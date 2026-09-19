import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, RotateCw, AlertCircle, Shield, Target, Activity, ShieldAlert, Crosshair, CheckCircle, Search, Zap } from 'lucide-react';
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
  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#3B82F6', '#94A3B8'];
  const attackSurfaceData = Object.keys(servicesMap).map((k, i) => ({
    name: k, value: servicesMap[k], color: COLORS[i % COLORS.length]
  }));

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
      <div className="bg-[#091827] border border-[#1A4263] rounded-xl p-6 shadow-[0_0_18px_rgba(14,82,140,0.10)] relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#8FB0C9] mb-1.5 uppercase tracking-wider">Target IP / Domain</label>
            <input 
              type="text" 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[#07121F] border border-[#234A69] rounded-lg px-4 py-3 text-[#F8FAFC] placeholder-[#607A91] focus:outline-none focus:border-[#1689D8] focus:ring-1 focus:ring-[#1689D8] focus:shadow-[0_0_12px_rgba(22,137,216,0.25)] transition-all"
              placeholder="Target IP / Domain"
              disabled={isScanning}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-[#8FB0C9] mb-1.5 uppercase tracking-wider">Scan Mode</label>
            <select 
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value)}
              disabled={isScanning}
              className="w-full bg-[#07121F] border border-[#234A69] rounded-lg px-4 py-3 text-[#F8FAFC] focus:outline-none focus:border-[#1689D8] focus:ring-1 focus:ring-[#1689D8] focus:shadow-[0_0_12px_rgba(22,137,216,0.25)] appearance-none transition-all"
            >
              <option value="quick">Quick Scan</option>
              <option value="full">Full Scan</option>
            </select>
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning || !target}
            className="bg-gradient-to-r from-[#0879D1] to-[#16A4E0] hover:from-[#1689D8] hover:to-[#22D3EE] hover:shadow-[0_0_18px_rgba(22,164,224,0.30)] border border-[#39B8FF] shadow-[0_0_18px_rgba(22,164,224,0.30)] text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[50px]"
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
            <MetricCard title="TARGET" value={scanResult.target} color="#38BDF8" colSpan="col-span-2" />
            <MetricCard title="OPEN PORTS" value={ports.length} color="#22D3EE" />
            <MetricCard title="SERVICES" value={Object.keys(servicesMap).length} color="#818CF8" />
            <MetricCard title="VULNS" value={cves.length} color="#F59E0B" />
            <MetricCard title="CRITICAL" value={counts.critical} color="#EF4444" />
            <MetricCard title="HIGH" value={counts.high} color="#F97316" />
            <MetricCard title="MEDIUM" value={counts.medium} color="#F59E0B" />
            <MetricCard title="STATUS" value="Completed" color="#22C55E" />
            <MetricCard title="TIME" value="2m 14s" color="#60A5FA" /> {/* Mocking duration */}
          </div>

          {/* Side-by-Side Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT PANEL - OFFENSE */}
            {/* LEFT PANEL - OFFENSE */}
            <div className="bg-[#120B10] border border-[#B91C1C] shadow-[0_0_18px_rgba(239,68,68,0.10)] rounded-xl overflow-hidden relative">
              <div className="p-5 border-b border-[#7F1D1D] bg-[#180C11] flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#FF4D55] flex items-center gap-2">
                    <Crosshair size={20} className="text-[#FF3B43]" /> OFFENSE
                  </h2>
                  <p className="text-xs text-[#A98B93] mt-1">What could potentially happen?</p>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#3A1018] text-[#FF8A91] rounded border border-[#9F1D2E] font-semibold">
                  Attacker Perspective
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Risk Distribution */}
                  <div className="bg-[#160C11] p-4 rounded-lg border border-[#54202A] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Risk Distribution</h3>
                    <div className="h-40 relative">
                      {riskData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#160C11', borderColor: '#54202A', color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#FFFFFF]">{cves.length}</span>
                        <span className="text-[10px] font-medium text-[#91A3B5] uppercase">Vulns</span>
                      </div>
                    </div>
                  </div>

                  {/* Attack Surface */}
                  <div className="bg-[#160C11] p-4 rounded-lg border border-[#54202A] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Attack Surface (Services)</h3>
                    <div className="h-40 relative">
                      {attackSurfaceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={attackSurfaceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {attackSurfaceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#160C11', borderColor: '#54202A', color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#FFFFFF]">{Object.keys(servicesMap).length}</span>
                        <span className="text-[10px] font-medium text-[#91A3B5] uppercase">Services</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Attack Scenarios */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#C62838] pb-2">SIMULATED ATTACK SCENARIOS</h3>
                  <div className="space-y-4">
                    {offense.scenarios && offense.scenarios.length > 0 ? offense.scenarios.map((scen: any, i: number) => {
                      let badgeClass = "bg-[#3B1119] text-[#FF7B85] border-[#9F1D2E]";
                      if (scen.risk === 'Critical') badgeClass = "bg-[#EF4444] text-[#FFFFFF] border-[#EF4444]";
                      else if (scen.risk === 'High') badgeClass = "bg-[#EF4444] text-[#FFFFFF] border-[#EF4444]";
                      else if (scen.risk === 'Medium') badgeClass = "bg-[#F59E0B] text-[#FFFFFF] border-[#F59E0B]";
                      else if (scen.risk === 'Low') badgeClass = "bg-[#3B82F6] text-[#FFFFFF] border-[#3B82F6]";
                      
                      return (
                      <div key={i} className="bg-[#160B10] rounded-lg border border-[#5C202B] border-l-4 border-l-[#EF4444] shadow-sm overflow-hidden hover:border-[#EF4444] transition-colors">
                        <div className="bg-[#170D12] p-3 border-b border-[#5C202B] flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={16} className="text-[#EF4444]" />
                            <span className="font-bold text-[#FFFFFF] text-sm font-mono">{scen.port} / {scen.service}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeClass}`}>{scen.risk} Risk</span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-[#FFFFFF] text-sm mb-3 flex items-center gap-2">
                            {scen.title} 
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3B1119] text-[#FF7B85] uppercase tracking-wider border border-[#9F1D2E]">Simulated Scenario</span>
                          </h4>
                          <div className="relative pl-4 border-l-2 border-[#EF4444] space-y-4 mb-4">
                            {scen.steps.map((step: string, si: number) => (
                              <div key={si} className="relative">
                                <div className="absolute w-2 h-2 bg-[#EF4444] rounded-full -left-[21px] top-1.5 border border-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                <div className="text-xs font-medium text-[#E2E8F0]">{step}</div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-[#170D12] p-3 rounded border border-[#5C202B]">
                            <div className="text-[10px] uppercase font-bold text-[#A7B0BA] mb-1">Potential Impact</div>
                            <ul className="list-disc pl-4 text-xs text-[#FFFFFF] space-y-0.5 marker:text-[#EF4444]">
                              {scen.impacts.map((imp: string, ii: number) => (
                                <li key={ii}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="text-sm text-[#94A3B8] italic p-3 bg-[#170D12] rounded border border-[#57202A] shadow-sm">No exposed network services were identified.</div>
                    )}
                  </div>
                </div>

                {/* Exposed Services */}
                {offense.exposed_services.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#C62838] pb-2">EXPOSED SERVICES</h3>
                    <div className="space-y-3">
                      {offense.exposed_services.map((srv: any, i: number) => {
                        let riskColor = "text-[#60A5FA] bg-[#172554] border-[#1E3A8A]";
                        if (srv.risk === 'Critical') riskColor = "text-[#FCA5A5] bg-[#3B1119] border-[#9F1D2E]";
                        if (srv.risk === 'High') riskColor = "text-[#FDBA74] bg-[#431407] border-[#9A3412]";
                        if (srv.risk === 'Medium') riskColor = "text-[#FCD34D] bg-[#451A03] border-[#B45309]";

                        return (
                        <div key={i} className="bg-[#170D12] p-3 rounded-lg border border-[#57202A] shadow-sm hover:border-[#EF4444] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-[#F8FAFC]">{srv.port}</span>
                              <span className="text-xs font-semibold text-[#94A3B8]">{srv.protocol}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#160B10] border border-[#5C202B] text-[#E2E8F0]">{srv.service}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor}`}>{srv.risk} Risk</span>
                          </div>
                          <div className="text-xs text-[#94A3B8] mb-2 truncate">Version: {srv.version}</div>
                          <div className="flex flex-wrap gap-1">
                            {srv.categories?.map((cat: string, ci: number) => (
                              <span key={ci} className="text-[9px] px-1.5 py-0.5 rounded bg-[#160B10] text-[#94A3B8] border border-[#5C202B]">{cat}</span>
                            ))}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* Key Findings */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#C62838] pb-2">KEY FINDINGS</h3>
                  <div className="overflow-x-auto bg-[#0B1725] rounded-lg border border-[#1B405A] shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase text-[#7FA3BB] bg-[#0F2235] border-b border-[#1B405A]">
                        <tr>
                          <th className="px-3 py-3 font-semibold">Port/Service</th>
                          <th className="px-3 py-3 font-semibold">Version</th>
                          <th className="px-3 py-3 font-semibold">Exposure</th>
                          <th className="px-3 py-3 font-semibold">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#E2E8F0] text-xs">
                        {offense.key_findings.map((f: any, i: number) => {
                           return (
                            <tr key={i} className="border-b border-[#1B405A] bg-[#0B1725] hover:bg-[#0F2235] last:border-0 transition-colors">
                              <td className="px-3 py-3 font-mono text-[#94A3B8] whitespace-nowrap">{f.port} / {f.service}</td>
                              <td className="px-3 py-3 truncate max-w-[80px]" title={f.version}>{f.version}</td>
                              <td className="px-3 py-3">
                                {f.cves > 0 ? (
                                  <span className="text-[#EF4444] font-semibold">{f.cves} CVEs</span>
                                ) : (
                                  <span className="text-[#94A3B8]">{f.exposure}</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-[#A8BBCB] truncate max-w-[150px]" title={f.impact}>{f.impact}</td>
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
            <div className="bg-[#071522] border border-[#1685C7] shadow-[0_0_18px_rgba(14,165,233,0.10)] rounded-xl overflow-hidden relative">
              <div className="p-5 border-b border-[#155E85] bg-[#091C2C] flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#29B6F6] flex items-center gap-2">
                    <Shield size={20} className="text-[#38BDF8]" /> DEFENSE
                  </h2>
                  <p className="text-xs text-[#8EAFC6] mt-1">How to monitor, prevent and respond?</p>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#082D45] text-[#67D7FF] rounded border border-[#12658D] font-semibold">
                  Defender Perspective
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Control Coverage */}
                  <div className="bg-[#0A1A29] p-4 rounded-lg border border-[#164562] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Control Coverage</h3>
                    <div className="h-40 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={coverageData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none">
                            {coverageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0A1A29', borderColor: '#164562', color: '#F8FAFC' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#FFFFFF]">{controlCoverage}%</span>
                        <span className="text-[10px] font-medium text-[#8EAFC6] uppercase">Coverage</span>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Priority */}
                  <div className="bg-[#0A1A29] p-4 rounded-lg border border-[#164562] shadow-sm">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4 tracking-wider uppercase text-center">Monitoring Priority</h3>
                    <div className="h-40 relative">
                      {monitoringPriorities.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={monitoringPriorities} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {monitoringPriorities.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0A1A29', borderColor: '#164562', color: '#F8FAFC' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#64748B] text-sm">No priority areas</div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Activity size={24} className="text-[#8EAFC6]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Defense Monitoring Playbooks */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#1E3A8A] pb-2">DEFENSE MONITORING PLAYBOOKS</h3>
                  <div className="space-y-4">
                    {defense.playbooks && defense.playbooks.length > 0 ? defense.playbooks.map((playbook: any, i: number) => {
                      return (
                      <div key={i} className="bg-[#0A1A29] rounded-lg border border-[#174B6B] border-l-4 border-l-[#2196D3] shadow-sm overflow-hidden hover:border-[#2196D3] transition-colors">
                        <div className="bg-[#091C2C] p-3 border-b border-[#174B6B] flex items-center gap-2">
                          <CheckCircle size={16} className="text-[#38BDF8]" />
                          <span className="font-bold text-[#FFFFFF] text-sm font-mono">{playbook.port} / {playbook.service}</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#082D45] text-[#67D7FF] font-bold uppercase tracking-wider border border-[#12658D]">Playbook</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#60A5FA] mb-1 flex items-center gap-1"><Activity size={12}/> Monitor</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#60A5FA]">
                              {playbook.monitor.map((m: string, mi: number) => <li key={mi}>{m}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#F59E0B] mb-1 flex items-center gap-1"><Search size={12}/> Detect</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#F59E0B]">
                              {playbook.detect.map((d: string, di: number) => <li key={di}>{d}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#22C55E] mb-1 flex items-center gap-1"><Shield size={12}/> Prevent</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#22C55E]">
                              {playbook.prevent.map((p: string, pi: number) => <li key={pi}>{p}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#EF4444] mb-1 flex items-center gap-1"><Zap size={12}/> Respond</div>
                            <ul className="list-disc pl-4 text-xs text-[#E2E8F0] space-y-0.5 marker:text-[#EF4444]">
                              {playbook.respond.map((r: string, ri: number) => <li key={ri}>{r}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="text-sm text-[#8EAFC6] italic p-3 bg-[#0A1A29] rounded border border-[#164562] shadow-sm">No exposed services requiring service-specific monitoring were identified.</div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#0A1A29] border border-[#164562] rounded-lg p-4 text-center shadow-sm hover:border-[#2196D3] transition-colors">
                    <div className="text-3xl font-bold text-[#F8FAFC] mb-1">{recommendations.length}</div>
                    <div className="text-[10px] text-[#8EAFC6] uppercase tracking-widest font-bold">Controls Advised</div>
                  </div>
                  <div className="bg-[#0A1A29] border border-[#164562] rounded-lg p-4 text-center shadow-sm hover:border-[#2196D3] transition-colors">
                    <div className="text-2xl font-bold text-[#60A5FA] mb-1 mt-1">{counts.critical > 0 ? 'High Risk' : 'Moderate'}</div>
                    <div className="text-[10px] text-[#8EAFC6] uppercase tracking-widest font-bold">Security Posture</div>
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

const MetricCard = ({ title, value, color = "#8FA6BD", colSpan = "col-span-1" }: { title: string, value: string | number, color?: string, colSpan?: string }) => (
  <div className={`bg-[#0A1828] border border-[#173A55] rounded-lg p-4 shadow-sm ${colSpan} flex flex-col justify-center transition-all hover:border-[#2196D3]`}>
    <div className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#8FA6BD' }}>
      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color }}></div>
      {title}
    </div>
    <div className="text-2xl font-bold text-[#F8FAFC] truncate" title={String(value)}>{value}</div>
  </div>
);

export default Dashboard;
