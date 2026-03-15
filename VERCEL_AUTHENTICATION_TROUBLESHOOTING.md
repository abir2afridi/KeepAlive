# Vercel Authentication Issue - Complete Troubleshooting Guide

## 🔍 **Problem Identified**

**Localhost works perfectly, but Vercel live server shows no data after login.** This is a classic authentication configuration issue between Supabase and Vercel deployment.

---

## 🔧 **Root Cause Analysis**

### **Most Likely Causes:**
1. **Supabase Redirect URL not configured** for Vercel domain
2. **Environment variables not properly loaded** in production
3. **CORS issues** between Supabase and Vercel
4. **Authentication flow broken** after OAuth redirect

---

## 🚀 **Step-by-Step Solution**

### **Step 1: Configure Supabase Redirect URLs**

**CRITICAL:** You must add your Vercel domain to Supabase Auth settings.

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `bfegwgoxeoawftxirapx`
3. **Navigate to**: Authentication → Settings
4. **Scroll to**: "Site URL" section
5. **Add these URLs**:
   ```
   https://keep2alive.vercel.app
   https://keep2alive.vercel.app/auth
   https://keep2alive.vercel.app/app/dashboard
   https://keep2alive.vercel.app/**
   ```

### **Step 2: Configure OAuth Providers**

1. **In Supabase Dashboard**: Authentication → Providers
2. **For Google Provider**:
   - **Enabled**: ✅ Check
   - **Authorized Redirect URIs**:
     ```
     https://keep2alive.vercel.app/auth/callback
     https://keep2alive.vercel.app/auth
     ```

### **Step 3: Verify Environment Variables**

Check that all environment variables are properly set in Vercel:

```bash
npx vercel env ls --scope abir2afridi-5746s-projects
```

**Required Variables:**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### **Step 4: Test Authentication Flow**

Use the debug endpoint to test authentication:

```javascript
// In browser console after login
fetch('/api/auth/debug', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(res => res.json()).then(console.log);
```

### **Step 5: Check Supabase Logs**

1. **Go to Supabase Dashboard**
2. **Navigate to**: Authentication → Logs
3. **Look for**: OAuth redirect errors, authentication failures

---

## 🔧 **Advanced Troubleshooting**

### **Option 1: Force Re-authentication**

Clear all authentication data and re-login:

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
window.location.href = '/auth';
```

### **Option 2: Check Network Requests**

1. **Open DevTools** → Network tab
2. **Try to login**
3. **Check for**: Failed OAuth requests, CORS errors
4. **Verify**: Redirect URLs match Supabase configuration

### **Option 3: Manual Token Verification**

After login, check if token is valid:

```javascript
// In browser console
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// Test with debug endpoint
fetch('/api/auth/debug', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json()).then(console.log);
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Invalid redirect_url" Error**
**Solution**: Add Vercel domain to Supabase redirect URLs (Step 1)

### **Issue 2: "CORS policy" Error**
**Solution**: Configure CORS in Supabase settings

### **Issue 3: Token expires immediately**
**Solution**: Check JWT settings in Supabase Auth

### **Issue 4: No data after login**
**Solution**: Verify environment variables are loaded correctly

---

## 🎯 **Quick Fix Checklist**

### **Must-Do Actions:**
- [ ] **Add Vercel domain to Supabase redirect URLs**
- [ ] **Configure Google OAuth redirect URIs**
- [ ] **Verify environment variables in Vercel**
- [ ] **Test authentication flow with debug endpoint**
- [ ] **Check Supabase authentication logs**

### **If Still Not Working:**
- [ ] **Clear browser storage and re-login**
- [ ] **Check network requests for errors**
- [ ] **Verify Supabase project settings**
- [ ] **Test with incognito window**

---

## 📋 **Debug Commands**

### **Check Environment Variables:**
```bash
npx vercel env ls --scope abir2afridi-5746s-projects
```

### **Test Authentication:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://keep2alive.vercel.app/api/auth/debug
```

### **Check Deployment:**
```bash
npx vercel logs --scope abir2afridi-5746s-projects
```

---

## 🎉 **Expected Result**

After following these steps:

1. **Login should work** on Vercel domain
2. **Data should load** after authentication
3. **No authentication errors** in console
4. **Monitors and stats** should display correctly

---

## 🔥 **Most Critical Fix**

**90% of the time, this issue is caused by missing redirect URL configuration in Supabase.**

**IMMEDIATE ACTION REQUIRED:**
1. Go to Supabase Dashboard → Authentication → Settings
2. Add `https://keep2alive.vercel.app` to Site URLs
3. Add `https://keep2alive.vercel.app/auth/callback` to Google OAuth
4. Clear browser cache and re-login

---

## 📞 **If Issue Persists**

If after following all steps the issue persists:

1. **Check Supabase logs** for authentication errors
2. **Verify domain matches exactly** (no http vs https)
3. **Test with a different browser** (incognito mode)
4. **Contact support** with detailed error logs

**🎯 FOLLOW THIS GUIDE EXACTLY - AUTHENTICATION WILL WORK!**
