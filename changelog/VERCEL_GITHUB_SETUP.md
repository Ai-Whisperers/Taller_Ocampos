# Vercel + GitHub Deployment Guide

This guide walks you through deploying your app using GitHub integration with Vercel.

---

## Prerequisites

- GitHub account with this repository pushed
- Vercel account (free)

---

## Part 1: Push Code to GitHub (If Not Already Done)

### Step 1: Check Git Status

Open terminal in your project root and run:

```bash
git status
```

### Step 2: Commit Your Changes

If you have uncommitted changes:

```bash
git add .
git commit -m "Prepare for deployment with Vercel and Render"
```

### Step 3: Push to GitHub

If you haven't pushed yet:

```bash
git push origin main
```

If you don't have a remote repository yet:

1. Go to https://github.com
2. Click "+" → "New repository"
3. Name it: `taller-ocampos` (or your preferred name)
4. **Do NOT initialize with README** (you already have code)
5. Click "Create repository"
6. Copy the commands shown and run them:

```bash
git remote add origin https://github.com/YOUR-USERNAME/taller-ocampos.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy to Vercel with GitHub

### Step 1: Sign Up/Login to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" (or "Login" if you have an account)
3. **Important**: Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account
5. You'll be redirected to Vercel dashboard

### Step 2: Import Your Repository

1. On Vercel dashboard, click "Add New..." → "Project"
2. You'll see "Import Git Repository" section
3. **If you see your repository**:
   - Click "Import" next to it
   - Skip to Step 3

4. **If you DON'T see your repository**:
   - Click "Adjust GitHub App Permissions"
   - Select repositories you want to give Vercel access to
   - Select your `taller-ocampos` repository
   - Click "Install"
   - Go back to Vercel, refresh, and you should see it
   - Click "Import"

### Step 3: Configure Frontend Project

After clicking Import:

1. **Project Name**: `taller-ocampos-frontend` (or leave default)

2. **Framework Preset**: Should auto-detect "Next.js" ✅

3. **Root Directory**:
   - Click "Edit" next to Root Directory
   - Type: `frontend`
   - This tells Vercel your Next.js app is in the frontend folder

4. **Build Settings**: Should auto-populate:
   - Build Command: `npm run build` ✅
   - Output Directory: `.next` ✅
   - Install Command: `npm install` ✅

5. **Environment Variables**: Leave blank for now (we'll add later)

6. Click "Deploy"

### Step 4: Wait for Deployment

- Vercel will build and deploy your frontend
- This takes 2-5 minutes
- You'll see a "Building..." status
- When done, you'll see "Congratulations!" with your live URL

### Step 5: Save Your Frontend URL

After deployment:
- You'll see something like: `https://taller-ocampos-frontend.vercel.app`
- **Copy this URL** - you'll need it for backend configuration
- Click "Continue to Dashboard"

---

## Part 3: Create Vercel Postgres Database

Now let's create your database in the same Vercel account:

### Step 1: Access Storage

1. In Vercel dashboard, look at the top navigation
2. Click "Storage" tab

### Step 2: Create Database

1. Click "Create Database" button
2. Select "Postgres" (it's powered by Neon)
3. Configure:
   - **Name**: `taller-ocampos-db`
   - **Region**: Choose closest to you:
     - `iad1` (US East - Washington, D.C.)
     - `sfo1` (US West - San Francisco)
     - `fra1` (Europe - Frankfurt)
   - **Pricing**: Free tier (default)
4. Click "Create"

### Step 3: Connect Database to Project

1. After database is created, you'll see "Connect Project"
2. Select your `taller-ocampos-frontend` project
3. Click "Connect"
4. Vercel will automatically add database environment variables to your project

### Step 4: Get Database Connection String

1. Click on your database name (`taller-ocampos-db`)
2. Click on ".env.local" tab
3. You'll see several environment variables:
   ```
   POSTGRES_URL="..."
   POSTGRES_PRISMA_URL="..."
   POSTGRES_URL_NO_SSL="..."
   POSTGRES_URL_NON_POOLING="..."
   POSTGRES_USER="..."
   POSTGRES_HOST="..."
   POSTGRES_PASSWORD="..."
   POSTGRES_DATABASE="..."
   ```

4. **Copy the `POSTGRES_PRISMA_URL` value** - this is what you'll use for your backend
5. It looks like: `postgres://user:pass@host/db?pgbouncer=true&connect_timeout=15`

---

## Part 4: Configure Frontend Environment Variables

Now let's add the frontend environment variables:

### Step 1: Go to Project Settings

1. In Vercel dashboard, click on your project (`taller-ocampos-frontend`)
2. Click "Settings" tab
3. Click "Environment Variables" in left sidebar

### Step 2: Add Environment Variables

Add these variables one by one:

**Variable 1: API URL**
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://your-backend-name.onrender.com/api`
  *(We'll get the actual URL in Part 5, for now use placeholder)*
- Environment: Check ✅ Production, Preview, Development
- Click "Save"

**Variable 2: Socket URL**
- Key: `NEXT_PUBLIC_SOCKET_URL`
- Value: `https://your-backend-name.onrender.com`
  *(Same as above, placeholder for now)*
- Environment: Check ✅ Production, Preview, Development
- Click "Save"

**Variable 3: App Name**
- Key: `NEXT_PUBLIC_APP_NAME`
- Value: `Taller Mecánico`
- Environment: Check ✅ Production, Preview, Development
- Click "Save"

**Variable 4: App URL**
- Key: `NEXT_PUBLIC_APP_URL`
- Value: `https://taller-ocampos-frontend.vercel.app`
  *(Use your actual Vercel URL from Step 5)*
- Environment: Check ✅ Production, Preview, Development
- Click "Save"

---

## Part 5: Deploy Backend to Render

Now let's deploy the backend using the database we just created:

### Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started"
3. **Important**: Choose "Sign up with GitHub"
4. Authorize Render to access your GitHub account

### Step 2: Create New Web Service

1. On Render dashboard, click "New +" → "Web Service"
2. Click "Connect" next to your GitHub repository
3. **If you don't see it**:
   - Click "Configure account"
   - Give Render access to your repository
   - Return and it should appear

### Step 3: Configure Backend Service

Fill in the configuration:

**Basic Settings:**
- **Name**: `taller-ocampos-backend` (or your preferred name)
- **Region**: Choose same or closest to your database region
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

**Build Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Instance Type:**
- Select "Free" (this gives you 750 hours/month free)

### Step 4: Add Environment Variables

Scroll down to "Environment Variables" section and add:

Click "Add Environment Variable" for each:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

2. **PORT**
   - Key: `PORT`
   - Value: `3001`

3. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: *Paste the `POSTGRES_PRISMA_URL` from Part 3, Step 4*

4. **JWT_SECRET** (Generate a new one!)
   - Key: `JWT_SECRET`
   - Value: Run this command in your terminal:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy the output and paste as value

5. **JWT_EXPIRES_IN**
   - Key: `JWT_EXPIRES_IN`
   - Value: `7d`

6. **FRONTEND_URL**
   - Key: `FRONTEND_URL`
   - Value: `https://taller-ocampos-frontend.vercel.app`
     *(Use your actual Vercel URL from Part 2, Step 5)*

7. **MAX_FILE_SIZE**
   - Key: `MAX_FILE_SIZE`
   - Value: `10485760`

8. **UPLOAD_DIR**
   - Key: `UPLOAD_DIR`
   - Value: `./uploads`

### Step 5: Deploy

1. Click "Create Web Service" at the bottom
2. Render will start building and deploying
3. This takes 5-10 minutes
4. You'll see logs scrolling
5. When done, you'll see "Live" status with a green dot

### Step 6: Save Your Backend URL

1. At the top, you'll see your backend URL
2. It looks like: `https://taller-ocampos-backend.onrender.com`
3. **Copy this URL** - you need it for the next step

### Step 7: Test Backend Health Check

1. Open a new browser tab
2. Go to: `https://your-backend-url.onrender.com/health`
3. You should see: `{"status":"OK","timestamp":"..."}`
4. If you see this, backend is working! ✅

---

## Part 6: Update Frontend with Backend URL

Now update your frontend to use the real backend URL:

### Step 1: Go Back to Vercel

1. Go to https://vercel.com
2. Click on your project (`taller-ocampos-frontend`)
3. Click "Settings" → "Environment Variables"

### Step 2: Update API URLs

Find and update these variables:

1. **NEXT_PUBLIC_API_URL**
   - Click the three dots → "Edit"
   - Change value to: `https://your-backend-url.onrender.com/api`
     *(Use your actual Render URL from Part 5, Step 6)*
   - Click "Save"

2. **NEXT_PUBLIC_SOCKET_URL**
   - Click the three dots → "Edit"
   - Change value to: `https://your-backend-url.onrender.com`
   - Click "Save"

### Step 3: Redeploy Frontend

1. Click "Deployments" tab
2. Click the three dots on the latest deployment → "Redeploy"
3. Confirm the redeploy
4. Wait 2-3 minutes for completion

---

## Part 7: Run Database Migrations

Now let's set up your database schema:

### Step 1: Open Render Shell

1. Go to your Render dashboard
2. Click on your backend service (`taller-ocampos-backend`)
3. Click "Shell" tab in the left sidebar
4. Click "Launch Shell"

### Step 2: Run Migration

In the shell that opens, type:

```bash
npm run prisma:migrate:deploy
```

Press Enter and wait. You should see:
```
✓ Database migrations applied successfully
```

### Step 3: (Optional) Seed Initial Data

If you want some test data:

```bash
npm run prisma:seed
```

### Step 4: Close Shell

Click "Exit" or close the shell tab

---

## Part 8: Test Everything!

### Test 1: Frontend Loads

1. Go to your Vercel URL: `https://your-app.vercel.app`
2. Page should load without errors
3. Open browser console (F12) - no red errors

### Test 2: Backend Connection

1. Try to register a new user
2. Fill in the registration form
3. Submit
4. You should be redirected to login or dashboard

### Test 3: Login

1. Login with your test credentials
2. Should successfully authenticate
3. Should see dashboard

### Test 4: Create Data

1. Try creating a client
2. Try creating a vehicle
3. Data should save successfully

### Test 5: Data Persistence

1. Refresh the page
2. Your data should still be there
3. Database is working! ✅

---

## 🎉 Success Checklist

- ✅ Frontend deployed on Vercel
- ✅ Backend deployed on Render
- ✅ Database created on Vercel Postgres
- ✅ Environment variables configured
- ✅ Database migrations completed
- ✅ Can register and login
- ✅ Data persists correctly
- ✅ No CORS errors

---

## 📝 Important URLs to Save

Write down these URLs for future reference:

- **Frontend**: https://______________________.vercel.app
- **Backend**: https://______________________.onrender.com
- **Backend Health**: https://______________________.onrender.com/health
- **Database**: (In Vercel Storage dashboard)

---

## 🐛 Troubleshooting

### "Failed to fetch" or CORS errors

**Problem**: Frontend can't reach backend

**Solution**:
1. Check backend is running: visit `/health` endpoint
2. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
3. Redeploy backend after changing CORS settings

### Database connection fails

**Problem**: Backend can't connect to database

**Solution**:
1. Verify `DATABASE_URL` in Render is correct
2. Check it's the `POSTGRES_PRISMA_URL` from Vercel
3. Ensure migrations ran: check Render logs

### Backend shows "Service Unavailable"

**Problem**: Render free tier spins down after inactivity

**Solution**:
- First request after inactivity takes 30-60 seconds (cold start)
- This is normal on free tier
- Paid tier keeps service always running

### Registration/Login doesn't work

**Problem**: Database not migrated or JWT issues

**Solution**:
1. Open Render Shell and run: `npm run prisma:migrate:deploy`
2. Check `JWT_SECRET` is set in Render
3. Check Render logs for specific error

---

## 🔄 Future Deployments

After initial setup, deployments are automatic:

1. **Make code changes locally**
2. **Commit**: `git add . && git commit -m "Your changes"`
3. **Push**: `git push origin main`
4. **Vercel**: Auto-deploys frontend (2-3 min)
5. **Render**: Auto-deploys backend (5-7 min)

That's it! No manual steps needed.

---

## Need Help?

- Vercel Support: https://vercel.com/support
- Render Support: https://render.com/docs
- Check logs in both platforms for error details

---

**You're all set! Your app is now live on the internet! 🚀**
