'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { ContentReader } from '@/components/ContentReader'
import { SessionCard } from '@/components/SessionCard'
import { LearningSession } from '@/components/LearningSession'
import { Leaderboard } from '@/components/Leaderboard'
import { NotificationSystem } from '@/components/NotificationSystem'
import { AuthForm } from '@/components/AuthForm'
import { TaskCard } from '@/components/TaskCard'
import { SimpleTaskCreator } from '@/components/SimpleTaskCreator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Trophy, 
  BookOpen, 
  Settings,
  LogOut,
  Crown,
  Target,
  TrendingUp,
  Calendar,
  Vote,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function HomePage() {
  const { data: session, status, update } = useSession()
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [inLearningSession, setInLearningSession] = useState(false)

  // Set default selected group from session
  useEffect(() => {
    if (session?.user?.groups && session.user.groups.length > 0 && !selectedGroup) {
      setSelectedGroup(session.user.groups[0])
    }
  }, [session, selectedGroup])

  // Fetch data when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupData()
    }
  }, [selectedGroup])

  const fetchGroupData = async () => {
    if (!selectedGroup) return

    try {
      // Fetch current session
      const sessionRes = await fetch(`/api/sessions/current?groupId=${selectedGroup.id}`)
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        setCurrentSession(sessionData)
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(`/api/leaderboard?groupId=${selectedGroup.id}&scope=overall`)
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json()
        setLeaderboard(leaderboardData)
      }

      // Fetch tasks
      const tasksRes = await fetch(`/api/tasks?groupId=${selectedGroup.id}`)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }

      // Fetch pending submissions for verification
      const submissionsRes = await fetch(`/api/tasks/submissions?groupId=${selectedGroup.id}&status=PENDING`)
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setPendingSubmissions(submissionsData)
      }
    } catch (error) {
      console.error('Error fetching group data:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() })
      })

      if (response.ok) {
        const group = await response.json()
        await update() // Refresh session to get new group
        setNewGroupName('')
        setShowCreateGroup(false)
      }
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      })

      if (response.ok) {
        await update() // Refresh session to get new group
        setInviteCode('')
        setShowJoinGroup(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskSubmit = async (taskId: string, submission: any) => {
    try {
      const response = await fetch('/api/tasks/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })

      if (response.ok) {
        fetchGroupData() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit task')
      }
    } catch (error) {
      console.error('Error submitting task:', error)
      alert('Failed to submit task')
    }
  }

  const handleVote = async (submissionId: string, vote: string, comment?: string) => {
    try {
      const response = await fetch('/api/tasks/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, vote, comment })
      })

      if (response.ok) {
        fetchGroupData() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to submit vote')
    }
  }

  const handleTaskCreated = () => {
    setShowCreateTask(false)
    fetchGroupData() // Refresh tasks data
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication form if not signed in
  if (!session) {
    return <AuthForm />
  }

  const isGroupLeader = selectedGroup && (
    selectedGroup.creatorId === session.user.id || 
    selectedGroup.role === 'admin'
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                🎯 Fantasy Learning
              </h1>
              {session.user.groups.length > 1 && (
                <select
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = session.user.groups.find(g => g.id === e.target.value)
                    setSelectedGroup(group)
                  }}
                  className="rounded-md border-gray-300 text-sm"
                >
                  {session.user.groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.memberCount} members)
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{session.user.rating}</span>
              </div>
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name}!
              </span>
              <NotificationSystem 
                groupId={selectedGroup?.id}
                userId={session.user.id}
              />
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {!selectedGroup ? (
          // No group selected - show group management
          <div className="text-center space-y-6">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Join or Create a Learning Group
              </h2>
              <p className="text-gray-600 mb-8">
                Get started by joining an existing group or creating your own!
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowJoinGroup(true)} 
                  className="w-full"
                  size="lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Group with Code
                </Button>
                
                <Button 
                  onClick={() => setShowCreateGroup(true)} 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Group
                </Button>
              </div>

              {/* Join Group Modal */}
              {showJoinGroup && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Join Group</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Enter invite code..."
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleJoinGroup} disabled={loading}>
                        Join
                      </Button>
                      <Button variant="outline" onClick={() => setShowJoinGroup(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Create Group Modal */}
              {showCreateGroup && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Create Group</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Group name..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleCreateGroup} disabled={loading}>
                        Create
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          // Group selected - show main interface
          <div className="space-y-6">
            {/* Group Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <span>{selectedGroup.name}</span>
                    {isGroupLeader && (
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        <Crown className="w-3 h-3 mr-1" />
                        Leader
                      </Badge>
                    )}
                  </h2>
                  <p className="text-gray-600">
                    {selectedGroup.memberCount} members • Code: {selectedGroup.inviteCode}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {isGroupLeader && (
                    <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Create Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                        </DialogHeader>
                        <SimpleTaskCreator
                          groupId={selectedGroup.id}
                          onTaskCreated={handleTaskCreated}
                          onCancel={() => setShowCreateTask(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowJoinGroup(true)}>
                    <Users className="w-4 h-4 mr-1" />
                    Join Another
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="session" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="tasks">
                  <Target className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Tasks</span>
                  <span className="sm:hidden">({tasks.length})</span>
                  <span className="hidden sm:inline"> ({tasks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="verification">
                  <Vote className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Verification</span>
                  <span className="sm:hidden">({pendingSubmissions.length})</span>
                  <span className="hidden sm:inline"> ({pendingSubmissions.length})</span>
                </TabsTrigger>
                <TabsTrigger value="session">
                  <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Current Session</span>
                  <span className="sm:hidden">Session</span>
                </TabsTrigger>
                <TabsTrigger value="leaderboard">
                  <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Leaderboard</span>
                  <span className="sm:hidden">Ranks</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-4">
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        userSubmission={task.submissions?.[0]}
                        currentUserId={session.user.id}
                        isGroupLeader={isGroupLeader}
                        onSubmit={handleTaskSubmit}
                        onVote={handleVote}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No tasks yet
                      </h3>
                      <p className="text-gray-600">
                        {isGroupLeader 
                          ? "Create your first task to get your group started!" 
                          : "Your group leader hasn't created any tasks yet."}
                      </p>
                      {isGroupLeader && (
                        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                          <DialogTrigger asChild>
                            <Button className="mt-4">
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Task
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <SimpleTaskCreator
                              groupId={selectedGroup.id}
                              onTaskCreated={handleTaskCreated}
                              onCancel={() => setShowCreateTask(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                {pendingSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {pendingSubmissions.map((submission) => (
                      <Card key={submission.id} className="relative">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{submission.task.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Submitted by {submission.user.name} • {new Date(submission.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {submission.task.pointValue} points
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {submission.evidenceText && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Evidence Description:</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded-lg">{submission.evidenceText}</p>
                            </div>
                          )}
                          
                          {submission.evidenceUrl && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Evidence File:</h4>
                              <a 
                                href={submission.evidenceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                View Attachment
                              </a>
                            </div>
                          )}

                          <div className="flex space-x-3 pt-4">
                            <Button 
                              size="sm" 
                              onClick={() => handleVote(submission.id, 'APPROVE')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleVote(submission.id, 'REJECT')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No submissions to verify
                      </h3>
                      <p className="text-gray-600">
                        When group members submit tasks requiring verification, they'll appear here for peer review.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="session">
                {currentSession ? (
                  inLearningSession ? (
                    <LearningSession 
                      session={currentSession}
                      currentUserId={session.user.id}
                      onComplete={() => {
                        setInLearningSession(false)
                        fetchGroupData() // Refresh session data
                      }}
                    />
                  ) : (
                    <div className="space-y-6">
                      <SessionCard 
                        session={currentSession} 
                        currentUserId={session.user.id}
                        onStartSession={() => setInLearningSession(true)}
                      />
                    </div>
                  )
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No active session
                      </h3>
                      <p className="text-gray-600">
                        {isGroupLeader 
                          ? "Create weekly learning sessions for your group members."
                          : "New weekly sessions start automatically. Check back soon!"
                        }
                      </p>
                      {isGroupLeader && (
                        <Button 
                          className="mt-4"
                          onClick={async () => {
                            try {
                              setLoading(true)
                              const response = await fetch('/api/sessions/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ groupId: selectedGroup.id })
                              })
                              
                              if (response.ok) {
                                fetchGroupData() // Refresh to show new session
                              } else {
                                const error = await response.json()
                                alert(error.error || 'Failed to create sessions')
                              }
                            } catch (error) {
                              console.error('Error creating sessions:', error)
                              alert('Failed to create sessions')
                            } finally {
                              setLoading(false)
                            }
                          }}
                          disabled={loading}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {loading ? 'Creating...' : 'Create Learning Sessions'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="leaderboard">
                <Leaderboard 
                  groupId={selectedGroup.id}
                  scope="overall"
                  onScopeChange={() => {}}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
