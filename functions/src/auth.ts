import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRole } from './types';

// Trigger when a new user is created
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    // Create user document in Firestore
    const userData = {
      email: user.email!,
      displayName: user.displayName || 'Anonymous User',
      photoURL: user.photoURL || null,
      role: 'player' as UserRole,
      gameIds: {
        BGMI: '',
        FREE_FIRE: ''
      },
      stats: {
        tournamentsJoined: 0,
        tournamentsWon: 0,
        totalEarnings: 0
      },
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('users').doc(user.uid).set(userData);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: 'player' });
    
    // Write audit log
    await db.collection('auditLogs').add({
      userId: user.uid,
      userDisplayName: userData.displayName,
      action: 'user_created',
      resourceType: 'user',
      resourceId: user.uid,
      newValue: userData,
      createdAt: now
    });
    
    console.log(`User created: ${user.uid} with role: player`);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user');
  }
});