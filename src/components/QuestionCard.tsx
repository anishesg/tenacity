'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Circle } from 'lucide-react'

interface Question {
  id: string
  prompt: string
  choices: string[]
  answerIndex: number
  points: number
}

interface QuestionCardProps {
  question: Question
  onAnswer: (selected: number) => void
  isAnswered: boolean
  userResponse?: {
    selected: number
    correct: boolean
    pointsAwarded: number
    correctAnswer?: number
  }
}

export function QuestionCard({
  question,
  onAnswer,
  isAnswered,
  userResponse
}: QuestionCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(
    userResponse?.selected ?? null
  )

  const handleChoiceSelect = (index: number) => {
    if (!isAnswered) {
      setSelectedChoice(index)
    }
  }

  const handleSubmit = () => {
    if (selectedChoice !== null && !isAnswered) {
      onAnswer(selectedChoice)
    }
  }

  const getChoiceStyle = (index: number) => {
    if (!isAnswered) {
      return selectedChoice === index
        ? 'border-primary bg-primary/10'
        : 'border-border hover:border-primary/50'
    }

    // Show results after answering
    if (userResponse) {
      if (index === question.answerIndex) {
        return 'border-green-500 bg-green-50 text-green-900'
      }
      if (index === userResponse.selected && !userResponse.correct) {
        return 'border-red-500 bg-red-50 text-red-900'
      }
    }

    return 'border-border'
  }

  const getChoiceIcon = (index: number) => {
    if (!isAnswered) {
      return selectedChoice === index ? (
        <Circle className="w-5 h-5 fill-current" />
      ) : (
        <Circle className="w-5 h-5" />
      )
    }

    // Show results after answering
    if (userResponse) {
      if (index === question.answerIndex) {
        return <CheckCircle className="w-5 h-5 text-green-600" />
      }
      if (index === userResponse.selected && !userResponse.correct) {
        return <XCircle className="w-5 h-5 text-red-600" />
      }
    }

    return <Circle className="w-5 h-5 text-muted-foreground" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.prompt}</CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Points: {question.points}</span>
          {isAnswered && userResponse && (
            <span className={userResponse.correct ? 'text-green-600' : 'text-red-600'}>
              {userResponse.correct ? 'Correct!' : 'Incorrect'} 
              ({userResponse.pointsAwarded}/{question.points} points)
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {question.choices.map((choice, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${getChoiceStyle(index)}`}
              onClick={() => handleChoiceSelect(index)}
            >
              {getChoiceIcon(index)}
              <span className="flex-1">{choice}</span>
            </div>
          ))}
        </div>

        {!isAnswered && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={selectedChoice === null}
            >
              Submit Answer
            </Button>
          </div>
        )}

        {isAnswered && userResponse && !userResponse.correct && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Correct answer:</strong> {question.choices[question.answerIndex]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 