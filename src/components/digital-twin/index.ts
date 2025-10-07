// Digital Twin Components - Central Export
export { AIControlProvider, useAIControl, detectIntent } from '@/contexts/AIControlContext'
export { DigitalTwinExperience } from '@/components/digital-twin/DigitalTwinExperience'
export { LandingScreen } from '@/components/digital-twin/LandingScreen'
export { AIControllerChat } from '@/components/digital-twin/AIControllerChat'
export { FuturisticBackground } from '@/components/digital-twin/FuturisticBackground'
export { AnimatedProjects } from '@/components/digital-twin/AnimatedProjects'
export { AnimatedSkills } from '@/components/digital-twin/AnimatedSkills'
export { ResumePanel } from '@/components/digital-twin/ResumePanel'
export { ContactTransform } from '@/components/digital-twin/ContactTransform'
export { default as DigitalTwinWrapper } from '@/components/digital-twin/DigitalTwinWrapper'

// Types
export type {
  UIMode,
  Theme,
  VoiceState,
  AIIntent,
  ActiveComponents,
} from '@/contexts/AIControlContext'
