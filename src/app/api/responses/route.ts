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

    const { questionId, selectedAnswer, sessionId, correct, points } = await request.json()
    
    if (!questionId || selectedAnswer === undefined || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the question
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if user already answered this question
    const existingResponse = await prisma.response.findFirst({
      where: {
        sessionId,
        questionId,
        userId: user.id
      }
    })

    if (existingResponse) {
      return NextResponse.json({ error: 'Question already answered' }, { status: 400 })
    }

    // Use provided correct status and points
    const pointsAwarded = points || 0

    // Create response
    const response = await prisma.response.create({
      data: {
        sessionId,
        questionId,
        userId: user.id,
        selected: selectedAnswer,
        correct,
        pointsAwarded
      }
    })

    // Update learning session score
    const sessionData = await prisma.learningSession.findUnique({
      where: { id: sessionId }
    })

    if (sessionData) {
      if (sessionData.playerAId === user.id) {
        await prisma.learningSession.update({
          where: { id: sessionId },
          data: {
            playerAScore: {
              increment: pointsAwarded
            }
          }
        })
      } else if (sessionData.playerBId === user.id) {
        await prisma.learningSession.update({
          where: { id: sessionId },
          data: {
            playerBScore: {
              increment: pointsAwarded
            }
          }
        })
      }
    }

    const choices = JSON.parse(question.choices)
    return NextResponse.json({
      ...response,
      correct,
      correctAnswer: question.answerIndex,
      explanation: choices[question.answerIndex]
    })
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 