import React from 'react';
import { Target, Clock, Calendar, Hash, Server, Globe, Shield } from 'lucide-react';
import type { ReportMetadata } from '../services/api';

interface ReportPreviewProps {
  metadata: ReportMetadata;
}

const InfoCard = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 flex items-start space-x-4">
    <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
      <Icon className="h-5 w-5 text-blue-400" />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">{label}</p>
      <p className="text-white font-medium">{value || 'N/A'}</p>
    </div>
  </div>
);

const StatusCard = ({ icon: Icon, label, status }: { icon: any, label: string, status: boolean | string }) => {
  const isAvailable = status === true || status === 'Available';
  const isNeutral = status === 'No CVEs Found';
  const displayStatus = typeof status === 'boolean' ? (status ? 'Available' : 'Not Available') : status;

  let bgClass = 'bg-slate-800/30 border-slate-700/30';
  let iconClass = 'text-slate-500';
  let textClass = 'text-slate-400';
  let badgeBg = 'bg-slate-700/50';
  let badgeText = 'text-slate-400';

  if (isAvailable) {
    bgClass = 'bg-emerald-900/10 border-emerald-500/20';
    iconClass = 'text-emerald-400';
    textClass = 'text-emerald-100';
    badgeBg = 'bg-emerald-500/20';
    badgeText = 'text-emerald-300';
  } else if (isNeutral) {
    bgClass = 'bg-blue-900/10 border-blue-500/20';
    iconClass = 'text-blue-400';
    textClass = 'text-blue-100';
    badgeBg = 'bg-blue-500/20';
    badgeText = 'text-blue-300';
  }

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${bgClass}`}>
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <span className={`font-medium ${textClass}`}>{label}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-md ${badgeBg} ${badgeText}`}>
        {displayStatus}
      </span>
    </div>
  );
};

export const ReportPreview: React.FC<ReportPreviewProps> = ({ metadata }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Target className="h-6 w-6 mr-2 text-blue-500" />
          Report Overview
        </h2>
        <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          v{metadata.metadata.report_version || '1.0'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard icon={Server} label="Target" value={metadata.metadata.target} />
        <InfoCard icon={Shield} label="Scan Mode" value={metadata.metadata.scan_mode} />
        <InfoCard icon={Clock} label="Scan Duration" value={metadata.metadata.scan_duration} />
        <InfoCard icon={Calendar} label="Generated" value={metadata.metadata.generated_at} />
      </div>

      <div className="pt-4 mt-6 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Module Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard icon={Hash} label="Port Scan" status={metadata.availability.port_scan} />
          <StatusCard icon={Globe} label="Web Security" status={metadata.availability.web_security} />
          <StatusCard icon={Shield} label="CVE Analysis" status={metadata.availability.cve_analysis} />
        </div>
      </div>
    </div>
  );
};
