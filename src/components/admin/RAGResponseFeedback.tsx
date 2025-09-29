'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Temporarily commented out to fix build issue
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RAGResponseFeedbackProps {
  queryId?: string
  metadata?: {
    agenticDecision?: 'SEARCH' | 'DIRECT' | 'CLARIFY'
    conversationContext?: string
    processingTime?: number
    interviewContext?: string
  }
  response: string
  compact?: boolean
}

export default function RAGResponseFeedback({
  queryId,
  metadata,
  response,
  compact = false,
}: RAGResponseFeedbackProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (!queryId) return

    setFeedbackType(type)
    setFeedbackGiven(true)

    try {
      await fetch('/api/admin/rag-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId,
          feedback: {
            satisfactionRating: type === 'positive' ? 5 : 2,
            clickedHelpful: type === 'positive',
          },
        }),
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'SEARCH':
        return 'bg-blue-100 text-blue-800'
      case 'DIRECT':
        return 'bg-green-100 text-green-800'
      case 'CLARIFY':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDecisionDescription = (decision: string) => {
    switch (decision) {
      case 'SEARCH':
        return 'AI searched the knowledge base'
      case 'DIRECT':
        return 'AI provided direct guidance'
      case 'CLARIFY':
        return 'AI requested clarification'
      default:
        return 'Standard response'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-2">
        {!feedbackGiven ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('positive')}
              className="text-xs h-6 px-2 hover:bg-green-50"
            >
              👍 Helpful
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('negative')}
              className="text-xs h-6 px-2 hover:bg-red-50"
            >
              👎 Not helpful
            </Button>
          </>
        ) : (
          <span className="text-xs text-gray-500">
            Thanks for your feedback! {feedbackType === 'positive' ? '👍' : '👎'}
          </span>
        )}

        {metadata?.agenticDecision && (
          <div className="relative group">
            <Badge
              className={`text-xs ${getDecisionColor(metadata.agenticDecision)}`}
              variant="secondary"
            >
              {metadata.agenticDecision}
            </Badge>
            {/* Temporarily simplified tooltip - will fix in future update */}
            <div className="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
              {getDecisionDescription(metadata.agenticDecision)}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="mt-4 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI Response Quality</span>
            {metadata?.agenticDecision && (
              <Badge className={getDecisionColor(metadata.agenticDecision)}>
                {metadata.agenticDecision} Decision
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {showDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Decision Type:</span>{' '}
                {getDecisionDescription(metadata?.agenticDecision || 'unknown')}
              </div>
              {metadata?.processingTime && (
                <div>
                  <span className="font-medium">Response Time:</span>{' '}
                  {metadata.processingTime.toFixed(0)}ms
                </div>
              )}
            </div>
            {metadata?.conversationContext && (
              <div>
                <span className="font-medium">Context Used:</span> {metadata.conversationContext}
              </div>
            )}
            {metadata?.interviewContext && (
              <div>
                <span className="font-medium">Interview Type:</span> {metadata.interviewContext}
              </div>
            )}
            <div>
              <span className="font-medium">Response Length:</span> {response.length} characters
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Was this response helpful?</span>
          <div className="flex gap-2">
            {!feedbackGiven ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback('positive')}
                  className="text-green-600 hover:bg-green-50 border-green-200"
                >
                  👍 Yes, helpful
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback('negative')}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  👎 Not helpful
                </Button>
              </>
            ) : (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span>Thanks for your feedback!</span>
                {feedbackType === 'positive' ? (
                  <span className="text-green-600">👍 Marked as helpful</span>
                ) : (
                  <span className="text-red-600">👎 We'll improve this</span>
                )}
              </div>
            )}
          </div>
        </div>

        {feedbackGiven && feedbackType === 'negative' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Your feedback helps improve our AI system. This response has been flagged for
              review.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
