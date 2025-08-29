import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GenerateBracketsRequest } from './types';

// Callable function to generate brackets (organizer only)
export const generateBrackets = functions.https.onCall(async (data: GenerateBracketsRequest, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const db = admin.firestore();
  
  try {
    const { tournamentId } = data;
    
    // Get tournament
    const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
    if (!tournamentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tournament not found');
    }
    
    const tournament = tournamentDoc.data();
    
    // Check if caller is organizer or admin
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const callerRole = callerDoc.data()?.role;
    
    if (context.auth.uid !== tournament!.organizerId && callerRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only tournament organizer or admin can generate brackets');
    }
    
    // Check if tournament is in registration phase
    if (tournament!.status !== 'registration') {
      throw new functions.https.HttpsError('failed-precondition', 'Tournament must be in registration phase');
    }
    
    // Get approved registrations
    const registrationsSnapshot = await db.collection('registrations')
      .where('tournamentId', '==', tournamentId)
      .where('paymentStatus', '==', 'approved')
      .get();
    
    if (registrationsSnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'No approved registrations found');
    }
    
    const approvedTeams = registrationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (approvedTeams.length < 2) {
      throw new functions.https.HttpsError('failed-precondition', 'At least 2 approved teams required');
    }
    
    // Generate single elimination bracket
    const bracketTeams = [...approvedTeams];
    
    // Shuffle teams for fairness
    for (let i = bracketTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bracketTeams[i], bracketTeams[j]] = [bracketTeams[j], bracketTeams[i]];
    }
    
    // Pad to next power of 2
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(bracketTeams.length)));
    while (bracketTeams.length < nextPowerOfTwo) {
      bracketTeams.push(null); // Bye
    }
    
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    
    // Create matches for first round
    const matches: any[] = [];
    const totalRounds = Math.log2(nextPowerOfTwo);
    
    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      
      for (let position = 0; position < matchesInRound; position++) {
        const matchId = db.collection('matches').doc().id;
        
        let match: any = {
          id: matchId,
          tournamentId,
          round,
          position,
          status: 'upcoming',
          createdAt: now,
          updatedAt: now
        };
        
        // First round - assign teams
        if (round === 1) {
          const team1Index = position * 2;
          const team2Index = position * 2 + 1;
          
          const team1 = bracketTeams[team1Index];
          const team2 = bracketTeams[team2Index];
          
          if (team1) {
            match.team1Id = team1.teamId || team1.userId;
            match.team1Name = team1.teamName || team1.playerGameId;
          }
          
          if (team2) {
            match.team2Id = team2.teamId || team2.userId;
            match.team2Name = team2.teamName || team2.playerGameId;
          }
          
          // Handle byes
          if (!team1 && team2) {
            match.winnerId = team2.teamId || team2.userId;
            match.winnerName = team2.teamName || team2.playerGameId;
            match.status = 'completed';
          } else if (team1 && !team2) {
            match.winnerId = team1.teamId || team1.userId;
            match.winnerName = team1.teamName || team1.playerGameId;
            match.status = 'completed';
          }
        }
        
        matches.push(match);
        batch.set(db.collection('matches').doc(matchId), match);
      }
    }
    
    // Create bracket document
    const bracketId = db.collection('brackets').doc().id;
    const bracket = {
      id: bracketId,
      tournamentId,
      type: 'single_elimination',
      rounds: Array.from({ length: totalRounds }, (_, i) => ({
        roundNumber: i + 1,
        matches: matches
          .filter(m => m.round === i + 1)
          .map(m => m.id)
      })),
      isLocked: true,
      createdAt: now,
      updatedAt: now
    };
    
    batch.set(db.collection('brackets').doc(bracketId), bracket);
    
    // Update tournament status
    batch.update(db.collection('tournaments').doc(tournamentId), {
      status: 'live',
      updatedAt: now
    });
    
    // Write audit log
    batch.set(db.collection('auditLogs').doc(), {
      userId: context.auth.uid,
      userDisplayName: callerDoc.data()?.displayName || 'Unknown',
      action: 'brackets_generated',
      resourceType: 'tournament',
      resourceId: tournamentId,
      newValue: { 
        bracketId, 
        totalTeams: approvedTeams.length,
        totalMatches: matches.length 
      },
      createdAt: now
    });
    
    // Commit batch
    await batch.commit();
    
    console.log(`Brackets generated for tournament ${tournamentId} with ${approvedTeams.length} teams`);
    
    return { 
      success: true, 
      message: 'Brackets generated successfully',
      data: {
        bracketId,
        totalTeams: approvedTeams.length,
        totalMatches: matches.length
      }
    };
  } catch (error) {
    console.error('Error generating brackets:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to generate brackets');
  }
});