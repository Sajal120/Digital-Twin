# 🔧 Phone System Environment Variables Setup

## Required Environment Variables for Vercel

To make your phone system work with custom voice and full functionality, you need to set these environment variables in your Vercel dashboard:

### 1. Navigate to Vercel Dashboard
- Go to https://vercel.com/dashboard
- Select your "Digital-Twin" project
- Go to Settings → Environment Variables

### 2. Add These Variables:

#### **ElevenLabs (For Custom Voice)**
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=WcXkU7PbsO0uKKBdWJrG
```

#### **OpenAI (Already set, but verify)**
```
OPENAI_API_KEY=your_openai_api_key_here
```

#### **Twilio (Already set, but verify)**
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

#### **Next.js URL (Important for API calls)**
```
NEXTAUTH_URL=https://www.sajal-app.online
```

### 3. How to Get ElevenLabs API Key:

1. **Go to ElevenLabs**: https://elevenlabs.io/
2. **Sign up/Login** to your account
3. **Go to Profile** → **API Keys**
4. **Generate new API key** if you don't have one
5. **Copy the API key**

### 4. Verify Your Voice ID:

Your custom voice ID is: `WcXkU7PbsO0uKKBdWJrG`

You can verify this by:
1. Going to ElevenLabs → Voice Library
2. Finding your custom voice
3. Checking the voice ID in the URL or settings

### 5. Set Variables in Vercel:

For each variable:
1. Click "Add New Variable"
2. Enter the **Name** (e.g., `ELEVENLABS_API_KEY`)
3. Enter the **Value** (your actual API key)
4. Select **Production** environment
5. Click "Save"

### 6. Redeploy After Setting Variables:

After adding all variables, redeploy your application:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. OR push a new commit to trigger deployment

## ✅ Verification

After setting up the environment variables, test your phone system:

1. **Call**: +61 2 7804 4137
2. **Expected behavior**:
   - Answers in your custom voice (ElevenLabs)
   - Provides rich responses from your database/MCP server
   - Maintains conversation flow
   - Speaks as "Sajal Basnet" in first person

## 🐛 Troubleshooting

If issues persist:

1. **Check Vercel Logs**:
   - Go to Functions tab in Vercel
   - Check logs for `/api/phone/handle-recording`
   - Look for ElevenLabs API errors

2. **Test API Endpoints**:
   ```bash
   # Test MCP integration
   curl -X POST https://www.sajal-app.online/api/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":"test","method":"tools/call","params":{"name":"ask_digital_twin","arguments":{"question":"Test question","enhancedMode":true}}}'
   ```

3. **Check TwiML Responses**:
   ```bash
   # Test phone webhook
   curl -X POST https://www.sajal-app.online/api/phone/webhook \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "From=%2B1234567890&To=%2B61278044137&CallSid=test123"
   ```

## 📞 Expected Call Flow

1. **Call arrives** → Phone webhook responds with greeting
2. **User speaks** → Audio recorded and transcribed  
3. **AI processes** → MCP server provides context-rich response
4. **ElevenLabs generates** → Your custom voice audio
5. **Plays response** → Continues recording for next input
6. **Repeat** → Natural conversation flow

The key is setting the `ELEVENLABS_API_KEY` in Vercel to enable custom voice!