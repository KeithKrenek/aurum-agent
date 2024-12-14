import React, { useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!validateEmail(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Check if email already exists
      const usersRef = collection(db, 'users'); console.log('1');
      const q = query(usersRef, where('email', '==', email)); console.log('2');
      const querySnapshot = await getDocs(q); console.log('3');

      if (!querySnapshot.empty) {
        toast.error('This email is already registered');
        return;
      }

      // Create new user document
      const userDoc = await addDoc(collection(db, 'users'), {
        name,
        email,
        createdAt: new Date(),
        hasCompletedInterview: false
      });

      // Create new interview session
      const interviewDoc = await addDoc(collection(db, 'interviews'), {
        userId: userDoc.id,
        userName: name,
        userEmail: email,
        createdAt: new Date(),
        lastUpdated: new Date(),
        currentPhase: 'brand-elements',
        messages: [],
        reports: {}
      });

      // Store interview ID in session storage for temporary access
      sessionStorage.setItem('interviewId', interviewDoc.id);
      sessionStorage.setItem('userName', name);

      toast.success('Registration successful');
      navigate(`/interview/${interviewDoc.id}`);

    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-black">
        Brand Development Journey
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full bg-black hover:bg-dark-gray text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
          type="submit"
          disabled={isLoading || !name || !email}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Processing...
            </span>
          ) : (
            'Begin Brand Alchemy'
          )}
        </button>
      </form>
    </div>
  );
};

export default Auth;