# Firebase Setup Guide for Esports Tournament System

This guide will help you set up Firebase properly for the Esports Tournament Management System.

## 🚀 Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase CLI** (`npm install -g firebase-tools`)
3. **Git** for version control

## 📋 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `esports-tournament-system` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Choose analytics account or create new one
6. Click "Create project"

## 🔧 Step 2: Enable Firebase Services

### Authentication
1. In Firebase Console, go to "Authentication" → "Get started"
2. Click "Sign-in method" tab
3. Enable the following providers:
   - **Email/Password**
   - **Google** (recommended for better UX)
4. Configure authorized domains if needed

### Firestore Database
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (we'll add security rules later)
3. Select a location closest to your users
4. Click "Done"

### Storage
1. Go to "Storage" → "Get started"
2. Choose "Start in test mode" (we'll add security rules later)
3. Select a location closest to your users
4. Click "Done"

### Cloud Functions
1. Go to "Functions" → "Get started"
2. Click "Create function"
3. Choose "Blaze" plan (pay-as-you-go, required for external API calls)
4. Select a location closest to your users

### Cloud Messaging (FCM)
1. Go to "Project settings" → "Cloud Messaging" tab
2. Generate a new Web Push certificate
3. Copy the VAPID key (you'll need this later)

## 🔑 Step 3: Get Firebase Configuration

1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → "Web" (</>)
4. Register app with name: `EsportsPro Web App`
5. Copy the configuration object

## 📝 Step 4: Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```env
   # Firebase Configuration
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
   ```

## 🔒 Step 5: Deploy Security Rules

### Firestore Security Rules
The project includes comprehensive security rules in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### Storage Security Rules
Deploy storage rules:

```bash
firebase deploy --only storage
```

## ⚙️ Step 6: Deploy Cloud Functions

1. Navigate to functions directory:
   ```bash
   cd functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build functions:
   ```bash
   npm run build
   ```

4. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```

## 🗄️ Step 7: Database Structure

The system uses the following Firestore collections:

### Users Collection (`users`)
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  role: 'viewer' | 'player' | 'organizer' | 'admin',
  gameIds: {
    BGMI: string,
    FREE_FIRE: string
  },
  stats: {
    tournamentsJoined: number,
    tournamentsWon: number,
    totalEarnings: number
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Teams Collection (`teams`)
```typescript
{
  id: string,
  name: string,
  logoURL?: string,
  captainId: string,
  members: TeamMember[],
  gameType: 'BGMI' | 'FREE_FIRE',
  stats: {
    tournamentsJoined: number,
    tournamentsWon: number,
    totalEarnings: number
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Tournaments Collection (`tournaments`)
```typescript
{
  id: string,
  title: string,
  description: string,
  gameType: 'BGMI' | 'FREE_FIRE',
  organizerId: string,
  organizerName: string,
  status: 'draft' | 'registration' | 'live' | 'completed',
  featured: boolean,
  maxTeams: number,
  entryFee: number,
  prizePool: number,
  prizeDistribution: PrizeDistribution[],
  rules: string[],
  schedule: {
    registrationStart: Timestamp,
    registrationEnd: Timestamp,
    tournamentStart: Timestamp,
    tournamentEnd: Timestamp
  },
  paymentInfo: {
    qrCodeURL: string,
    upiId: string,
    instructions: string
  },
  room?: {
    id: string,
    password: string,
    visibleFrom?: Timestamp
  },
  streamURL?: string,
  bannerURL?: string,
  sponsors: Sponsor[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Registrations Collection (`registrations`)
```typescript
{
  id: string,
  tournamentId: string,
  userId: string,
  teamId?: string,
  teamName?: string,
  playerGameId: string,
  paymentStatus: 'pending' | 'approved' | 'rejected',
  paymentProof?: {
    imageURL: string,
    utr: string,
    amount: number,
    submittedAt: Timestamp
  },
  verifiedBy?: string,
  verifiedAt?: Timestamp,
  notes?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Matches Collection (`matches`)
```typescript
{
  id: string,
  tournamentId: string,
  round: number,
  position: number,
  team1Id?: string,
  team2Id?: string,
  team1Name?: string,
  team2Name?: string,
  winnerId?: string,
  winnerName?: string,
  status: 'upcoming' | 'live' | 'completed',
  scheduledAt?: Timestamp,
  startedAt?: Timestamp,
  completedAt?: Timestamp,
  scores?: {
    team1Score: number,
    team2Score: number
  },
  room?: {
    id: string,
    password: string
  },
  streamURL?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔐 Step 8: Security Rules Overview

### Firestore Rules
- **Users**: Can read/write their own data, admins can read all
- **Teams**: Players can create teams, members can update team data
- **Tournaments**: Public read, organizers can create/update their tournaments
- **Registrations**: Players can create, organizers can verify payments
- **Matches**: Public read, organizers can create/update
- **Brackets**: Public read, organizers can create/update
- **Highlights**: Public read, organizers can create/update
- **Notifications**: Users can read their own notifications
- **Audit Logs**: Admin only access

### Storage Rules
- **Images**: Only authenticated users can upload images
- **Videos**: Only organizers can upload videos
- **File types**: Only images and videos allowed
- **Size limits**: 10MB for images, 100MB for videos

## 🚀 Step 9: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Try to:
   - Sign up with a new account
   - Create a tournament (as organizer)
   - Join a tournament (as player)
   - Upload files
   - Verify payments

## 🔧 Step 10: Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

3. Update environment variables for production:
   ```env
   VITE_APP_ENV=production
   ```

## 🛠️ Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all variables in `.env` are set
   - Check that variable names match exactly

2. **"Permission denied" errors**
   - Deploy security rules: `firebase deploy --only firestore:rules,storage`
   - Check that user has proper role assigned

3. **Cloud Functions not working**
   - Ensure you're on Blaze plan
   - Check function logs: `firebase functions:log`
   - Verify function deployment: `firebase functions:list`

4. **File uploads failing**
   - Check storage rules
   - Verify file size and type
   - Ensure user is authenticated

### Getting Help

1. Check Firebase Console for errors
2. Review function logs: `firebase functions:log`
3. Check browser console for client-side errors
4. Verify environment variables are loaded correctly

## 📊 Monitoring

### Firebase Console
- **Analytics**: Track user engagement
- **Crashlytics**: Monitor app crashes
- **Performance**: Monitor app performance
- **Functions**: Monitor cloud function execution

### Custom Monitoring
- **Audit Logs**: Track all important actions
- **Error Boundaries**: Catch and handle React errors
- **Toast Notifications**: User feedback for actions

## 🔄 Updates and Maintenance

1. **Regular Backups**: Export Firestore data regularly
2. **Security Updates**: Keep Firebase SDK updated
3. **Performance Monitoring**: Monitor query performance
4. **Cost Optimization**: Monitor Firebase usage and costs

---

## ✅ Setup Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Cloud Functions deployed
- [ ] Environment variables configured
- [ ] Security rules deployed
- [ ] Application tested
- [ ] Production deployment ready

Your Firebase setup is now complete! The application will store all data in Firebase and provide real-time updates across all connected clients.
