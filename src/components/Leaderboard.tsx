'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    email: string
    rating?: number
  }
  score?: number
  rating?: number
  sessions?: number
  joinedAt?: string
}

interface LeaderboardProps {
  groupId: string
  scope: 'weekly' | 'overall'
  onScopeChange: (scope: 'weekly' | 'overall') => void
}

export function Leaderboard({ groupId, scope, onScopeChange }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [groupId, scope])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/leaderboard?groupId=${groupId}&scope=${scope}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      
      const data = await response.json()
      setLeaderboard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {rank}
          </div>
        )
    }
  }

  const formatRating = (rating: number) => {
    return Math.round(rating).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Leaderboard</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={scope === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onScopeChange('weekly')}
            >
              This Week
            </Button>
            <Button
              variant={scope === 'overall' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onScopeChange('overall')}
            >
              Overall
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available for this period
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {getRankIcon(entry.rank)}
                  <div>
                    <div className="font-medium">
                      {entry.user.name || entry.user.email}
                    </div>
                    {scope === 'weekly' && entry.sessions && (
                      <div className="text-sm text-muted-foreground">
                        {entry.sessions} session{entry.sessions !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {scope === 'weekly' ? (
                    <div className="font-bold text-lg">
                      {entry.score?.toLocaleString() || 0}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        pts
                      </span>
                    </div>
                  ) : (
                    <div className="font-bold text-lg">
                      {formatRating(entry.rating || entry.user.rating || 1000)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        ELO
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 