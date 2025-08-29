import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SetCustomClaimsRequest, UserRole } from './types';

// Callable function to set custom claims (admin only)
export const setCustomClaims = functions.https.onCall(async (data: SetCustomClaimsRequest, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const db = admin.firestore();
  
  // Check if caller is admin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set custom claims');
  }
  
  try {
    const { uid, role } = data;
    
    // Validate role
    const validRoles: UserRole[] = ['viewer', 'player', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid role specified');
    }
    
    // Get target user
    const targetUserDoc = await db.collection('users').doc(uid).get();
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const oldValue = targetUserDoc.data();
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Update user document
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(uid).update({
      role,
      updatedAt: now
    });
    
    // Write audit log
    await db.collection('auditLogs').add({
      userId: context.auth.uid,
      userDisplayName: callerDoc.data()?.displayName || 'Admin',
      action: 'role_updated',
      resourceType: 'user',
      resourceId: uid,
      oldValue: { role: oldValue?.role },
      newValue: { role },
      createdAt: now
    });
    
    console.log(`Role updated for user ${uid}: ${oldValue?.role} -> ${role}`);
    
    return { success: true, message: 'Role updated successfully' };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update role');
  }
});