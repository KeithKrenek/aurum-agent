import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { generatePDF } from './pdfGenerator';
import { Loader, FileDown } from 'lucide-react';

const Report: React.FC = () => {
  const [reportParts, setReportParts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      const userEmail = localStorage.getItem('email');
      if (!userEmail) {
        toast.error('User details are missing. Redirecting to registration...');
        navigate('/auth');
        return;
      }

      try {
        const userRef = doc(db, 'users', userEmail);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          toast.error('User data not found. Redirecting to registration...');
          navigate('/auth');
          return;
        }

        const userData = userDoc.data();
        const parts = [];
        for (let i = 1; i <= 3; i++) {
          const reportPart = userData[`assistant${i}Report`];
          if (reportPart) {
            parts.push(reportPart);
          } else {
            parts.push(`Assistant ${i} did not provide a report.`);
          }
        }
        setReportParts(parts);
        setError(null);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to fetch reports. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const downloadPDF = async () => {
    setIsPdfLoading(true);
    try {
      const combinedReport = reportParts.join('\n\n'); // Combine all parts into one string

      await generatePDF({
        report: combinedReport,
      });

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-4xl font-extrabold mb-6 text-black">Combined Report</h1>

      {isLoading ? (
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 mb-4 mx-auto" />
          <p>Loading your report...</p>
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-neutral-gray">
          {reportParts.map((part, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-2xl font-bold mb-4 text-dark-gray">
                Assistant {index + 1}
              </h2>
              <p className="text-dark-gray">{part}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={downloadPDF}
        disabled={isPdfLoading || isLoading}
        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-dark-gray transition duration-300 flex items-center mt-6 disabled:bg-neutral-gray"
      >
        {isPdfLoading ? (
          <>
            <Loader className="animate-spin mr-2" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileDown className="mr-2" />
            Download PDF
          </>
        )}
      </button>
    </div>
  );
};

export default Report;
