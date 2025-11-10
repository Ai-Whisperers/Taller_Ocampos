# Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Code is committed to GitHub
- [ ] All tests pass locally
- [ ] Environment variable examples are created
- [ ] `.gitignore` is properly configured
- [ ] Production configuration files are ready

---

## Phase 1: Database Setup

Choose one option:

### Option A: Neon (Recommended)
- [ ] Sign up at https://neon.tech
- [ ] Create new project
- [ ] Create database `taller_ocampos`
- [ ] Copy connection string
- [ ] Test connection locally (optional)

### Option B: Railway
- [ ] Sign up at https://railway.app
- [ ] Create new project
- [ ] Add PostgreSQL database
- [ ] Copy connection string

### Option C: Vercel Postgres
- [ ] Go to Vercel dashboard
- [ ] Storage → Create Database → Postgres
- [ ] Copy connection string

---

## Phase 2: Backend Deployment

Choose one option:

### Option A: Railway (Recommended)
- [ ] Go to https://railway.app
- [ ] New Project → Deploy from GitHub repo
- [ ] Select your repository
- [ ] Configure root directory: `backend`
- [ ] Add all environment variables (see ENV_SETUP.md)
- [ ] Deploy
- [ ] Copy public URL
- [ ] Test `/health` endpoint

### Option B: Render
- [ ] Go to https://render.com
- [ ] New → Web Service
- [ ] Connect GitHub repo
- [ ] Configure root directory: `backend`
- [ ] Add all environment variables
- [ ] Deploy
- [ ] Copy public URL
- [ ] Test `/health` endpoint

**Backend Environment Variables:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `DATABASE_URL` (from Phase 1)
- [ ] `JWT_SECRET` (generate new - see ENV_SETUP.md)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `FRONTEND_URL` (leave blank for now, will update)
- [ ] `MAX_FILE_SIZE=10485760`
- [ ] `UPLOAD_DIR=./uploads`

---

## Phase 3: Database Migration

- [ ] Open backend console/shell in Railway/Render
- [ ] Run: `npm run prisma:migrate:deploy`
- [ ] Verify migrations completed successfully
- [ ] (Optional) Run: `npm run prisma:seed` for initial data

---

## Phase 4: Frontend Deployment

- [ ] Go to https://vercel.com
- [ ] Add New → Project
- [ ] Import from GitHub
- [ ] Select your repository
- [ ] Configure root directory: `frontend`
- [ ] Add environment variables
- [ ] Deploy
- [ ] Copy Vercel URL

**Frontend Environment Variables:**
- [ ] `NEXT_PUBLIC_API_URL` (backend URL + /api)
- [ ] `NEXT_PUBLIC_SOCKET_URL` (backend URL)
- [ ] `NEXT_PUBLIC_APP_NAME=Taller Mecánico`
- [ ] `NEXT_PUBLIC_APP_URL` (leave blank, add after deployment)

---

## Phase 5: Final Configuration

- [ ] Update backend `FRONTEND_URL` with Vercel URL
- [ ] Redeploy backend (Railway/Render)
- [ ] Update frontend `NEXT_PUBLIC_APP_URL` with Vercel URL
- [ ] Redeploy frontend (automatic in Vercel)

---

## Phase 6: Testing

### Backend Tests
- [ ] Visit `https://your-backend.railway.app/health`
- [ ] Should return: `{"status":"OK","timestamp":"..."}`

### Frontend Tests
- [ ] Visit your Vercel URL
- [ ] Page loads without errors
- [ ] Check browser console (F12) - no CORS errors

### Integration Tests
- [ ] Register a new user
- [ ] Login with test credentials
- [ ] Create a test client
- [ ] Create a test vehicle
- [ ] Verify data persists after refresh
- [ ] Test dashboard loads data

---

## Phase 7: Post-Deployment

### Security
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic on Vercel/Railway/Render)

### Monitoring
- [ ] Check backend logs in Railway/Render
- [ ] Check Vercel deployment logs
- [ ] Set up error tracking (optional)
- [ ] Enable database backups

### Documentation
- [ ] Document deployment URLs
- [ ] Save environment variables securely
- [ ] Share access with team members

---

## Important URLs

Record your deployment URLs here:

- **Frontend**: https://___________________.vercel.app
- **Backend**: https://___________________.railway.app (or .onrender.com)
- **Database**: (Keep secure - don't share publicly)

---

## Quick Commands Reference

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Backend Health
```bash
curl https://your-backend-url.com/health
```

### View Backend Logs (Railway)
```bash
railway logs
```

### View Vercel Logs
```bash
vercel logs
```

---

## Troubleshooting

### Deployment fails
- Check build logs in platform dashboard
- Verify all dependencies are in package.json
- Ensure Node.js version is compatible

### Database connection fails
- Verify DATABASE_URL format
- Check database is running
- Review backend logs for specific error

### CORS errors
- Backend `FRONTEND_URL` must match frontend URL exactly
- Include `https://` protocol
- No trailing slashes
- Redeploy backend after CORS changes

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_API_URL` includes `/api` path
- Test backend `/health` endpoint directly
- Check backend logs for errors

---

## Need Help?

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## Success Criteria

Your deployment is successful when:
- ✅ Frontend loads at Vercel URL
- ✅ Backend `/health` returns OK
- ✅ User can register and login
- ✅ Data persists in database
- ✅ No errors in browser console
- ✅ Dashboard displays correctly
