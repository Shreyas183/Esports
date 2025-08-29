import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Scheduled function to reveal room credentials before matches
export const timeGateRoomCreds = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const revealTime = new Date(now.toDate().getTime() - 15 * 60 * 1000); // 15 minutes before
    
    try {
      // Find tournaments with room credentials that should be revealed
      const tournamentsSnapshot = await db.collection('tournaments')
        .where('status', '==', 'live')
        .where('room.visibleFrom', '<=', admin.firestore.Timestamp.fromDate(revealTime))
        .get();
      
      const batch = db.batch();
      const notifications: any[] = [];
      
      for (const tournamentDoc of tournamentsSnapshot.docs) {
        const tournament = tournamentDoc.data();
        
        if (tournament.room && !tournament.room.revealed) {
          // Mark room as revealed
          batch.update(tournamentDoc.ref, {
            'room.revealed': true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Get all registered players for this tournament
          const registrationsSnapshot = await db.collection('registrations')
            .where('tournamentId', '==', tournamentDoc.id)
            .where('paymentStatus', '==', 'approved')
            .get();
          
          // Create notifications for all registered players
          for (const regDoc of registrationsSnapshot.docs) {
            const registration = regDoc.data();
            
            notifications.push({
              userId: registration.userId,
              title: 'Room Credentials Available',
              message: `Room credentials for "${tournament.title}" are now available!`,
              type: 'match_start',
              data: {
                tournamentId: tournamentDoc.id,
                roomId: tournament.room.id,
                roomPassword: tournament.room.password
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
      
      // Commit tournament updates
      if (!batch.isEmpty) {
        await batch.commit();
      }
      
      // Create notifications
      for (const notification of notifications) {
        await db.collection('notifications').add(notification);
        
        // Send FCM notification
        try {
          const userDoc = await db.collection('users').doc(notification.userId).get();
          if (userDoc.exists && userDoc.data()?.fcmToken) {
            await admin.messaging().send({
              token: userDoc.data()!.fcmToken,
              notification: {
                title: notification.title,
                body: notification.message
              },
              data: notification.data
            });
          }
        } catch (fcmError) {
          console.error('Error sending FCM notification:', fcmError);
        }
      }
      
      console.log(`Processed ${tournamentsSnapshot.size} tournaments, sent ${notifications.length} notifications`);
    } catch (error) {
      console.error('Error in timeGateRoomCreds:', error);
    }
  });