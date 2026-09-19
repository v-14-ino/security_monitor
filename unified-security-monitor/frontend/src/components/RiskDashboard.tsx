import React from 'react';
import { Shield, Target, Activity, CheckCircle, AlertTriangle, AlertOctagon, Network, Globe, Mail, Database, Terminal, Key } from 'lucide-react';
import type { UploadResponse } from '../services/api';

interface RiskDashboardProps {
  metadata: UploadResponse;
}

const getRiskColor = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'moderate': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
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

export const RiskDashboard: React.FC<RiskDashboardProps> = ({ metadata }) => {
  const { risk_summary, attack_surface, priority_findings, recommendations } = metadata;

  if (!risk_summary || !attack_surface) {
    return null; // Safety fallback
  }

  const riskClasses = getRiskColor(risk_summary.overall_risk);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl relative overflow-hidden">
      {/* Background glow based on risk */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-opacity-20 rounded-full blur-3xl -z-10 transition-colors ${
        risk_summary.overall_risk === 'Critical' ? 'bg-rose-600' :
        risk_summary.overall_risk === 'High' ? 'bg-orange-600' :
        risk_summary.overall_risk === 'Moderate' ? 'bg-amber-600' : 'bg-emerald-600'
      }`}></div>

      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Activity className="h-7 w-7 text-indigo-500" />
            SECURITY RISK ASSESSMENT
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Risk summary derived from the uploaded security assessment report</p>
        </div>
      </div>

      {risk_summary.exposed_ports === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Shield className="h-12 w-12 mx-auto text-emerald-500/50 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">No exposed ports were identified in this report.</h3>
          <p className="text-sm mt-2">The risk assessment requires exposed services to calculate an attack surface.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Row: Overall Risk & Attack Surface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Overall Risk Card */}
            <div className={`col-span-1 lg:col-span-1 border rounded-2xl p-6 flex flex-col justify-center items-center text-center ${riskClasses} relative overflow-hidden shadow-lg`}>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 opacity-80">Overall Security Risk</h3>
              <div className="text-5xl font-extrabold tracking-tight mb-2 uppercase">
                {risk_summary.overall_risk}
              </div>
              <div className="text-2xl font-bold opacity-90 mb-4">
                {risk_summary.risk_score} <span className="text-lg opacity-70">/ 100</span>
              </div>
              
              <div className="w-full bg-slate-900/50 rounded-full h-3 mb-6 overflow-hidden border border-slate-700/30">
                <div 
                  className={`h-3 rounded-full ${risk_summary.risk_score >= 70 ? 'bg-rose-500' : risk_summary.risk_score >= 40 ? 'bg-orange-500' : risk_summary.risk_score >= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${risk_summary.risk_score}%` }}
                ></div>
              </div>
              
              <p className="text-xs opacity-75 max-w-xs mx-auto leading-relaxed">
                Risk score is calculated from findings contained in the uploaded scanner report and should not be interpreted as proof that exploitation occurred.
              </p>
            </div>

            {/* Attack Surface Summary */}
            <div className="col-span-1 lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Target className="h-4 w-4" /> Attack Surface Summary
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition">
                  <Network className="h-6 w-6 text-indigo-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-100">{attack_surface.total_open_ports}</span>
                  <span className="text-xs text-slate-400 font-medium">Open Ports</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition">
                  <Terminal className="h-6 w-6 text-fuchsia-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-100">{attack_surface.unique_services}</span>
                  <span className="text-xs text-slate-400 font-medium">Unique Services</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition">
                  <Globe className="h-6 w-6 text-blue-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-100">{attack_surface.web_services}</span>
                  <span className="text-xs text-slate-400 font-medium">Web Services</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition">
                  <Key className="h-6 w-6 text-orange-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-100">{attack_surface.remote_access_services}</span>
                  <span className="text-xs text-slate-400 font-medium">Remote Access</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition">
                  <Mail className="h-6 w-6 text-amber-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-100">{attack_surface.mail_services}</span>
                  <span className="text-xs text-slate-400 font-medium">Mail Services</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition">
                  <Database className="h-6 w-6 text-emerald-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-100">{attack_surface.database_services}</span>
                  <span className="text-xs text-slate-400 font-medium">Database Services</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Threat Distribution
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-900/40 border-l-4 border-rose-500 rounded-r-lg p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-500 tracking-wider">CRITICAL</span>
                  <span className="text-lg font-bold text-slate-200">{risk_summary.critical_count}</span>
                </div>
                <div className="bg-slate-900/40 border-l-4 border-orange-500 rounded-r-lg p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-orange-500 tracking-wider">HIGH</span>
                  <span className="text-lg font-bold text-slate-200">{risk_summary.high_count}</span>
                </div>
                <div className="bg-slate-900/40 border-l-4 border-amber-500 rounded-r-lg p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-500 tracking-wider">MEDIUM</span>
                  <span className="text-lg font-bold text-slate-200">{risk_summary.medium_count}</span>
                </div>
                <div className="bg-slate-900/40 border-l-4 border-blue-500 rounded-r-lg p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-500 tracking-wider">LOW</span>
                  <span className="text-lg font-bold text-slate-200">{risk_summary.low_count}</span>
                </div>
                <div className="bg-slate-900/40 border-l-4 border-slate-500 rounded-r-lg p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">INFO</span>
                  <span className="text-lg font-bold text-slate-200">{risk_summary.informational_count}</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Priority Findings */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-400" /> Priority Findings
              </h3>
              
              {priority_findings.length === 0 ? (
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center text-slate-400 text-sm">
                  No priority findings identified.
                </div>
              ) : (
                <div className="space-y-3">
                  {priority_findings.map((finding) => (
                    <div key={finding.rank} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/60 transition group cursor-default">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-900 text-xs font-bold text-slate-300 border border-slate-700">
                            #{finding.rank}
                          </span>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-900/50 ${
                            finding.severity.toLowerCase() === 'critical' ? 'text-rose-400 border-rose-500/30' :
                            finding.severity.toLowerCase() === 'high' ? 'text-orange-400 border-orange-500/30' :
                            finding.severity.toLowerCase() === 'medium' ? 'text-amber-400 border-amber-500/30' :
                            'text-slate-400 border-slate-500/30'
                          }`}>
                            {finding.severity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          PORT {finding.port}
                        </div>
                      </div>
                      
                      <h4 className="text-slate-200 font-medium text-sm mb-1">{finding.title}</h4>
                      
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="uppercase font-semibold tracking-wider">{finding.service}</span>
                          <span>•</span>
                          <span>{finding.product}</span>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-xs text-slate-400 border border-slate-800">
                          <span className="text-slate-500 font-semibold block mb-1">Reason:</span>
                          {finding.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" /> Prioritized Security Recommendations
              </h3>
              
              {recommendations.length === 0 ? (
                <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center text-slate-400 text-sm">
                  No recommendations generated.
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.priority} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`text-xl font-black opacity-20 ${getSeverityColorText(rec.severity)}`}>
                          {rec.priority.toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${getSeverityColorText(rec.severity)}`}>
                            — {rec.severity}
                          </span>
                        </div>
                        <h4 className="text-slate-200 font-medium text-sm mb-2">{rec.title}</h4>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {rec.recommendation}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Related Ports:</span>
                          {rec.related_ports.map((p, i) => (
                            <span key={i} className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
