# 🚀 Production2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID: `your_google_client_id_here`
4. **Add these Authorized Redirect URIs**:ployment Guide for Digital Twin on Vercel

This guide will help you deploy your Digital Twin project to production on Vercel with all OAuth integrations working correctly.

## 📋 Pre-Deployment Checklist

### 1. **Get Your Vercel Production URL**
- Deploy your project to Vercel first (it may fail due to missing env vars, that's OK)
- Get your production URL: `https://your-app-name.vercel.app`
- Or use your custom domain if configured

### 2. **OAuth Provider Configurations**

#### 🔧 **Google OAuth Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Find your OAuth 2.0 Client ID: `469919738949-6detfpna66n0mucfa42j4hgpgne54cqg.apps.googleusercontent.com`
4. **Add these Authorized Redirect URIs**:
   ```
   https://sajal-app.online/api/auth/callback/google
   https://sajal-app.online/api/auth/google/callback
   ```
5. **Keep existing localhost URIs for development**:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/api/auth/google/callback
   ```

#### 🔗 **LinkedIn Developer Console**
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Find your app with Client ID: `your_linkedin_client_id_here`
3. Go to Auth tab
4. **Add these Authorized Redirect URLs**:
   ```
   https://sajal-app.online/api/auth/linkedin/callback
   ```
5. **Keep existing localhost URL for development**:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```

#### 🐙 **GitHub OAuth App**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Find your OAuth App with Client ID: `your_github_client_id_here`
3. **Update Authorization Callback URL to**:
   ```
   https://sajal-app.online/api/auth/github/callback
   ```
4. **Note**: GitHub only allows one callback URL per app. You may need to:
   - Create a separate OAuth app for production, OR
   - Use the same app and switch the URL when deploying

## ⚙️ Vercel Environment Variables Setup

### **Step 1: Access Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings > Environment Variables

### **Step 2: Add These Environment Variables**

**🔥 CRITICAL - Using domain: `sajal-app.online`**

```env
# Database
DATABASE_URI=your_neon_database_uri_here
DATABASE_URL=your_neon_database_url_here

# Payload CMS
PAYLOAD_SECRET=your_payload_secret_here
CRON_SECRET=your_cron_secret_here
PREVIEW_SECRET=your_preview_secret_here

# Production URLs
NEXT_PUBLIC_SERVER_URL=https://sajal-app.online
NEXT_PUBLIC_SITE_URL=https://sajal-app.online

# Environment
NODE_ENV=production

# AI Services
GROQ_API_KEY=your_groq_api_key_here
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url_here
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token_here
OPENAI_API_KEY=your_openai_api_key_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_USERNAME=Sajal120

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
LINKEDIN_REDIRECT_URI=https://sajal-app.online/api/auth/linkedin/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_PROJECT_ID=your_google_project_id_here
GOOGLE_REDIRECT_URI=https://sajal-app.online/api/auth/callback/google

# NextAuth.js
NEXTAUTH_URL=https://sajal-app.online
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-this-in-production-2024
```

### **Step 3: Environment Selection**
For each variable, set the environment to:
- ✅ **Production**
- ✅ **Preview** (optional, for branch previews)
- ❌ **Development** (keep using your local .env file)

## 🔧 Code Updates Required

### **1. Update LinkedIn Service (Optional Improvement)**
The LinkedIn service already uses dynamic URL construction, but you can make it more explicit:

**File**: `src/lib/linkedin-service.ts`
- The constructor already uses: `process.env.LINKEDIN_REDIRECT_URI || ${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/linkedin/callback`
- This will automatically work with your production URL ✅

### **2. Update GitHub Service (Optional Improvement)**  
**File**: `src/lib/github-service.ts`
- The `getOAuthUrl()` method already uses: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/github/callback`
- This will automatically work with your production URL ✅

### **3. No changes needed for Google OAuth**
NextAuth.js handles this automatically with `NEXTAUTH_URL` ✅

## 🚀 Deployment Steps

### **Step 1: Verify Your Domain**
1. Your domain `sajal-app.online` is now configured
2. Ensure it's properly set up in Vercel dashboard

### **Step 2: Configure OAuth Providers**
1. ✅ Google Console - Add production redirect URIs
2. ✅ LinkedIn Developer Portal - Add production redirect URL  
3. ✅ GitHub OAuth App - Update callback URL (or create separate production app)

### **Step 3: Set Vercel Environment Variables**
1. Copy all variables from the list above
2. Set them in Vercel Dashboard > Settings > Environment Variables
3. Make sure to select "Production" environment

### **Step 4: Deploy**
1. Push your code to your connected Git repository
2. Vercel will automatically deploy
3. Monitor the deployment logs for any errors

### **Step 5: Test OAuth Integrations**
1. Visit your production URL
2. Test each OAuth provider:
   - ✅ Google Sign-in
   - ✅ LinkedIn Integration  
   - ✅ GitHub Integration
3. Check that callbacks work correctly

## 🔍 Common Issues & Solutions

### **Issue**: OAuth Redirect Mismatch
**Solution**: Double-check that redirect URIs in OAuth provider consoles exactly match your environment variables

### **Issue**: NEXTAUTH_URL Error
**Solution**: Ensure `NEXTAUTH_URL` is set to your production URL without trailing slash

### **Issue**: Database Connection Error
**Solution**: Your Neon database connection string should work in production. Verify it's correctly set.

### **Issue**: CORS Errors
**Solution**: Your `next.config.js` is already configured to handle dynamic URLs based on environment

## 📝 Production vs Development

### **Development** (localhost:3000)
- Uses `.env` file
- OAuth redirects to `localhost:3000`
- All services work locally

### **Production** (Vercel)
- Uses Vercel Environment Variables
- OAuth redirects to your production domain
- `VERCEL_PROJECT_PRODUCTION_URL` is automatically set by Vercel

## 🎯 Final Checklist

- [ ] Updated OAuth provider redirect URIs
- [ ] Set all Vercel environment variables
- [ ] Replaced `your-app-name.vercel.app` with actual URL
- [ ] Tested all OAuth integrations in production
- [ ] Verified chatbot functionality works
- [ ] Confirmed database connectivity

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify OAuth provider configurations
3. Test individual API endpoints
4. Check browser network tab for failed requests

**Your project is ready for production! 🎉**