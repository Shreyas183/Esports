import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { 
  User, 
  Team, 
  Tournament, 
  Registration, 
  Match, 
  Bracket, 
  Highlight, 
  Notification, 
  AuditLog,
  CreateTournamentForm,
  CreateTeamForm,
  JoinTournamentForm
} from '@/types';
import { toast } from '@/hooks/use-toast';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  TEAMS: 'teams',
  TOURNAMENTS: 'tournaments',
  REGISTRATIONS: 'registrations',
  MATCHES: 'matches',
  BRACKETS: 'brackets',
  HIGHLIGHTS: 'highlights',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs'
} as const;

// User Service
export class UserService {
  static async getUser(uid: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async updateUser(uid: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async updateUserStats(uid: string, stats: Partial<User['stats']>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(docRef, {
        'stats': stats,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  static async updateGameIds(uid: string, gameIds: User['gameIds']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(docRef, {
        gameIds,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating game IDs:', error);
      throw error;
    }
  }
}

// Team Service
export class TeamService {
  static async createTeam(data: CreateTeamForm, captainId: string, captainName: string): Promise<string> {
    try {
      const teamData: Omit<Team, 'id'> = {
        name: data.name,
        logoURL: '', // Will be updated after upload
        captainId,
        members: [{
          userId: captainId,
          displayName: captainName,
          gameId: '',
          role: 'captain',
          joinedAt: Timestamp.now()
        }],
        gameType: data.gameType,
        stats: {
          tournamentsJoined: 0,
          tournamentsWon: 0,
          totalEarnings: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.TEAMS), teamData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  static async getTeam(teamId: string): Promise<Team | null> {
    try {
      const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Team;
      }
      return null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }

  static async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TEAMS),
        where('members', 'array-contains', { userId }),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  static async updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  static async addTeamMember(teamId: string, member: Team['members'][0]): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
      await updateDoc(docRef, {
        members: [...(await this.getTeam(teamId))?.members || [], member],
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const team = await this.getTeam(teamId);
      if (!team) throw new Error('Team not found');

      const updatedMembers = team.members.filter(member => member.userId !== userId);
      await this.updateTeam(teamId, { members: updatedMembers });
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }
}

// Registration Service
export class RegistrationService {
  static async createRegistration(data: JoinTournamentForm, userId: string, tournamentId: string): Promise<string> {
    try {
      const registrationData: Omit<Registration, 'id'> = {
        tournamentId,
        userId,
        teamId: data.teamId,
        teamName: data.teamName,
        playerGameId: data.playerGameId,
        paymentStatus: 'pending',
        paymentProof: {
          imageURL: '', // Will be updated after upload
          utr: data.utr,
          amount: 0, // Will be set from tournament entry fee
          submittedAt: Timestamp.now()
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.REGISTRATIONS), registrationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }

  static async getRegistration(registrationId: string): Promise<Registration | null> {
    try {
      const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Registration;
      }
      return null;
    } catch (error) {
      console.error('Error fetching registration:', error);
      throw error;
    }
  }

  static async getTournamentRegistrations(tournamentId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REGISTRATIONS),
        where('tournamentId', '==', tournamentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
    } catch (error) {
      console.error('Error fetching tournament registrations:', error);
      throw error;
    }
  }

  static async getUserRegistrations(userId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REGISTRATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      throw error;
    }
  }

  static async updatePaymentStatus(registrationId: string, status: Registration['paymentStatus'], verifiedBy: string, notes?: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
      await updateDoc(docRef, {
        paymentStatus: status,
        verifiedBy,
        verifiedAt: Timestamp.now(),
        notes,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

// Match Service
export class MatchService {
  static async createMatch(matchData: Omit<Match, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MATCHES), {
        ...matchData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  static async getMatch(matchId: string): Promise<Match | null> {
    try {
      const docRef = doc(db, COLLECTIONS.MATCHES, matchId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Match;
      }
      return null;
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  }

  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.MATCHES),
        where('tournamentId', '==', tournamentId),
        orderBy('round', 'asc'),
        orderBy('position', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    } catch (error) {
      console.error('Error fetching tournament matches:', error);
      throw error;
    }
  }

  static async updateMatchResult(matchId: string, winnerId: string, scores: Match['scores']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MATCHES, matchId);
      await updateDoc(docRef, {
        winnerId,
        scores,
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  }
}

// File Upload Service
export class FileUploadService {
  static async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  static async uploadVideo(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Notification Service
export class NotificationService {
  static async createNotification(notificationData: Omit<Notification, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        ...notificationData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

// Audit Log Service
export class AuditLogService {
  static async createAuditLog(logData: Omit<AuditLog, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        ...logData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  static async getAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}

// Real-time listeners
export class RealtimeService {
  static onTournamentUpdate(tournamentId: string, callback: (tournament: Tournament) => void): Unsubscribe {
    const docRef = doc(db, COLLECTIONS.TOURNAMENTS, tournamentId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Tournament);
      }
    });
  }

  static onUserRegistrations(userId: string, callback: (registrations: Registration[]) => void): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.REGISTRATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      callback(registrations);
    });
  }

  static onTournamentMatches(tournamentId: string, callback: (matches: Match[]) => void): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.MATCHES),
      where('tournamentId', '==', tournamentId),
      orderBy('round', 'asc'),
      orderBy('position', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      callback(matches);
    });
  }
}

// Export all services
export {
  UserService,
  TeamService,
  RegistrationService,
  MatchService,
  FileUploadService,
  NotificationService,
  AuditLogService,
  RealtimeService
};
