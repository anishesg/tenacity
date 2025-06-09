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
    const scope = searchParams.get('scope') || 'overall'

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    if (scope === 'weekly') {
      // Weekly leaderboard based on this week's sessions
      const weekStart = getWeekStart(new Date())
      
      const sessions = await prisma.session.findMany({
        where: {
          groupId,
          weekStart
        },
        include: {
          playerA: true,
          playerB: true
        }
      })

      // Calculate weekly scores
      const weeklyScores: { [userId: string]: { user: any, score: number, sessions: number } } = {}

      sessions.forEach((session: any) => {
        if (!weeklyScores[session.playerAId]) {
          weeklyScores[session.playerAId] = {
            user: session.playerA,
            score: 0,
            sessions: 0
          }
        }
        if (!weeklyScores[session.playerBId]) {
          weeklyScores[session.playerBId] = {
            user: session.playerB,
            score: 0,
            sessions: 0
          }
        }

        weeklyScores[session.playerAId].score += session.playerAScore
        weeklyScores[session.playerAId].sessions += 1
        weeklyScores[session.playerBId].score += session.playerBScore
        weeklyScores[session.playerBId].sessions += 1
      })

      const weeklyLeaderboard = Object.values(weeklyScores)
        .sort((a: any, b: any) => b.score - a.score)
        .map((entry: any, index: number) => ({
          rank: index + 1,
          user: entry.user,
          score: entry.score,
          sessions: entry.sessions
        }))

      return NextResponse.json(weeklyLeaderboard)
    } else {
      // Overall leaderboard based on Elo ratings
      const groupUsers = await prisma.groupUser.findMany({
        where: { groupId },
        include: {
          user: true
        },
        orderBy: {
          user: {
            rating: 'desc'
          }
        }
      })

      const overallLeaderboard = groupUsers.map((gu: any, index: number) => ({
        rank: index + 1,
        user: gu.user,
        rating: gu.user.rating,
        joinedAt: gu.joinedAt
      }))

      return NextResponse.json(overallLeaderboard)
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 