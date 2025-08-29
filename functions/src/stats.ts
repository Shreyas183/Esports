import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Trigger to recalculate stats when match is finalized
export const recalcStats = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only proceed if match was just completed
    if (before.status !== 'completed' && after.status === 'completed' && after.winnerId) {
      const db = admin.firestore();
      
      try {
        const matchId = context.params.matchId;
        const match = after;
        
        // Get tournament data
        const tournamentDoc = await db.collection('tournaments').doc(match.tournamentId).get();
        if (!tournamentDoc.exists) {
          console.error('Tournament not found for match:', matchId);
          return;
        }
        
        const tournament = tournamentDoc.data();
        
        // Get bracket to check if this is the final match
        const bracketSnapshot = await db.collection('brackets')
          .where('tournamentId', '==', match.tournamentId)
          .limit(1)
          .get();
        
        if (bracketSnapshot.empty) {
          console.error('Bracket not found for tournament:', match.tournamentId);
          return;
        }
        
        const bracket = bracketSnapshot.docs[0].data();
        const finalRound = Math.max(...bracket.rounds.map((r: any) => r.roundNumber));
        const isFinalMatch = match.round === finalRound;
        
        const batch = db.batch();
        
        // Update winner stats
        if (match.winnerId) {
          // Check if winner is a team or individual
          if (match.winnerId.startsWith('team_')) {
            // Update team stats
            const teamDoc = await db.collection('teams').doc(match.winnerId).get();
            if (teamDoc.exists) {
              const teamStats = teamDoc.data()?.stats || {
                tournamentsJoined: 0,
                tournamentsWon: 0,
                totalEarnings: 0
              };
              
              // If this is the final match, increment tournaments won and add earnings
              if (isFinalMatch) {
                teamStats.tournamentsWon += 1;
                teamStats.totalEarnings += tournament!.prizePool * (tournament!.prizeDistribution[0]?.percentage || 0) / 100;
              }
              
              batch.update(db.collection('teams').doc(match.winnerId), {
                stats: teamStats,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              
              // Update individual team member stats
              const team = teamDoc.data();
              for (const member of team?.members || []) {
                const userDoc = await db.collection('users').doc(member.userId).get();
                if (userDoc.exists) {
                  const userStats = userDoc.data()?.stats || {
                    tournamentsJoined: 0,
                    tournamentsWon: 0,
                    totalEarnings: 0
                  };
                  
                  if (isFinalMatch) {
                    userStats.tournamentsWon += 1;
                    userStats.totalEarnings += tournament!.prizePool * (tournament!.prizeDistribution[0]?.percentage || 0) / 100 / (team?.members?.length || 1);
                  }
                  
                  batch.update(db.collection('users').doc(member.userId), {
                    stats: userStats,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                }
              }
            }
          } else {
            // Update individual user stats
            const userDoc = await db.collection('users').doc(match.winnerId).get();
            if (userDoc.exists) {
              const userStats = userDoc.data()?.stats || {
                tournamentsJoined: 0,
                tournamentsWon: 0,
                totalEarnings: 0
              };
              
              if (isFinalMatch) {
                userStats.tournamentsWon += 1;
                userStats.totalEarnings += tournament!.prizePool * (tournament!.prizeDistribution[0]?.percentage || 0) / 100;
              }
              
              batch.update(db.collection('users').doc(match.winnerId), {
                stats: userStats,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
        
        // If this is the final match, update tournament status
        if (isFinalMatch) {
          batch.update(db.collection('tournaments').doc(match.tournamentId), {
            status: 'completed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Create notifications for all participants
          const registrationsSnapshot = await db.collection('registrations')
            .where('tournamentId', '==', match.tournamentId)
            .where('paymentStatus', '==', 'approved')
            .get();
          
          for (const regDoc of registrationsSnapshot.docs) {
            const registration = regDoc.data();
            
            batch.set(db.collection('notifications').doc(), {
              userId: registration.userId,
              title: 'Tournament Completed',
              message: `"${tournament!.title}" has been completed! Check the results.`,
              type: 'result_posted',
              data: {
                tournamentId: match.tournamentId,
                winnerId: match.winnerId,
                winnerName: match.winnerName
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        
        // Advance winner to next round if not final
        if (!isFinalMatch) {
          const nextRound = match.round + 1;
          const nextPosition = Math.floor(match.position / 2);
          
          // Find the next match
          const nextMatchSnapshot = await db.collection('matches')
            .where('tournamentId', '==', match.tournamentId)
            .where('round', '==', nextRound)
            .where('position', '==', nextPosition)
            .limit(1)
            .get();
          
          if (!nextMatchSnapshot.empty) {
            const nextMatchDoc = nextMatchSnapshot.docs[0];
            const nextMatch = nextMatchDoc.data();
            
            // Determine if winner goes to team1 or team2 slot
            const isEvenPosition = match.position % 2 === 0;
            const updateField = isEvenPosition ? 'team1' : 'team2';
            
            batch.update(nextMatchDoc.ref, {
              [`${updateField}Id`]: match.winnerId,
              [`${updateField}Name`]: match.winnerName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        
        // Write audit log
        batch.set(db.collection('auditLogs').doc(), {
          userId: 'system',
          userDisplayName: 'System',
          action: 'stats_recalculated',
          resourceType: 'match',
          resourceId: matchId,
          newValue: { 
            matchCompleted: true,
            winnerId: match.winnerId,
            isFinalMatch 
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Commit all updates
        await batch.commit();
        
        console.log(`Stats recalculated for match ${matchId}, winner: ${match.winnerId}, final: ${isFinalMatch}`);
      } catch (error) {
        console.error('Error recalculating stats:', error);
      }
    }
  });