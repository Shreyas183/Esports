// Environment variable validation and typing
interface EnvironmentVariables {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
  VITE_FIREBASE_VAPID_KEY?: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_APP_ENV: 'development' | 'production' | 'test';
  VITE_USE_EMULATORS?: string;
}

// Validate environment variables
const validateEnv = (): EnvironmentVariables => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  return {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    VITE_FIREBASE_VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'EsportsPro',
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    VITE_APP_ENV: (import.meta.env.VITE_APP_ENV as EnvironmentVariables['VITE_APP_ENV']) || 'development',
    VITE_USE_EMULATORS: import.meta.env.VITE_USE_EMULATORS,
  };
};

// Export validated environment variables
export const env = validateEnv();

// Environment helper functions
export const isDevelopment = () => env.VITE_APP_ENV === 'development';
export const isProduction = () => env.VITE_APP_ENV === 'production';
export const isTest = () => env.VITE_APP_ENV === 'test';

export const shouldUseEmulators = () => 
  isDevelopment() && env.VITE_USE_EMULATORS === 'true';

// Firebase config helper
export const getFirebaseConfig = () => {
  const config: any = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  
  // Only add measurementId if it exists
  if (env.VITE_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;
  }
  
  return config;
};

export default env;
