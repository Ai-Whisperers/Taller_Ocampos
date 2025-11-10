# Bootstrap Contracts Verification
Doc-Type: Technical Specification · Version 1.0 · Updated 2025-11-10 · Taller Mecánico

Complete verification of bootstrap contracts between frontend, backend, and Vercel deployment platform.

---

## 🎯 What are Bootstrap Contracts?

Bootstrap contracts define the initialization, configuration, and integration agreements between:
- **Frontend** ↔ **Vercel** (deployment platform)
- **Frontend** ↔ **Backend** (API communication)
- **Backend** ↔ **Database** (data persistence)

---

## ✅ Frontend Bootstrap Contract (Next.js → Vercel)

### **Package.json Contract**
**Location:** `frontend/package.json`

**Required Scripts:**
```json
{
  "scripts": {
    "dev": "next dev",           ✅ Development mode
    "build": "next build",       ✅ Production build (Vercel calls this)
    "start": "next start",       ✅ Production server
    "lint": "next lint"          ✅ Code quality check
  }
}
```

**Critical Dependencies:**
- `next`: ^14.2.33 ✅
- `react`: ^18.2.0 ✅
- `react-dom`: ^18.2.0 ✅

**Node.js Version:**
- Specified: ❌ **MISSING** (Should add engines field)
- Vercel will use: Latest LTS (currently Node 18.x-20.x)
- **Recommendation:** Add explicit version

### **Next.config.js Contract**
**Location:** `frontend/next.config.js`

**Bootstrap Configuration:**
```javascript
{
  reactStrictMode: true,              ✅ React strict mode enabled
  swcMinify: true,                    ✅ Fast minification
  output: conditional,                ✅ Standalone for Docker, standard for Vercel
  env: {
    NEXT_PUBLIC_API_URL,             ✅ Backend API endpoint
    NEXT_PUBLIC_SOCKET_URL,          ✅ WebSocket endpoint
    NEXT_PUBLIC_APP_NAME,            ✅ Application name
    NEXT_PUBLIC_APP_URL              ✅ Frontend URL
  }
}
```

**Rewrites Configuration:**
```javascript
rewrites() {
  return [
    {
      source: '/api/proxy/:path*',
      destination: '${NEXT_PUBLIC_API_URL}/:path*'
    }
  ]
}
```
⚠️ **ISSUE:** Conflicts with vercel.json rewrites

### **Vercel.json Contract**
**Location:** `frontend/vercel.json`

**Bootstrap Configuration:**
```json
{
  "framework": "nextjs",              ✅ Framework detection
  "version": 2,                       ✅ Vercel config version
  "name": "taller-mecanico",          ✅ Project name
  "regions": ["iad1"],                ✅ Deployment region
}
```

**Environment Variables (Build Time):**
```json
{
  "env": {
    "NEXT_PUBLIC_APP_NAME": "Taller Ocampos"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_NAME": "Taller Ocampos"
    }
  }
}
```
⚠️ **ISSUE:** Hardcoded value should use dashboard env vars

**Rewrites Configuration:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://placeholder-backend.onrender.com/api/:path*"
    }
  ]
}
```
⚠️ **ISSUE:** Pattern mismatch with next.config.js

---

## ✅ Backend Bootstrap Contract (Express → Runtime)

### **Package.json Contract**
**Location:** `backend/package.json`

**Required Scripts:**
```json
{
  "scripts": {
    "dev": "nodemon",                    ✅ Development with hot reload
    "build": "tsc",                      ✅ TypeScript compilation
    "start": "node dist/index.js",       ✅ Production start
    "postinstall": "prisma generate"     ✅ Auto-generate Prisma client
  }
}
```

**Critical Dependencies:**
- `express`: ^4.18.2 ✅
- `@prisma/client`: ^5.7.0 ✅
- `socket.io`: ^4.6.0 ✅
- `dotenv`: ^16.3.1 ✅

**Node.js Version:**
- Specified: ❌ **MISSING** (Should add engines field)
- Recommended: >=18.0.0

### **Index.ts Bootstrap Contract**
**Location:** `backend/src/index.ts`

**Expected Environment Variables:**
```typescript
{
  FRONTEND_URL: string,               ✅ For CORS configuration
  MOBILE_URL?: string,                ✅ For mobile app CORS
  PORT: number,                       ✅ HTTP server port (default: 3001)
  SOCKET_PORT?: number,               ⚠️ Not actually used (misleading)
  NODE_ENV: string,                   ✅ Environment mode
  DATABASE_URL: string,               ✅ Prisma connection string
  JWT_SECRET: string,                 ✅ Authentication secret
  JWT_EXPIRES_IN: string              ✅ Token expiration
}
```

**Bootstrap Sequence:**
1. Load dotenv ✅
2. Create Express app ✅
3. Create HTTP server ✅
4. Create Socket.IO server on same HTTP server ✅
5. Apply middleware (helmet, cors, morgan, rate limiter) ✅
6. Register API routes ✅
7. Register health check endpoint ✅
8. Register Socket.IO handlers ✅
9. Apply error handling middleware ✅
10. Start HTTP server with Socket.IO ✅

⚠️ **ISSUE:** SOCKET_PORT is declared but not used (Socket.IO runs on same port as HTTP server)

---

## 🔗 Frontend ↔ Backend Integration Contract

### **API Communication**

**Frontend Expects:**
- Base URL: `process.env.NEXT_PUBLIC_API_URL` (e.g., https://backend.onrender.com/api)
- WebSocket URL: `process.env.NEXT_PUBLIC_SOCKET_URL` (e.g., https://backend.onrender.com)

**Backend Provides:**
- API Endpoints: `/api/auth`, `/api/clients`, `/api/vehicles`, etc.
- Health Check: `/health`
- Socket.IO: On main HTTP server (not separate port)

**Routing Patterns:**

Frontend makes requests to:
```
/api/auth/login → NEXT_PUBLIC_API_URL/auth/login
/api/clients → NEXT_PUBLIC_API_URL/clients
```

⚠️ **INCONSISTENCY DETECTED:**

**next.config.js rewrites:**
```javascript
source: '/api/proxy/:path*'
destination: '${NEXT_PUBLIC_API_URL}/:path*'
```

**vercel.json rewrites:**
```json
source: '/api/:path*'
destination: 'https://placeholder-backend.onrender.com/api/:path*'
```

**These are different patterns!** Should be unified.

### **CORS Configuration**

**Frontend → Backend:**
- Frontend sends credentials: `true`
- Backend expects: `FRONTEND_URL` in allowed origins

**Backend CORS Config:**
```typescript
cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.MOBILE_URL || 'exp://localhost:8081'
  ],
  credentials: true
})
```

✅ **Contract:** Backend MUST have `FRONTEND_URL` set to Vercel deployment URL

---

## 📋 Environment Variable Contracts

### **Frontend Required Variables (Vercel Dashboard)**
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api     ✅ Required
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com      ⚠️ Optional (socket on same URL)
NEXT_PUBLIC_APP_NAME=Taller Mecánico                          ⚠️ Hardcoded in vercel.json
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app               ✅ Optional
```

### **Backend Required Variables (Render/Railway)**
```env
NODE_ENV=production                                            ✅ Required
PORT=3001                                                      ✅ Required
DATABASE_URL=postgresql://...                                  ✅ Required
JWT_SECRET=...                                                 ✅ Required
JWT_EXPIRES_IN=7d                                             ✅ Required
FRONTEND_URL=https://your-app.vercel.app                      ✅ Required (CORS)
MAX_FILE_SIZE=10485760                                        ✅ Optional
UPLOAD_DIR=./uploads                                          ✅ Optional
```

---

## 🐛 Issues Found

### **Issue 1: Duplicate Rewrites with Different Patterns**
**Impact:** HIGH - Confusion about API routing

**Problem:**
- `next.config.js`: `/api/proxy/:path*` → Backend
- `vercel.json`: `/api/:path*` → Backend

**Solution:** Remove `vercel.json` rewrites OR unify patterns

**Recommendation:** Use `next.config.js` rewrites only (more flexible with env vars)

### **Issue 2: Hardcoded Environment Variable**
**Impact:** MEDIUM - Less flexible configuration

**Problem:**
- `vercel.json` hardcodes `NEXT_PUBLIC_APP_NAME`
- Should come from Vercel Dashboard env vars

**Solution:** Remove from `vercel.json`, add to dashboard

### **Issue 3: Misleading SOCKET_PORT**
**Impact:** LOW - Documentation clarity

**Problem:**
- Backend declares `SOCKET_PORT` but doesn't use it
- Socket.IO runs on same port as HTTP server
- Frontend expects WebSocket on main URL

**Solution:** Remove `SOCKET_PORT` from documentation and env examples

### **Issue 4: Missing Node.js Version Specification**
**Impact:** MEDIUM - Deployment consistency

**Problem:**
- Neither `package.json` specifies Node.js version
- Vercel will use latest, might cause compatibility issues

**Solution:** Add `engines` field to both package.json files

---

## 🔧 Recommended Fixes

### **Fix 1: Update frontend/vercel.json**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "taller-mecanico",
  "framework": "nextjs",
  "regions": ["iad1"],
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```
**Changes:** Remove `env`, `build.env`, and `rewrites` sections

### **Fix 2: Add Node.js version to package.json files**
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### **Fix 3: Update backend .env.example**
Remove `SOCKET_PORT=3002` (misleading - socket runs on main port)

### **Fix 4: Update documentation**
Clarify that Socket.IO runs on the same URL as the HTTP API

---

## ✅ Bootstrap Contract Checklist

### **Frontend (Vercel)**
- [✅] package.json has build script
- [✅] Next.js 14+ installed
- [⚠️] Node.js version specified (NEEDS FIX)
- [✅] vercel.json in frontend folder
- [⚠️] No hardcoded env vars in vercel.json (NEEDS FIX)
- [✅] next.config.js configured
- [✅] Environment variables documented

### **Backend (Render/Railway)**
- [✅] package.json has start script
- [✅] Express + Socket.IO configured
- [⚠️] Node.js version specified (NEEDS FIX)
- [✅] CORS configured for frontend
- [✅] Environment variables documented
- [✅] Database connection via Prisma
- [✅] Health check endpoint

### **Integration**
- [⚠️] API routing patterns unified (NEEDS FIX)
- [✅] CORS configuration matches
- [✅] Environment variable contracts clear
- [✅] WebSocket configuration documented

---

## 📊 Contract Status Summary

| Contract | Status | Issues |
|:---------|:-------|:-------|
| Frontend → Vercel | ⚠️ Needs fixes | Hardcoded env, missing Node version |
| Backend → Runtime | ⚠️ Needs fixes | Missing Node version, misleading socket port |
| Frontend ↔ Backend | ⚠️ Needs fixes | Routing pattern mismatch |
| Environment Variables | ✅ Good | Well documented |
| Security Headers | ✅ Good | Properly configured |
| CORS Configuration | ✅ Good | Correctly set up |

**Overall Status:** ⚠️ **Good with minor fixes needed**

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Issues identified, fixes recommended
