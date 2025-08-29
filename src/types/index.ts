import { Timestamp } from 'firebase/firestore';

// User roles
export type UserRole = 'viewer' | 'player' | 'organizer' | 'admin';

// Game types
export type GameType = 'BGMI' | 'FREE_FIRE';

// Tournament status
export type TournamentStatus = 'draft' | 'registration' | 'live' | 'completed';

// Payment status
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

// Match status
export type MatchStatus = 'upcoming' | 'live' | 'completed';

// User interface
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  logoURL?: string;
  captainId: string;
  members: TeamMember[];
  gameType: GameType;
  stats: {
    tournamentsJoined: number;
    tournamentsWon: number;
    totalEarnings: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  gameId: string;
  role: 'captain' | 'member';
  joinedAt: Timestamp;
}

// Tournament interface
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
    registrationStart: Timestamp;
    registrationEnd: Timestamp;
    tournamentStart: Timestamp;
    tournamentEnd: Timestamp;
  };
  paymentInfo: {
    qrCodeURL: string;
    upiId: string;
    instructions: string;
  };
  room?: {
    id: string;
    password: string;
    visibleFrom?: Timestamp;
  };
  streamURL?: string;
  bannerURL?: string;
  sponsors: Sponsor[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

// Registration interface
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
    submittedAt: Timestamp;
  };
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Match interface
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
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  scores?: {
    team1Score: number;
    team2Score: number;
  };
  room?: {
    id: string;
    password: string;
  };
  streamURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Bracket interface
export interface Bracket {
  id: string;
  tournamentId: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  rounds: Round[];
  isLocked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Round {
  roundNumber: number;
  matches: string[]; // Match IDs
}

// Highlight interface
export interface Highlight {
  id: string;
  tournamentId: string;
  title: string;
  description: string;
  videoURL: string;
  thumbnailURL: string;
  uploadedBy: string;
  duration: number;
  tags: string[];
  views: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'payment_approved' | 'payment_rejected' | 'tournament_start' | 'match_start' | 'result_posted';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
}

// Audit log interface
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
  createdAt: Timestamp;
}

// Form interfaces
export interface CreateTournamentForm {
  title: string;
  description: string;
  gameType: GameType;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  prizeDistribution: PrizeDistribution[];
  rules: string[];
  registrationStart: Date;
  registrationEnd: Date;
  tournamentStart: Date;
  tournamentEnd: Date;
  paymentQR: File | null;
  upiId: string;
  paymentInstructions: string;
  banner: File | null;
  sponsors: Sponsor[];
}

export interface JoinTournamentForm {
  teamId?: string;
  teamName?: string;
  playerGameId: string;
  paymentProof: File | null;
  utr: string;
}

export interface CreateTeamForm {
  name: string;
  gameType: GameType;
  logo: File | null;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Firebase Cloud Function types
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