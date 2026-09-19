import React from 'react';
import { ShieldAlert, AlertTriangle, Info, Activity, Server, Target } from 'lucide-react';
import type { ThreatAnalysisData } from '../services/api';

interface ThreatAnalysisProps {
  threatAnalysis?: ThreatAnalysisData;
  cveAnalysisStatus?: string;
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  let bgClass = 'bg-slate-700/50 border-slate-600/30 text-slate-400';
  
  switch (severity.toLowerCase()) {
    case 'critical':
      bgClass = 'bg-rose-900/40 border-rose-500/30 text-rose-400';
      break;
    case 'high':
      bgClass = 'bg-orange-900/40 border-orange-500/30 text-orange-400';
      break;
    case 'medium':
      bgClass = 'bg-amber-900/40 border-amber-500/30 text-amber-400';
      break;
    case 'low':
      bgClass = 'bg-blue-900/40 border-blue-500/30 text-blue-400';
      break;
    case 'informational':
      bgClass = 'bg-slate-800 border-slate-700 text-slate-300';
      break;
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${bgClass}`}>
      {severity}
    </span>
  );
};

export const ThreatAnalysis: React.FC<ThreatAnalysisProps> = ({ threatAnalysis, cveAnalysisStatus }) => {
  if (!threatAnalysis || threatAnalysis.services_analyzed === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-rose-500" />
            SECURITY THREAT ANALYSIS
          </h2>
        </div>
        <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50">
          No open ports available for threat analysis.
        </div>
      </div>
    );
  }

  const hasCves = cveAnalysisStatus === 'Available';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-rose-500" />
          SECURITY THREAT ANALYSIS
        </h2>
        <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-medium">
          Powered by Service Profiler
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Threats Identified</p>
            <p className="text-2xl font-bold text-slate-100">{threatAnalysis.total_threats}</p>
          </div>
        </div>
        
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Server className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Services Analyzed</p>
            <p className="text-2xl font-bold text-slate-100">{threatAnalysis.services_analyzed}</p>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <Activity className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Highest Severity</p>
            <div className="mt-1">
              <SeverityBadge severity={threatAnalysis.highest_severity} />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <Target className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Reported CVE Risk</p>
            <p className={`text-sm font-bold ${hasCves ? 'text-rose-400' : 'text-emerald-400'} mt-1`}>
              {hasCves ? 'CVEs Identified' : 'No CVEs were identified in this scanner report.'}
            </p>
          </div>
        </div>
      </div>
      
      {threatAnalysis.threats.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Identified Potential Threats</h3>
          {threatAnalysis.threats.map((threat, idx) => (
            <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:bg-slate-800/50 transition-colors">
              <div className="p-4 border-b border-slate-700/30 bg-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-semibold tracking-wider">PORT</span>
                    <span className="text-lg text-emerald-400 font-mono font-bold">{threat.port}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-700"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">{threat.service}</span>
                    <span className="text-slate-200 font-medium">{threat.product} {threat.version !== 'Unknown' ? threat.version : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 font-semibold tracking-wider mb-1">SEVERITY</span>
                    <SeverityBadge severity={threat.severity} />
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <h4 className="text-lg font-bold text-slate-100 mb-2">{threat.title}</h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded border border-slate-600/30 font-medium">
                    {threat.threat_type}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {threat.description}
                </p>
                
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">Recommendation</span>
                      <p className="text-sm text-blue-200/80">{threat.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50">
          Threat analysis is limited because this service is not covered by the current knowledge base.
        </div>
      )}
    </div>
  );
};
