# Vercel Deployment - Quick Start Guide

Get LangCoach live on Vercel in 10 minutes.

## Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

## 5-Minute Setup

### 1. Prepare Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

Required values:
- `VITE_PASSWORD`: Your login password
- `OPENAI_API_KEY`: From OpenAI dashboard
- `ELEVENLABS_API_KEY`: From ElevenLabs dashboard

### 2. Verify Build Works

```bash
# Test build
npm run build
npm run test:client

# Should complete without errors
```

### 3. Deploy to Vercel

```bash
# From project root
vercel --prod
```

Vercel will:
1. Auto-detect project structure
2. Build the app
3. Deploy to production
4. Show live URL

### 4. Add Environment Variables to Vercel

After first deployment, add to Vercel dashboard:

```
Project Settings → Environment Variables
```

Add for **Production**:
- `VITE_API_URL`: (auto-filled with your Vercel URL)
- `VITE_PASSWORD`: Your password
- `OPENAI_API_KEY`: Your key
- `ELEVENLABS_API_KEY`: Your key

Add for **Preview** (for testing):
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`

### 5. Redeploy

```bash
vercel --prod
```

Done! 🎉

---

## Access Your App

Your app is live at: `https://your-project.vercel.app`

---

## Common Issues

### "Build failed"

```bash
# Check local build works
npm run install:all
npm run build:client
```

### "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules client/node_modules api/node_modules
npm run install:all
```

### "API returning 502"

```bash
# Check environment variables are set
vercel env ls

# Redeploy
vercel --prod
```

---

## Next Steps

1. **Test the app** at live URL
2. **Share with team**
3. **Monitor performance** in Vercel dashboard
4. **Setup custom domain** (optional)
5. **Configure monitoring** (Sentry, etc.)

---

## Useful Commands

```bash
# View logs in real-time
vercel logs --follow

# List all deployments
vercel deployments

# View deployment status
vercel status

# Test locally
vercel dev

# Add env variable
vercel env add VARIABLE_NAME
```

---

## Cost Estimate

- **Vercel Hosting**: Free (Hobby plan)
- **OpenAI API**: ~$50-200/month
- **ElevenLabs TTS**: ~$50-200/month
- **Custom Domain**: ~$12/year
- **Total**: ~$120-420/month

---

## For Detailed Setup

See **VERCEL_DEPLOYMENT_GUIDE.md** for complete documentation.

---

## Support

- Vercel Dashboard: https://vercel.com/dashboard
- CLI Help: `vercel --help`
- Docs: https://vercel.com/docs
