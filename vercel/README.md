# Vercel Deployment Configuration
Doc-Type: Configuration Guide · Version 1.0 · Updated 2025-11-10

Centralized Vercel deployment orchestration for the Taller Mecánico monorepo.

---

## 📁 Directory Structure

```
vercel/
├── scripts/
│   ├── install.sh          # Custom install script for monorepo
│   ├── build.sh            # Production build orchestration
│   └── validate-env.js     # Environment variable validation
├── config/
│   └── production.json     # Production configuration
└── README.md               # This file
```

---

## 🎯 Purpose

This directory centralizes all Vercel-specific configuration and build orchestration:

- **Clean Separation**: Vercel configs isolated from application code
- **Build Orchestration**: Custom scripts handle monorepo complexity
- **Environment Validation**: Pre-build checks for required variables
- **Production Grade**: Security headers, caching, optimization
- **Maintainability**: Single source of truth for Vercel deployment

---

## 🔧 Build Scripts

### `scripts/install.sh`

**Purpose**: Handles dependency installation for the frontend monorepo package

**What it does**:
- Navigates to frontend directory
- Runs `npm ci` for clean install
- Verifies critical packages (Next.js, React)
- Outputs installation statistics

**Called by**: Vercel during install phase

**Usage**:
```bash
# Automatic (Vercel)
# Runs via vercel.json installCommand

# Manual testing
bash vercel/scripts/install.sh
```

---

### `scripts/build.sh`

**Purpose**: Orchestrates the production build process

**What it does**:
- Validates environment variables
- Cleans previous build artifacts
- Runs Next.js production build
- Verifies build output
- Reports build statistics

**Called by**: Vercel during build phase

**Environment checks**:
- ✅ Required: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`
- ⚠️ Optional: `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_APP_URL`

**Usage**:
```bash
# Automatic (Vercel)
# Runs via vercel.json buildCommand

# Manual testing
cd frontend
bash ../vercel/scripts/build.sh
```

---

### `scripts/validate-env.js`

**Purpose**: Pre-deployment environment variable validation

**What it does**:
- Checks all required variables are set
- Validates URL formats and patterns
- Warns about missing optional variables
- Provides helpful error messages
- Displays environment info

**Usage**:
```bash
# Run validation
node vercel/scripts/validate-env.js

# With environment variables
NEXT_PUBLIC_API_URL=https://api.example.com/api \
NEXT_PUBLIC_APP_NAME="Taller Mecánico" \
node vercel/scripts/validate-env.js
```

**Exit codes**:
- `0` = All validations passed
- `1` = Missing required variables

---

## 📋 Configuration Files

### Root `vercel.json`

**Location**: `/vercel.json`

**Key configurations**:

```json
{
  "buildCommand": "bash vercel/scripts/build.sh",
  "installCommand": "bash vercel/scripts/install.sh",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs"
}
```

**Features**:
- ✅ Custom build orchestration
- ✅ Security headers (XSS, CSRF, etc.)
- ✅ Clean URLs and trailing slash handling
- ✅ Function timeout configuration
- ✅ API proxy configuration

---

### `config/production.json`

**Purpose**: Production environment settings

**Contains**:
- Build optimization settings
- Security configuration
- Performance tuning
- Monitoring setup

**Usage**: Reference file for production best practices

---

## 🚀 Deployment Flow

### Automatic Deployment (Git Push)

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel detects changes
# → Triggers build pipeline

# 3. Install phase
# → Runs: vercel/scripts/install.sh
# → Installs frontend dependencies

# 4. Build phase
# → Runs: vercel/scripts/build.sh
# → Validates environment variables
# → Builds Next.js production bundle

# 5. Deploy phase
# → Vercel deploys to edge network
# → Live in ~2 minutes
```

---

## 🔍 Environment Variables

### Required Variables (Set in Vercel Dashboard)

```bash
# Backend API endpoint
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api

# Application name
NEXT_PUBLIC_APP_NAME=Taller Mecánico
```

### Optional Variables

```bash
# WebSocket endpoint (defaults to API URL)
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com

# Frontend URL (auto-detected by Vercel)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Where to Set Them

**Vercel Dashboard**:
1. Go to your project
2. Settings → Environment Variables
3. Add each variable
4. Select environments: Production, Preview, Development
5. Click "Save"

---

## 🧪 Testing Build Locally

### Test Install Script

```bash
# From project root
bash vercel/scripts/install.sh
```

### Test Build Script

```bash
# Set environment variables
export NEXT_PUBLIC_API_URL=https://api.example.com/api
export NEXT_PUBLIC_APP_NAME="Taller Mecánico"

# Run build
cd frontend
bash ../vercel/scripts/build.sh
```

### Test Environment Validation

```bash
# With valid environment
NEXT_PUBLIC_API_URL=https://api.example.com/api \
NEXT_PUBLIC_APP_NAME="Test App" \
node vercel/scripts/validate-env.js

# Expected: ✅ All Environment Variables Valid
```

---

## 🔧 Troubleshooting

### Build Fails: "Missing environment variables"

**Problem**: Required env vars not set in Vercel

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy

---

### Build Fails: "npm ci failed"

**Problem**: Corrupted package-lock.json or cache

**Solution**:
1. Clear Vercel cache: Settings → General → Clear Build Cache
2. Redeploy

---

### Build Succeeds but App Not Working

**Problem**: Environment variables incorrect format

**Solution**:
1. Run validation locally:
   ```bash
   node vercel/scripts/validate-env.js
   ```
2. Fix invalid URLs/formats
3. Update in Vercel
4. Redeploy

---

### "Permission denied" on Scripts

**Problem**: Script files not executable

**Solution**:
```bash
chmod +x vercel/scripts/*.sh
git add vercel/scripts/*.sh
git commit -m "Fix script permissions"
git push
```

---

## 📊 Build Performance

### Expected Build Times

- **Install**: 30-60 seconds
- **Build**: 60-90 seconds
- **Deploy**: 30-60 seconds
- **Total**: ~3-4 minutes

### Optimization Tips

1. **Use npm ci**: Faster than npm install (we do this)
2. **Cache dependencies**: Vercel caches node_modules automatically
3. **Incremental builds**: Only changed files rebuild
4. **Edge caching**: Static assets cached globally

---

## 🔐 Security Features

### Enabled by Default

- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### Additional Recommendations

For production, consider adding:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- Subresource Integrity (SRI)

---

## 📚 References

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/docs/cli)

---

## 🎯 Best Practices

### DO ✅

- Keep build scripts in `vercel/scripts/`
- Validate environment variables before build
- Use `npm ci` instead of `npm install`
- Set proper cache headers
- Enable security headers
- Test builds locally before pushing

### DON'T ❌

- Don't commit `.env` files
- Don't hardcode secrets in scripts
- Don't skip environment validation
- Don't disable security headers
- Don't use `npm install` in CI/CD

---

## 🔄 Maintenance

### Regular Tasks

- [ ] Review build logs monthly
- [ ] Update dependencies quarterly
- [ ] Audit security headers
- [ ] Monitor build times
- [ ] Check for Vercel platform updates

### Updates

When updating:
1. Test scripts locally first
2. Deploy to preview environment
3. Verify functionality
4. Promote to production

---

**Configuration Version**: 1.0
**Last Updated**: 2025-11-10
**Maintained By**: DevOps Team
