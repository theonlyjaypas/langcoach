# Vercel Deployment Guide - LangCoach

Complete guide to deploy LangCoach to Vercel with optimal performance and security.

## Overview

This guide covers:
- Initial Vercel setup
- Environment variables configuration
- Performance optimization
- Security hardening
- Monitoring & debugging
- Cost optimization

---

## Pre-Deployment Checklist

Before deploying to Vercel, ensure:

```bash
# 1. Verify build succeeds locally
npm run build
npm run test:client

# 2. Check for TypeScript errors
npm run lint

# 3. Verify all env vars are set
cp .env.example .env.local
# Fill in actual values

# 4. Test production build locally
cd client
npm run preview
```

---

## Step 1: Initial Vercel Setup

### Create Vercel Project

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel
# Vercel will automatically detect the project structure
```

### Or Use Web Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your Git repository (GitHub/GitLab/Bitbucket)
4. Click "Import"
5. Vercel will auto-detect the configuration

---

## Step 2: Environment Variables

### Set in Vercel Dashboard

1. Go to Project Settings > Environment Variables
2. Add the following variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-project.vercel.app` | Production, Preview, Development |
| `VITE_PASSWORD` | Your secure password | Production |
| `OPENAI_API_KEY` | Your OpenAI key | Production, Preview |
| `ELEVENLABS_API_KEY` | Your ElevenLabs key | Production, Preview |

### Via CLI

```bash
vercel env add VITE_API_URL
# Select scope: Production
# Enter value: https://your-project.vercel.app

vercel env add VITE_PASSWORD
# Select scope: Production
# Enter value: your_secure_password

vercel env add OPENAI_API_KEY
# Select scope: Production, Preview
# Enter value: sk-your-key

vercel env add ELEVENLABS_API_KEY
# Select scope: Production, Preview
# Enter value: your-key
```

### Verify Environment Variables

```bash
vercel env ls
```

---

## Step 3: Deploy

### First Deployment

```bash
# Deploy from root directory
vercel --prod
```

### Subsequent Deployments

After pushing to main branch, Vercel automatically deploys.

Or manually:

```bash
vercel --prod
```

### Preview Deployments

Every pull request gets an automatic preview deployment.

---

## Step 4: Verify Deployment

### Check Deployment Status

```bash
vercel projects ls
vercel deployments
```

### Test Endpoints

```bash
# Test API endpoints
curl https://your-project.vercel.app/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'

# Should return 200 OK
```

### Performance Metrics

1. Go to Vercel Dashboard > Project > Analytics
2. Check:
   - Web Vitals (Core Web Vitals)
   - Performance metrics
   - Edge locations

---

## Step 5: Optimization

### 1. Enable Analytics

In Vercel Dashboard:
- Project Settings > Analytics
- Enable Web Analytics

### 2. Configure Build Settings

Verify in Project Settings > Build & Development:

```
Build Command: npm run vercel-build
Output Directory: client/dist
Install Command: npm run install:all
Node.js Version: 24.x
```

### 3. Function Configuration

Vercel.json already configured for:
- 30-second timeout
- 1GB memory per function
- Caching headers (cache static assets)

### 4. Edge Caching

Automatic via Vercel Edge Network:
- Static assets cached at edge (31536000s)
- API responses not cached (no-cache)
- Serialized across 27+ regions

---

## Step 6: Security Hardening

### 1. HTTPS Enforcement

Automatic via Vercel. All traffic forced to HTTPS.

### 2. Security Headers

Already configured in `vercel.json`:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains |
| `X-Content-Type-Options` | nosniff |
| `X-Frame-Options` | SAMEORIGIN |
| `X-XSS-Protection` | 1; mode=block |
| `Permissions-Policy` | microphone=(self), camera=() |

### 3. CSP (Content Security Policy)

Add to vercel.json if needed:

```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [{
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }]
  }]
}
```

### 4. Rate Limiting

Vercel provides DDoS protection by default.

For application-level rate limiting, consider:
- Upstash Redis (serverless)
- Supabase Edge Functions

---

## Step 7: Monitoring & Logging

### Vercel Analytics

Dashboard shows:
- Web Vitals
- API performance
- Error rates
- Deployment history

### View Logs

```bash
# Watch logs in real-time
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-id]
```

### External Monitoring (Optional)

Setup Sentry for error tracking:

```bash
npm install @sentry/node
```

Add to API handlers:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Step 8: Cost Optimization

### Optimize Function Execution Time

Current: 30s timeout, 1GB memory

For production:
- Monitor actual usage via logs
- Reduce timeout if possible (cold starts matter)
- Only use 512MB memory if sufficient

```json
{
  "functions": {
    "api/*.ts": {
      "maxDuration": 10,
      "memory": 512
    }
  }
}
```

### Optimize Build Time

Current build time ~2-3 minutes.

To speed up:
1. Remove unused dependencies
2. Use faster compilers
3. Parallelize builds

Already done:
- ✅ Removed axios, @supabase/supabase-js
- ✅ Optimized TypeScript compilation

### Estimated Costs (Monthly)

| Component | Cost |
|-----------|------|
| Hobby Plan | Free |
| Pro Plan | $20 |
| API calls (OpenAI) | ~$50-200 |
| TTS (ElevenLabs) | ~$50-200 |
| **Total** | **$120-420/mo** |

Note: Vercel hosting is free on Hobby plan. Most costs from API usage.

---

## Troubleshooting

### Build Fails

```bash
# Check build logs in dashboard
vercel logs --follow

# Test build locally
npm run vercel-build

# Check Node version
node --version  # Should be 24.x
```

### API Returns 502

```bash
# Check function logs
vercel logs --follow

# Verify env vars are set
vercel env ls

# Check function timeout isn't exceeded
# Increase timeout in vercel.json
```

### Frontend 404 Errors

Verify rewrites in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Slow Performance

1. Check Web Vitals in Analytics
2. Verify caching headers are correct
3. Monitor function execution time
4. Check for large assets

```bash
# Analyze bundle size
cd client && npm run build
# Check dist/ folder size
```

### Environment Variables Not Working

```bash
# Verify env vars are set
vercel env ls

# Redeploy after adding new vars
vercel --prod

# Check in build logs that vars are available
vercel logs --follow
```

---

## Advanced: Edge Functions (Optional)

For ultra-low latency on specific routes:

```typescript
// api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Add custom logic
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Advanced: Custom Domains

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records (Vercel shows instructions)
4. Verify SSL certificate (automatic)

Costs: $12-15/year (domain registrar)

---

## Deployment Pipeline

### Production Deployment

```
1. Push to main branch
2. GitHub Actions run tests (if configured)
3. Vercel auto-builds & deploys
4. Analytics updated
5. Slack notification (optional)
```

### Preview Deployment

```
1. Open pull request
2. Vercel creates preview deployment
3. Get preview URL (in PR comments)
4. Verify changes before merge
5. Merge to main for production
```

### Rollback

If something breaks:

```bash
# View deployments
vercel deployments

# Promote previous deployment to production
vercel promote [deployment-id]
```

---

## CI/CD Integration

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Setup Vercel CLI for CI

```bash
# Generate token
vercel tokens create

# Add to GitHub Secrets
# VERCEL_TOKEN
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID
```

---

## Monitoring Checklist

Daily:
- [ ] Check deployment status
- [ ] Monitor error logs
- [ ] Verify API endpoints working

Weekly:
- [ ] Review Web Vitals
- [ ] Check cost estimates
- [ ] Verify security headers

Monthly:
- [ ] Analyze performance trends
- [ ] Update dependencies
- [ ] Review and optimize timeouts

---

## Post-Deployment

### Announce Deployment

```markdown
## 🚀 LangCoach Live!

Production URL: https://your-project.vercel.app

Features:
- Voice-enabled English coaching
- AI-powered responses (GPT-4)
- Real-time transcription (Whisper)
- TTS responses (ElevenLabs)
- Dark mode support

Performance:
- Lighthouse: 95+ (all metrics)
- Core Web Vitals: All green
- Load time: <1.5s
```

### User Communication

1. Share the live URL
2. Provide login credentials
3. Request feedback

---

## Useful Commands

```bash
# View deployment logs
vercel logs --follow

# Check project status
vercel status

# View all deployments
vercel deployments

# Remove a deployment
vercel rm [deployment-id]

# Set environment variable
vercel env add VARIABLE_NAME

# Test locally
vercel dev

# Deploy preview
vercel --yes

# Deploy production
vercel --prod --yes
```

---

## Support & Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Vercel Support](https://vercel.com/support)
- [API Documentation](https://vercel.com/docs/api)

---

## Summary

✅ **Deployment Complete when:**

1. Build succeeds without errors
2. All environment variables set
3. Production URL accessible
4. Security headers verified
5. Performance metrics checked
6. Error monitoring working
7. Team can access the app

---

**Next Steps:**

1. Deploy to Vercel: `vercel --prod`
2. Share production URL
3. Monitor performance
4. Gather user feedback
5. Plan Phase 2 improvements

**Cost Estimate**: $120-420/month (mostly API usage)

**Time to Deploy**: 10-15 minutes (first time)
