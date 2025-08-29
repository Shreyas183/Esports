import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { VerifyPaymentRequest } from './types';

// Callable function to verify payment (organizer only)
export const verifyPayment = functions.https.onCall(async (data: VerifyPaymentRequest, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const db = admin.firestore();
  
  try {
    const { registrationId, approved, notes } = data;
    
    // Get registration document
    const registrationDoc = await db.collection('registrations').doc(registrationId).get();
    if (!registrationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Registration not found');
    }
    
    const registration = registrationDoc.data();
    
    // Get tournament to check organizer
    const tournamentDoc = await db.collection('tournaments').doc(registration!.tournamentId).get();
    if (!tournamentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tournament not found');
    }
    
    const tournament = tournamentDoc.data();
    
    // Check if caller is organizer or admin
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const callerRole = callerDoc.data()?.role;
    
    if (context.auth.uid !== tournament!.organizerId && callerRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only tournament organizer or admin can verify payments');
    }
    
    const now = admin.firestore.FieldValue.serverTimestamp();
    const newStatus = approved ? 'approved' : 'rejected';
    
    // Update registration
    const updateData: any = {
      paymentStatus: newStatus,
      verifiedBy: context.auth.uid,
      verifiedAt: now,
      updatedAt: now
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    await db.collection('registrations').doc(registrationId).update(updateData);
    
    // Create notification for player
    await db.collection('notifications').add({
      userId: registration!.userId,
      title: `Payment ${approved ? 'Approved' : 'Rejected'}`,
      message: approved 
        ? `Your payment for "${tournament!.title}" has been approved!` 
        : `Your payment for "${tournament!.title}" has been rejected. ${notes || ''}`,
      type: approved ? 'payment_approved' : 'payment_rejected',
      data: {
        tournamentId: registration!.tournamentId,
        registrationId
      },
      read: false,
      createdAt: now
    });
    
    // Write audit log
    await db.collection('auditLogs').add({
      userId: context.auth.uid,
      userDisplayName: callerDoc.data()?.displayName || 'Unknown',
      action: 'payment_verified',
      resourceType: 'registration',
      resourceId: registrationId,
      oldValue: { paymentStatus: registration!.paymentStatus },
      newValue: { paymentStatus: newStatus, notes },
      createdAt: now
    });
    
    // Send FCM notification (if user has token)
    const userDoc = await db.collection('users').doc(registration!.userId).get();
    if (userDoc.exists && userDoc.data()?.fcmToken) {
      try {
        await admin.messaging().send({
          token: userDoc.data()!.fcmToken,
          notification: {
            title: `Payment ${approved ? 'Approved' : 'Rejected'}`,
            body: approved 
              ? `Your payment for "${tournament!.title}" has been approved!` 
              : `Your payment for "${tournament!.title}" has been rejected.`
          },
          data: {
            type: approved ? 'payment_approved' : 'payment_rejected',
            tournamentId: registration!.tournamentId,
            registrationId
          }
        });
      } catch (fcmError) {
        console.error('Error sending FCM notification:', fcmError);
        // Don't fail the function if FCM fails
      }
    }
    
    console.log(`Payment ${approved ? 'approved' : 'rejected'} for registration ${registrationId}`);
    
    return { 
      success: true, 
      message: `Payment ${approved ? 'approved' : 'rejected'} successfully` 
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify payment');
  }
});