import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const BrandEntry: React.FC = () => {
    const [brandName, setBrandName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
    
        try {
            if (!brandName.trim()) {
                throw new Error('Brand name is required');
            }
            
            // Create interview document in Firestore
            const interviewsCollection = collection(db, 'interviews');
            const newInterviewRef = doc(interviewsCollection);
            
            const interviewData = {
                brandName: brandName.trim(),
                threadId: null, // threadId to be set later in Chat.tsx
                createdAt: new Date(),
                lastUpdated: new Date(),
                currentPhase: 'discovery',
                messages: [],
                reports: {}
            };

            await setDoc(newInterviewRef, interviewData);

            // Store interview ID and brand name in sessionStorage
            sessionStorage.setItem('interviewId', newInterviewRef.id);
            sessionStorage.setItem('brandName', brandName.trim());

            console.log('Interview created:', {
                interviewId: newInterviewRef.id,
                brandName: brandName.trim(),
                threadId: null
            });

            // Navigate to chat
            navigate(`/chat/${newInterviewRef.id}`);

        } catch (error) {
            console.error('Error creating interview:', error);
            toast.error('Failed to start brand development session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-6 p-4 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-black">
                Aurum Agent
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
                        type="text"
                        placeholder="Your Brand Name"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        required
                    />
                </div>
                <button
                    className="w-full bg-black hover:bg-dark-gray text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                    type="submit"
                    disabled={isLoading || !brandName.trim()}
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

export default BrandEntry;