import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
import { onUserCreate } from './auth';
import { setCustomClaims } from './admin';
import { generateBrackets } from './brackets';
import { verifyPayment } from './payments';
import { timeGateRoomCreds } from './scheduler';
import { recalcStats } from './stats';

// Export all functions
export {
  onUserCreate,
  setCustomClaims,
  generateBrackets,
  verifyPayment,
  timeGateRoomCreds,
  recalcStats
};