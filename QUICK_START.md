# Quick Start Guide - Fix Blank White Page

## 🚨 **Immediate Fix for Blank White Page**

The blank white page is caused by missing Firebase configuration. Here's how to fix it:

### Step 1: Create Environment File

1. **Copy the example file:**
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file** and add your Firebase configuration:
   ```env
   # Firebase Configuration (REPLACE WITH YOUR ACTUAL VALUES)
   VITE_FIREBASE_API_KEY=your_actual_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Firebase Cloud Messaging
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here

   # App Configuration
   VITE_APP_NAME=EsportsPro
   VITE_APP_VERSION=1.0.0
   VITE_APP_ENV=development
   VITE_USE_EMULATORS=false
   ```

### Step 2: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Click "Add app" → "Web" (</>)
4. Copy the configuration object
5. Replace the placeholder values in your `.env` file

### Step 3: Start the Application

```bash
npm run dev
```

The app should now load properly!

---

## 🔧 **Alternative: Use Demo Mode (No Firebase Setup Required)**

If you want to see the app immediately without setting up Firebase:

1. **The app will automatically detect missing Firebase config**
2. **It will show a warning in the console but continue running**
3. **You can browse the UI and see the layout**
4. **Authentication and data features won't work until Firebase is configured**

---

## 🎯 **What You'll See After Fixing**

- ✅ **Landing Page** - Tournament showcase and features
- ✅ **Authentication** - Sign up/sign in forms
- ✅ **Dashboard** - Role-based dashboards
- ✅ **Tournament Management** - Create and manage tournaments
- ✅ **Team Management** - Create and manage teams
- ✅ **Real-time Updates** - Live tournament updates

---

## 🚀 **Next Steps After App is Running**

1. **Set up Firebase project** (follow `SETUP.md` for detailed instructions)
2. **Deploy security rules** for production use
3. **Configure Cloud Functions** for advanced features
4. **Set up hosting** for production deployment

---

## 🆘 **Still Having Issues?**

1. **Check browser console** for error messages
2. **Verify `.env` file** exists and has correct values
3. **Restart the dev server** after creating `.env`
4. **Clear browser cache** and reload

The app is now configured to handle missing Firebase gracefully, so you should see the UI even without Firebase setup!
