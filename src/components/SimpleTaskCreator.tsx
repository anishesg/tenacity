'use client'

import { useState } from 'react'
import { 
  Target, 
  BookOpen, 
  CheckCircle2,
  Trophy
} from 'lucide-react'

interface SimpleTaskCreatorProps {
  groupId: string
  onTaskCreated: () => void
  onCancel: () => void
}

export function SimpleTaskCreator({ groupId, onTaskCreated, onCancel }: SimpleTaskCreatorProps) {
  const [loading, setLoading] = useState(false)
  const [taskType, setTaskType] = useState<'fitness' | 'learning' | 'habit'>('learning')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(100)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [dueDate, setDueDate] = useState('')

  const taskTypes = [
    {
      id: 'fitness',
      name: 'Fitness Challenge',
      icon: <Target className="w-5 h-5" />,
      description: 'Physical activities and workout challenges',
      color: 'text-red-500'
    },
    {
      id: 'learning',
      name: 'Learning Quest',
      icon: <BookOpen className="w-5 h-5" />,
      description: 'Educational content and skill development',
      color: 'text-blue-500'
    },
    {
      id: 'habit',
      name: 'Habit Builder',
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: 'Daily habits and routine building',
      color: 'text-green-500'
    }
  ]

  const difficultyLevels = [
    { id: 'easy', name: 'Easy', points: 50, description: 'Quick and simple' },
    { id: 'medium', name: 'Medium', points: 100, description: 'Moderate effort' },
    { id: 'hard', name: 'Hard', points: 200, description: 'Challenging task' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        taskType: 'MANUAL', // Default to manual verification
        pointValue: points,
        groupId,
        dueDate: dueDate || null,
        requiresEvidence: true,
        evidencePrompt: 'Please provide evidence of task completion'
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        onTaskCreated()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Modern Task Type Selection */}
      <div className="space-y-4">
        <label className="heading-text text-lg text-gray-900">Choose Your Quest Type</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {taskTypes.map((type) => (
            <div
              key={type.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                taskType === type.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setTaskType(type.id as any)}
            >
              <div className="text-center space-y-3">
                <div className={`${type.color} mx-auto`}>
                  {type.icon}
                </div>
                <div>
                  <h4 className="heading-text text-gray-900 font-semibold">{type.name}</h4>
                  <p className="body-text text-gray-600 text-sm">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="heading-text text-gray-900">Quest Title *</label>
          <input
            placeholder="Enter an epic task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="space-y-3">
          <label className="heading-text text-gray-900">Quest Deadline</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="heading-text text-gray-900">Quest Description *</label>
        <textarea
          placeholder="Describe the adventure that awaits..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
        />
      </div>

      {/* Modern Difficulty Selection */}
      <div className="space-y-4">
        <label className="heading-text text-lg text-gray-900">Choose Difficulty & Rewards</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficultyLevels.map((level) => (
            <div
              key={level.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                difficulty === level.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                setDifficulty(level.id as any)
                setPoints(level.points)
              }}
            >
              <div className="text-center space-y-3">
                <div>
                  <h3 className="heading-text text-gray-900 font-semibold text-lg">{level.name}</h3>
                  <p className="body-text text-gray-600 text-sm">{level.description}</p>
                </div>
                <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-900 font-semibold">{level.points} pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Action Buttons */}
      <div className="flex space-x-4 pt-6">
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
        >
          {loading ? '🚀 Creating Quest...' : '✨ Create Quest'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
} 