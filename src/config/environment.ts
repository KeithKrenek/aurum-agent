// src/config/environment.ts

interface EnvironmentConfig {
    openai: {
      apiKey: string;
      assistantId: string;
    };
    firebase: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      measurementId: string;
    };
  }
  
  const requireEnvVar = (name: string): string => {
    const value = import.meta.env[name];
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  };
  
  export const config: EnvironmentConfig = {
    openai: {
      apiKey: requireEnvVar('VITE_OPENAI_API_KEY'),
      assistantId: requireEnvVar('VITE_OPENAI_ASSISTANT_ID')
    },
    firebase: {
      apiKey: requireEnvVar('VITE_FIREBASE_API_KEY'),
      authDomain: requireEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: requireEnvVar('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: requireEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: requireEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: requireEnvVar('VITE_FIREBASE_APP_ID'),
      measurementId: requireEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
    }
  };