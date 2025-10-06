# 🚀 Upstash Redis Setup (5 Minutes)

## Why You Need This
- **Current:** 11-12 seconds for RAG/LLM processing
- **With Redis:** 0.5-1 second (cached responses)
- **Cost:** $10/month (or $0.2 per 100k requests)

---

## Step 1: Create Upstash Account

1. Go to: https://upstash.com/
2. Sign in with GitHub
3. Click "Create Database"
4. Choose:
   - **Name:** sajal-phone-cache
   - **Region:** US East (same as Vercel)
   - **Type:** Regional (not Global)
5. Click "Create"

---

## Step 2: Get Your Credentials

After creation, copy these values:

```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA
```

---

## Step 3: Add to Vercel Environment Variables

1. Go to: https://vercel.com/sajal120/digital-twin/settings/environment-variables
2. Add these two variables:
   - `UPSTASH_REDIS_REST_URL` = (paste URL)
   - `UPSTASH_REDIS_REST_TOKEN` = (paste token)
3. Click "Save"
4. Redeploy: `vercel --prod`

---

## Step 4: Install Package (I'll do this for you)

```bash
pnpm add @upstash/redis
```

---

## Step 5: I'll Add This Code

```typescript
// Cache RAG responses for 1 hour
// Common questions ("hello", "who are you") become instant
```

---

## Expected Results

| Question Type | Before | After |
|--------------|--------|-------|
| First time   | 15s    | 5s    |
| Repeated     | 15s    | 1s ⚡ |
| Common greeting | 15s | 0.5s ⚡⚡ |

**ROI:** Most calls will be 1-2s (10x faster!)
