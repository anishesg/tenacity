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
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

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

    // Get all tasks for the group
    const tasks = await prisma.task.findMany({
      where: { groupId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        submissions: {
          where: { userId: user.id },
          include: {
            votes: {
              include: {
                voter: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        taskQuestions: true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
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
      groupId,
      title,
      description,
      taskType,
      pointValue,
      dueDate,
      requiresEvidence,
      evidencePrompt,
      votingThreshold,
      questions // For auto-verifiable tasks
    } = body

    if (!groupId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is group admin or creator
    const groupMember = await prisma.groupUser.findFirst({
      where: {
        groupId,
        userId: user.id
      },
      include: {
        group: true
      }
    })

    if (!groupMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Check permissions (group creator or admin)
    if (groupMember.group.creatorId !== user.id && groupMember.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions to create tasks' }, { status: 403 })
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        groupId,
        creatorId: user.id,
        title,
        description,
        taskType: taskType || 'MANUAL',
        pointValue: pointValue || 10,
        dueDate: dueDate ? new Date(dueDate) : null,
        requiresEvidence: requiresEvidence || false,
        evidencePrompt,
        votingThreshold: votingThreshold || 0.6,
        votingDeadline: dueDate ? new Date(new Date(dueDate).getTime() + 24 * 60 * 60 * 1000) : null, // 24h after due date
        taskQuestions: questions ? {
          create: questions.map((q: any, index: number) => ({
            prompt: q.prompt,
            choices: JSON.stringify(q.choices),
            answerIndex: q.answerIndex,
            points: q.points || 1
          }))
        } : undefined
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        taskQuestions: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 