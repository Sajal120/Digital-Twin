# Voice Input Debugging Guide

## Issue: Microphone notification shows but no voice captured

The microphone icon shows "site is using your microphone" but speech isn't being captured or sent to the backend.

---

## ✅ Changes Deployed

### 1. **Comprehensive Logging Added**
All voice input events are now logged to the browser console:
- 🎤 Speech recognition start
- 📝 Speech results received
- ✅ Final transcripts
- ❌ Errors with detailed context
- 🛑 Recognition end events
- 🔄 Auto-restart attempts

### 2. **API Call Tracking**
- 📤 Request details to `/api/voice/conversation`
- 📥 Response status and data
- 💬 Message processing flow

---

## 🧪 Testing Instructions

### **Step 1: Open Browser Console**
On your phone:
1. **iPhone Safari**: Settings > Safari > Advanced > Web Inspector (connect to Mac)
2. **Android Chrome**: Connect phone to computer, use Chrome DevTools Remote Debugging
3. **Alternative**: Use desktop browser first to verify

### **Step 2: Test Voice Input**
1. Visit: https://www.sajal-app.online
2. Open browser console (F12 or right-click > Inspect)
3. Click the microphone button
4. Watch for these logs:

```
✅ Expected logs when working:
📱 Requesting microphone access...
✅ Microphone access granted
🎙️ Starting recording...
🎤 Speech recognition STARTED
🎤 Speech recognition RESULT received
   Result 0: { transcript: "hello", isFinal: false }
📝 Transcripts: { finalTranscript: "", interimTranscript: "hello" }
🎤 Speech recognition RESULT received
   Result 1: { transcript: "hello", isFinal: true }
✅ Sending final transcript to callback: hello
📝 Transcription received in useVoiceChat
💬 Creating user message
🚀 Processing user message...
📤 Calling /api/voice/conversation
📥 API Response status: 200
✅ API Response data: { success: true, hasAudioUrl: true }
```

### **Step 3: Identify the Problem**

#### **Problem A: No speech recognition results**
If you see:
```
🎤 Speech recognition STARTED
⚠️ No speech detected - user may not be speaking loud enough
```

**Solution:**
- Speak louder and clearer
- Check if phone microphone is covered
- Try in a quieter environment
- The speech recognition API is very sensitive

#### **Problem B: Speech recognition not starting**
If you see:
```
❌ Recognition ref is null!
```
or
```
❌ Speech recognition ERROR: { error: "not-allowed" }
```

**Solution:**
- Clear browser cache and reload
- Check microphone permissions: Settings > Safari/Chrome > Microphone
- Try a different browser

#### **Problem C: Results received but not sent to backend**
If you see speech results but no "Transcription received in useVoiceChat":
```
🎤 Speech recognition RESULT received
📝 Transcripts: { finalTranscript: "hello", interimTranscript: "" }
(but no "Transcription received" log)
```

**Solution:**
- This indicates a bug in the callback chain
- Share the console logs with developer

#### **Problem D: Network/API errors**
If you see:
```
📥 API Response status: 500
```

**Solution:**
- Check Vercel logs for backend errors
- Verify internet connection
- Check API rate limits

---

## 🔍 Common Issues & Solutions

### **Issue 1: iOS Safari HTTPS Required**
**Symptoms:**
- Error: "HTTPS required for microphone on iOS"
- Speech recognition not available

**Fix:**
- Always use `https://www.sajal-app.online`
- Never use `http://` on iOS

### **Issue 2: Microphone Used by Another App**
**Symptoms:**
- Error: "Microphone is being used by another app"
- `NotReadableError` in console

**Fix:**
1. Close all other apps using microphone (Voice Memos, Phone, etc.)
2. Refresh the page
3. Try again

### **Issue 3: Speech Recognition Times Out**
**Symptoms:**
- Microphone indicator on but no results
- Logs show "Speech recognition ENDED" quickly
- Error: "no-speech"

**Fix:**
- **Speak immediately** after clicking mic button
- Web Speech API has a 5-10 second timeout
- Don't pause too long between words

### **Issue 4: Language Mismatch**
**Symptoms:**
- Speech detected but gibberish transcription
- Low confidence scores

**Fix:**
- Currently set to `en-US` (American English)
- Speak clearly in English
- Future: Add language selection

---

## 📊 Checking Vercel Logs

### **Backend Logs**
1. Go to: https://vercel.com/your-project/logs
2. Filter by: `/api/voice/conversation`
3. Check for:
   - Request received logs
   - Processing time
   - Errors or timeouts

### **What to Look For**
```
✅ Good log:
POST /api/voice/conversation 200 in 2.3s

❌ Bad log:
POST /api/voice/conversation 500 in 30s
Error: Timeout waiting for response
```

---

## 🛠️ Advanced Debugging

### **Check Speech Recognition Support**
Run in console:
```javascript
console.log({
  hasWebkitSpeechRecognition: 'webkitSpeechRecognition' in window,
  hasSpeechRecognition: 'SpeechRecognition' in window,
  hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isHTTPS: location.protocol === 'https:',
})
```

### **Test Microphone Directly**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone working:', stream.getAudioTracks())
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(err => console.error('❌ Microphone error:', err))
```

### **Manually Trigger Speech Recognition**
```javascript
const recognition = new webkitSpeechRecognition()
recognition.lang = 'en-US'
recognition.onresult = (e) => console.log('Result:', e.results[0][0].transcript)
recognition.onerror = (e) => console.error('Error:', e.error)
recognition.start()
// Now speak!
```

---

## 📱 Mobile-Specific Tips

### **iOS Safari**
- Must use HTTPS (not HTTP)
- Permission prompt appears once per domain
- May need to clear Safari data if permission denied
- Settings > Safari > Clear History and Website Data

### **Android Chrome**
- More lenient than iOS
- Can use HTTP on localhost
- Better error messages
- May need "Camera & Microphone" permission in Android settings

---

## 🎯 Expected Behavior

### **Successful Flow:**
1. User clicks microphone button
2. Browser requests microphone permission (first time only)
3. User grants permission
4. Microphone icon shows as active
5. **User speaks** (within 5-10 seconds)
6. Interim results appear as user speaks
7. Final transcript sent when user stops speaking
8. API processes message
9. AI response returned with audio
10. Audio plays automatically

### **Current Issue:**
- Steps 1-4 work ✅
- **Step 5-7 FAIL** ❌ (no speech detected)
- No logs reach backend

---

## 🚀 Next Steps

1. **Deploy and wait 2 minutes** for Vercel to update
2. **Open console on your phone** (or desktop first)
3. **Test microphone button** and watch logs
4. **Share console logs** if issue persists
5. **Check Vercel logs** for backend errors

---

## 📞 Need Help?

If you see unexpected logs or errors not covered here:
1. Take a screenshot of the console
2. Share the full console output
3. Note your device (iPhone/Android) and browser
4. Describe exactly when the issue occurs

The comprehensive logging will help identify exactly where the voice input flow breaks!
