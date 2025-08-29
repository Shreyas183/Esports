import React from 'react';
import { AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

interface FirebaseWarningProps {
  onDismiss?: () => void;
}

export const FirebaseWarning: React.FC<FirebaseWarningProps> = ({ onDismiss }) => {
  const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY && 
                              import.meta.env.VITE_FIREBASE_PROJECT_ID &&
                              import.meta.env.VITE_FIREBASE_API_KEY !== 'placeholder_api_key';

  if (isFirebaseConfigured) {
    return null;
  }

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <CheckCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Using New-Esports Firebase Project</AlertTitle>
      <AlertDescription className="text-blue-700">
        <div className="space-y-2">
          <p>
            This app is now connected to your new-esports Firebase project. 
            All data will be stored and managed through Firebase. 
            You can test all features including authentication and data persistence!
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/SETUP.md', '_blank')}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View Setup Guide
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-blue-600 hover:bg-blue-100"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default FirebaseWarning;
