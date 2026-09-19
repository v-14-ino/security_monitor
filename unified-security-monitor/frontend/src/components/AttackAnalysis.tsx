import React, { useState } from 'react';
import { Target, Activity, Shield, FileSearch, Server, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { UploadResponse, AttackAnalysisService } from '../services/api';

interface AttackAnalysisProps {
  metadata: UploadResponse;
}

const getSeverityBadge = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const ThreatCard: React.FC<{ service: AttackAnalysisService }> = ({ service }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-sm hover:bg-slate-800/60 transition-colors">
      <div 
        className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center h-12 w-12 bg-slate-900 rounded-lg border border-slate-700 shadow-inner">
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-0.5">Port</span>
            <span className="text-emerald-400 font-mono font-bold text-sm leading-none">{service.port}</span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-200 uppercase tracking-wider">{service.service}</h4>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{service.product !== 'Unknown' ? service.product : 'Product Unknown'}</span>
              {service.version !== 'Unknown' && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-300">v{service.version}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end md:items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Threat Level</span>
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getSeverityBadge(service.risk_level)}`}>
              {service.risk_level}
            </span>
          </div>
          <div className="hidden md:flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Potential Threats</span>
            <span className="text-slate-300 font-semibold">{service.threats.length}</span>
          </div>
          <div className="text-slate-500">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 bg-slate-900/50 p-5 space-y-6">
          
          <div>
            <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Potential Threats
            </h5>
            {service.threats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {service.threats.map((threat, i) => (
                  <div key={i} className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-lg flex gap-3">
                    <div className="mt-0.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${threat.severity.toLowerCase() === 'critical' ? 'bg-rose-500' : threat.severity.toLowerCase() === 'high' ? 'bg-orange-500' : threat.severity.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    </div>
                    <div>
                      <h6 className="text-sm font-semibold text-slate-200 mb-1">{threat.name}</h6>
                      <p className="text-xs text-slate-400 mb-1">{threat.description}</p>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Reason: {threat.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No specific threats identified for this service.</p>
            )}
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-rose-400" /> Known CVEs
            </h5>
            {service.cves.length > 0 ? (
              <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-rose-900/20 text-rose-300 text-xs">
                    <tr>
                      <th className="px-4 py-2 font-semibold border-b border-rose-900/30">CVE ID</th>
                      <th className="px-4 py-2 font-semibold border-b border-rose-900/30">Severity</th>
                      <th className="px-4 py-2 font-semibold border-b border-rose-900/30">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-900/10">
                    {service.cves.map((cve, i) => (
                      <tr key={i} className="hover:bg-rose-900/10">
                        <td className="px-4 py-3 font-mono font-bold text-rose-400 whitespace-nowrap">{cve.cve_id}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(cve.severity)}`}>
                            {cve.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs leading-relaxed max-w-xl truncate" title={cve.description}>
                          {cve.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                No CVEs were identified by the uploaded scanner report.
              </p>
            )}
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" /> Security Recommendation
            </h5>
            {service.recommendations.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 ml-1">
                {service.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Review configuration and restrict unnecessary access.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export const AttackAnalysis: React.FC<AttackAnalysisProps> = ({ metadata }) => {
  const { attack_analysis } = metadata;

  if (!attack_analysis || !attack_analysis.summary) return null;
  const { summary, services } = attack_analysis;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Target className="h-7 w-7 text-rose-500" />
            ATTACK SURFACE & THREAT ANALYSIS
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Dynamic analysis of potential attack vectors and exposure patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Open Ports</span>
          <span className="text-3xl font-extrabold text-slate-100">{summary.total_ports}</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Services Exposed</span>
          <span className="text-3xl font-extrabold text-slate-100">{services.length}</span>
        </div>
        <div className="bg-slate-800/40 border-b-4 border-rose-500 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Critical Threats</span>
          <span className="text-3xl font-extrabold text-slate-100">{summary.critical}</span>
        </div>
        <div className="bg-slate-800/40 border-b-4 border-orange-500 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-2">High Threats</span>
          <span className="text-3xl font-extrabold text-slate-100">{summary.high}</span>
        </div>
        <div className="bg-slate-800/40 border-b-4 border-amber-500 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-2">Medium Threats</span>
          <span className="text-3xl font-extrabold text-slate-100">{summary.medium}</span>
        </div>
        <div className="bg-slate-800/40 border-b-4 border-slate-500 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Low / Info</span>
          <span className="text-3xl font-extrabold text-slate-100">{summary.low + summary.informational}</span>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-700/30 p-4 rounded-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <FileSearch className="w-24 h-24 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2 z-10">Known CVEs</span>
          <span className="text-3xl font-extrabold text-slate-100 z-10">{services.reduce((acc, s) => acc + s.cves.length, 0)}</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-400" /> THREAT MATRIX
        </h3>
        <div className="overflow-x-auto border border-slate-700/50 rounded-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-400 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Port</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Service</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Product</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Version</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Threat Level</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-700/50 w-full">Potential Threats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30 bg-slate-900/30">
              {services.map((svc, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">{svc.port}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200 uppercase">{svc.service}</td>
                  <td className="px-4 py-3 text-slate-300">{svc.product}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{svc.version}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(svc.risk_level)}`}>
                      {svc.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px] md:max-w-[400px]">
                    {svc.threats.map(t => t.name).join(', ') || 'None identified'}
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                    No exposed services to analyze.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-200 mb-4 mt-8 flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-400" /> DETAILED THREAT CARDS
          </h3>
          <div className="space-y-4">
            {services.map((svc, i) => (
              <ThreatCard key={i} service={svc} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
