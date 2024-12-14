import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ReactGA from 'react-ga4';
import Header from './Header';
import Footer from './Footer';
import Chat from './Chat';
import Auth from './Auth';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Initialize Google Analytics only if measurement ID is available
const GA_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

interface UserDetails {
  name: string;
  email: string;
  createdAt: Date;
  currentInterviewId?: string;
}

interface AppContentProps {
  userDetails: UserDetails | null;
  refreshUserDetails: () => Promise<void>;
}

function App() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserDetails = async () => {
    setLoading(true);
    const sessionId = sessionStorage.getItem('interviewId');
    const userEmail = sessionStorage.getItem('userEmail');
    const userName = sessionStorage.getItem('userName');
    
    if (sessionId && userEmail && userName) {
      try {
        const interviewDoc = await getDoc(doc(db, 'interviews', sessionId));
        if (interviewDoc.exists() && interviewDoc.data().userEmail === userEmail) {
          setUserDetails({
            name: userName,
            email: userEmail,
            createdAt: interviewDoc.data().createdAt.toDate(),
            currentInterviewId: sessionId
          });
        } else {
          clearSessionData();
        }
      } catch (error) {
        console.error('Error fetching interview details:', error);
        clearSessionData();
      }
    }
    setLoading(false);
  };

  const clearSessionData = () => {
    sessionStorage.removeItem('interviewId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    setUserDetails(null);
  };

  useEffect(() => {
    checkUserDetails();
  }, []);

  // Make checkUserDetails available to child components
  const contextValue = {
    userDetails,
    refreshUserDetails: checkUserDetails
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppContent userDetails={userDetails} refreshUserDetails={checkUserDetails} />
      </Router>
    </ErrorBoundary>
  );
}

const AppContent: React.FC<AppContentProps> = ({ userDetails, refreshUserDetails }) => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header user={userDetails} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route 
            path="/auth" 
            element={!userDetails ? <Auth onRegistrationComplete={refreshUserDetails} /> : <Navigate to="/chat" replace />} 
          />
          <Route
            path="/chat"
            element={userDetails ? <Chat /> : <Navigate to="/auth" replace />}
          />
          <Route path="*" element={<Navigate to={userDetails ? '/chat' : '/auth'} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;