import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader } from 'lucide-react';

const Auth: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        toast.error('This email is already registered. Please try a different one.');
      } else {
        // Save new user to Firestore
        await setDoc(userRef, {
          name,
          email,
          createdAt: new Date(),
        });
        toast.success('Welcome! Your details have been saved.');
        navigate('/chat'); // Redirect to chat after registration
      }
    } catch (error) {
      console.error('Error handling authentication:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-black">Welcome to Aurum Agent</h1>

      <form onSubmit={handleAuth} className="space-y-4">
        {/* Name Input */}
        <div>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Email Input */}
        <div>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            className="w-full bg-black hover:bg-dark-gray text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Saving...
              </span>
            ) : (
              'Start Alchemy'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;
