import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
            <ShieldAlert className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Security Attack Analyzer
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              JSON-Based Security Assessment & Attack Simulation Platform
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
