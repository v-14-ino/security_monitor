import React, { useState, useEffect } from 'react';
import { 
  Play, AlertTriangle, Info, Server,
  Shield, CheckCircle, Activity, Search, ShieldAlert, AlertOctagon, Terminal
} from 'lucide-react';
import type { UploadResponse } from '../services/api';

interface AttackSimulationProps {
  metadata: UploadResponse;
}

interface TimelineEvent {
  id: number;
  timestamp: string;
  stage: string;
  title: string;
  description: string;
  port?: number | string | null;
  service?: string | null;
  severity: string;
  evidence_source: string;
  status: 'SIMULATED';
}

const getSeverityStyles = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const getEventIcon = (stage: string) => {
  const s = stage.toLowerCase();
  if (s.includes('initializ') || s.includes('complet')) return <CheckCircle className="w-5 h-5" />;
  if (s.includes('reconnaissance') || s.includes('review')) return <Search className="w-5 h-5" />;
  if (s.includes('exposure') || s.includes('service')) return <Server className="w-5 h-5" />;
  if (s.includes('weakness') || s.includes('vulnerability')) return <ShieldAlert className="w-5 h-5" />;
  if (s.includes('access')) return <Terminal className="w-5 h-5" />;
  if (s.includes('impact')) return <AlertOctagon className="w-5 h-5" />;
  if (s.includes('defensive') || s.includes('mitigation')) return <Shield className="w-5 h-5" />;
  return <Activity className="w-5 h-5" />;
};

export const AttackSimulation: React.FC<AttackSimulationProps> = ({ metadata }) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const generateEvents = () => {
    const generatedEvents: TimelineEvent[] = [];
    let eventId = 1;

    let baseTime = new Date();
    if (metadata.metadata?.generated_at) {
      const parsed = new Date(metadata.metadata.generated_at);
      if (!isNaN(parsed.getTime())) {
        baseTime = parsed;
      }
    }
    baseTime = new Date(baseTime.getTime() + 15000); 

    const addEvent = (stage: string, title: string, description: string, severity = 'Informational', evidenceSource = 'report', port: any = null, service: any = null) => {
      baseTime = new Date(baseTime.getTime() + (Math.floor(Math.random() * 25) + 10) * 1000);
      
      const timeString = baseTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      generatedEvents.push({
        id: eventId++,
        timestamp: timeString,
        stage,
        title,
        description,
        severity,
        evidence_source: evidenceSource,
        port,
        service,
        status: 'SIMULATED'
      });
    };

    addEvent('Simulation Initialized', 'Simulation Started', 'A hypothetical attack-path simulation was initialized using the uploaded security assessment.', 'Informational', 'report');

    const openPorts = metadata.attack_surface?.total_open_ports || 0;
    addEvent('Reconnaissance', 'Attack Surface Reviewed', `Reported attack surface reviewed. ${openPorts} open port(s) identified in the report findings.`, 'Informational', 'port_scan');

    if (openPorts === 0 || !metadata.port_analysis?.ports || metadata.port_analysis.ports.length === 0) {
      addEvent('Service Exposure', 'No Exposed Service Evidence', 'Attack-path simulation is limited because no exposed services were identified in the report.', 'Informational', 'port_scan');
      addEvent('Potential Impact', 'Minimal External Footprint', 'Illustrative impact based on available evidence suggests limited immediate external attack vectors.', 'Low', 'risk_assessment');
    } else {
      const services = metadata.attack_analysis?.services || [];
      const cveServices = services.filter(s => s.cves && s.cves.length > 0);
      const threatServices = services.filter(s => s.threats && s.threats.length > 0);
      
      const targetService = cveServices.length > 0 ? cveServices[0] : 
                            (threatServices.length > 0 ? threatServices[0] : services[0]);

      if (targetService) {
        addEvent('Service Exposure', `Service Identified: ${targetService.service || 'Unknown'}`, `Port ${targetService.port} / ${targetService.service || 'Unknown'} identified as exposed in the report.`, 'Medium', 'port_scan', targetService.port, targetService.service);

        if (targetService.cves && targetService.cves.length > 0) {
          const cve = targetService.cves[0];
          addEvent('Potential Vulnerability Identified', `CVE Evidence Reviewed`, `Reported vulnerability ${cve.cve_id} reviewed. ${cve.description.slice(0, 100)}...`, cve.severity || 'High', 'cve_analysis', targetService.port, targetService.service);
        } else if (targetService.version && targetService.version !== 'Unknown') {
          addEvent('Potential Weakness', `Version Assessment`, `Potential weakness identified from the reported software version (${targetService.version}).`, 'Medium', 'version_assessment', targetService.port, targetService.service);
        } else if (targetService.threats && targetService.threats.length > 0) {
          addEvent('Potential Weakness', `Threat Finding`, `Reported threat evidence reviewed: ${targetService.threats[0].name}.`, targetService.risk_level || 'Medium', 'threat_analysis', targetService.port, targetService.service);
        }

        if (targetService.service && (targetService.service.toLowerCase().includes('http') || targetService.service.toLowerCase().includes('web'))) {
           addEvent('Web Security Review', 'Web Findings Reviewed', `Reported web security finding reviewed during simulation for potential vectors.`, 'Informational', 'web_security', targetService.port, targetService.service);
        }

        addEvent('Hypothetical Initial Access Path', `Simulated Access Scenario`, `Simulated initial access path considered through the exposed ${targetService.service || 'service'}. Access was NOT actually performed.`, targetService.risk_level || 'Medium', 'attack_analysis', targetService.port, targetService.service);

        const accessDesc = targetService.risk_level.toLowerCase() === 'critical' ? 'Potential impact: Remote code execution risk associated with the reported vulnerability.' : 'Potential access level: Remote authentication surface and service interaction.';
        addEvent('Potential Access Level', `Illustrative Access Scope`, accessDesc, targetService.risk_level || 'Medium', 'risk_assessment');
      }
    }

    addEvent('Potential Impact Assessment', 'Risk Summary Evaluation', `Based on the reported ${metadata.risk_summary?.overall_risk || 'unknown'} risk level, the hypothetical scenario concludes with potential resource access evaluation.`, metadata.risk_summary?.overall_risk || 'Informational', 'risk_assessment');

    if (metadata.recommendations && metadata.recommendations.length > 0) {
      addEvent('Defensive Mitigation Point', 'Recommendation Highlight', `Mitigation point: ${metadata.recommendations[0].title}.`, metadata.recommendations[0].severity || 'Informational', 'recommendations');
    }

    addEvent('Simulation Completed', 'Timeline Completed', 'Hypothetical attack simulation reached its conclusion based on reported evidence.', 'Informational', 'system');

    setEvents(generatedEvents);
  };

  useEffect(() => {
    if (metadata) {
      generateEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata]);



  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl relative overflow-hidden">
      
      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-8 flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-amber-400 font-bold uppercase tracking-wider text-sm mb-1">Simulation Mode</h3>
          <p className="text-amber-200/80 text-sm">
            No real attack was performed. This is an evidence-based hypothetical attack-path visualization 
            using ONLY information already present in the uploaded security report.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-2">
            ⚔️ ATTACK SIMULATION
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mt-4">
            {events.length > 0 && showTimeline && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Start (Simulated)</span>
                  <span className="font-mono">{events[0]?.timestamp || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">End (Simulated)</span>
                  <span className="font-mono">{events[events.length - 1]?.timestamp || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Events</span>
                  <span className="font-mono">{events.length}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          {!showTimeline ? (
            <button
              onClick={() => setShowTimeline(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg transition-all"
            >
              <Play className="w-5 h-5" />
              SHOW ATTACK TIMELINE
            </button>
          ) : (
            <button
              onClick={() => setShowTimeline(false)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-bold shadow-lg transition-all"
            >
              HIDE ATTACK TIMELINE
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-[100px]">
        {showTimeline && events.length > 0 && (
          <div className="absolute left-7 top-4 bottom-0 w-px bg-slate-700/50"></div>
        )}
        
        <div className="space-y-6 relative">
          {showTimeline && events.map((event, index) => {
            if (!event) return null; // Safe fallback just in case
            return (
              <div key={event.id || index} className="flex gap-6 animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="flex flex-col items-center mt-1 z-10">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-slate-400 shadow-xl">
                    {getEventIcon(event.stage || 'unknown')}
                  </div>
                </div>
                
                <div className="flex-1 bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl shadow-sm hover:bg-slate-800/60 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                    <div className="flex items-center gap-3 mb-2 md:mb-0">
                      <span className="font-mono text-sm font-bold text-indigo-400">
                        {event.timestamp}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded">
                        {event.status || 'SIMULATED'} TIMELINE
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {event.port && (
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded">
                          PORT {event.port}
                        </span>
                      )}
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${getSeverityStyles(event.severity || 'low')}`}>
                        {event.severity}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-200 mb-1 uppercase tracking-wide">
                    {event.stage}
                  </h4>
                  <p className="text-sm font-semibold text-slate-300 mb-2">
                    {event.title}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {event.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-slate-500">
                    <Info className="w-3.5 h-3.5" />
                    Evidence source: {event.evidence_source ? event.evidence_source.replace('_', ' ') : 'Not available'}
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {!showTimeline && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Terminal className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">Click to view the hypothetical attack path visualization.</p>
          </div>
        )}
      </div>

    </div>
  );
};
