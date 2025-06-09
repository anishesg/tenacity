'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, CheckCircle, AlertCircle, Info, Trophy, Users, Target } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
}

interface NotificationSystemProps {
  groupId?: string
  userId?: string
}

export function NotificationSystem({ groupId, userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Simulate real-time notifications (in production, use WebSockets or Server-Sent Events)
  useEffect(() => {
    if (!groupId || !userId) return

    const checkForUpdates = async () => {
      try {
        // Check for new task submissions
        const submissionsRes = await fetch(`/api/tasks/submissions?groupId=${groupId}&status=PENDING`)
        if (submissionsRes.ok) {
          const submissions = await submissionsRes.json()
          
          // Create notifications for new submissions
          submissions.forEach((submission: any) => {
            if (submission.userId !== userId) { // Don't notify about own submissions
              const notificationId = `submission-${submission.id}`
              const exists = notifications.find(n => n.id === notificationId)
              
              if (!exists) {
                addNotification({
                  id: notificationId,
                  type: 'info',
                  title: 'New Task Submission',
                  message: `${submission.user.name} submitted "${submission.task.title}" for review`,
                  timestamp: new Date(submission.submittedAt),
                  read: false,
                  actionUrl: '#verification',
                  actionText: 'Review'
                })
              }
            }
          })
        }

        // Check for completed sessions
        const sessionRes = await fetch(`/api/sessions/current?groupId=${groupId}`)
        if (sessionRes.ok) {
          const session = await sessionRes.json()
          if (session.completed) {
            const notificationId = `session-complete-${session.id}`
            const exists = notifications.find(n => n.id === notificationId)
            
            if (!exists) {
              const isPlayerA = session.playerA.id === userId
              const userScore = isPlayerA ? session.playerAScore : session.playerBScore
              const opponentScore = isPlayerA ? session.playerBScore : session.playerAScore
              const won = userScore > opponentScore
              
              addNotification({
                id: notificationId,
                type: won ? 'success' : 'info',
                title: won ? 'Session Victory!' : 'Session Complete',
                message: won 
                  ? `You won your learning session with ${userScore} points!`
                  : `Learning session completed. Final score: ${userScore} points`,
                timestamp: new Date(),
                read: false,
                actionUrl: '#session',
                actionText: 'View Results'
              })
            }
          }
        }

      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }

    // Check immediately and then every 30 seconds
    checkForUpdates()
    const interval = setInterval(checkForUpdates, 30000)

    return () => clearInterval(interval)
  }, [groupId, userId, notifications])

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.actionUrl && notification.actionText && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              // In a real app, navigate to the URL
                              console.log('Navigate to:', notification.actionUrl)
                            }}
                          >
                            {notification.actionText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
} 