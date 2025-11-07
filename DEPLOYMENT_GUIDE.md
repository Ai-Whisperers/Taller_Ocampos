# Deployment Guide: Taller Mecánico

This guide walks you through deploying your auto repair shop management system to production.

## Architecture Overview

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: Node.js/Express API deployed on Railway/Render
- **Database**: PostgreSQL (Neon/Railway/Render/Vercel Postgres)

---

## Prerequisites

1. GitHub account with this repository
2. Vercel account (for frontend)
3. Railway or Render account (for backend)
4. Database provider account (Neon recommended for free tier)

---

## Step 1: Set Up PostgreSQL Database

### Option A: Neon (Recommended - Free Tier)

1. Go to [Neon](https://neon.tech)
2. Sign up and create a new project
3. Create a database named `taller_ocampos`
4. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)
5. Save this for later use

### Option B: Railway

1. Go to [Railway](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the connection string from the database settings
4. Save this for later use

### Option C: Vercel Postgres

1. In your Vercel dashboard → Storage → Create Database
2. Select Postgres
3. Copy the connection string
4. Save this for later use

---

## Step 2: Deploy Backend

### Using Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `DATABASE_URL` = (your database connection string from Step 1)
   - `JWT_SECRET` = (generate a strong random string, min 32 characters)
   - `JWT_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = `https://your-app.vercel.app` (you'll get this in Step 3)
   - `MAX_FILE_SIZE` = `10485760`
   - `UPLOAD_DIR` = `./uploads`

6. Deploy and copy the public URL (e.g., `https://your-backend.railway.app`)

### Using Render (Alternative)

1. Go to [Render](https://render.com)
2. New → Web Service → Connect your GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the same environment variables as above
5. Deploy and copy the public URL

---

## Step 3: Run Database Migrations

After your backend is deployed:

1. In Railway/Render dashboard, open the Shell/Console
2. Run: `npm run prisma:migrate:deploy`
3. Optionally seed data: `npm run prisma:seed`

---

## Step 4: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-url`
   - `NEXT_PUBLIC_APP_NAME` = `Taller Mecánico`
   - `NEXT_PUBLIC_APP_URL` = (leave blank for now, add after first deploy)

6. Click "Deploy"
7. After deployment, copy your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## Step 5: Update Backend CORS

1. Go back to your backend service (Railway/Render)
2. Update environment variable:
   - `FRONTEND_URL` = `https://your-app.vercel.app` (your actual Vercel URL)
3. Redeploy the backend service

---

## Step 6: Update Frontend URL

1. In Vercel dashboard → Your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
3. Redeploy (Vercel will auto-redeploy on changes)

---

## Step 7: Verify Deployment

Test the following:

1. **Frontend loads**: Visit your Vercel URL
2. **Backend health check**: Visit `https://your-backend-url/health`
3. **User registration**: Create a test account
4. **Login**: Log in with test credentials
5. **API connectivity**: Try creating a client or vehicle
6. **Database**: Verify data persists

---

## Environment Variables Checklist

### Backend (.env in production)
- ✅ `NODE_ENV=production`
- ✅ `PORT=3001`
- ✅ `DATABASE_URL` (PostgreSQL connection string)
- ✅ `JWT_SECRET` (strong random string)
- ✅ `JWT_EXPIRES_IN=7d`
- ✅ `FRONTEND_URL` (Vercel URL)
- ✅ `MAX_FILE_SIZE=10485760`
- ✅ `UPLOAD_DIR=./uploads`

### Frontend (.env.production in Vercel)
- ✅ `NEXT_PUBLIC_API_URL` (backend URL + /api)
- ✅ `NEXT_PUBLIC_SOCKET_URL` (backend URL)
- ✅ `NEXT_PUBLIC_APP_NAME=Taller Mecánico`
- ✅ `NEXT_PUBLIC_APP_URL` (Vercel URL)

---

## Troubleshooting

### Backend won't start
- Check logs in Railway/Render dashboard
- Verify DATABASE_URL is correct
- Ensure migrations ran successfully: `npm run prisma:migrate:deploy`

### Frontend can't connect to backend
- Check CORS: Ensure `FRONTEND_URL` in backend matches your Vercel URL
- Verify `NEXT_PUBLIC_API_URL` in Vercel is correct
- Check backend is running: visit `/health` endpoint

### Database connection fails
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Check database provider dashboard for connection details
- Ensure database allows connections from your backend's IP (most providers allow all by default)

### CORS errors
- Backend `FRONTEND_URL` must match frontend URL exactly (including https://)
- Don't include trailing slashes
- Redeploy backend after changing CORS settings

---

## Post-Deployment

### Security Checklist
- ✅ Change JWT_SECRET to a strong random value
- ✅ Use HTTPS for all URLs
- ✅ Enable database connection SSL
- ✅ Review and limit CORS origins
- ✅ Set up proper rate limiting
- ✅ Enable security headers (helmet is configured)

### Monitoring
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor backend logs in Railway/Render
- Check Vercel analytics for frontend performance

### Backups
- Enable automated database backups in your database provider
- Consider setting up a backup schedule

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs

---

## Costs

- **Vercel**: Free tier (sufficient for most small apps)
- **Railway**: $5/month credit on free tier
- **Render**: Free tier available (with limitations)
- **Neon**: Free tier with 0.5GB storage

Total estimated cost: **$0-10/month** depending on usage
