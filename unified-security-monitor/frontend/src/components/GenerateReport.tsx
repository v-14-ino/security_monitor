import React, { useState } from 'react';
import { FileJson, FileText, CheckCircle } from 'lucide-react';
import { type UploadResponse } from '../services/api';
import { generateJSONReport, generatePDFReport } from '../services/reportGenerator';

interface GenerateReportProps {
  metadata: UploadResponse;
}

export const GenerateReport: React.FC<GenerateReportProps> = ({ metadata }) => {
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerateJSON = () => {
    try {
      generateJSONReport(metadata);
      showMessage("JSON report generated successfully!");
    } catch (error) {
      console.error("Error generating JSON report:", error);
      showMessage("Failed to generate JSON report.");
    }
  };

  const handleGeneratePDF = () => {
    try {
      generatePDFReport(metadata);
      showMessage("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF report:", error);
      showMessage("Failed to generate PDF report.");
    }
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleGenerateJSON}
          disabled={!metadata}
          className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white py-3 px-6 rounded-lg transition-colors cursor-pointer"
        >
          <FileJson className="h-5 w-5" />
          <span className="font-semibold">GENERATE JSON REPORT</span>
        </button>
        <button
          onClick={handleGeneratePDF}
          disabled={!metadata}
          className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white py-3 px-6 rounded-lg transition-colors cursor-pointer"
        >
          <FileText className="h-5 w-5" />
          <span className="font-semibold">GENERATE PDF REPORT</span>
        </button>
      </div>
      
      {message && (
        <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};
