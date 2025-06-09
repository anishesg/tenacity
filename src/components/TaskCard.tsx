'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Vote,
  User,
  Calendar,
  Trophy,
  MessageSquare
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  taskType: 'AUTO_QUIZ' | 'MANUAL' | 'HYBRID'
  pointValue: number
  dueDate?: string
  requiresEvidence: boolean
  evidencePrompt?: string
  votingThreshold: number
  creator: {
    id: string
    name: string
  }
  submissions?: any[]
  taskQuestions?: any[]
  _count?: {
    submissions: number
  }
}

interface TaskCardProps {
  task: Task
  userSubmission?: any
  currentUserId: string
  isGroupLeader: boolean
  onSubmit: (taskId: string, submission: any) => void
  onVote: (submissionId: string, vote: string, comment?: string) => void
}

export function TaskCard({ 
  task, 
  userSubmission, 
  currentUserId, 
  isGroupLeader,
  onSubmit,
  onVote 
}: TaskCardProps) {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [showVotingInterface, setShowVotingInterface] = useState(false)
  const [evidenceText, setEvidenceText] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [votingSubmissions, setVotingSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const isOverdue = task.dueDate && new Date() > new Date(task.dueDate)
  const canSubmit = !userSubmission && !isOverdue
  const hasAutoQuestions = task.taskQuestions && task.taskQuestions.length > 0

  const getStatusBadge = () => {
    if (userSubmission) {
      const status = userSubmission.status
      const colors = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        AUTO_SCORED: 'bg-blue-100 text-blue-800'
      }
      return (
        <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
          {status === 'AUTO_SCORED' ? 'Completed' : status.toLowerCase()}
        </Badge>
      )
    }
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Not submitted</Badge>
  }

  const getTaskTypeIcon = () => {
    switch (task.taskType) {
      case 'AUTO_QUIZ':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'MANUAL':
        return <Vote className="w-4 h-4 text-purple-500" />
      case 'HYBRID':
        return <Trophy className="w-4 h-4 text-orange-500" />
    }
  }

  const handleSubmit = async () => {
    if (hasAutoQuestions && quizAnswers.length !== task.taskQuestions?.length) {
      alert('Please answer all questions')
      return
    }

    if (task.requiresEvidence && !evidenceText.trim()) {
      alert('Please provide evidence for this task')
      return
    }

    setLoading(true)
    try {
      const submission = {
        taskId: task.id,
        evidenceText: evidenceText.trim() || null,
        evidenceUrl: evidenceUrl.trim() || null,
        quizAnswers: hasAutoQuestions ? quizAnswers : null
      }

      await onSubmit(task.id, submission)
      setShowSubmissionForm(false)
      setEvidenceText('')
      setEvidenceUrl('')
      setQuizAnswers([])
    } catch (error) {
      console.error('Error submitting task:', error)
      alert('Failed to submit task')
    } finally {
      setLoading(false)
    }
  }

  const loadVotingSubmissions = async () => {
    try {
      const response = await fetch(`/api/tasks/submissions?taskId=${task.id}&forVoting=true`)
      if (response.ok) {
        const submissions = await response.json()
        setVotingSubmissions(submissions)
        setShowVotingInterface(true)
      }
    } catch (error) {
      console.error('Error loading voting submissions:', error)
    }
  }

  const handleVote = async (submissionId: string, vote: string, comment?: string) => {
    try {
      await onVote(submissionId, vote, comment)
      // Refresh voting submissions
      loadVotingSubmissions()
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to submit vote')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              {getTaskTypeIcon()}
              <span>{task.title}</span>
              {getStatusBadge()}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{task.creator.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="w-3 h-3" />
                <span>{task.pointValue} points</span>
              </div>
              {task.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{task.description}</p>

        {/* Task Type Information */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {task.taskType === 'AUTO_QUIZ' && 'Quiz'}
            {task.taskType === 'MANUAL' && 'Peer Verified'}
            {task.taskType === 'HYBRID' && 'Quiz + Peer Verified'}
          </Badge>
          {task.requiresEvidence && (
            <Badge variant="outline">Evidence Required</Badge>
          )}
          <Badge variant="outline">
            {Math.round(task.votingThreshold * 100)}% approval needed
          </Badge>
        </div>

        {/* Submission Status */}
        {userSubmission && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Your Submission</span>
              <span className="text-sm text-muted-foreground">
                Score: {userSubmission.score}/{task.pointValue}
              </span>
            </div>
            {userSubmission.evidenceText && (
              <p className="text-sm mb-2">{userSubmission.evidenceText}</p>
            )}
            {userSubmission.votes && userSubmission.votes.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium">Votes ({userSubmission.votes.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {userSubmission.votes.map((vote: any) => (
                    <Badge 
                      key={vote.id} 
                      variant="outline" 
                      className={`text-xs ${
                        vote.vote === 'APPROVE' ? 'border-green-500 text-green-700' :
                        vote.vote === 'REJECT' ? 'border-red-500 text-red-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {vote.voter.name}: {vote.vote.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Dialog open={showSubmissionForm} onOpenChange={setShowSubmissionForm}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  Submit Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit: {task.title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Task Description */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Task Description</h4>
                    <p className="text-sm text-gray-700">{task.description}</p>
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                      <span>Points: {task.pointValue}</span>
                      {task.dueDate && (
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Quiz Questions */}
                  {hasAutoQuestions && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Answer the Questions</h4>
                      {task.taskQuestions?.map((question, index) => {
                        const choices = JSON.parse(question.choices)
                        return (
                          <div key={question.id} className="p-4 border rounded-lg space-y-3">
                            <p className="font-medium">Q{index + 1}: {question.prompt}</p>
                            <div className="space-y-2">
                              {choices.map((choice: string, choiceIndex: number) => (
                                <label key={choiceIndex} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`question-${index}`}
                                    checked={quizAnswers[index] === choiceIndex}
                                    onChange={() => {
                                      const newAnswers = [...quizAnswers]
                                      newAnswers[index] = choiceIndex
                                      setQuizAnswers(newAnswers)
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm">{choice}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Evidence Submission */}
                  {task.requiresEvidence && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Provide Evidence</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block font-medium text-sm mb-2">
                            {task.evidencePrompt || 'Describe your completion:'}
                          </label>
                          <textarea
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Provide detailed evidence of your task completion..."
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-sm mb-2">
                            Supporting Link (optional)
                          </label>
                          <Input
                            type="url"
                            value={evidenceUrl}
                            onChange={(e) => setEvidenceUrl(e.target.value)}
                            placeholder="https://example.com/my-evidence"
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Link to photos, videos, documents, or other supporting evidence
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSubmissionForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="px-6"
                    >
                      {loading ? 'Submitting...' : 'Submit Task'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {!userSubmission && task.creator.id !== currentUserId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadVotingSubmissions}
            >
              <Vote className="w-4 h-4 mr-1" />
              Vote on Submissions
            </Button>
          )}

          {isGroupLeader && (
            <Badge variant="outline" className="text-xs">
              {task._count?.submissions || 0} submissions
            </Badge>
          )}
        </div>



        {/* Voting Interface */}
        {showVotingInterface && (
          <div className="p-4 border rounded-lg space-y-4">
            <h4 className="font-medium">Vote on Submissions</h4>
            {votingSubmissions.length === 0 ? (
              <p className="text-muted-foreground">No submissions to vote on.</p>
            ) : (
              <div className="space-y-4">
                {votingSubmissions.map((submission) => (
                  <VotingCard
                    key={submission.id}
                    submission={submission}
                    task={task}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowVotingInterface(false)}
            >
              Close Voting
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Separate component for voting on individual submissions
function VotingCard({ submission, task, onVote }: {
  submission: any
  task: Task
  onVote: (submissionId: string, vote: string, comment?: string) => void
}) {
  const [comment, setComment] = useState('')
  const [voting, setVoting] = useState(false)

  const handleVote = async (vote: string) => {
    setVoting(true)
    try {
      await onVote(submission.id, vote, comment.trim() || undefined)
      setComment('')
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="p-3 bg-muted rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{submission.user.name}</span>
        <span className="text-sm text-muted-foreground">
          {submission.votes.length} votes so far
        </span>
      </div>
      
      {submission.evidenceText && (
        <p className="text-sm">{submission.evidenceText}</p>
      )}
      
      {submission.evidenceUrl && (
        <a 
          href={submission.evidenceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          View Evidence →
        </a>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        className="w-full p-2 border border-border rounded text-sm"
        rows={2}
      />

      <div className="flex space-x-2">
        <Button 
          size="sm" 
          onClick={() => handleVote('APPROVE')}
          disabled={voting}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Approve
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleVote('REJECT')}
          disabled={voting}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Reject
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleVote('ABSTAIN')}
          disabled={voting}
        >
          Abstain
        </Button>
      </div>
    </div>
  )
} 