# 🎯 OAuth Provider Configuration Checklist

## 📋 Quick Reference for Production URLs

Replace `YOUR_PRODUCTION_URL` with your actual Vercel domain (e.g., `https://digital-twin-portfolio.vercel.app`)

## 🔧 Google OAuth Console Configuration

**Location**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Current App Details:
- **Client ID**: `469919738949-6detfpna66n0mucfa42j4hgpgne54cqg.apps.googleusercontent.com`
- **Project ID**: `digital-twin-473009`

### ✅ Actions Required:
1. Navigate to APIs & Services > Credentials
2. Click on your OAuth 2.0 Client ID
3. **Add these Authorized Redirect URIs**:
   ```
   YOUR_PRODUCTION_URL/api/auth/callback/google
   YOUR_PRODUCTION_URL/api/auth/google/callback
   ```
4. Keep existing localhost URIs for development:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/api/auth/google/callback
   ```

### 🔍 Additional Scopes (Already configured):
- `openid`
- `email` 
- `profile`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

---

## 🔗 LinkedIn Developer Portal Configuration

**Location**: [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)

### Current App Details:
- **Client ID**: `86hzlsszia4jze`
- **App Name**: Your Digital Twin Portfolio App

### ✅ Actions Required:
1. Go to your LinkedIn app dashboard
2. Navigate to Auth tab
3. **Add this Authorized Redirect URL**:
   ```
   YOUR_PRODUCTION_URL/api/auth/linkedin/callback
   ```
4. Keep existing localhost URL:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```

### 🔍 Required Scopes (Already configured):
- `openid`
- `profile`
- `email`
- `w_member_social`

---

## 🐙 GitHub OAuth App Configuration

**Location**: [GitHub Developer Settings](https://github.com/settings/developers)

### Current App Details:
- **Client ID**: `Ov23lin3GBi9e59atpyA`
- **Owner**: `Sajal120`

### ⚠️ Important Note:
GitHub OAuth Apps only allow **ONE** Authorization Callback URL per app.

### ✅ Two Options:

#### Option A: Update Existing App (Recommended for single developer)
1. Go to GitHub > Settings > Developer settings > OAuth Apps
2. Click on your existing app
3. **Update Authorization Callback URL to**:
   ```
   YOUR_PRODUCTION_URL/api/auth/github/callback
   ```

#### Option B: Create Separate Production App (Recommended for team)
1. Create a new OAuth App for production
2. Use the same settings but with production callback URL
3. Update your production environment variables with the new Client ID and Secret

### 🔍 Required Permissions (Already configured):
- `read:user`
- `user:email`
- `repo`

---

## 🚀 Vercel Environment Variables

After updating OAuth providers, set these in Vercel Dashboard:

```env
# OAuth Redirect URIs - Update these URLs!
LINKEDIN_REDIRECT_URI=YOUR_PRODUCTION_URL/api/auth/linkedin/callback
GOOGLE_REDIRECT_URI=YOUR_PRODUCTION_URL/api/auth/callback/google
NEXTAUTH_URL=YOUR_PRODUCTION_URL

# Main app URL
NEXT_PUBLIC_SERVER_URL=YOUR_PRODUCTION_URL
NEXT_PUBLIC_SITE_URL=YOUR_PRODUCTION_URL

# Keep all other variables the same as in your .env.production file
```

---

## 🧪 Testing Checklist

After configuration, test each integration:

### Google OAuth Test:
- [ ] Visit `/api/auth/signin` 
- [ ] Click "Sign in with Google"
- [ ] Should redirect to Google, then back to your app
- [ ] Check console for any CORS or redirect errors

### LinkedIn Integration Test:
- [ ] Trigger LinkedIn auth through your chatbot
- [ ] Should redirect to LinkedIn, then back with profile data
- [ ] Verify profile information is retrieved correctly

### GitHub Integration Test:
- [ ] Trigger GitHub integration through your RAG system
- [ ] Should redirect to GitHub, then back with repositories/profile data
- [ ] Check that GitHub API calls work correctly

---

## 🚨 Common Issues & Solutions

### Issue: "Redirect URI Mismatch"
**Solution**: Ensure URLs in OAuth providers exactly match environment variables (no trailing slashes, correct protocol)

### Issue: "Invalid Client" Error
**Solution**: Verify Client ID and Secret are correctly set in Vercel environment variables

### Issue: CORS Errors
**Solution**: Check that `NEXT_PUBLIC_SERVER_URL` is set correctly and matches your domain

### Issue: NextAuth URL Mismatch
**Solution**: Ensure `NEXTAUTH_URL` matches your production domain exactly

---

## 🎉 Production Deployment Workflow

1. **First**: Deploy to Vercel (may fail due to OAuth issues)
2. **Get**: Your production URL from Vercel
3. **Update**: OAuth provider configurations (this checklist)
4. **Set**: Vercel environment variables
5. **Redeploy**: Your application
6. **Test**: All OAuth integrations
7. **Monitor**: Vercel logs for any issues

---

## 📞 Support Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Production Checklist](https://next-auth.js.org/deployment)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth 2.0 Guide](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [GitHub OAuth App Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)

**You've got this! 🚀**