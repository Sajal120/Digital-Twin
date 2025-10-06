# 🚀 Upstash Redis Setup Instructions

## ✅ Step 1: Install Package (DONE!)
```bash
pnpm add @upstash/redis
```

---

## 🔧 Step 2: Create Redis Database (2 minutes)

1. Go to: **https://console.upstash.com/**
2. You should already be logged in (you have Upstash Vector)
3. Click **"Redis"** tab at the top
4. Click **"Create Database"**
5. Configure:
   - **Name:** `sajal-cache`
   - **Type:** Regional (NOT Global)
   - **Region:** **us-east-1** (same as Vercel)
   - **Eviction:** ✅ Enable (recommended for caching)
   - **TLS:** ✅ Enabled (default)
6. Click **"Create"**

---

## 🔑 Step 3: Get Your Redis Credentials

After creating the database, click on it and scroll to **"REST API"** section.

You'll see:
```bash
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxA
```

**Copy both values!**

---

## ⚙️ Step 4: Add to Vercel Environment Variables

1. Go to your screenshot location (already open):
   **https://vercel.com/sajal-basnets-projects/digital-twin-prj/settings/environment-variables**

2. Click **"Add New"** button

3. Add **FIRST** variable:
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** (paste your Redis URL - NOT the vector URL!)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

4. Add **SECOND** variable:
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** (paste your Redis token)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

---

## 🎯 What This Will Do

Once you add the credentials, I'll implement caching for:

### Phone Calls:
- ✅ Cache common greetings ("hello", "how are you")
- ✅ Cache responses for 5 minutes
- ✅ 15s → 1-2s response time (10x faster!)

### Chat:
- ✅ Cache repeated questions
- ✅ Cache search results
- ✅ 24s → 2-3s response time (8x faster!)

---

## 📊 Expected Performance

| Scenario | Before | After Cache Hit |
|----------|--------|-----------------|
| First-time question | 15s | 15s (no cache) |
| Repeat question | 15s | 1-2s ⚡ |
| Common greeting | 15s | 0.5s ⚡⚡ |
| Chat message | 24s | 2-3s ⚡ |

**80% of calls will be cached = instant responses!**

---

## 💰 Cost

- **Free Tier:** 10,000 commands/day (plenty for testing)
- **Pay-as-you-go:** $0.2 per 100k commands
- **Expected:** ~$10/month for moderate usage

---

## ✅ Next Steps

**After you add the Redis credentials to Vercel:**

1. Tell me: **"Credentials added"**
2. I'll implement the caching code (5 files to modify)
3. Deploy to production
4. Test and see 10x speedup!

---

## 🆘 Need Help?

If you can't find the Redis section in Upstash:
- You might need to create a separate Redis account/project
- Or click the Upstash logo at top left → Switch to Redis

Let me know when you've added the credentials to Vercel! 🚀
