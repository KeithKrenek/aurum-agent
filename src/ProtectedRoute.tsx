// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Interview } from './types/interview';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const { interviewId } = useParams();
  
  useEffect(() => {
    const validateSession = async () => {
      try {
        const storedInterviewId = sessionStorage.getItem('interviewId');
        
        // Check if interviewId exists in session storage and matches URL parameter
        if (!storedInterviewId || storedInterviewId !== interviewId) {
          setIsValidSession(false);
          return;
        }

        // Verify interview exists in database
        const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
        if (!interviewDoc.exists()) {
          setIsValidSession(false);
          return;
        }

        const interview = interviewDoc.data() as Interview;
        
        // Validate interview is active
        if (interview.currentPhase === 'complete' && !window.location.pathname.includes('/report')) {
          setIsValidSession(false);
          return;
        }

        setIsValidSession(true);
      } catch (error) {
        console.error('Session validation error:', error);
        setIsValidSession(false);
      }
    };

    validateSession();
  }, [interviewId]);

  if (isValidSession === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-gray"></div>
      </div>
    );
  }

  return isValidSession ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
};