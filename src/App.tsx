import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ReactGA from 'react-ga4';
import Header from './Header';
import Footer from './Footer';
import Chat from './Chat';
import Report from './Report';
import Auth from './Auth';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Initialize Google Analytics
ReactGA.initialize('G-0YYN1T7X1M'); // Replace with your actual GA4 Measurement ID

interface UserDetails {
  // Define the structure of your user details here
  email: string;
  name: string;
  // Add other fields as necessary
}

function App() {
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserDetails = async () => {
      setLoading(true);
      const storedEmail = localStorage.getItem('email');
      if (storedEmail) {
        try {
          const userDoc = await getDoc(doc(db, 'users', storedEmail));
          if (userDoc.exists()) {
            setUserDetails(userDoc.data() as UserDetails);
          } else {
            localStorage.removeItem('email');
            setUserDetails(null);
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
      setLoading(false);
    };

    checkUserDetails();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppContent userDetails={userDetails} />
      </Router>
    </ErrorBoundary>
  );
}

// Separate component to use useLocation hook
interface AppContentProps {
  userDetails: UserDetails | null;
}

const AppContent: React.FC<AppContentProps> = ({ userDetails }) => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header user={userDetails} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/auth" element={!userDetails ? <Auth /> : <Navigate to="/chat" replace />} />
          <Route
            path="/chat"
            element={userDetails ? <Chat /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/report/:interviewId"
            element={userDetails ? <Report /> : <Navigate to="/auth" replace />}
          />
          <Route path="*" element={<Navigate to={userDetails ? '/chat' : '/auth'} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
