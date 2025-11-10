# 🚀 Deploy to Vercel - Immediate Instructions
Doc-Type: Quick Reference · Version 1.0 · Updated 2025-11-10

**Frontend is ready for immediate deployment. Follow these steps to show the client.**

---

## ⚡ 5-Minute Deployment

### **1. Import to Vercel**
```
1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select this repository
4. Click "Import"
```

### **2. Configure Project**
**CRITICAL: Set Root Directory**

In the configuration screen:
```
Framework Preset: Next.js (auto-detected) ✅
Root Directory: frontend                  ⚠️ MUST SET THIS
Build Command: (leave empty)              ✅ Auto-detected
Output Directory: (leave empty)           ✅ Auto-detected
Install Command: (leave empty)            ✅ Auto-detected
```

**⚠️ IMPORTANT:** You MUST set Root Directory to `frontend`

### **3. Add Environment Variables**
Click "Add Environment Variables" and add these:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=Taller Mecánico
```

**Note:** For demo purposes, you can use placeholder URLs. The frontend will work without a backend (some features will show errors, but UI is visible).

### **4. Deploy**
```
1. Click "Deploy"
2. Wait 2-3 minutes
3. Get your live URL: https://your-project.vercel.app
```

---

## 🎯 Post-Deployment

### **Share with Client**
Once deployed, share this URL with your client:
```
https://your-project-name.vercel.app
```

### **Test the Deployment**
1. Visit the URL
2. You should see the landing/login page
3. UI components should load correctly
4. Images and styles should work

### **Expected Behavior (Without Backend)**
- ✅ Pages load
- ✅ UI renders correctly
- ✅ Styles work perfectly
- ✅ Navigation works
- ❌ Login will fail (no backend)
- ❌ Data fetching will show errors (no backend)

**This is normal!** Client can see the complete UI/UX.

---

## 🔧 Troubleshooting

### **Error: "No Next.js version detected"**
**Fix:** You forgot to set Root Directory to `frontend`

**Steps:**
1. Go to Project Settings
2. Click "General"
3. Find "Root Directory"
4. Set to: `frontend`
5. Click "Save"
6. Redeploy

### **Error: Build fails**
**Check:**
1. Root Directory is set to `frontend` ✅
2. Node.js version compatible (18+) ✅
3. All dependencies in package.json ✅

**Fix:**
1. Go to Deployments
2. Click latest deployment
3. Click "Redeploy"
4. Check "Clear cache"
5. Click "Redeploy"

### **Styles not loading**
**Check:**
1. Visit the URL with browser dev tools open (F12)
2. Check Console for errors
3. Check Network tab for failed requests

**Usually auto-fixes on redeploy**

---

## 📊 Deployment Checklist

Before showing to client:

- [ ] Root Directory set to `frontend`
- [ ] Environment variables added
- [ ] Build completed successfully
- [ ] Visit the live URL
- [ ] Landing page loads
- [ ] Styles render correctly
- [ ] No critical console errors
- [ ] Test navigation
- [ ] Test responsive design (mobile view)

---

## 🎨 What Client Will See

### **Landing Page**
- Professional login/register interface
- Branding (Taller Mecánico)
- Responsive design

### **After Login (Will Fail Without Backend)**
- Client can see the UI design
- Dashboard layout
- Navigation structure
- Component library
- Visual design system

**Purpose:** Show the client the complete UI/UX even without backend!

---

## 🔄 Update Deployment

To push changes:

```bash
# Make your changes
git add .
git commit -m "Update frontend"
git push origin main

# Vercel auto-deploys in ~2 minutes
```

---

## 🌐 Custom Domain (Optional)

After deployment, add a custom domain:

1. Go to Project Settings
2. Click "Domains"
3. Add your domain
4. Follow DNS instructions
5. Wait for verification (~1 hour)

---

## 📱 Mobile Testing

Test on mobile devices:

1. Open browser on phone
2. Visit: `https://your-project.vercel.app`
3. Should be fully responsive
4. Test navigation and UI

---

## 🔐 Production Checklist (Before Full Launch)

- [ ] Backend deployed (see `changelog/DEPLOYMENT_MVP_VERCEL.md`)
- [ ] Database setup (Neon.tech)
- [ ] Update environment variables with real backend URL
- [ ] Test full login flow
- [ ] Test data operations
- [ ] Test real-time updates
- [ ] Configure custom domain
- [ ] SSL certificate active (automatic on Vercel)
- [ ] Analytics setup (optional)

---

## 📞 Support

**For deployment issues:**
- Check: `BOOTSTRAP_CONTRACTS.md`
- Check: `README.md`
- Check: Vercel build logs

**Vercel Logs:**
1. Go to Deployments
2. Click latest deployment
3. Click "Building"
4. See full build log

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Live URL is accessible
3. ✅ Landing page loads correctly
4. ✅ Styles render properly
5. ✅ Navigation works
6. ✅ No critical console errors

**Client can now see the frontend!** 🎉

---

**Quick Reference:**
- Root Directory: `frontend`
- Framework: Next.js (auto-detected)
- Build Time: ~2 minutes
- Cost: $0 (free tier)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Deployment Time:** 5 minutes
**Status:** ✅ Ready to Deploy Now
