import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, vote, comment } = body

    if (!submissionId || !vote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['APPROVE', 'REJECT', 'ABSTAIN'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get submission details
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: {
            group: {
              include: {
                groupUsers: true
              }
            }
          }
        },
        user: true,
        votes: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user is in the group
    const isGroupMember = submission.task.group.groupUsers.some((gu: any) => gu.userId === user.id)
    if (!isGroupMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Check if user is trying to vote on their own submission
    if (submission.userId === user.id) {
      return NextResponse.json({ error: 'Cannot vote on your own submission' }, { status: 400 })
    }

    // Check if voting deadline has passed
    if (submission.task.votingDeadline && new Date() > submission.task.votingDeadline) {
      return NextResponse.json({ error: 'Voting deadline has passed' }, { status: 400 })
    }

    // Check if user already voted
    const existingVote = await prisma.taskVote.findUnique({
      where: {
        submissionId_voterId: {
          submissionId,
          voterId: user.id
        }
      }
    })

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted on this submission' }, { status: 400 })
    }

    // Create the vote
    const newVote = await prisma.taskVote.create({
      data: {
        submissionId,
        voterId: user.id,
        vote: vote as any,
        comment
      },
      include: {
        voter: {
          select: { id: true, name: true }
        }
      }
    })

    // Check if we need to update submission status
    const updatedSubmission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: {
            group: {
              include: {
                groupUsers: true
              }
            }
          }
        },
        votes: true
      }
    })

    if (updatedSubmission) {
      const totalGroupMembers = updatedSubmission.task.group.groupUsers.length - 1 // Exclude submitter
      const totalVotes = updatedSubmission.votes.length
      const approveVotes = updatedSubmission.votes.filter((v: any) => v.vote === 'APPROVE').length
      const rejectVotes = updatedSubmission.votes.filter((v: any) => v.vote === 'REJECT').length
      
      const approvalRate = totalVotes > 0 ? approveVotes / totalVotes : 0
      const threshold = updatedSubmission.task.votingThreshold

      // Check if we have enough votes to make a decision
      if (totalVotes >= Math.max(3, Math.floor(totalGroupMembers / 2))) { // At least 3 votes or half the group
        let newStatus = updatedSubmission.status
        let finalScore = updatedSubmission.score

        if (approvalRate >= threshold) {
          newStatus = 'APPROVED'
          // Calculate peer score based on approval rate
          const peerScore = Math.round(updatedSubmission.task.pointValue * approvalRate)
          finalScore = (updatedSubmission.autoScore || 0) + peerScore
        } else {
          newStatus = 'REJECTED'
          finalScore = updatedSubmission.autoScore || 0 // Keep auto score if any
        }

        // Update submission status
        await prisma.taskSubmission.update({
          where: { id: submissionId },
          data: {
            status: newStatus as any,
            score: finalScore,
            peerScore: approvalRate >= threshold ? Math.round(updatedSubmission.task.pointValue * approvalRate) : 0
          }
        })

        // Update user's rating if approved
        if (newStatus === 'APPROVED') {
          await prisma.user.update({
            where: { id: updatedSubmission.userId },
            data: {
              rating: {
                increment: Math.floor(finalScore / 10) // Convert points to rating points
              }
            }
          })
        }
      }
    }

    return NextResponse.json(newVote)
  } catch (error) {
    console.error('Error creating vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 