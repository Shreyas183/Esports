// Shared types for Cloud Functions
export type UserRole = 'viewer' | 'player' | 'organizer' | 'admin';
export type GameType = 'BGMI' | 'FREE_FIRE';
export type TournamentStatus = 'draft' | 'registration' | 'live' | 'completed';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  gameIds: Record<GameType, string>;
  stats: {
    tournamentsJoined: number;
    tournamentsWon: number;
    totalEarnings: number;
  };
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  gameType: GameType;
  organizerId: string;
  organizerName: string;
  status: TournamentStatus;
  featured: boolean;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  prizeDistribution: PrizeDistribution[];
  rules: string[];
  schedule: {
    registrationStart: admin.firestore.Timestamp;
    registrationEnd: admin.firestore.Timestamp;
    tournamentStart: admin.firestore.Timestamp;
    tournamentEnd: admin.firestore.Timestamp;
  };
  paymentInfo: {
    qrCodeURL: string;
    upiId: string;
    instructions: string;
  };
  room?: {
    id: string;
    password: string;
    visibleFrom?: admin.firestore.Timestamp;
  };
  streamURL?: string;
  bannerURL?: string;
  sponsors: Sponsor[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface PrizeDistribution {
  position: number;
  amount: number;
  percentage: number;
}

export interface Sponsor {
  name: string;
  logoURL: string;
  websiteURL?: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  teamId?: string;
  teamName?: string;
  playerGameId: string;
  paymentStatus: PaymentStatus;
  paymentProof?: {
    imageURL: string;
    utr: string;
    amount: number;
    submittedAt: admin.firestore.Timestamp;
  };
  verifiedBy?: string;
  verifiedAt?: admin.firestore.Timestamp;
  notes?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  team1Id?: string;
  team2Id?: string;
  team1Name?: string;
  team2Name?: string;
  winnerId?: string;
  winnerName?: string;
  status: MatchStatus;
  scheduledAt?: admin.firestore.Timestamp;
  startedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  scores?: {
    team1Score: number;
    team2Score: number;
  };
  room?: {
    id: string;
    password: string;
  };
  streamURL?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface AuditLog {
  id: string;
  userId: string;
  userDisplayName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: admin.firestore.Timestamp;
}

// Request types for callable functions
export interface GenerateBracketsRequest {
  tournamentId: string;
}

export interface VerifyPaymentRequest {
  registrationId: string;
  approved: boolean;
  notes?: string;
}

export interface SetCustomClaimsRequest {
  uid: string;
  role: UserRole;
}