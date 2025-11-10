# MVP Deployment Guide - Vercel + Render
Doc-Type: Quick Start Guide · Version 1.0 · Updated 2025-11-10 · Taller Mecánico

Deploy Taller Mecánico as an MVP using free-tier cloud services.

---

## 🎯 Architecture for MVP

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Vercel        │────────▶│   Render.com    │────────▶│   Neon.tech     │
│   (Frontend)    │  HTTPS  │   (Backend)     │  SSL    │   (Database)    │
│   Next.js       │         │   Express+WS    │         │   PostgreSQL    │
│   Free Tier     │         │   Free Tier*    │         │   Free Tier     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Free Tier Limits:**
- **Vercel**: Unlimited deployments, 100GB bandwidth
- **Render**: 750 hours/month (30 days), sleeps after 15min inactivity
- **Neon**: 0.5GB storage, 1 database, always active

---

## ⚠️ IMPORTANT: Data Persistence Notice

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  MVP DATA PERSISTENCE WARNING                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Current Setup:                                              │
│  ✓ Database: Neon.tech (PostgreSQL) - PERSISTENT           │
│  ✓ User data, clients, vehicles - SAFE                      │
│                                                              │
│  ✗ File Uploads: Render.com ephemeral storage              │
│    - Files stored in ./uploads directory                     │
│    - WILL BE DELETED when backend restarts/redeploys       │
│    - NOT suitable for production                            │
│                                                              │
│  For Production:                                             │
│  → Implement cloud storage (AWS S3, Cloudinary, etc.)       │
│  → See TODO_PRODUCTION_STORAGE.md for implementation        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**What This Means:**
- ✅ All database data (users, clients, vehicles, work orders) is persistent
- ❌ Uploaded files (attachments, images) will be lost on backend restart
- 🔄 For MVP testing, this is acceptable
- 🚀 For production, implement cloud storage (takes ~2 hours)

---

## 🚀 Quick Deployment (20 Minutes)

### Step 1: Database Setup (5 min)

**Sign up for Neon.tech:**

1. Go to https://neon.tech
2. Sign up with GitHub (free tier, no credit card needed)
3. Create a new project:
   - Name: `taller-mecanico`
   - Region: Choose closest to your users
4. Create a database:
   - Name: `taller_mecanico`
5. Copy connection string:
   ```
   Click "Dashboard" → "Connection Details"
   Copy the "Connection string" (starts with postgresql://)
   ```

**Example connection string:**
```
postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/taller_mecanico?sslmode=require
```

---

### Step 2: Backend Deployment on Render (10 min)

**Create Render Account:**

1. Go to https://render.com
2. Sign up with GitHub (free tier, no credit card needed)

**Deploy Backend:**

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `taller-mecanico-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste your Neon connection string here>
   JWT_SECRET=<generate using command below>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://taller-mecanico.vercel.app
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   ```

5. **Generate JWT_SECRET** (run in terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste as JWT_SECRET value

6. Click "Create Web Service"

7. Wait for deployment (3-5 minutes)

8. **Copy your backend URL** (shown at top):
   ```
   Example: https://taller-mecanico-backend.onrender.com
   ```

9. **Test backend health:**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status":"OK",...}`

---

### Step 3: Frontend Deployment on Vercel (5 min)

**Create Vercel Account:**

1. Go to https://vercel.com
2. Sign up with GitHub (free tier, no credit card needed)

**Deploy Frontend:**

1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Vercel auto-detects Next.js configuration
4. **Environment Variables** (Add these):
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.onrender.com
   NEXT_PUBLIC_APP_NAME=Taller Mecánico
   NEXT_PUBLIC_APP_URL=https://taller-mecanico.vercel.app
   ```

   Replace `your-backend-url` with your actual Render URL from Step 2

5. Click "Deploy"

6. Wait for deployment (2-3 minutes)

7. **Copy your Vercel URL:**
   ```
   Example: https://taller-mecanico.vercel.app
   ```

8. **Update Backend CORS:**
   - Go back to Render dashboard
   - Click your backend service
   - Go to "Environment" tab
   - Update `FRONTEND_URL` to your actual Vercel URL
   - Click "Save Changes" (backend will redeploy)

---

## ✅ Verification Checklist

### Test 1: Frontend Loads
- [ ] Visit your Vercel URL
- [ ] Page loads without errors
- [ ] Open browser console (F12) - no red errors

### Test 2: Backend Connection
- [ ] Visit `https://your-backend-url.onrender.com/health`
- [ ] Should see JSON response: `{"status":"OK"}`

### Test 3: User Registration
- [ ] Click "Register" on frontend
- [ ] Fill in form and submit
- [ ] Should successfully create account

### Test 4: Login
- [ ] Login with test credentials
- [ ] Should redirect to dashboard
- [ ] Dashboard should load data

### Test 5: Create Data
- [ ] Create a test client
- [ ] Create a test vehicle
- [ ] Data should save successfully

### Test 6: Data Persistence
- [ ] Refresh the page
- [ ] Data should still be there
- [ ] Database persistence working! ✓

---

## 🔧 Configuration Files Summary

Your repo now has:

**Root Level:**
- `vercel.json` - Vercel configuration for monorepo
- `.env.vercel.example` - Environment variable template

**Frontend:**
- `frontend/vercel.json` - Next.js specific config
- `frontend/next.config.js` - Dual mode (Vercel + Docker)

**Backend:**
- Standard Express app (no changes needed)
- Compatible with Render/Railway/Fly.io

---

## 💰 Cost Analysis

| Service | Free Tier | Limitations | Paid Tier |
|---------|-----------|-------------|-----------|
| **Vercel** | ✅ Unlimited | 100GB bandwidth, Hobby projects | $20/mo per team |
| **Render** | ✅ 750hrs/mo | Sleeps after 15min inactivity | $7/mo always-on |
| **Neon** | ✅ 0.5GB | 1 database, 3GB data transfer | $19/mo (3GB) |
| **Total** | **$0/month** | Good for MVP testing | ~$46/mo production |

**Free Tier Behavior:**
- Render backend sleeps after 15 min → First request takes 30-60 seconds to wake up
- For always-on production: Upgrade Render ($7/mo)

---

## 🚨 Known Limitations (MVP)

### 1. File Upload Persistence ⚠️
**Issue**: Files stored on Render's ephemeral filesystem
**Impact**: Uploaded attachments deleted on restart/redeploy
**Workaround**: Don't upload critical files in MVP
**Solution**: See `TODO_PRODUCTION_STORAGE.md`

### 2. Backend Cold Starts
**Issue**: Render free tier sleeps after 15 min inactivity
**Impact**: First request takes 30-60 seconds
**Workaround**: Keep-alive ping services or upgrade to paid tier
**Solution**: Upgrade Render ($7/mo) for always-on

### 3. WebSocket Reconnection
**Issue**: Backend restart drops WebSocket connections
**Impact**: Real-time updates stop working until page refresh
**Workaround**: Implement auto-reconnect (already in code)
**Solution**: No action needed (client auto-reconnects)

---

## 🔄 Updating Your MVP

### Update Frontend Only

```bash
# Make changes to frontend code
git add frontend/
git commit -m "Update frontend feature"
git push origin main

# Vercel auto-deploys (30 seconds)
```

### Update Backend Only

```bash
# Make changes to backend code
git add backend/
git commit -m "Update backend feature"
git push origin main

# Go to Render dashboard → Manual Deploy
# Or enable auto-deploy in Render settings
```

### Run Database Migrations

```bash
# In Render dashboard:
# 1. Click your backend service
# 2. Click "Shell" tab
# 3. Run:
npx prisma migrate deploy
```

---

## 📊 Monitoring Your MVP

### Check Backend Status
```bash
curl https://your-backend-url.onrender.com/health
```

### View Backend Logs
1. Go to Render dashboard
2. Click your backend service
3. Click "Logs" tab
4. View real-time logs

### View Frontend Logs
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments" → Latest deployment → "Functions" tab
4. View function logs

---

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend

**Symptoms**: Network errors, "Failed to fetch"

**Solutions:**
1. Check `NEXT_PUBLIC_API_URL` in Vercel settings
2. Verify backend is running: visit `/health` endpoint
3. Check `FRONTEND_URL` in Render matches your Vercel URL
4. Redeploy backend after changing CORS settings

### Database Connection Fails

**Symptoms**: "Connection refused", "Can't connect to database"

**Solutions:**
1. Check `DATABASE_URL` in Render is correct
2. Verify Neon database is not paused (free tier issue)
3. Test connection from Render shell:
   ```bash
   npx prisma db execute --stdin <<SQL
   SELECT 1;
   SQL
   ```

### Backend Is Slow (First Request)

**Expected Behavior**: Render free tier sleeps after 15 min inactivity

**Solutions:**
1. Wait 30-60 seconds for cold start
2. Upgrade to Render paid tier ($7/mo)
3. Use keep-alive service (e.g., UptimeRobot)

### File Uploads Not Persisting

**Expected Behavior**: This is a known MVP limitation

**Why**: Render uses ephemeral storage that resets on restart

**Short-term**: Don't upload critical files in MVP
**Long-term**: Implement cloud storage (see `TODO_PRODUCTION_STORAGE.md`)

---

## 🎓 Next Steps After MVP

Once you validate your MVP, upgrade to production:

### 1. Implement Cloud Storage (Priority 1)
- [ ] Add AWS S3 or Cloudinary for file uploads
- [ ] Migrate existing uploads (if any)
- [ ] Test file upload/download flows
- [ ] See: `TODO_PRODUCTION_STORAGE.md`

### 2. Upgrade Hosting (Priority 2)
- [ ] Render: Upgrade to paid tier ($7/mo) for always-on
- [ ] Neon: Monitor storage usage, upgrade if needed
- [ ] Vercel: Monitor bandwidth, stays on free tier

### 3. Add Monitoring (Priority 3)
- [ ] Set up error tracking (Sentry)
- [ ] Add uptime monitoring (UptimeRobot)
- [ ] Configure alerts for downtime

### 4. Security Hardening (Priority 4)
- [ ] Enable rate limiting (already in code)
- [ ] Add HTTPS everywhere (auto with Vercel/Render)
- [ ] Implement backup strategy for database
- [ ] Review and rotate secrets

### 5. Performance Optimization (Priority 5)
- [ ] Enable CDN for static assets
- [ ] Add database connection pooling
- [ ] Implement caching layer (Redis)
- [ ] Optimize database queries

---

## 📝 Environment Variables Quick Reference

### Vercel (Frontend)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_NAME=Taller Mecánico
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Render (Backend)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
JWT_SECRET=your-32-char-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

---

## 🎉 Success!

Your MVP is now live on the internet!

- ✅ Frontend: Fast, global CDN via Vercel
- ✅ Backend: RESTful API + WebSockets via Render
- ✅ Database: Persistent PostgreSQL via Neon
- ✅ Total Cost: $0/month (free tiers)
- ⚠️ File Uploads: Non-persistent (known limitation)

**Next:** Use the app, gather feedback, then upgrade to production-ready storage!

---

**Guide Version**: 1.0
**Last Updated**: 2025-11-10
**Deployment Time**: ~20 minutes
**Cost**: $0/month (MVP), ~$46/month (production-ready)
