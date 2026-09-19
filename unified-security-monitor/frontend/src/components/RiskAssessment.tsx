import React from 'react';
import { Activity, ShieldAlert, CheckCircle, Network, Info, AlertOctagon } from 'lucide-react';
import type { UploadResponse } from '../services/api';

interface RiskAssessmentProps {
  metadata: UploadResponse;
}

const getRiskColor = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    default: return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
  }
};

const getSeverityColorText = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-rose-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-amber-500';
    case 'low': return 'text-blue-500';
    default: return 'text-slate-400';
  }
};

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ metadata }) => {
  const { risk_assessment } = metadata;

  if (!risk_assessment) return null;

  const {
    overall_risk,
    risk_score,
    explanation,
    severity_summary,
    attack_surface_ports,
    priority_findings,
    service_risk,
    recommendations
  } = risk_assessment;

  const riskClasses = getRiskColor(overall_risk);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl relative overflow-hidden">
      
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-opacity-10 rounded-full blur-3xl -z-10 transition-colors ${
        overall_risk === 'Critical' ? 'bg-rose-600' :
        overall_risk === 'High' ? 'bg-orange-600' :
        overall_risk === 'Medium' ? 'bg-amber-600' : 'bg-emerald-600'
      }`}></div>

      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3 uppercase tracking-wider">
            <Activity className="h-7 w-7 text-fuchsia-500" />
            Dynamic Security Risk Assessment
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Evidence-based risk calculation derived dynamically from uploaded findings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Risk Card */}
        <div className={`col-span-1 border rounded-2xl p-6 flex flex-col justify-center items-center text-center ${riskClasses} relative overflow-hidden shadow-lg`}>
          <h3 className="text-sm font-bold tracking-widest uppercase mb-4 opacity-80">Overall Risk</h3>
          <div className="text-5xl font-extrabold tracking-tight mb-2 uppercase">
            {overall_risk}
          </div>
          <div className="text-2xl font-bold opacity-90 mb-4">
            {risk_score} <span className="text-lg opacity-70">/ 100</span>
          </div>
          <div className="w-full bg-slate-900/50 rounded-full h-3 mb-6 overflow-hidden border border-slate-700/30">
            <div 
              className={`h-3 rounded-full ${risk_score >= 70 ? 'bg-rose-500' : risk_score >= 40 ? 'bg-orange-500' : risk_score >= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${risk_score}%` }}
            ></div>
          </div>
        </div>

        {/* Explanation & Summary */}
        <div className="col-span-1 lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" /> Assessment Evidence
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              {explanation}
            </p>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-center">
              <span className="block text-xl font-black text-slate-100">{attack_surface_ports}</span>
              <span className="block text-[10px] text-slate-500 font-bold uppercase mt-1">Ports Exposed</span>
            </div>
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-lg p-3 text-center">
              <span className="block text-xl font-black text-rose-400">{severity_summary.Critical}</span>
              <span className="block text-[10px] text-rose-500/70 font-bold uppercase mt-1">Critical</span>
            </div>
            <div className="bg-orange-950/20 border border-orange-900/50 rounded-lg p-3 text-center">
              <span className="block text-xl font-black text-orange-400">{severity_summary.High}</span>
              <span className="block text-[10px] text-orange-500/70 font-bold uppercase mt-1">High</span>
            </div>
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-3 text-center">
              <span className="block text-xl font-black text-amber-400">{severity_summary.Medium}</span>
              <span className="block text-[10px] text-amber-500/70 font-bold uppercase mt-1">Medium</span>
            </div>
            <div className="bg-blue-950/20 border border-blue-900/50 rounded-lg p-3 text-center">
              <span className="block text-xl font-black text-blue-400">{severity_summary.Low}</span>
              <span className="block text-[10px] text-blue-500/70 font-bold uppercase mt-1">Low</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 text-center">
              <span className="block text-xl font-black text-slate-400">{severity_summary.Informational}</span>
              <span className="block text-[10px] text-slate-500 font-bold uppercase mt-1">Info</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Dynamic Priority Findings */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" /> Evidence-Based Findings
          </h3>
          
          {priority_findings.length === 0 ? (
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center text-slate-400 text-sm">
              No priority findings identified in the JSON report.
            </div>
          ) : (
            <div className="space-y-3">
              {priority_findings.map((finding, idx) => (
                <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-900/50 ${getRiskColor(finding.severity)}`}>
                      {finding.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono border border-slate-700 bg-slate-900 px-2 py-0.5 rounded">
                      SOURCE: {finding.source}
                    </span>
                  </div>
                  
                  <h4 className="text-slate-200 font-medium text-sm mb-1">{finding.title}</h4>
                  <p className="text-xs text-slate-400 mb-2">{finding.description}</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs mt-3">
                    <span className="bg-slate-900/50 border border-slate-700 text-slate-300 px-2 py-1 rounded">
                      <strong className="text-slate-500">Component:</strong> {finding.affected_component}
                    </span>
                    <span className="bg-slate-900/50 border border-slate-700 text-slate-300 px-2 py-1 rounded">
                      <strong className="text-slate-500">Port:</strong> {finding.port}
                    </span>
                  </div>
                  <div className="mt-3 p-2 bg-slate-900/30 rounded border-l-2 border-slate-600 text-xs text-slate-400 italic">
                    Evidence: {finding.evidence}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Dynamic Service Risk */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Network className="h-4 w-4 text-indigo-400" /> Service Attack Surface
          </h3>
          
          <div className="overflow-x-auto border border-slate-700/50 rounded-xl mb-6">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800/80 text-slate-400 text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Port</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Service</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Calculated Risk</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700/50">Evidence Found</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30 bg-slate-900/30">
                {service_risk.map((svc, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{svc.port}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200 uppercase text-xs">{svc.service}</div>
                      <div className="text-[10px] text-slate-500">{svc.product} {svc.version !== 'unknown' ? `v${svc.version}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskColor(svc.risk_level)}`}>
                        {svc.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {svc.evidence_sources.map((src, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                            {src}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {service_risk.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">
                      No exposed services to map.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Recommendations */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" /> Remediations Based on Findings
          </h3>
          
          {recommendations.length === 0 ? (
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center text-slate-400 text-sm">
              No specific remediation recommendation was provided by the source report.
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertOctagon className={`h-4 w-4 ${getSeverityColorText(rec.severity)}`} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {rec.severity} PRIORITY
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rec.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
