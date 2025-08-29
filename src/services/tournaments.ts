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
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { Tournament, Registration, Match, Bracket, CreateTournamentForm } from '@/types';
import { toast } from '@/hooks/use-toast';

// Tournament service class
export class TournamentService {
  private static readonly COLLECTION = 'tournaments';
  private static readonly REGISTRATIONS_COLLECTION = 'registrations';
  private static readonly MATCHES_COLLECTION = 'matches';
  private static readonly BRACKETS_COLLECTION = 'brackets';

  // Get all tournaments
  static async getAllTournaments(): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get tournaments by status
  static async getTournamentsByStatus(status: Tournament['status']): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    } catch (error) {
      console.error('Error fetching tournaments by status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get tournaments by organizer
  static async getTournamentsByOrganizer(organizerId: string): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('organizerId', '==', organizerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    } catch (error) {
      console.error('Error fetching organizer tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your tournaments",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get featured tournaments
  static async getFeaturedTournaments(limitCount: number = 5): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    } catch (error) {
      console.error('Error fetching featured tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch featured tournaments",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get single tournament
  static async getTournament(id: string): Promise<Tournament | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Tournament;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament details",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Create tournament
  static async createTournament(data: CreateTournamentForm, organizerId: string, organizerName: string): Promise<string> {
    try {
      const tournamentData: Omit<Tournament, 'id'> = {
        title: data.title,
        description: data.description,
        gameType: data.gameType,
        organizerId,
        organizerName,
        status: 'draft',
        featured: false,
        maxTeams: data.maxTeams,
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        prizeDistribution: data.prizeDistribution,
        rules: data.rules,
        schedule: {
          registrationStart: Timestamp.fromDate(data.registrationStart),
          registrationEnd: Timestamp.fromDate(data.registrationEnd),
          tournamentStart: Timestamp.fromDate(data.tournamentStart),
          tournamentEnd: Timestamp.fromDate(data.tournamentEnd)
        },
        paymentInfo: {
          qrCodeURL: '', // Will be updated after upload
          upiId: data.upiId,
          instructions: data.paymentInstructions
        },
        sponsors: data.sponsors || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), tournamentData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Update tournament
  static async updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Delete tournament
  static async deleteTournament(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get tournament registrations
  static async getTournamentRegistrations(tournamentId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, this.REGISTRATIONS_COLLECTION),
        where('tournamentId', '==', tournamentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
    } catch (error) {
      console.error('Error fetching tournament registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get tournament matches
  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    try {
      const q = query(
        collection(db, this.MATCHES_COLLECTION),
        where('tournamentId', '==', tournamentId),
        orderBy('round', 'asc'),
        orderBy('position', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    } catch (error) {
      console.error('Error fetching tournament matches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch matches",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Get tournament bracket
  static async getTournamentBracket(tournamentId: string): Promise<Bracket | null> {
    try {
      const q = query(
        collection(db, this.BRACKETS_COLLECTION),
        where('tournamentId', '==', tournamentId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Bracket;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tournament bracket:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bracket",
        variant: "destructive"
      });
      throw error;
    }
  }
}

// Export default instance
export default TournamentService;
