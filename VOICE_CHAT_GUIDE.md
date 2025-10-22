# Voice Chat Feature Guide

## Overview
The Voice Chat mode provides a complete voice-based conversation experience using your cloned Cartesia voice and Deepgram's advanced speech recognition, following the same backend architecture as the phone system but optimized for web and mobile browsers.

## Features
- 🎙️ **Voice Recording**: Uses Web Audio API + MediaRecorder  
- 📝 **Transcription**: Powered by Deepgram Nova-2 via `/api/voice/deepgram-transcribe`
- 🤖 **AI Processing**: Uses MCP Digital Twin for intelligent responses
- 🔊 **Text-to-Speech**: Your cloned Cartesia voice via `/api/voice/tts`
- � **Speech Control**: Stop AI speech anytime by tapping the button
- �📱 **Mobile Optimized**: Works great on mobile devices

## How It Works

### Step-by-Step Process
1. **User taps mic button** → Starts audio recording (WebM format)
2. **Audio sent to backend** → `/api/voice/deepgram-transcribe` (Deepgram Nova-2)  
3. **Text processed by AI** → `/api/mcp` (Digital Twin MCP server)
4. **AI response cleaned** → Removes MCP metadata and formatting
5. **Text-to-speech** → `/api/voice/tts` (Cartesia with your cloned voice)
6. **Audio played back** → Browser audio playback (stoppable)

### Technical Architecture
```
Browser (MediaRecorder) → Deepgram Nova-2 → MCP Digital Twin → Cartesia Voice → Browser (Audio)
     ↑                                                                            ↓
Voice Input                                                              Your Voice Output
```

## Usage

### Desktop
- Click the microphone button to start/stop recording
- **Keyboard Shortcut**: Press `SPACEBAR` for push-to-talk functionality
- Click "Replay" buttons to re-listen to AI responses

### Mobile
- Tap the microphone button to start talking
- Tap again to stop and process
- Optimized for touch interfaces

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
- **Auto-cleanup**: Microphone and audio resources automatically released
- **Speech interruption**: Stop AI speech anytime by tapping the mic button
- **Response cleaning**: Automatically removes MCP metadata and formatting
- **Error handling**: Graceful fallbacks for audio issues
- **Permission handling**: Clear prompts for microphone access
- **Format optimization**: WebM for modern browsers, fallbacks available

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