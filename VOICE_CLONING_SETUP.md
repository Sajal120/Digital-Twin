# Voice Cloning Setup Guide

This guide will help you set up voice cloning so your AI speaks with YOUR voice instead of synthetic voices.

## 🎯 Quick Setup (Recommended: ElevenLabs)

### Step 1: Create ElevenLabs Account
1. Go to [ElevenLabs](https://elevenlabs.io)
2. Sign up for an account (free tier available)
3. Get your API key from Settings > Profile

### Step 2: Clone Your Voice (Multilingual)
1. In ElevenLabs dashboard, go to "Voice Lab"
2. Click "Add Voice" > "Instant Voice Cloning"
3. **For Multilingual Support:**
   - Record samples in MULTIPLE languages you want to support
   - Minimum 1-2 minutes per language
   - Include varied content (conversational, professional, emotional tones)
4. Name your voice (e.g., "Sajal_Multilingual")
5. Copy the Voice ID from the voice details

### Multilingual Recording Strategy:
- **English**: 2-3 minutes of varied content
- **Your Native Language**: 2-3 minutes 
- **Additional Languages**: 1-2 minutes each
- **Total Recommended**: 5-10 minutes across all languages

### Step 3: Configure Environment Variables
Your `.env.local` file has been configured with your voice IDs:

```bash
# ElevenLabs Voice Cloning Configuration  
ELEVENLABS_API_KEY=sk_264b7f4b380378e30e3c26b70dc18b77f87dada89575109d
USE_VOICE_CLONING=true

# Voice IDs for different languages
ELEVENLABS_VOICE_ID_ENGLISH=WcXkU7PbsO0uKKBdWJrG
ELEVENLABS_VOICE_ID_NEPALI=kVZyn8ilKHGqUvyzpypz  
ELEVENLABS_VOICE_ID_HINDI=kVZyn8ilKHGqUvyzpypz
ELEVENLABS_VOICE_ID_SPANISH=icR4YGTUP0802ik86tET
ELEVENLABS_VOICE_ID_CHINESE=5WyRhB8fkmIoGHFIECuf

# Default voice ID (English)
ELEVENLABS_VOICE_ID=WcXkU7PbsO0uKKBdWJrG
```

✅ **Your voices are now configured for:**
- **English**: Professional voice clone
- **Nepali/Hindi**: Same voice ID (Devanagari script)
- **Spanish**: Separate trained voice
- **Chinese**: Separate trained voice

### Step 4: Test Your Multilingual Voice System
```bash
# Run the comprehensive test
node test-multilingual-voice.js

# Test individual languages
curl -X POST http://localhost:3000/api/voice/speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is my English voice!", "provider": "elevenlabs"}'

curl -X POST http://localhost:3000/api/voice/speech \
  -H "Content-Type: application/json" \
  -d '{"text": "नमस्कार, यो मेरो नेपाली आवाज हो!", "provider": "elevenlabs"}'

curl -X POST http://localhost:3000/api/voice/speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola, esta es mi voz en español!", "provider": "elevenlabs"}'
```

## � Multilingual Voice Cloning

### Supported Languages (ElevenLabs):
- **English** (en) - Best quality with monolingual model
- **Spanish** (es) - High quality
- **French** (fr) - High quality  
- **German** (de) - High quality
- **Italian** (it) - High quality
- **Portuguese** (pt) - High quality
- **Polish** (pl) - Good quality
- **Turkish** (tr) - Good quality
- **Russian** (ru) - Good quality
- **Dutch** (nl) - Good quality
- **Czech** (cs) - Good quality
- **Arabic** (ar) - Good quality
- **Chinese** (zh) - Good quality
- **Japanese** (ja) - Good quality
- **Hindi** (hi) - Good quality
- **Korean** (ko) - Good quality
- **Nepali** (ne) - Supported via Hindi model

### Recording Tips for Multiple Languages:
- **Consistency**: Use same recording setup for all languages
- **Natural Speech**: Speak naturally in each language
- **Varied Content**: Include different sentence structures
- **Clear Pronunciation**: Articulate clearly in each language

### Sample Multilingual Recording Script:

#### English (2-3 minutes):
```
Hello, my name is Sajal and I'm a software engineer. I specialize in full-stack development, artificial intelligence, and modern web technologies. I've worked on numerous projects involving React, Node.js, Python, and machine learning. I'm passionate about creating innovative solutions that solve real-world problems.
```

#### Nepali (2-3 minutes):
```
नमस्कार, मेरो नाम सजल हो र म एक सफ्टवेयर इन्जिनियर हुँ। म फुल-स्ट्याक डेभलपमेन्ट, आर्टिफिशियल इन्टेलिजेन्स, र आधुनिक वेब प्रविधिहरूमा विशेषज्ञता राख्छु। मैले React, Node.js, Python, र मेसिन लर्निङ सम्बन्धी धेरै परियोजनाहरूमा काम गरेको छु।
```

#### Hindi (1-2 minutes):
```
नमस्ते, मेरा नाम सजल है और मैं एक सॉफ्टवेयर इंजीनियर हूं। मैं फुल-स्टैक डेवलपमेंट, आर्टिफिशियल इंटेलिजेंस, और आधुनिक वेब तकनीकों में विशेषज्ञता रखता हूं।
```

## 🎙️ Recording Tips for Best Results

### Voice Recording Guidelines:
- **Duration**: 1-5 minutes minimum
- **Environment**: Quiet room, no background noise
- **Tone**: Natural, conversational speaking
- **Content**: Read varied text (news articles, books, etc.)
- **Consistency**: Maintain same tone and pace throughout

### Sample Text to Record:
```
Hello, my name is Sajal and I'm a software engineer. I specialize in full-stack development, artificial intelligence, and modern web technologies. I've worked on numerous projects involving React, Node.js, Python, and machine learning. I'm passionate about creating innovative solutions that solve real-world problems. I enjoy collaborating with teams and mentoring junior developers. Technology is constantly evolving, and I stay updated with the latest trends and best practices in software development.
```

## 🔧 Advanced Configuration

### Voice Settings (ElevenLabs)
```typescript
// In your environment or code
const voiceSettings = {
  stability: 0.5,        // 0-1, higher = more stable, lower = more expressive
  similarity_boost: 0.8, // 0-1, how similar to your voice
  style: 0.0,           // 0-1, style exaggeration
  use_speaker_boost: true // Enhance speaker similarity
}
```

### Multiple Voice Providers
Your system supports multiple providers:
- **ElevenLabs**: Best quality, voice cloning
- **OpenAI**: Good quality, no cloning (fallback)
- **Murf**: Alternative cloning service
- **Resemble**: Enterprise voice cloning

## 🚀 Usage in Your Chat

Once configured, your AI will automatically use your cloned voice when responding. The system will:

1. Generate AI response text
2. Send text to ElevenLabs with your voice ID
3. Return audio in your voice
4. Play audio in the chat interface

## 📊 Cost Considerations

### ElevenLabs Pricing:
- **Free**: 10,000 characters/month
- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters

### Optimization Tips:
- Cache frequent responses
- Use shorter responses when possible
- Implement text compression for repeated phrases

## 🔍 Troubleshooting

### Common Issues:

1. **Voice sounds robotic**
   - Increase similarity_boost (0.8-0.9)
   - Record more varied voice samples
   - Use professional recording setup

2. **API errors**
   - Check API key is valid
   - Verify voice ID exists
   - Check ElevenLabs quota

3. **Fallback to OpenAI**
   - System automatically falls back if ElevenLabs fails
   - Check environment variables are set correctly

### Debug Commands:
```bash
# Test ElevenLabs connection
node -e "console.log(process.env.ELEVENLABS_API_KEY ? 'API Key found' : 'API Key missing')"

# Test voice ID
curl -H "xi-api-key: YOUR_API_KEY" https://api.elevenlabs.io/v1/voices
```

## 🎯 Next Steps

1. Record your voice samples
2. Set up ElevenLabs account
3. Configure environment variables
4. Test the voice cloning
5. Start using your AI with YOUR voice!

Your users will now hear YOUR actual voice when the AI responds, creating a much more personal and engaging experience.