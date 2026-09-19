import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileJson, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { UploadResponse } from '../services/api';
import axios from 'axios';

interface UploadPanelProps {
  onUploadSuccess: (metadata: UploadResponse) => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Validating report...");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Crucial for React 18 Strict Mode: reset to true on mount
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.json')) {
      setError('Only .json files are supported.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a JSON report.');
      return;
    }

    setLoading(true);
    setError(null);
    setElapsed(0);
    setStatusMessage("Validating report...");

    const startTime = Date.now();

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        // Calculate exact elapsed seconds (resilient to React rendering delays)
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(currentElapsed);
        
        if (currentElapsed < 10) setStatusMessage("Validating report...");
        else if (currentElapsed < 20) setStatusMessage("Analyzing security evidence...");
        else if (currentElapsed < 30) setStatusMessage("Preparing assessment results...");
        else setStatusMessage("Finalizing...");
      }
    }, 1000);

    const controller = new AbortController();
    // Exactly 60 seconds absolute maximum timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await api.uploadReport(file, controller.signal);
      
      const timeTaken = Date.now() - startTime;
      const remainingWait = 30000 - timeTaken;

      // Ensure minimum 30-second delay measured accurately from start
      if (remainingWait > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingWait));
      }
      
      if (isMountedRef.current) {
        onUploadSuccess(response as UploadResponse);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (axios.isCancel(err) || err.code === 'ERR_CANCELED') {
        setError('Analysis timed out after 60 seconds. Please try again.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error') {
        setError('Unable to connect to the analysis server.');
      } else {
        setError('An unexpected error occurred during upload.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const progress = Math.min(99, Math.floor((elapsed / 30) * 100));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg shadow-black/20">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Upload Security Report</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Upload a JSON report generated by the vulnerability assessment engine.
        </p>

        {loading ? (
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-800/50">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-6" />
            <h3 className="text-lg font-semibold text-white mb-2">ANALYZING SECURITY REPORT</h3>
            <p className="text-slate-400 text-sm mb-4">{statusMessage}</p>
            
            <div className="w-64 bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between w-64 text-xs text-slate-500">
              <span>{progress}%</span>
              <span>{elapsed}s elapsed</span>
            </div>
          </div>
        ) : (
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            
            {!file ? (
              <>
                <UploadCloud className={`h-12 w-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
                <p className="text-slate-300 font-medium mb-1">
                  {isDragging ? 'Drop JSON file here' : 'Click to browse or drag and drop'}
                </p>
                <p className="text-slate-500 text-sm">JSON report files only</p>
                <button className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Choose JSON Report
                </button>
              </>
            ) : (
              <>
                <FileJson className="h-12 w-12 text-blue-500 mb-4" />
                <p className="text-white font-medium mb-1 truncate max-w-xs">{file.name}</p>
                <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(2)} KB • JSON File</p>
                <button 
                  className="mt-4 px-4 py-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-lg text-xs transition-colors"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
                >
                  Change File
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-6 py-2.5 rounded-lg font-medium flex items-center justify-center min-w-[140px] transition-all
              ${!file || loading 
                ? 'bg-blue-600/50 text-white/50 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
          >
            {loading ? (
              <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Analyzing...</>
            ) : (
              'Analyze Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
