import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  icon?: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children
}) => {
  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden mt-6 transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3 text-white">
          {Icon && <Icon className="h-6 w-6 text-blue-400" />}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </div>
      </button>
      
      <div 
        className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-6 border-t border-slate-700/50">
          {children}
        </div>
      </div>
    </div>
  );
};
