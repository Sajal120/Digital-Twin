# 🎯 Pinecone Setup (10 Minutes)

## Why Upgrade From Upstash Vectors
- **Current Upstash Vectors:** 800ms-1.5s per search
- **Pinecone:** 100-300ms per search (5x faster)
- **Cost:** ~$70/month

---

## Step 1: Create Pinecone Account

1. Go to: https://www.pinecone.io/
2. Sign up with email
3. Verify email
4. Choose "Serverless" plan (not "Pod")

---

## Step 2: Create Index

1. Click "Create Index"
2. Settings:
   - **Name:** `sajal-twin`
   - **Dimensions:** `1536` (OpenAI embeddings)
   - **Metric:** `cosine`
   - **Cloud:** `AWS`
   - **Region:** `us-east-1`
3. Click "Create Index"

---

## Step 3: Get API Key

1. Go to "API Keys" tab
2. Copy your API key:
   ```
   PINECONE_API_KEY=pcsk_xxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 4: Add to Vercel

1. Vercel Dashboard → Environment Variables
2. Add:
   - `PINECONE_API_KEY` = (paste key)
3. Save

---

## Step 5: Migrate Data

I'll provide a migration script that:
1. Exports from Upstash vectors
2. Imports to Pinecone
3. Switches your app to use Pinecone

**Migration time:** ~30 minutes for your data

---

## Expected Results

| Operation | Upstash | Pinecone |
|-----------|---------|----------|
| Vector search | 1-1.5s | 0.2-0.3s |
| Batch search | 2-3s | 0.5s |

**Speedup:** Additional 1-2 seconds saved
