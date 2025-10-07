'use client'

import { AIControlProvider } from '@/contexts/AIControlContext'
import { DigitalTwinExperience } from './DigitalTwinExperience'

export default function DigitalTwinWrapper() {
  return (
    <AIControlProvider>
      <DigitalTwinExperience />
    </AIControlProvider>
  )
}
