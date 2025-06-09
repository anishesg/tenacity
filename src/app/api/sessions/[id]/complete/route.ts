import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateEloRatings } from '@/lib/elo'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the learning session
    const gameSession = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        playerA: true,
        playerB: true,
        topic: {
          include: {
            contentItems: {
              include: {
                questions: true
              }
            }
          }
        },
        responses: true
      }
    })

    if (!gameSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if user is part of this session
    if (gameSession.playerAId !== user.id && gameSession.playerBId !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this session' }, { status: 403 })
    }

    // Check if session is already completed
    if (gameSession.completed) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    // Check if all questions have been answered by both players
    const totalQuestions = gameSession.topic?.contentItems.reduce(
      (sum: number, item: any) => sum + item.questions.length,
      0
    ) || 0

    const playerAResponses = gameSession.responses.filter((r: any) => r.userId === gameSession.playerAId).length
    const playerBResponses = gameSession.responses.filter((r: any) => r.userId === gameSession.playerBId).length

    if (playerAResponses < totalQuestions || playerBResponses < totalQuestions) {
      return NextResponse.json({ error: 'All questions must be answered before completion' }, { status: 400 })
    }

    // Calculate new Elo ratings
    const eloResult = calculateEloRatings(
      gameSession.playerA.rating,
      gameSession.playerB.rating,
      gameSession.playerAScore,
      gameSession.playerBScore
    )

    // Update user ratings and mark session as completed
    await prisma.$transaction([
      prisma.user.update({
        where: { id: gameSession.playerAId },
        data: { rating: eloResult.playerANewRating }
      }),
      prisma.user.update({
        where: { id: gameSession.playerBId },
        data: { rating: eloResult.playerBNewRating }
      }),
      prisma.learningSession.update({
        where: { id: sessionId },
        data: { completed: true }
      })
    ])

    // Return updated session with new ratings
    const updatedSession = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        playerA: true,
        playerB: true,
        topic: true
      }
    })

    return NextResponse.json({
      ...updatedSession,
      eloChanges: {
        playerA: {
          oldRating: gameSession.playerA.rating,
          newRating: eloResult.playerANewRating,
          change: eloResult.playerANewRating - gameSession.playerA.rating
        },
        playerB: {
          oldRating: gameSession.playerB.rating,
          newRating: eloResult.playerBNewRating,
          change: eloResult.playerBNewRating - gameSession.playerB.rating
        }
      }
    })
  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 