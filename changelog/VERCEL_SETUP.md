# Vercel Deployment Setup Guide
Doc-Type: Configuration Guide · Version 1.0 · Updated 2025-11-10 · Taller Mecánico

Complete configuration guide for deploying this monorepo to Vercel.

---

## 🎯 Monorepo Structure

```
Taller_Ocampos/
├── frontend/              ← Next.js application (deploy this)
│   ├── vercel.json       ← Vercel configuration
│   ├── package.json      ← Next.js dependencies
│   ├── next.config.js    ← Next.js configuration
│   └── src/              ← Application code
├── backend/              ← Express API (deploy to Render)
├── k8s/                  ← Kubernetes configs
├── VERCEL_SETUP.md       ← This guide
└── .vercelignore         ← Files to exclude from deployment
```

---

## ⚙️ Vercel Dashboard Configuration

### **CRITICAL: Root Directory Setting**

The Root Directory setting **CANNOT** be configured in `vercel.json`. You **MUST** configure it in the Vercel dashboard.

**Steps:**

1. Go to your Vercel project
2. Navigate to **Settings** → **General**
3. Scroll to **Root Directory**
4. Set to: `frontend`
5. Click **Save**

**Why:** This tells Vercel where your Next.js application lives in the monorepo. Without this, Vercel looks for `package.json` at the repository root and fails with "No Next.js version detected".

---

## 📋 Vercel Project Settings

### **Framework Preset**
- **Setting:** Automatically detected as **Next.js**
- **Location:** Settings → General → Framework Preset
- **Value:** `Next.js`

### **Build & Development Settings**
Vercel will automatically detect these from `frontend/package.json`:
- **Build Command:** `npm run build` (from package.json)
- **Output Directory:** `.next` (Next.js default)
- **Install Command:** `npm install` (auto-detected)
- **Development Command:** `npm run dev` (from package.json)

**Note:** Do NOT override these unless necessary. Let Vercel's framework detection work.

---

## 🔐 Environment Variables

Configure these in: **Settings** → **Environment Variables**

### **Required Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_APP_NAME=Taller Ocampos
```

### **Optional Variables:**
```env
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### **Variable Scope:**
- Set for: **Production**, **Preview**, **Development**
- This ensures all deployments have the correct configuration

---

## 📄 vercel.json Configuration

The `vercel.json` file is located in `frontend/vercel.json` (alongside package.json).

This follows Vercel's **classical deployment pattern** for Next.js applications.

**Key configuration:**
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [ /* Security headers */ ],
  "rewrites": [ /* API proxy */ ]
}
```

**What's configured:**
- ✅ Framework preset: Next.js (for auto-detection)
- ✅ Security headers (XSS, CSRF, clickjacking protection)
- ✅ API proxy to backend (placeholder URL to update)
- ✅ Clean URLs and trailing slash behavior
- ✅ Deployment region (iad1 - US East)

**What Vercel handles automatically:**
- ✅ Build command from package.json scripts
- ✅ Install command (auto-detected npm/yarn/pnpm)
- ✅ Output directory (.next for Next.js)
- ✅ Node.js version detection
- ✅ Environment variable injection

**Note:** Root Directory must be set to `frontend` in Vercel Dashboard (cannot be configured in vercel.json)

---

## 🚀 Deployment Steps

### **Initial Setup**

1. **Connect Repository to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will detect it as a Next.js project

2. **Configure Root Directory:**
   - Before first deployment, set Root Directory to `frontend`
   - Settings → General → Root Directory → `frontend` → Save

3. **Add Environment Variables:**
   - Settings → Environment Variables
   - Add all required variables (see above)

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically:
     - Navigate to `frontend/` directory
     - Install dependencies with `npm install`
     - Build with `npm run build`
     - Deploy the `.next` output

### **Subsequent Deployments**

Every push to `main` branch will automatically deploy:
```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys in ~2 minutes
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] **Dashboard Settings**
  - Root Directory is set to `frontend`
  - Framework Preset is "Next.js"
  - All environment variables are configured

- [ ] **Build Process**
  - Build completes without errors
  - No "Next.js version not detected" errors
  - Build time is reasonable (~2-5 minutes)

- [ ] **Runtime**
  - Visit your Vercel URL
  - Pages load correctly
  - API requests work (check browser console)
  - Environment variables are accessible

- [ ] **Security**
  - Response headers include security settings
  - HTTPS is enforced
  - CORS is configured properly

---

## 🐛 Troubleshooting

### **Error: "No Next.js version detected"**

**Symptom:**
```
Warning: Could not identify Next.js version
Error: No Next.js version detected
```

**Cause:** Root Directory not set to `frontend`

**Fix:**
1. Go to Settings → General → Root Directory
2. Set to `frontend`
3. Save and redeploy

---

### **Error: "Module not found" or "Cannot find package"**

**Symptom:**
```
Module not found: Can't resolve 'next'
```

**Cause:** Dependencies not installed correctly

**Fix:**
1. Check `frontend/package.json` includes all dependencies
2. Verify Node.js version compatibility (v18+)
3. Clear Vercel cache:
   - Deployments → [Latest deployment] → ⋮ → Redeploy → Clear cache

---

### **Error: API requests fail (CORS / Network errors)**

**Symptom:**
```
Access to fetch at 'https://backend.onrender.com' has been blocked by CORS
```

**Cause:** Backend CORS not configured for Vercel frontend URL

**Fix:**
1. Get your Vercel deployment URL (e.g., `https://taller-mecanico.vercel.app`)
2. Update backend `FRONTEND_URL` environment variable on Render
3. Redeploy backend on Render

---

### **Error: Environment variables undefined**

**Symptom:**
```
process.env.NEXT_PUBLIC_API_URL is undefined
```

**Cause:** Environment variables not set in Vercel or wrong scope

**Fix:**
1. Settings → Environment Variables
2. Verify variables are set for **Production**, **Preview**, and **Development**
3. Redeploy (environment changes require redeploy)

---

## 📊 Build Performance

**Expected build times:**
- **Clean build:** 3-5 minutes
- **Cached build:** 1-2 minutes
- **Deploy:** 10-30 seconds

**Build output size:**
- **Total:** ~15-25 MB
- **.next directory:** ~10-20 MB
- **node_modules:** Excluded (not deployed)

---

## 🔄 CI/CD Integration

Vercel automatically deploys on:

**Production Deployments:**
- Push to `main` branch
- Manual deploy from dashboard

**Preview Deployments:**
- Pull requests (any branch)
- Each commit gets unique preview URL

**Configuration:**
- Settings → Git → Production Branch: `main`
- Settings → Git → Ignored Build Step: Not configured (always build)

---

## 📚 Additional Resources

**Vercel Documentation:**
- Monorepos: https://vercel.com/docs/monorepos
- Next.js: https://vercel.com/docs/frameworks/nextjs
- Project Config: https://vercel.com/docs/project-configuration
- Environment Variables: https://vercel.com/docs/environment-variables

**Project Documentation:**
- Backend Deployment: `DEPLOYMENT_MVP_VERCEL.md`
- Docker Setup: `DEPLOYMENT_DOCKER.md`
- Kubernetes: `DEPLOYMENT_KUBERNETES.md`

---

## 🎯 Summary

This is a **classical Vercel + Next.js deployment** with monorepo support.

**What to configure in Vercel Dashboard:**
1. Root Directory: `frontend` (CRITICAL)
2. Environment Variables: `NEXT_PUBLIC_API_URL`, etc.
3. Framework Preset: Next.js (auto-detected)

**What to configure in vercel.json (frontend/):**
- Security headers
- API rewrites/proxies
- Region selection
- URL behavior (clean URLs, trailing slash)

**What Vercel handles automatically (no custom scripts needed):**
- Dependency installation (npm/yarn/pnpm auto-detection)
- Build command execution (from package.json)
- Output directory detection (.next for Next.js)
- Framework configuration and optimization
- Serverless function generation

**Classical deployment means:**
- ✅ No custom build orchestration
- ✅ No centralized config folder
- ✅ Standard Next.js project structure
- ✅ Vercel's automatic optimizations
- ✅ Simpler maintenance and debugging

---

**Guide Version:** 1.1
**Last Updated:** 2025-11-10
**Deployment Pattern:** Classical Vercel + Next.js
**Deployment Target:** Vercel (Frontend only)
**Time to Deploy:** ~10 minutes (first time)
