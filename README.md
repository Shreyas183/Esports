## Esports Tournament Management System

This is a full-stack, Firebase-powered web app for organizing and participating in esports tournaments. It includes role-based dashboards, tournament creation and registration, manual payment verification, automated single-elimination brackets, scheduled room-credential reveals, real-time notifications, and comprehensive audit logging.

### Table of Contents
- Overview
- Tech Stack
- Architecture
- Key Features
- Project Structure
- Core Workflows
- Data Model and Collections
- Frontend: Routing, Hooks, Services, and UI
- Backend: Cloud Functions
- Environment and Configuration
- Setup and Development
- Security Rules
- Scripts and Utilities
- Deployment
- Notes, Caveats, and Troubleshooting
- Roadmap

## Overview
- Purpose: Manage esports tournaments end-to-end with Admin, Organizer, Player, and Viewer roles.
- Backend: Firebase (Auth, Firestore, Cloud Functions, Storage, Cloud Messaging, Hosting).
- Frontend: React + TypeScript + Vite with a modern UI (shadcn/ui + Radix).
- Data: Firestore collections for users, teams, tournaments, registrations, matches, brackets, highlights, notifications, auditLogs.

## 🛠 Tech Stack
- Frontend
  - React 18, TypeScript, Vite
  - Tailwind CSS, tailwind-merge, tailwindcss-animate
  - shadcn/ui (Radix UI primitives), lucide-react icons
  - React Router v6, TanStack React Query
  - React Hook Form + Zod
- Firebase SDK (web)
  - Auth, Firestore, Storage, Functions, Analytics, Messaging (FCM)
- Backend
  - Firebase Functions v5 (Node 20), firebase-admin v12
- Tooling
  - ESLint v9, TypeScript v5, PostCSS, @vitejs/plugin-react-swc

## Architecture
- Client initializes Firebase via src/services/firebase.ts and connects to project new-esports (no emulators by default).
- Auth and role data are loaded into context in src/hooks/useAuth.ts and permission helpers in src/hooks/use-auth.ts.
- Firestore is accessed directly on the client; privileged operations are handled by callable Cloud Functions via src/services/cloudFunctions.ts.
- Long-running or cross-cutting backend tasks (roles, payments, brackets, room credentials, stats) live in functions/src/*.
- Notifications are stored in Firestore and optionally sent as push via FCM.

## 🎮 Key Features
- Role-based dashboards: Admin, Organizer, Player, Viewer.
- Tournament lifecycle: draft → registration → live → completed.
- Registration with UPI payment proof; organizer approves/rejects with notes.
- Single-elimination bracket generation with shuffling and power-of-two padding (byes).
- Automatic match progression: winners advance, stats updated, tournament completes at final.
- Time-gated room credentials: revealed 15 minutes prior via scheduled function.
- Real-time notifications (Firestore + FCM) and audit logs for sensitive actions.
- Modern, accessible UI with toasts, skeletons, and spinners.

## 📁 Project Structure

```plaintext
├── functions/
│   └── src/
│       ├── index.ts          # Entry: exports all functions
│       ├── auth.ts           # onUserCreate (seed user + claims + audit)
│       ├── admin.ts          # setCustomClaims (admin-only)
│       ├── brackets.ts       # generateBrackets (callable)
│       ├── payments.ts       # verifyPayment (callable)
│       ├── scheduler.ts      # timeGateRoomCreds (pub/sub schedule)
│       ├── stats.ts          # recalcStats on match completion
│       └── types.ts          # Backend types
├── src/
│   ├── components/
│   │   ├── auth/ProtectedRoute.tsx
│   │   └── ui/*              # shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth provider and actions
│   │   └── use-auth.ts       # Permissions, profile, nav helpers
│   ├── pages/
│   │   ├── DashboardRouter.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── OrganizerDashboard.tsx
│   │   ├── PlayerDashboard.tsx
│   │   └── ViewerDashboard.tsx
│   ├── services/
│   │   ├── firebase.ts       # Firebase app + helpers (no emulator)
│   │   ├── cloudFunctions.ts # Callable clients
│   │   └── tournaments.ts    # Firestore tournament service
│   └── types/index.ts        # Frontend types
├── firestore.rules           # Firestore security rules
├── storage.rules             # Storage security rules
├── firebase.json             # Firebase config
└── env.example               # Example env vars
```
## 🎯 Core Workflows
### User onboarding
- functions/src/auth.ts:onUserCreate runs on Auth signup.
- Creates users/{uid} with default role player, sets custom claims, writes audit log.

### Authentication (frontend)
- src/hooks/useAuth.ts manages auth state and profile:
  - signIn, signUp, signInWithGoogle, logout, updateUserProfile.
  - Loads users/{uid} on auth state change.

### Organizer: Create tournament
- UI page src/pages/CreateTournament.tsx (form and uploads).
- src/services/tournaments.ts:TournamentService.createTournament writes tournaments docs with schedule, payment info, sponsors, etc.

### Player: Register and pay
- Write to registrations with team/solo info and payment proof (UTR + image), status pending.

### Organizer: Verify payment
- Calls callable verifyPayment via src/services/cloudFunctions.ts.
- Cloud Function checks organizer or admin role, updates registrations/{id}, creates notification, logs audit, and sends FCM if available.

### Organizer: Generate brackets
- Calls callable generateBrackets.
- Cloud Function validates: auth, role (organizer/admin), tournament status registration, approved registrations exist and ≥2.
- Shuffles teams, pads to power-of-two with byes, creates first-round matches, writes brackets/{id}, updates tournaments/{id}.status = 'live', logs audit.

### Match completion and progression
- Updating a match to completed triggers recalcStats:
  - Updates winner stats (team and members or solo).
  - If final, sets tournament completed and notifies approved registrants.
  - If not final, advances winner to the next match’s correct slot.

### Room credentials reveal
- timeGateRoomCreds runs every 5 minutes and reveals tournaments.room 15 minutes prior to matches, creates notifications, and sends FCM.

## 📊 Data Model and Collections
- users: role, game IDs, stats, displayName, photo, timestamps, optional fcmToken.
- teams: name, logo, captain, members, gameType, stats.
- tournaments: title, description, gameType, organizer, status, maxTeams, entryFee, prizePool, prizeDistribution, rules, schedule, paymentInfo, optional room, streamURL, bannerURL, sponsors.
- registrations: tournamentId, userId, team info, playerGameId, paymentProof (imageURL, UTR, amount), paymentStatus, verifiedBy/At, notes.
- matches: tournamentId, round, position, team slots, winner, status, scores, optional room, streamURL.
- brackets: tournamentId, type, rounds (list of match IDs), isLocked.
- highlights: tournament video metadata.
- notifications: userId, title, message, type, data, read flag, createdAt.
- auditLogs: action, actor, resource, old/new values, metadata, createdAt.

See src/types/index.ts and functions/src/types.ts for full interfaces.

## Frontend: Routing, Hooks, Services, and UI
- Routing
  - src/components/auth/ProtectedRoute.tsx: redirects unauthenticated to /auth, enforces allowedRoles.
  - src/pages/DashboardRouter.tsx: selects dashboard by user.role.
- Hooks
  - useAuth.ts: context + auth actions and Firestore profile merge updates.
  - use-auth.ts: permissions (isAdmin, isOrganizer, …), profile helpers, role-based navigation.
- Services
  - firebase.ts: initializes app to new-esports, exposes auth, db, storage, functions, Analytics (prod), FCM helpers (requestNotificationPermission, onMessageListener), storage uploader.
  - tournaments.ts: TournamentService queries and CRUD for tournaments, registrations, matches, brackets.
  - cloudFunctions.ts: callable clients for generateBrackets, verifyPayment, setCustomClaims.
- UI/UX
  - shadcn/ui components under src/components/ui/*, lucide-react icons, toast notifications, skeletons, spinners.

## Backend: Cloud Functions
Exported from functions/src/index.ts:
- onUserCreate: Create users doc, set claims, audit log.
- setCustomClaims: Admin-only role updates (validates target and writes audit log).
- generateBrackets: Organizer/admin-only; creates bracket and matches; sets tournament live.
- verifyPayment: Organizer/admin-only; updates registrations; sends notification + FCM; audit log.
- timeGateRoomCreds: Scheduled; reveals room credentials and notifies approved registrants.
- recalcStats: On matches/{matchId} update to completed; updates stats, advances bracket, completes tournament if final, notifies.

## 🌐 Environment and Configuration
- Example .env: see env.example for VITE_FIREBASE_*, VITE_FIREBASE_VAPID_KEY, and app metadata variables.
- Firebase client config is currently hardcoded in src/services/firebase.ts to new-esports. If you change projects, update this file or refactor to read from env.
- By default, the client does not connect to emulators.

## 🚀 Setup and Development
### Prerequisites
- Node.js 18+
- Firebase CLI: npm i -g firebase-tools
- Firebase services enabled: Auth, Firestore, Storage, Functions, Hosting, Cloud Messaging

### Install dependencies
bash
npm install
cd functions && npm install && cd ..


### Configure Firebase project
bash
firebase login
firebase use <your-project-id>


### Run locally
bash
npm run dev


### Lint and build
bash
npm run lint
npm run build


### Emulators (optional)
Current setup always connects to Firebase. To use emulators, modify src/services/firebase.ts to connect to emulators conditionally via env and connect*Emulator helpers.

## 🔐 Security Rules
- Firestore rules in firestore.rules and Storage rules in storage.rules.
bash
firebase deploy --only firestore:rules,storage

Policies should restrict access based on roles, ensure users only access their own data where appropriate, and validate shapes for core documents.

## 🧰 Scripts and Utilities
- scripts/seedAdmin.ts, scripts/seedAdminWithAuth.ts seed an admin user/document. They reference a different sample project (esports-53611); update configs/UIDs before use.
- scripts/clear-users.js, scripts/list-users.js provide user management helpers. Review carefully before production use.

## 📦 Deployment
### Cloud Functions
bash
cd functions
npm run build
firebase deploy --only functions


### Hosting
bash
npm run build
firebase deploy --only hosting


### Full deploy
bash
firebase deploy


## ⚠ Notes, Caveats, and Troubleshooting
- Firebase config is hardcoded to new-esports; update src/services/firebase.ts or use env vars for portability.
- Cloud Messaging requires VITE_FIREBASE_VAPID_KEY and browser permission; confirm service worker if adding background handlers.
- Roles: all new users start as player via onUserCreate; promote via setCustomClaims callable.
- Brackets: single-elimination only; byes are auto-assigned when entrants are not a power of two.

## 🗺 Roadmap
- Additional bracket types: double elimination, round robin
- Live streaming integration
- Advanced analytics and leaderboards
- PWA/mobile support and richer push flows
- Tournament templates and cloning
- Full emulator support behind env flags
