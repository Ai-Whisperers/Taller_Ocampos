# Quick Start - Vercel MVP Deployment
Doc-Type: Quick Reference · Version 1.0 · Updated 2025-11-10

**Total Time**: 20 minutes | **Cost**: $0/month

---

## 📋 Before You Start

Open `.env` file in the root directory and keep it ready. You'll fill it in as you go through the steps.

---

## Step 1: Create Database (5 minutes)

### Neon.tech Setup

1. **Sign up**: https://neon.tech (GitHub login)

2. **Create Project**:
   - Name: `taller-mecanico`
   - Region: Choose closest to you

3. **Create Database**:
   - Name: `taller_mecanico`

4. **Copy Connection String**:
   ```
   Dashboard → Connection Details → "Connection string"
   ```

5. **Update `.env`**:
   ```bash
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/taller_mecanico?sslmode=require
   ```

✅ **Checkpoint**: Connection string saved in `.env`

---

## Step 2: Deploy Backend (10 minutes)

### Render.com Setup

1. **Sign up**: https://render.com (GitHub login)

2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select: `Ai-Whisperers/Taller_Ocampos`

3. **Configure**:
   ```
   Name:          taller-mecanico-backend
   Region:        Oregon (or closest)
   Branch:        main
   Root Dir:      backend
   Runtime:       Node
   Build Cmd:     npm install && npm run build
   Start Cmd:     npm start
   Instance:      Free
   ```

4. **Generate JWT Secret**:
   ```bash
   # Run in your terminal:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output (long random string)

5. **Add Environment Variables** (in Render):
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste from .env>
   JWT_SECRET=<paste generated secret>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://taller-mecanico.vercel.app
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   ```

6. **Click "Create Web Service"**

7. **Wait for Deployment** (3-5 minutes)
   - Watch logs for completion
   - Look for "Build succeeded" message

8. **Copy Backend URL**:
   ```
   Top of page: https://taller-mecanico-backend-xxxx.onrender.com
   ```

9. **Update `.env`**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
   FRONTEND_URL=https://your-backend.onrender.com  # We'll update this next
   ```

10. **Test Backend**:
    ```bash
    curl https://your-backend.onrender.com/health
    # Should return: {"status":"OK",...}
    ```

✅ **Checkpoint**: Backend URL saved, health check passed

---

## Step 3: Deploy Frontend (5 minutes)

### Vercel Setup

1. **Sign up**: https://vercel.com (GitHub login)

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Find: `Ai-Whisperers/Taller_Ocampos`
   - Click "Import"

3. **Vercel Auto-detects** Next.js ✓

4. **Add Environment Variables**:

   Click "Environment Variables" and add each:

   **Variable 1**:
   ```
   Name:  NEXT_PUBLIC_API_URL
   Value: https://your-backend.onrender.com/api
   All environments: ✓
   ```

   **Variable 2**:
   ```
   Name:  NEXT_PUBLIC_SOCKET_URL
   Value: https://your-backend.onrender.com
   All environments: ✓
   ```

   **Variable 3**:
   ```
   Name:  NEXT_PUBLIC_APP_NAME
   Value: Taller Mecánico
   All environments: ✓
   ```

   **Variable 4** (leave for now, update after deploy):
   ```
   Name:  NEXT_PUBLIC_APP_URL
   Value: https://taller-mecanico.vercel.app
   All environments: ✓
   ```

5. **Click "Deploy"** (2-3 minutes)

6. **Copy Vercel URL**:
   ```
   After deploy: https://taller-mecanico-xxxx.vercel.app
   ```

7. **Update `.env`**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ```

✅ **Checkpoint**: Frontend deployed, URL saved

---

## Step 4: Update Backend CORS (2 minutes)

1. **Go to Render Dashboard**
   - Click your backend service

2. **Update Environment**:
   - Click "Environment" tab
   - Find `FRONTEND_URL`
   - Change to: `https://your-actual-vercel-url.vercel.app`
   - Click "Save Changes"

3. **Backend Auto-redeploys** (1-2 minutes)

✅ **Checkpoint**: CORS updated

---

## Step 5: Test Everything (3 minutes)

### ✅ Test 1: Frontend Loads
```
Visit: https://your-app.vercel.app
Should: Load without errors
```

### ✅ Test 2: Backend Health
```
Visit: https://your-backend.onrender.com/health
Should: Show {"status":"OK"}
```

### ✅ Test 3: Register User
```
Click: Register
Fill: Email, password, name
Should: Successfully create account
```

### ✅ Test 4: Login
```
Use: Test credentials
Should: Redirect to dashboard
```

### ✅ Test 5: Create Data
```
Create: Test client
Create: Test vehicle
Should: Save successfully
```

### ✅ Test 6: Persistence
```
Refresh: Page
Should: Data still there ✓
```

---

## 🎉 Success!

Your app is now live:

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Database**: Neon.tech (persistent)

**Cost**: $0/month (free tiers)

---

## ⚠️ Important Notes

### File Uploads (Known Limitation)
- ✅ All database data is persistent
- ❌ Uploaded files deleted on restart
- 📚 See `TODO_PRODUCTION_STORAGE.md` for fix (4 hours)

### Backend Cold Starts
- Render free tier sleeps after 15 min
- First request takes 30-60 seconds
- Subsequent requests are fast

---

## 📝 Your URLs

Write down for reference:

```
Frontend:     https://______________________.vercel.app
Backend:      https://______________________.onrender.com
Backend API:  https://______________________.onrender.com/api
Health Check: https://______________________.onrender.com/health
Database:     (Neon.tech dashboard)
```

---

## 🔄 Future Updates

### Update Frontend
```bash
git add frontend/
git commit -m "Update feature"
git push origin main
# Vercel auto-deploys
```

### Update Backend
```bash
git add backend/
git commit -m "Update feature"
git push origin main
# Go to Render → Manual Deploy
```

---

## 🐛 Quick Troubleshooting

**Frontend can't reach backend?**
→ Check `FRONTEND_URL` in Render matches Vercel URL

**Database errors?**
→ Verify `DATABASE_URL` in Render is correct

**Backend slow?**
→ Cold start (expected on free tier)

**Files not persisting?**
→ Known limitation, see `TODO_PRODUCTION_STORAGE.md`

---

## 📚 More Help

- Full Guide: `DEPLOYMENT_MVP_VERCEL.md`
- Storage Fix: `TODO_PRODUCTION_STORAGE.md`
- Environment Variables: `.env.vercel.example`
- Kubernetes: `DEPLOYMENT_KUBERNETES.md`
- Docker: `DEPLOYMENT_DOCKER.md`

---

**Deployment Time**: 20 minutes
**Cost**: $0/month
**Status**: Production-ready (except file uploads)
