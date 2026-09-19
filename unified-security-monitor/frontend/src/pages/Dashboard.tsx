import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, RotateCw, AlertCircle, Clock, Shield, Target, Activity, AlertTriangle, ShieldAlert, Crosshair, CheckCircle, Database, Search, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = 'http://127.0.0.1:8000/api';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [target, setTarget] = useState('');
  const [scanMode, setScanMode] = useState('full');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      const assessmentId = searchParams.get('assessment');
      const url = assessmentId 
        ? `${API_BASE}/scans/${assessmentId}` 
        : `${API_BASE}/scans/latest`;
        
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setScanResult(data);
          // If we loaded latest, we might want to update the URL so refreshes stick to it.
          // But to avoid a redirect loop if there are no assessments, only update if it has an ID
          if (!assessmentId && data.scan_id) {
            setSearchParams({ assessment: data.scan_id }, { replace: true });
          }
        } else {
          // It's okay if latest returns 404 (no scans yet)
          if (res.status !== 404) {
            setError('Failed to load assessment data.');
          }
        }
      } catch (e) {
        console.error(e);
        setError('Connection error loading assessment.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAssessment();
  }, [searchParams, setSearchParams]);

  const handleScan = async () => {
    if (!target) return;
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setLoadingStage('Initializing assessment...');
    
    try {
      setLoadingStage('Discovering services & analyzing vulnerabilities...');
      const res = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, scan_mode: scanMode })
      });
      
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Backend unavailable or scan failed.');
      } else {
        setLoadingStage('Evaluating risk & generating dashboard...');
        const data = await res.json();
        setScanResult(data);
        setSearchParams({ assessment: data.scan_id });
      }
    } catch (e: any) {
      setError(e.message || "Assessment failed. Check backend connection.");
    }
    setIsScanning(false);
    setLoadingStage('');
  };

  // Derived Metrics
  // Derived Metrics
  const cves = scanResult?.cve_analysis?.findings || [];
  const ports = scanResult?.ports || [];
  
  const offense = scanResult?.offense || { exposed_services: [], scenarios: [], key_findings: [] };
  const defense = scanResult?.defense || { control_coverage: 100, monitoring_priority: [], playbooks: [], response: [] };
  
  const counts = {
    critical: cves.filter((c: any) => c.severity === 'CRITICAL').length,
    high: cves.filter((c: any) => c.severity === 'HIGH').length,
    medium: cves.filter((c: any) => c.severity === 'MEDIUM').length,
    low: cves.filter((c: any) => c.severity === 'LOW').length,
    info: cves.filter((c: any) => !['CRITICAL','HIGH','MEDIUM','LOW'].includes(c.severity)).length,
  };

  const riskData = [
    { name: 'Critical', value: counts.critical, color: '#EF4444' },
    { name: 'High', value: counts.high, color: '#F97316' },
    { name: 'Medium', value: counts.medium, color: '#F59E0B' },
    { name: 'Low', value: counts.low, color: '#3B82F6' },
  ].filter(d => d.value > 0);

  // Attack Surface calculation
  const servicesMap: Record<string, number> = {};
  offense.exposed_services.forEach((s: any) => {
    const srv = s.service || 'UNKNOWN';
    servicesMap[srv] = (servicesMap[srv] || 0) + 1;
  });
  const attackSurfaceData = Object.keys(servicesMap).map(k => ({
    name: k, value: servicesMap[k]
  }));
  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#3B82F6', '#94A3B8'];
  attackSurfaceData.forEach((d, i) => d.color = COLORS[i % COLORS.length]);

  // Defense calculations
  const controlCoverage = defense.control_coverage;
  const coverageData = [
    { name: 'Covered', value: controlCoverage, color: '#2563EB' },
    { name: 'Gaps', value: 100 - controlCoverage, color: '#E2E8F0' }
  ];

  const DEF_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B'];
  const monitoringPriorities = defense.monitoring_priority.map((d: any, i: number) => ({
    name: d.name,
    value: 1, // Uniform distribution visually
    color: DEF_COLORS[i % DEF_COLORS.length]
  }));
  
  const recommendations = defense.recommendations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Assessment Control */}
      <div className="bg-[#0D1525] border border-[#243247] rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">Target IP / Domain</label>
            <input 
              type="text" 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[#080F1C] border border-[#334155] rounded-lg px-4 py-3 text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
              placeholder="Target IP / Domain"
              disabled={isScanning}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">Scan Mode</label>
            <select 
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value)}
              disabled={isScanning}
              className="w-full bg-[#080F1C] border border-[#334155] rounded-lg px-4 py-3 text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] appearance-none transition-all"
            >
              <option value="quick">Quick Scan</option>
              <option value="full">Full Scan</option>
            </select>
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning || !target}
            className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white px-8 py-3 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[50px]"
          >
            {isScanning ? <RotateCw className="animate-spin" size={18} /> : <Play size={18} />} 
            {isScanning ? 'Scanning...' : 'START ASSESSMENT'}
          </button>
        </div>
        
        {isScanning && (
          <div className="mt-6 flex flex-col items-center justify-center p-4">
            <div className="text-blue-400 mb-2 font-medium">Assessment in progress</div>
            <div className="text-slate-400 text-sm">{loadingStage}</div>
            <div className="w-full max-w-md h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500 w-1/2 animate-[pulse_2s_ease-in-out_infinite] rounded-full"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-400 text-sm flex items-center gap-2 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      {!scanResult && !isScanning && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-[#64748B] border border-[#1E293B] rounded-xl bg-[#0D1525] border-dashed shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <Target size={64} className="mb-6 text-[#1E293B]" />
          <h2 className="text-2xl font-medium text-[#F8FAFC] mb-3">No Assessment Data</h2>
          <p className="text-[#94A3B8] max-w-md text-center">Enter a target and start an assessment to view attack surface, risks, findings and defensive recommendations.</p>
        </div>
      )}

      {scanResult && !isScanning && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            <MetricCard title="TARGET" value={scanResult.target} color="#2563EB" colSpan="col-span-2" />
            <MetricCard title="OPEN PORTS" value={ports.length} color="#06B6D4" />
            <MetricCard title="SERVICES" value={Object.keys(servicesMap).length} color="#6366F1" />
            <MetricCard title="VULNS" value={cves.length} color="#F59E0B" />
            <MetricCard title="CRITICAL" value={counts.critical} color="#DC2626" />
            <MetricCard title="HIGH" value={counts.high} color="#EA580C" />
            <MetricCard title="MEDIUM" value={counts.medium} color="#F59E0B" />
            <MetricCard title="STATUS" value="Completed" color="#16A34A" />
            <MetricCard title="TIME" value="2m 14s" color="#6366F1" /> {/* Mocking duration */}
          </div>

          {/* Side-by-Side Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT PANEL - OFFENSE */}
            {/* LEFT PANEL - OFFENSE */}
            <div className="bg-[#140B10] border border-[#7F1D1D] shadow-[0_0_15px_rgba(239,68,68,0.10)] rounded-xl overflow-hidden relative">
              <div className="p-5 border-b border-[#7F1D1D] bg-[#1A0D11] flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#F87171] flex items-center gap-2">
                    <Crosshair size={20} className="text-[#EF4444]" /> OFFENSE
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-1">What could potentially happen?</p>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#3F1118] text-[#FCA5A5] rounded border border-[#7F1D1D] font-semibold">
                  Attacker Perspective
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Risk Distribution */}
                  <div className="bg-[#170C10] p-4 rounded-lg border border-[#4C1D25] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Risk Distribution</h3>
                    <div className="h-40 relative">
                      {riskData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1A0D11', borderColor: '#4C1D25', color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#F8FAFC]">{cves.length}</span>
                        <span className="text-[10px] font-medium text-[#94A3B8] uppercase">Vulns</span>
                      </div>
                    </div>
                  </div>

                  {/* Attack Surface */}
                  <div className="bg-[#170C10] p-4 rounded-lg border border-[#4C1D25] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Attack Surface (Services)</h3>
                    <div className="h-40 relative">
                      {attackSurfaceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={attackSurfaceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {attackSurfaceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1A0D11', borderColor: '#4C1D25', color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#F8FAFC]">{Object.keys(servicesMap).length}</span>
                        <span className="text-[10px] font-medium text-[#94A3B8] uppercase">Services</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Attack Scenarios */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#7F1D1D] pb-2">Simulated Attack Scenarios</h3>
                  <div className="space-y-4">
                    {offense.scenarios && offense.scenarios.length > 0 ? offense.scenarios.map((scen: any, i: number) => {
                      let badgeClass = "bg-[#3F1118] text-[#FCA5A5] border-[#7F1D1D]";
                      if (scen.risk === 'Critical') badgeClass = "bg-[#EF4444] text-[#FFFFFF] border-[#EF4444]";
                      else if (scen.risk === 'High') badgeClass = "bg-[#F97316] text-[#FFFFFF] border-[#F97316]";
                      else if (scen.risk === 'Medium') badgeClass = "bg-[#B45309] text-[#FEF3C7] border-[#D97706]";
                      else badgeClass = "bg-[#1E293B] text-[#94A3B8] border-[#334155]";
                      
                      return (
                      <div key={i} className="bg-[#170C10] rounded-lg border border-[#4C1D25] border-l-4 border-l-[#EF4444] shadow-sm overflow-hidden hover:border-[#EF4444] transition-colors">
                        <div className="bg-[#1A0D11] p-3 border-b border-[#4C1D25] flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={16} className="text-[#EF4444]" />
                            <span className="font-bold text-[#F8FAFC] text-sm font-mono">{scen.port} / {scen.service}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeClass}`}>{scen.risk} Risk</span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-[#F8FAFC] text-sm mb-3 flex items-center gap-2">
                            {scen.title} 
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4C1D25] text-[#FCA5A5] uppercase tracking-wider border border-[#7F1D1D]">Simulated Scenario</span>
                          </h4>
                          <div className="relative pl-4 border-l-2 border-[#4C1D25] space-y-4 mb-4">
                            {scen.steps.map((step: string, si: number) => (
                              <div key={si} className="relative">
                                <div className="absolute w-2 h-2 bg-[#EF4444] rounded-full -left-[21px] top-1.5 border border-[#170C10] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                <div className="text-xs font-medium text-[#E2E8F0]">{step}</div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-[#1A0D11] p-3 rounded border border-[#4C1D25]">
                            <div className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1">Potential Impact</div>
                            <ul className="list-disc pl-4 text-xs text-[#F8FAFC] space-y-0.5 marker:text-[#EF4444]">
                              {scen.impacts.map((imp: string, ii: number) => (
                                <li key={ii}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="text-sm text-[#94A3B8] italic p-3 bg-[#10090C] rounded border border-[#4C1D25] shadow-sm">No exposed network services were identified.</div>
                    )}
                  </div>
                </div>

                {/* Exposed Services */}
                {offense.exposed_services.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#7F1D1D] pb-2">Exposed Services</h3>
                    <div className="space-y-3">
                      {offense.exposed_services.map((srv: any, i: number) => {
                        let riskColor = "text-[#60A5FA] bg-[#172554] border-[#1E3A8A]";
                        if (srv.risk === 'Critical') riskColor = "text-[#FCA5A5] bg-[#450A0A] border-[#7F1D1D]";
                        if (srv.risk === 'High') riskColor = "text-[#FDBA74] bg-[#431407] border-[#9A3412]";
                        if (srv.risk === 'Medium') riskColor = "text-[#FCD34D] bg-[#451A03] border-[#B45309]";

                        return (
                        <div key={i} className="bg-[#170C10] p-3 rounded-lg border border-[#4C1D25] shadow-sm hover:border-[#EF4444] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-[#F8FAFC]">{srv.port}</span>
                              <span className="text-xs font-semibold text-[#94A3B8]">{srv.protocol}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A0D11] border border-[#4C1D25] text-[#E2E8F0]">{srv.service}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor}`}>{srv.risk} Risk</span>
                          </div>
                          <div className="text-xs text-[#94A3B8] mb-2 truncate">Version: {srv.version}</div>
                          <div className="flex flex-wrap gap-1">
                            {srv.categories?.map((cat: string, ci: number) => (
                              <span key={ci} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A0D11] text-[#94A3B8] border border-[#4C1D25]">{cat}</span>
                            ))}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* Key Findings */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#7F1D1D] pb-2">Key Findings</h3>
                  <div className="overflow-x-auto bg-[#170C10] rounded-lg border border-[#4C1D25] shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase text-[#94A3B8] bg-[#1A0D11] border-b border-[#4C1D25]">
                        <tr>
                          <th className="px-3 py-3 font-semibold">Port/Service</th>
                          <th className="px-3 py-3 font-semibold">Version</th>
                          <th className="px-3 py-3 font-semibold">Exposure</th>
                          <th className="px-3 py-3 font-semibold">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#F8FAFC] text-xs">
                        {offense.key_findings.map((f: any, i: number) => {
                           return (
                            <tr key={i} className="border-b border-[#4C1D25] bg-[#10090C] hover:bg-[#1A0D11] last:border-0 transition-colors">
                              <td className="px-3 py-3 font-mono text-[#94A3B8] whitespace-nowrap">{f.port} / {f.service}</td>
                              <td className="px-3 py-3 truncate max-w-[80px]" title={f.version}>{f.version}</td>
                              <td className="px-3 py-3">
                                {f.cves > 0 ? (
                                  <span className="text-[#EF4444] font-semibold">{f.cves} CVEs</span>
                                ) : (
                                  <span className="text-[#94A3B8]">{f.exposure}</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-[#94A3B8] truncate max-w-[150px]" title={f.impact}>{f.impact}</td>
                            </tr>
                           );
                        })}
                        {offense.key_findings.length === 0 && (
                          <tr><td colSpan={4} className="px-3 py-4 text-center text-[#64748B]">No network exposure findings</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - DEFENSE */}
            <div className="bg-[#07111F] border border-[#1E3A8A] shadow-[0_0_15px_rgba(59,130,246,0.10)] rounded-xl overflow-hidden relative">
              <div className="p-5 border-b border-[#1E3A8A] bg-[#0A1628] flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#60A5FA] flex items-center gap-2">
                    <Shield size={20} className="text-[#3B82F6]" /> DEFENSE
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-1">How to monitor, prevent and respond?</p>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#172554] text-[#93C5FD] rounded border border-[#1E3A8A] font-semibold">
                  Defender Perspective
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Control Coverage */}
                  <div className="bg-[#0A192F] p-4 rounded-lg border border-[#1E40AF] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Control Coverage</h3>
                    <div className="h-40 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={coverageData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none">
                            {coverageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0A1628', borderColor: '#1E40AF', color: '#F8FAFC' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#F8FAFC]">{controlCoverage}%</span>
                        <span className="text-[10px] font-medium text-[#94A3B8] uppercase">Coverage</span>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Priority */}
                  <div className="bg-[#0A192F] p-4 rounded-lg border border-[#1E40AF] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Monitoring Priority</h3>
                    <div className="h-40 relative">
                      {monitoringPriorities.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={monitoringPriorities} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {monitoringPriorities.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0A1628', borderColor: '#1E40AF', color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#64748B] text-sm">No priority areas</div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Activity size={24} className="text-[#64748B]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Defense Monitoring Playbooks */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#1E3A8A] pb-2">Defense Monitoring Playbooks</h3>
                  <div className="space-y-4">
                    {defense.playbooks && defense.playbooks.length > 0 ? defense.playbooks.map((playbook: any, i: number) => {
                      return (
                      <div key={i} className="bg-[#0A192F] rounded-lg border border-[#1E40AF] border-l-4 border-l-[#3B82F6] shadow-sm overflow-hidden hover:border-[#3B82F6] transition-colors">
                        <div className="bg-[#0A1628] p-3 border-b border-[#1E40AF] flex items-center gap-2">
                          <CheckCircle size={16} className="text-[#3B82F6]" />
                          <span className="font-bold text-[#F8FAFC] text-sm font-mono">{playbook.port} / {playbook.service}</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#172554] text-[#93C5FD] font-bold uppercase tracking-wider border border-[#1E3A8A]">Playbook</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1 flex items-center gap-1"><Activity size={12}/> Monitor</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#3B82F6]">
                              {playbook.monitor.map((m: string, mi: number) => <li key={mi}>{m}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1 flex items-center gap-1"><Search size={12}/> Detect</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#F97316]">
                              {playbook.detect.map((d: string, di: number) => <li key={di}>{d}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1 flex items-center gap-1"><Shield size={12}/> Prevent</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#22C55E]">
                              {playbook.prevent.map((p: string, pi: number) => <li key={pi}>{p}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1 flex items-center gap-1"><Zap size={12}/> Respond</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#EF4444]">
                              {playbook.respond.map((r: string, ri: number) => <li key={ri}>{r}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="text-sm text-[#94A3B8] italic p-3 bg-[#0A1628] rounded border border-[#1E40AF] shadow-sm">No exposed services requiring service-specific monitoring were identified.</div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#0A192F] border border-[#1E40AF] rounded-lg p-4 text-center shadow-sm hover:border-[#3B82F6] transition-colors">
                    <div className="text-3xl font-bold text-[#F8FAFC] mb-1">{recommendations.length}</div>
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold">Controls Advised</div>
                  </div>
                  <div className="bg-[#0A192F] border border-[#1E40AF] rounded-lg p-4 text-center shadow-sm hover:border-[#3B82F6] transition-colors">
                    <div className="text-2xl font-bold text-[#60A5FA] mb-1 mt-1">{counts.critical > 0 ? 'High Risk' : 'Moderate'}</div>
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold">Security Posture</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, color = "#64748B", colSpan = "col-span-1" }: { title: string, value: string | number, color?: string, colSpan?: string }) => (
  <div className={`bg-[#0D1525] border border-[#1E293B] rounded-lg p-3 shadow-sm ${colSpan} flex flex-col justify-center transition-all hover:border-[#334155]`}>
    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color }}>
      <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: color }}></div>
      {title}
    </div>
    <div className="text-xl font-bold text-[#F8FAFC] truncate" title={String(value)}>{value}</div>
  </div>
);

export default Dashboard;
