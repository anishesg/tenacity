import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const groupId = searchParams.get('groupId')
    const status = searchParams.get('status')
    const forVoting = searchParams.get('forVoting') === 'true'

    // Handle group-wide submissions request (for verification tab)
    if (groupId && status) {
      // Find the user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if user is in the group
      const groupMember = await prisma.groupUser.findFirst({
        where: {
          groupId,
          userId: user.id
        }
      })

      if (!groupMember) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
      }

      // Get all pending submissions for the group (excluding user's own submissions)
      const submissions = await prisma.taskSubmission.findMany({
        where: {
          task: { groupId },
          status: status as any,
          userId: { not: user.id }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          task: {
            select: { id: true, title: true, pointValue: true }
          },
          votes: {
            where: { voterId: user.id }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      })

      // Filter out submissions the user has already voted on
      const unvotedSubmissions = submissions.filter(submission => submission.votes.length === 0)

      return NextResponse.json(unvotedSubmissions)
    }

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get task to check group membership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        group: {
          include: {
            groupUsers: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user is in the group
    const isGroupMember = task.group.groupUsers.some(gu => gu.userId === user.id)
    if (!isGroupMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    if (forVoting) {
      // Get submissions that need voting (excluding user's own submission)
      const submissions = await prisma.taskSubmission.findMany({
        where: {
          taskId,
          userId: { not: user.id },
          status: 'PENDING'
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          votes: {
            include: {
              voter: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      })

      // Filter out submissions user has already voted on
      const filteredSubmissions = submissions.filter(submission => 
        !submission.votes.some(vote => vote.voterId === user.id)
      )

      return NextResponse.json(filteredSubmissions)
    } else {
      // Get user's own submission
      const submission = await prisma.taskSubmission.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId: user.id
          }
        },
        include: {
          votes: {
            include: {
              voter: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      return NextResponse.json(submission)
    }
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      taskId,
      evidenceText,
      evidenceUrl,
      quizAnswers // For auto-verifiable tasks
    } = body

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        taskQuestions: true,
        group: {
          include: {
            groupUsers: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user is in the group
    const isGroupMember = task.group.groupUsers.some(gu => gu.userId === user.id)
    if (!isGroupMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Check if task is still open (before due date)
    if (task.dueDate && new Date() > task.dueDate) {
      return NextResponse.json({ error: 'Task submission deadline has passed' }, { status: 400 })
    }

    // Check if user already submitted
    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId: user.id
        }
      }
    })

    if (existingSubmission) {
      return NextResponse.json({ error: 'Already submitted for this task' }, { status: 400 })
    }

    let autoScore = null
    let status = 'PENDING'

    // Calculate auto score for AUTO_QUIZ or HYBRID tasks
    if ((task.taskType === 'AUTO_QUIZ' || task.taskType === 'HYBRID') && quizAnswers && task.taskQuestions.length > 0) {
      let correctAnswers = 0
      let totalPoints = 0

      task.taskQuestions.forEach((question, index) => {
        totalPoints += question.points
        if (quizAnswers[index] === question.answerIndex) {
          correctAnswers += question.points
        }
      })

      autoScore = correctAnswers
      
      // If it's purely auto-verifiable, set status to AUTO_SCORED
      if (task.taskType === 'AUTO_QUIZ') {
        status = 'AUTO_SCORED'
      }
    }

    // Create the submission
    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        userId: user.id,
        evidenceText,
        evidenceUrl,
        autoScore,
        status: status as any,
        score: task.taskType === 'AUTO_QUIZ' ? (autoScore || 0) : 0
      },
      include: {
        task: {
          select: { title: true, pointValue: true, taskType: true }
        }
      }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 