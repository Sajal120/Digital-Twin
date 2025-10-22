# Voice Chat Feature Guide

## Overview
The Voice Chat mode provides a **pure voice conversation experience** - no text distractions during active conversations. Uses your cloned Cartesia voice and Deepgram's advanced speech recognition for natural, seamless voice-to-voice interaction.

## Key Features
- 🎙️ **Pure Voice Mode**: No text shown during active conversations
- 📝 **Deepgram Transcription**: Ultra-fast speech recognition via Nova-2 model
- 🤖 **Smart AI Processing**: Uses MCP Digital Twin for intelligent responses  
- 🔊 **Your Cloned Voice**: Cartesia TTS with your personal voice
- 🛑 **Speech Control**: Stop AI speech anytime by tapping the button
- � **Conversation Memory**: Auto-generates summaries to continue later
- �📱 **Mobile Optimized**: Perfect for hands-free mobile use

## How It Works

### Pure Voice Conversation Flow
1. **Start Conversation** → Enters pure voice mode (no text display)
2. **Voice Recording** → High-quality WebM audio capture  
3. **Deepgram Processing** → Ultra-fast speech-to-text transcription
4. **AI Intelligence** → MCP Digital Twin generates contextual response
5. **Response Cleaning** → Removes technical metadata for natural speech
6. **Cartesia Voice** → Your cloned voice speaks the response
7. **Memory Storage** → Conversation stored for later continuation
8. **End & Summary** → Auto-generates conversation summary

### Pure Voice Experience
- **No Text Distractions**: Clean voice-only interface during conversation
- **Natural Flow**: Seamless back-and-forth like a phone call
- **Memory Persistence**: Continue conversations across sessions
- **Speech Control**: Stop AI anytime by tapping mic button

### Technical Architecture
```
Start → Pure Voice Mode → Deepgram → MCP AI → Cartesia Voice → Memory → Summary
        (No Text Display)     ↓                    ↓           ↓         ↓
                          Store Memory    Your Voice    Session ID   Continue Later
```

## Usage

### Starting a Conversation
1. **Switch to Voice Chat Mode** → Click 🎙️ Voice Chat button
2. **Start New Conversation** → Click "🎤 Start New Conversation"  
3. **Pure Voice Interface** → No text shown during active conversation
4. **Natural Speaking** → Talk naturally, AI responds with your voice
5. **End Conversation** → Click "🛑 End Conversation" for summary

### During Conversation
- **Tap Mic**: Start recording your message
- **Tap Again**: Stop recording and process
- **Tap During AI Speech**: Stop AI and speak immediately  
- **Turn Counter**: See conversation progress
- **Natural Flow**: No text distractions

### After Conversation
- **Auto Summary**: Conversation summary generated automatically
- **Session Memory**: Conversation stored with unique session ID
- **Continue Later**: Resume conversations from previous sessions

## Voice Chat Mode Features

### UI Elements
- **🎙️ Voice Chat** mode toggle button
- Large microphone button with visual feedback
- Real-time status indicators:
  - 🎙️ "Listening..." (red, pulsing)
  - ⚡ "Processing..." (gray, loading)
  - 🔊 "AI is speaking..." (blue)
  - 🎯 "Ready to talk" (green)

### Message Display
- Voice messages show 🎙️/🔊 indicators
- Text transcripts are displayed for reference
- Replay buttons for re-listening to AI responses
- Message history preserved like other chat modes

### Smart Features
- **Pure Voice Experience**: No text shown during conversations for natural flow
- **Conversation Memory**: Auto-saves conversation summaries with session IDs
- **Session Continuity**: Resume conversations from where you left off
- **Speech Interruption**: Stop AI speech anytime by tapping the mic button
- **Response Cleaning**: Automatically removes technical metadata
- **Resource Management**: Auto-cleanup of microphone and audio resources
- **Error Handling**: Graceful fallbacks for audio issues
- **Mobile Optimized**: Touch-friendly interface for mobile devices

## API Integration

### Transcription (`/api/voice/deepgram-transcribe`)
- Input: Audio file (WebM/WAV)
- Output: Text transcript with confidence score
- Powered by: Deepgram Nova-2 (faster and more accurate than Whisper)

### AI Processing (`/api/mcp`)
- Input: User question text
- Output: Intelligent response (automatically cleaned of metadata)
- Powered by: Digital Twin MCP server

### Text-to-Speech (`/api/voice/tts`)
- Input: Response text
- Output: Audio file (MP3) in your voice
- Powered by: Cartesia with your cloned voice ID

## Browser Compatibility
- **Chrome/Edge**: Full support (WebM + Opus)
- **Firefox**: Full support
- **Safari**: Full support (WebM fallback)
- **Mobile**: Optimized for iOS Safari and Android Chrome

## Troubleshooting

### Common Issues
1. **Microphone not working**: Check browser permissions
2. **No sound output**: Check system audio settings
3. **Transcription errors**: Speak clearly, avoid background noise
4. **Processing delays**: Normal for AI processing (2-5 seconds)

### Error Handling
- Audio permission denied → Clear error message
- Transcription failed → Asks user to repeat
- AI processing failed → Graceful fallback response
- TTS failed → Text-only response mode

## Mobile Optimization
- Touch-friendly large buttons
- Battery-efficient recording
- Network-aware processing
- Responsive voice status indicators

The voice chat feature provides a seamless, natural conversation experience that mirrors the quality of the phone system while being optimized for web and mobile use.