'use client'

import { useState, useEffect } from 'react'
import Markdown from 'markdown-to-jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from './QuestionCard'
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react'

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
  order: number
  questions: Question[]
}

interface ContentReaderProps {
  contentItems: ContentItem[]
  sessionId: string
  userResponses: any[]
  onQuestionAnswered: (questionId: string, selected: number) => void
  onAllCompleted: () => void
}

export function ContentReader({
  contentItems,
  sessionId,
  userResponses,
  onQuestionAnswered,
  onAllCompleted
}: ContentReaderProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showQuestions, setShowQuestions] = useState(false)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())

  const currentItem = contentItems[currentItemIndex]
  const currentQuestion = showQuestions ? currentItem?.questions[currentQuestionIndex] : null
  
  // Calculate total questions and answered questions
  const totalQuestions = contentItems.reduce((sum, item) => sum + item.questions.length, 0)
  const answeredQuestions = userResponses.length
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  // Check if current question is answered
  const isCurrentQuestionAnswered = currentQuestion 
    ? userResponses.some(r => r.questionId === currentQuestion.id)
    : false

  // Check if all questions in current item are answered
  const currentItemQuestionsAnswered = currentItem?.questions.every(q =>
    userResponses.some(r => r.questionId === q.id)
  ) || false

  useEffect(() => {
    // Check if all questions are answered
    if (answeredQuestions === totalQuestions && totalQuestions > 0) {
      onAllCompleted()
    }
  }, [answeredQuestions, totalQuestions, onAllCompleted])

  const handleReadingComplete = () => {
    setShowQuestions(true)
  }

  const handleQuestionAnswer = (selected: number) => {
    if (currentQuestion) {
      onQuestionAnswered(currentQuestion.id, selected)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentItem.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Move to next content item
      setCompletedItems(prev => new Set([...prev, currentItem.id]))
      if (currentItemIndex < contentItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
        setCurrentQuestionIndex(0)
        setShowQuestions(false)
      }
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleBackToReading = () => {
    setShowQuestions(false)
  }

  const handleNextItem = () => {
    if (currentItemIndex < contentItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      setCurrentQuestionIndex(0)
      setShowQuestions(false)
    }
  }

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1)
      setCurrentQuestionIndex(0)
      setShowQuestions(false)
    }
  }

  if (!currentItem) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No content available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{answeredQuestions}/{totalQuestions} questions completed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {contentItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index === currentItemIndex
                  ? 'bg-primary text-primary-foreground'
                  : completedItems.has(item.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {completedItems.has(item.id) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Section {currentItemIndex + 1} of {contentItems.length}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentItem.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showQuestions ? (
            <div className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <Markdown>{currentItem.body}</Markdown>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousItem}
                  disabled={currentItemIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Section
                </Button>
                
                <Button onClick={handleReadingComplete}>
                  Start Quiz
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleBackToReading}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Reading
                </Button>
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {currentItem.questions.length}
                </div>
              </div>

              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  onAnswer={handleQuestionAnswer}
                  isAnswered={isCurrentQuestionAnswered}
                  userResponse={userResponses.find(r => r.questionId === currentQuestion.id)}
                />
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <Button
                  onClick={handleNextQuestion}
                  disabled={!isCurrentQuestionAnswered}
                >
                  {currentQuestionIndex < currentItem.questions.length - 1 ? 'Next' : 
                   currentItemIndex < contentItems.length - 1 ? 'Next Section' : 'Complete'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 