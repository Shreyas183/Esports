import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { 
  GenerateBracketsRequest, 
  VerifyPaymentRequest, 
  SetCustomClaimsRequest,
  APIResponse 
} from '@/types';

// Cloud Function helpers
export const generateBrackets = httpsCallable<GenerateBracketsRequest, APIResponse>(
  functions, 
  'generateBrackets'
);

export const verifyPayment = httpsCallable<VerifyPaymentRequest, APIResponse>(
  functions, 
  'verifyPayment'
);

export const setCustomClaims = httpsCallable<SetCustomClaimsRequest, APIResponse>(
  functions, 
  'setCustomClaims'
);

// Helper function to call cloud functions with error handling
export const callCloudFunction = async <T, R>(
  func: (data: T) => Promise<{ data: R }>,
  data: T
): Promise<R> => {
  try {
    const result = await func(data);
    return result.data;
  } catch (error: any) {
    console.error('Cloud function error:', error);
    throw new Error(error.message || 'Function call failed');
  }
};