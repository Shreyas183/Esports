# Esports Tournament Management System

A comprehensive web application for managing esports tournaments with role-based access control, payment verification, bracket generation, and real-time notifications.

## 🎮 Features

- **Role-Based Access**: Admin, Organizer, Player, and Viewer dashboards
- **Tournament Management**: Create, manage, and participate in tournaments
- **Team System**: Create teams, invite members, manage rosters
- **Payment Integration**: QR code payments with UTR verification
- **Bracket Generation**: Automated single-elimination brackets
- **Real-time Notifications**: Firebase Cloud Messaging integration
- **Secure**: Comprehensive Firebase security rules

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, FCM)
- **UI Components**: Radix UI (shadcn/ui)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **State Management**: React Query

## 📁 Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── auth/           # Authentication components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Application pages
│   ├── services/           # Firebase and API services
│   ├── types/              # TypeScript type definitions
│   └── lib/                # Utility functions
├── functions/              # Firebase Cloud Functions
│   └── src/               # Function source code
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
└── firebase.json          # Firebase configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with the following services enabled:
  - Authentication
  - Firestore
  - Storage
  - Functions
  - Hosting
  - Cloud Messaging

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd esports-tournament-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Firebase Setup**
   ```bash
   firebase login
   firebase use <your-project-id>
   ```

4. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

5. **Deploy Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

6. **Start Development**
   ```bash
   npm run dev
   ```

### Environment Setup

The Firebase configuration is already set up in `src/services/firebase.ts`. For production deployment, ensure your Firebase project is properly configured.

## 🔧 Development

### Running with Emulators

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the dev server
npm run dev
```

### Building for Production

```bash
npm run build
firebase deploy --only hosting
```

## 🔐 Security

### Firestore Rules

The project includes comprehensive security rules that:
- Ensure users can only access their own data
- Validate role-based permissions
- Prevent unauthorized operations
- Enforce data validation

### Storage Rules

Storage rules control:
- File upload permissions based on user roles
- File type validation (images/videos only)
- File size limits
- Path-based access control

## 📱 User Roles

### Viewer
- Browse tournaments
- Watch live streams
- View highlights and results

### Player
- Create/join teams
- Register for tournaments
- Upload payment proofs
- Receive notifications

### Organizer
- Create and manage tournaments
- Verify payments
- Generate brackets
- Manage match results
- Upload highlights

### Admin
- Full system access
- User role management
- Site-wide moderation
- Audit log access

## 🎯 Core Workflows

### Tournament Registration
1. Player selects tournament
2. Chooses team or solo registration
3. Uploads payment proof with UTR
4. Organizer verifies payment
5. Player receives confirmation notification

### Bracket Generation
1. Organizer reviews approved registrations
2. Generates single-elimination brackets
3. System creates all matches automatically
4. Room credentials are time-gated before matches

### Payment Verification
1. Organizer views pending payments
2. Compares proof with tournament requirements
3. Approves or rejects with notes
4. System sends notifications to players
5. Audit log records all actions

## 🔧 Cloud Functions

### Available Functions

- `onUserCreate`: Initialize new user documents
- `setCustomClaims`: Admin role management
- `generateBrackets`: Tournament bracket generation
- `verifyPayment`: Payment verification workflow
- `timeGateRoomCreds`: Scheduled room credential reveals
- `recalcStats`: Automatic stats updates on match completion

### Function Deployment

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 📊 Database Collections

- `users` - User profiles and stats
- `teams` - Team information and members
- `tournaments` - Tournament details and settings
- `registrations` - Tournament registrations with payment info
- `matches` - Individual matches and results
- `brackets` - Tournament bracket structures
- `highlights` - Video highlights and clips
- `notifications` - User notifications
- `auditLogs` - System audit trail

## 🎨 UI/UX Features

- **Dark Theme**: Gaming-focused dark interface
- **Responsive Design**: Mobile-first approach
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: Toast notifications for user feedback
- **Accessibility**: WCAG AA compliant
- **Animations**: Smooth transitions and micro-interactions

## 📈 Performance

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Lazy loading and compression
- **Caching**: React Query for efficient data fetching
- **Bundle Size**: Optimized with Vite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review Firebase console for errors
- Check browser console for client-side issues
- Review function logs: `firebase functions:log`

## 🔄 Updates

### Recent Changes
- ✅ Complete Firebase security rules
- ✅ Cloud Functions for backend operations
- ✅ Real-time bracket generation
- ✅ Payment verification workflow
- ✅ Notification system
- ✅ Audit logging

### Upcoming Features
- Advanced bracket types (double elimination, round robin)
- Live streaming integration
- Advanced analytics
- Mobile app support
- Tournament templates
