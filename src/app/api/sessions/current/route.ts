import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWeekStart } from '@/lib/utils'

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

    // Get current week start
    const weekStart = getWeekStart(new Date())

    // Find current session for this user and group
    const currentSession = await prisma.learningSession.findFirst({
      where: {
        groupId,
        weekStart,
        OR: [
          { playerAId: user.id },
          { playerBId: user.id }
        ]
      },
      include: {
        topic: {
          include: {
            contentItems: {
              include: {
                questions: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        playerA: true,
        playerB: true,
        responses: {
          where: {
            userId: user.id
          }
        }
      }
    })

    if (!currentSession) {
      return NextResponse.json({ error: 'No session found for this week' }, { status: 404 })
    }

    // Transform questions to parse JSON choices
    const transformedSession = {
      ...currentSession,
      topic: currentSession.topic ? {
        ...currentSession.topic,
        contentItems: currentSession.topic.contentItems.map((item: any) => ({
          ...item,
          questions: item.questions.map((question: any) => ({
            ...question,
            choices: JSON.parse(question.choices)
          }))
        }))
      } : null
    }

    return NextResponse.json(transformedSession)
  } catch (error) {
    console.error('Error fetching current session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 