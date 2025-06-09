'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { User, Clock, Trophy, BookOpen, Target } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SessionUser {
  id: string
  name: string
  email: string
  rating: number
}

interface SessionTopic {
  id: string
  title: string
  description: string
}

interface SessionCardProps {
  session: {
    id: string
    weekStart: string
    playerAScore: number
    playerBScore: number
    completed: boolean
    playerA: SessionUser
    playerB: SessionUser
    topic: SessionTopic
  }
  currentUserId: string
  onStartSession: () => void
}

export function SessionCard({ session, currentUserId, onStartSession }: SessionCardProps) {
  const isPlayerA = session.playerA.id === currentUserId
  const opponent = isPlayerA ? session.playerB : session.playerA
  const userScore = isPlayerA ? session.playerAScore : session.playerBScore
  const opponentScore = isPlayerA ? session.playerBScore : session.playerAScore

  const getWinnerStatus = () => {
    if (!session.completed) return null
    
    if (userScore > opponentScore) return 'won'
    if (userScore < opponentScore) return 'lost'
    return 'tied'
  }

  const winnerStatus = getWinnerStatus()

  const getStatusBadge = () => {
    if (!session.completed) {
      return <Badge variant="outline">In Progress</Badge>
    }

    switch (winnerStatus) {
      case 'won':
        return <Badge className="bg-green-500">Victory</Badge>
      case 'lost':
        return <Badge variant="destructive">Defeat</Badge>
      case 'tied':
        return <Badge variant="secondary">Tie</Badge>
      default:
        return <Badge variant="outline">Completed</Badge>
    }
  }

  const getRatingDifference = () => {
    const diff = Math.abs(session.playerA.rating - session.playerB.rating)
    const higher = session.playerA.rating > session.playerB.rating ? session.playerA : session.playerB
    const isUserHigher = higher.id === currentUserId
    
    return {
      difference: diff,
      userIsHigher: isUserHigher
    }
  }

  const ratingInfo = getRatingDifference()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{session.topic.title}</CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground">{session.topic.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Matchup */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">You</div>
              <div className="text-sm text-muted-foreground">
                {Math.round(isPlayerA ? session.playerA.rating : session.playerB.rating)} ELO
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {userScore} - {opponentScore}
            </div>
            {session.completed && (
              <div className="text-xs text-muted-foreground">Final</div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-medium">{opponent.name || opponent.email}</div>
              <div className="text-sm text-muted-foreground">
                {Math.round(opponent.rating)} ELO
              </div>
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-secondary" />
            </div>
          </div>
        </div>

        {/* Rating Difference Info */}
        {ratingInfo.difference > 0 && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>
              {ratingInfo.userIsHigher ? 'You are' : `${opponent.name || 'Opponent'} is`} favored by {ratingInfo.difference} ELO points
            </span>
          </div>
        )}

        {/* Week Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Week of {formatDate(new Date(session.weekStart))}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Learning Session</span>
          </div>
        </div>

        {/* Action Button */}
        {!session.completed && (
          <Button onClick={onStartSession} className="w-full">
            {userScore > 0 || opponentScore > 0 ? 'Continue Session' : 'Start Learning'}
          </Button>
        )}

        {session.completed && winnerStatus && (
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {winnerStatus === 'won' && '🎉 Congratulations! You won this session!'}
              {winnerStatus === 'lost' && '💪 Good effort! Better luck next time!'}
              {winnerStatus === 'tied' && '🤝 Great match! You tied with your opponent!'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 