import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportDownloadProps {
  phase: string;
  onDownload: () => Promise<void>;
}

const ReportDownload: React.FC<ReportDownloadProps> = ({
  phase,
  onDownload
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await onDownload();
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-center my-4 p-4 bg-bone rounded-lg">
      <div className="text-dark-gray">
        <h4 className="font-bold mb-2">
          {phase === 'complete' ? 'Final Brand Report' : `${phase} Report`} Ready
        </h4>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-gray text-white rounded hover:bg-black transition-colors"
        >
          {isDownloading ? (
            <Loader className="animate-spin h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Report
        </button>
      </div>
    </div>
  );
};

export default ReportDownload;