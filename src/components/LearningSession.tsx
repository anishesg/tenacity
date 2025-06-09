'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { User, Trophy, Clock, CheckCircle, XCircle, BookOpen, Target } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Question {
  id: string
  prompt: string
  choices: string[]
  answerIndex: number
  points: number
}

interface ContentItem {
  id: string
  title: string
  body: string
  questions: Question[]
  order: number
}

interface SessionUser {
  id: string
  name: string
  email: string
  rating: number
}

interface SessionData {
  id: string
  weekStart: string
  playerAScore: number
  playerBScore: number
  completed: boolean
  playerA: SessionUser
  playerB: SessionUser
  topic: {
    id: string
    title: string
    description: string
    contentItems: ContentItem[]
  }
  responses?: any[]
}

interface LearningSessionProps {
  session: SessionData
  currentUserId: string
  onComplete: () => void
}

export function LearningSession({ session, currentUserId, onComplete }: LearningSessionProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userResponses, setUserResponses] = useState<Set<string>>(new Set())
  const [userScore, setUserScore] = useState(0)
  const [showContent, setShowContent] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)

  const isPlayerA = session.playerA.id === currentUserId
  const opponent = isPlayerA ? session.playerB : session.playerA
  const currentScore = isPlayerA ? session.playerAScore : session.playerBScore
  const opponentScore = isPlayerA ? session.playerBScore : session.playerAScore

  const currentItem = session.topic.contentItems[currentItemIndex]
  const currentQuestion = currentItem?.questions[currentQuestionIndex]
  const totalQuestions = session.topic.contentItems.reduce((sum, item) => sum + item.questions.length, 0)
  const answeredQuestions = userResponses.size
  const progress = (answeredQuestions / totalQuestions) * 100

  // Initialize user responses from session data
  useEffect(() => {
    if (session.responses) {
      const userResponseIds = new Set(
        session.responses
          .filter(r => r.userId === currentUserId)
          .map(r => r.questionId)
      )
      setUserResponses(userResponseIds)
      
      // Calculate current score
      const score = session.responses
        .filter(r => r.userId === currentUserId && r.correct)
        .reduce((sum, r) => sum + (r.points || 0), 0)
      setUserScore(score)
    }
  }, [session, currentUserId])

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || !currentQuestion) return

    setIsSubmitting(true)
    const isCorrect = selectedAnswer === currentQuestion.answerIndex
    const points = isCorrect ? currentQuestion.points : 0

    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          selectedAnswer,
          correct: isCorrect,
          points
        })
      })

      if (response.ok) {
        setUserResponses(prev => new Set([...prev, currentQuestion.id]))
        setUserScore(prev => prev + points)
        setLastResult({ correct: isCorrect, points })
        setShowResultModal(true)
        setSelectedAnswer(null)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setShowResultModal(false)
    
    if (currentQuestionIndex < currentItem.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowContent(true)
    } else if (currentItemIndex < session.topic.contentItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
      setShowContent(true)
    } else {
      // All questions completed
      checkSessionCompletion()
    }
  }

  const checkSessionCompletion = async () => {
    if (answeredQuestions >= totalQuestions) {
      try {
        await fetch(`/api/sessions/${session.id}/complete`, {
          method: 'POST'
        })
        onComplete()
      } catch (error) {
        console.error('Error completing session:', error)
      }
    }
  }

  const isQuestionAnswered = currentQuestion && userResponses.has(currentQuestion.id)

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{session.topic.title}</CardTitle>
            <Badge variant={session.completed ? "default" : "outline"}>
              {session.completed ? "Completed" : "In Progress"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{session.topic.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Score Display */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">You</div>
                  <div className="text-sm text-muted-foreground">{currentScore + userScore} points</div>
                </div>
              </div>
              
              <div className="text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                <div className="text-sm text-muted-foreground">VS</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="font-medium">{opponent.name || opponent.email}</div>
                  <div className="text-sm text-muted-foreground">{opponentScore} points</div>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{answeredQuestions}/{totalQuestions} questions</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content/Question Display */}
      {currentItem && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{currentItem.title}</CardTitle>
              <Badge variant="outline">
                Section {currentItemIndex + 1} of {session.topic.contentItems.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content */}
            {showContent && (
              <div className="space-y-4">
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentItem.body.replace(/\n/g, '<br/>') }} />
                </div>
                <Button 
                  onClick={() => setShowContent(false)}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Questions
                </Button>
              </div>
            )}

            {/* Question */}
            {!showContent && currentQuestion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Question {currentQuestionIndex + 1}</h3>
                  <Badge>
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <p className="text-lg">{currentQuestion.prompt}</p>

                {isQuestionAnswered ? (
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Already answered!</p>
                    <Button 
                      onClick={handleNextQuestion}
                      className="mt-3"
                    >
                      Next Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentQuestion.choices.map((choice, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-4"
                        onClick={() => setSelectedAnswer(index)}
                        disabled={isSubmitting}
                      >
                        <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                        {choice}
                      </Button>
                    ))}
                    
                    <Button 
                      onClick={handleAnswerSubmit}
                      disabled={selectedAnswer === null || isSubmitting}
                      className="w-full mt-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {lastResult?.correct ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span>{lastResult?.correct ? 'Correct!' : 'Incorrect'}</span>
            </DialogTitle>
            <DialogDescription>
              {lastResult?.correct 
                ? `Great job! You earned ${lastResult.points} point${lastResult.points !== 1 ? 's' : ''}.`
                : 'Don\'t worry, keep learning and you\'ll get the next one!'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button onClick={handleNextQuestion}>
              {answeredQuestions >= totalQuestions ? 'Complete Session' : 'Next Question'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 