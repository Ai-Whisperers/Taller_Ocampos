# Troubleshooting Guide

## ChunkLoadError: Loading chunk failed

### Problem
```
ChunkLoadError: Loading chunk app/layout failed.
(timeout: http://localhost:3004/_next/static/chunks/app/layout.js)
```

### Root Causes
1. **Build Cache Issues** - Stale or corrupted build cache
2. **TypeScript Errors** - Build fails silently with TS errors
3. **Test Files in Build** - Test utilities included in production build
4. **Network Issues** - Slow connections causing chunk timeouts
5. **Browser Cache** - Outdated cached chunks

### ✅ Solutions Applied

#### 1. Fixed TypeScript Error
**Issue:** `pathname` could be `null` in Sidebar component
```typescript
// Before (Error)
const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

// After (Fixed)
const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
```

#### 2. Excluded Test Files from Build
**Updated `tsconfig.json`:**
```json
{
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "tests/**/*"
  ]
}
```

#### 3. Fixed Test Utilities
**Moved Jest globals from utilities:**
```typescript
// Before - caused build errors
beforeEach(() => { ... })

// After - exported function
export const setupLocalStorageMock = () => { ... }
```

#### 4. Added Cleanup Scripts
**New package.json scripts:**
```json
{
  "scripts": {
    "clean": "rm -rf .next && rm -rf node_modules/.cache",
    "clean:full": "rm -rf .next && rm -rf node_modules && npm install",
    "dev:clean": "npm run clean && npm run dev",
    "build:clean": "npm run clean && npm run build",
    "fix-chunks": "node ../scripts/fix-chunk-errors.js"
  }
}
```

### 🚀 Quick Fix Commands

**For immediate resolution:**
```bash
# Clean and restart development
cd frontend
npm run clean
npm run dev

# For persistent issues
npm run clean:full
```

**For production builds:**
```bash
# Clean build
npm run build:clean

# Test production locally
npm run build && npm run start
```

### 🔧 Automated Fix Script

Run the automated chunk error fixer:
```bash
node scripts/fix-chunk-errors.js
```

This script will:
- ✅ Clean all caches (.next, node_modules/.cache, .swc)
- ✅ Check configuration files
- ✅ Rebuild the application
- ✅ Provide troubleshooting tips

### 🌐 Browser-Side Fixes

1. **Hard Refresh:** `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache:** Developer Tools > Application > Storage > Clear Site Data
3. **Incognito/Private Mode:** Test in a clean browser session
4. **Different Browser:** Try Chrome, Firefox, Safari, Edge

### 🔍 Debug Steps

1. **Check Browser DevTools:**
   ```
   F12 > Network Tab > Reload page
   Look for failed chunk requests (404, timeout errors)
   ```

2. **Verify Build Success:**
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Test Different Ports:**
   ```bash
   npm run dev -- -p 3010
   # Try different port if 3000-3005 are busy
   ```

4. **Check File Permissions:**
   ```bash
   ls -la .next/static/chunks/
   # Ensure chunk files exist and are readable
   ```

### ⚠️ Prevention Tips

1. **Always build before deploying:**
   ```bash
   npm run build && npm run start
   ```

2. **Keep dependencies updated:**
   ```bash
   npm audit fix
   npm update
   ```

3. **Monitor build warnings:**
   - Fix TypeScript errors immediately
   - Address eslint warnings
   - Remove unused dependencies

4. **Use clean development workflow:**
   ```bash
   # Start of day
   git pull
   npm run clean
   npm run dev

   # Before commits
   npm run build
   npm run test
   ```

### 📊 Current Status

✅ **Frontend Server:** Running on http://localhost:3005
✅ **Build:** Successful with no errors
✅ **TypeScript:** All type errors resolved
✅ **Test Configuration:** Properly excluded from build
✅ **Cache:** Cleaned and rebuilt

The application should now load without chunk errors. If issues persist, run:
```bash
npm run fix-chunks
```

### 🆘 If Problems Continue

1. **Check Network:**
   - Test internet connection stability
   - Try different WiFi network
   - Use wired connection if possible

2. **System Resources:**
   - Close other development servers
   - Free up RAM and disk space
   - Restart development machine

3. **Environment Issues:**
   - Check Node.js version (requires 18+)
   - Verify npm/yarn version compatibility
   - Try different terminal/shell

4. **Last Resort:**
   ```bash
   # Nuclear option - complete reset
   rm -rf node_modules package-lock.json .next
   npm install
   npm run build
   npm run dev
   ```

For additional support, check the [Next.js documentation](https://nextjs.org/docs/messages/chunk-load-error) or create an issue in the project repository.