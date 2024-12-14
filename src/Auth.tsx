import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth: React.FC<{ onRegistrationComplete: () => Promise<void> }> = ({ onRegistrationComplete }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateName = (name: string): boolean => {
        return name.trim().length >= 2 && name.trim().length <= 50;
    };

    const checkEmailExists = async (email: string): Promise<boolean> => {
        const userDocRef = doc(db, 'users', email);
        const userDoc = await getDoc(userDocRef);
        return userDoc.exists();
    };

    const createNewInterview = async (userEmail: string, userName: string) => {
        try {
            const interviewsCollection = collection(db, 'interviews');
            const newInterviewRef = doc(interviewsCollection);
            
            const interviewData = {
                userId: userEmail,
                userName: userName,
                userEmail: userEmail,
                createdAt: new Date(),
                lastUpdated: new Date(),
                currentPhase: 'brand-elements',
                messages: [],
                reports: {}
            };

            await setDoc(newInterviewRef, interviewData);
            return newInterviewRef.id;
        } catch (error) {
            console.error('Error creating interview:', error);
            throw new Error('Failed to create interview');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
    
        try {
            // Input validation
            if (!validateEmail(email)) {
                toast.error('Please enter a valid email address');
                setIsLoading(false);
                return;
            }

            if (!validateName(name)) {
                toast.error('Please enter a valid name (2-50 characters)');
                setIsLoading(false);
                return;
            }

            // Check if email already exists
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                toast.error('This email is already registered');
                setIsLoading(false);
                return;
            }

            // Create user document
            const userDocRef = doc(db, 'users', email);
            await setDoc(userDocRef, {
                name,
                email,
                createdAt: new Date()
            });

            // Create interview document
            const interviewId = await createNewInterview(email, name);

            // Store session data
            sessionStorage.setItem('interviewId', interviewId);
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userName', name);

            toast.success('Registration successful');
            await onRegistrationComplete();
            navigate('/chat');

        } catch (error) {
            console.error('Error during registration:', error);
            toast.error('Failed to create account. Please try again.');
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
                        maxLength={50}
                    />
                </div>
                <div>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
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
                        'Begin Brand Development'
                    )}
                </button>
            </form>
        </div>
    );
};

export default Auth;