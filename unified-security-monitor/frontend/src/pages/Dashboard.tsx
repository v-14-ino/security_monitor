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
      if (!assessmentId) {
        setScanResult(null);
        return;
      }
      
      const url = `${API_BASE}/scans/${assessmentId}`;
        
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setScanResult(data);
        } else {
          // It's okay if latest returns 404 (no scans yet)
          if (res.status !== 404) {
            setError('Failed to load assessment data.');
          }
        }
      } catch (e) {
        console.error(e);
        setError('Connection error loading assessment.');
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
    { name: 'Critical', value: counts.critical, color: 'var(--text-primary)' },
    { name: 'High', value: counts.high, color: 'var(--text-primary)' },
    { name: 'Medium', value: counts.medium, color: 'var(--text-primary)' },
    { name: 'Low', value: counts.low, color: 'var(--text-primary)' },
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
    { name: 'Covered', value: controlCoverage, color: 'var(--text-primary)' },
    { name: 'Gaps', value: 100 - controlCoverage, color: 'var(--text-primary)' }
  ];

  const DEF_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B'];
  const monitoringPriorities = defense.monitoring_priority.map((d: any, i: number) => ({
    name: d.name,
    value: 1, // Uniform distribution visually
    color: DEF_COLORS[i % DEF_COLORS.length]
  }));
  
  const recommendations = defense.recommendations || [];

  return (
    <div className="space-y-6 pb-12 transition-colors duration-300">
      {/* Top Assessment Control */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-primary)] rounded-xl p-6 shadow-sm relative z-10 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider transition-colors duration-300">Target IP / Domain</label>
            <input 
              type="text" 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all duration-300"
              placeholder="Target IP / Domain"
              disabled={isScanning}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider transition-colors duration-300">Scan Mode</label>
            <select 
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value)}
              disabled={isScanning}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] appearance-none transition-all duration-300"
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
        <div className="flex flex-col items-center justify-center py-32 text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)] border-dashed shadow-sm transition-colors duration-300">
          <Target size={64} className="mb-6 text-[var(--border-primary)] transition-colors duration-300" />
          <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-3 transition-colors duration-300">No Assessment Data</h2>
          <p className="text-[var(--text-secondary)] max-w-md text-center transition-colors duration-300">Enter a target and start an assessment to view attack surface, risks, findings and defensive recommendations.</p>
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
            <div className="bg-[var(--offense-bg)] border border-[var(--offense-border)] shadow-sm rounded-xl overflow-hidden relative transition-colors duration-300">
              <div className="p-5 border-b border-[var(--offense-border)] bg-[var(--offense-header)] flex justify-between items-center transition-colors duration-300">
                <div>
                  <h2 className="text-xl font-bold text-[var(--offense-title)] flex items-center gap-2 transition-colors duration-300">
                    <Crosshair size={20} className="text-[var(--offense-title)]" /> OFFENSE
                  </h2>
                  <p className="text-xs text-[var(--offense-title)] mt-1 transition-colors duration-300 opacity-80">What could potentially happen?</p>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[var(--bg-card)] text-[var(--offense-title)] rounded border border-[var(--offense-border)] font-semibold transition-colors duration-300">
                  Attacker Perspective
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Risk Distribution */}
                  <div className="bg-[var(--offense-card)] p-4 rounded-lg border border-[var(--offense-border)] shadow-sm transition-colors duration-300">
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-4 tracking-wider uppercase text-center transition-colors duration-300">Risk Distribution</h3>
                    <div className="h-40 relative">
                      {riskData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[var(--text-primary)] text-[var(--text-primary)] transition-colors duration-300">{cves.length}</span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] dark:text-[#91A3B5] uppercase transition-colors duration-300">Vulns</span>
                      </div>
                    </div>
                  </div>

                  {/* Attack Surface */}
                  <div className="bg-[var(--bg-card)] dark:bg-[#160C11] p-4 rounded-lg border border-red-100 dark:border-[#54202A] shadow-sm transition-colors duration-300">
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] text-[var(--text-primary)] mb-4 tracking-wider uppercase text-center transition-colors duration-300">Attack Surface (Services)</h3>
                    <div className="h-40 relative">
                      {attackSurfaceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={attackSurfaceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {attackSurfaceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[var(--text-primary)] text-[var(--text-primary)] transition-colors duration-300">{Object.keys(servicesMap).length}</span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] dark:text-[#91A3B5] uppercase transition-colors duration-300">Services</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Attack Scenarios */}
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#C62838] pb-2">SIMULATED ATTACK SCENARIOS</h3>
                  <div className="space-y-4">
                    {offense.scenarios && offense.scenarios.length > 0 ? offense.scenarios.map((scen: any, i: number) => {
                      let badgeClass = "bg-[var(--offense-card)] text-[var(--text-secondary)] border-[var(--offense-border)]";
                      if (scen.risk === 'Critical') badgeClass = "bg-[var(--accent-red)] text-white border-[var(--accent-red)]";
                      else if (scen.risk === 'High') badgeClass = "bg-[var(--accent-red)] text-white border-[var(--accent-red)]";
                      else if (scen.risk === 'Medium') badgeClass = "bg-[var(--accent-orange)] text-white border-[var(--accent-orange)]";
                      else if (scen.risk === 'Low') badgeClass = "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]";
                      
                      return (
                      <div key={i} className="bg-[var(--offense-card)] rounded-lg border border-[var(--offense-border)] border-l-4 border-l-[var(--accent-red)] shadow-sm overflow-hidden hover:border-[var(--accent-red)] transition-colors">
                        <div className="bg-[var(--offense-header)] p-3 border-b border-[var(--offense-border)] flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={16} className="text-[#EF4444]" />
                            <span className="font-bold text-white text-sm font-mono">{scen.port} / {scen.service}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeClass}`}>{scen.risk} Risk</span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                            {scen.title} 
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--offense-card)] text-[var(--text-secondary)] uppercase tracking-wider border border-[var(--offense-border)]">Simulated Scenario</span>
                          </h4>
                          <div className="relative pl-4 border-l-2 border-[var(--accent-red)] space-y-4 mb-4">
                            {scen.steps.map((step: string, si: number) => (
                              <div key={si} className="relative">
                                <div className="absolute w-2 h-2 bg-[var(--accent-red)] rounded-full -left-[21px] top-1.5 border border-[var(--accent-red)] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                <div className="text-xs font-medium text-[var(--text-primary)]">{step}</div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-[var(--offense-header)] p-3 rounded border border-[var(--offense-border)]">
                            <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Potential Impact</div>
                            <ul className="list-disc pl-4 text-xs text-white space-y-0.5 marker:text-[#EF4444]">
                              {scen.impacts.map((imp: string, ii: number) => (
                                <li key={ii}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="text-sm text-[var(--text-secondary)] italic p-3 bg-[var(--offense-header)] rounded border border-[var(--offense-border)] shadow-sm">No exposed network services were identified.</div>
                    )}
                  </div>
                </div>

                {/* Exposed Services */}
                {offense.exposed_services.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3 border-b border-[#C62838] pb-2">EXPOSED SERVICES</h3>
                    <div className="space-y-3">
                      {offense.exposed_services.map((srv: any, i: number) => {
                        let riskColor = "text-[var(--accent-blue)] bg-[#172554] border-[#1E3A8A]";
                        if (srv.risk === 'Critical') riskColor = "text-[#FCA5A5] bg-[var(--offense-card)] border-[var(--offense-border)]";
                        if (srv.risk === 'High') riskColor = "text-[#FDBA74] bg-[#431407] border-[#9A3412]";
                        if (srv.risk === 'Medium') riskColor = "text-[#FCD34D] bg-[#451A03] border-[#B45309]";

                        return (
                        <div key={i} className="bg-[var(--offense-header)] p-3 rounded-lg border border-[var(--offense-border)] shadow-sm hover:border-[var(--accent-red)] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-[#F8FAFC]">{srv.port}</span>
                              <span className="text-xs font-semibold text-[var(--text-secondary)]">{srv.protocol}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--offense-card)] border border-[var(--offense-border)] text-[var(--text-primary)]">{srv.service}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor}`}>{srv.risk} Risk</span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mb-2 truncate">Version: {srv.version}</div>
                          <div className="flex flex-wrap gap-1">
                            {srv.categories?.map((cat: string, ci: number) => (
                              <span key={ci} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--offense-card)] text-[var(--text-secondary)] border border-[var(--offense-border)]">{cat}</span>
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
                  <div className="overflow-x-auto bg-[var(--table-body)] rounded-lg border border-[var(--grid-border)] shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase text-[var(--text-secondary)] bg-[var(--table-header)] border-b border-[var(--grid-border)]">
                        <tr>
                          <th className="px-3 py-3 font-semibold">Port/Service</th>
                          <th className="px-3 py-3 font-semibold">Version</th>
                          <th className="px-3 py-3 font-semibold">Exposure</th>
                          <th className="px-3 py-3 font-semibold">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--text-primary)] text-xs">
                        {offense.key_findings.map((f: any, i: number) => {
                           return (
                            <tr key={i} className="border-b border-[var(--grid-border)] bg-[var(--table-body)] hover:bg-[var(--table-header)] last:border-0 transition-colors">
                              <td className="px-3 py-3 font-mono text-[var(--text-secondary)] whitespace-nowrap">{f.port} / {f.service}</td>
                              <td className="px-3 py-3 truncate max-w-[80px]" title={f.version}>{f.version}</td>
                              <td className="px-3 py-3">
                                {f.cves > 0 ? (
                                  <span className="text-[#EF4444] font-semibold">{f.cves} CVEs</span>
                                ) : (
                                  <span className="text-[var(--text-secondary)]">{f.exposure}</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-[var(--text-secondary)] truncate max-w-[150px]" title={f.impact}>{f.impact}</td>
                            </tr>
                           );
                        })}
                        {offense.key_findings.length === 0 && (
                          <tr><td colSpan={4} className="px-3 py-4 text-center text-[var(--text-secondary)]">No network exposure findings</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - DEFENSE */}
            <div className="bg-[var(--defense-bg)] border border-[var(--defense-border)] shadow-sm rounded-xl overflow-hidden relative transition-colors duration-300">
              <div className="p-5 border-b border-[var(--defense-border)] bg-[var(--defense-header)] flex justify-between items-center transition-colors duration-300">
                <div>
                  <h2 className="text-xl font-bold text-[var(--defense-title)] flex items-center gap-2 transition-colors duration-300">
                    <Shield size={20} className="text-[var(--defense-title)]" /> DEFENSE
                  </h2>
                  <p className="text-xs text-[var(--defense-title)] mt-1 transition-colors duration-300 opacity-80">How to monitor, prevent and respond?</p>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[var(--bg-card)] text-[var(--defense-title)] rounded border border-[var(--defense-border)] font-semibold transition-colors duration-300">
                  Defender Perspective
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Control Coverage */}
                  <div className="bg-[var(--defense-card)] p-4 rounded-lg border border-[var(--defense-border)] shadow-sm transition-colors duration-300">
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-4 tracking-wider uppercase text-center transition-colors duration-300">Control Coverage</h3>
                    <div className="h-40 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={coverageData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none">
                            {coverageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[var(--text-primary)] text-[var(--text-primary)] transition-colors duration-300">{controlCoverage}%</span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] dark:text-[var(--text-secondary)] uppercase transition-colors duration-300">Coverage</span>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Priority */}
                  <div className="bg-[var(--defense-card)] p-4 rounded-lg border border-[var(--defense-border)] shadow-sm transition-colors duration-300">
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-4 tracking-wider uppercase text-center transition-colors duration-300">Monitoring Priority</h3>
                    <div className="h-40 relative">
                      {monitoringPriorities.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={monitoringPriorities} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {monitoringPriorities.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color as string} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm transition-colors duration-300">No priority areas</div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Activity size={24} className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] transition-colors duration-300" />
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
                      <div key={i} className="bg-[var(--defense-card)] rounded-lg border border-[var(--defense-border)] border-l-4 border-l-[var(--accent-cyan)] shadow-sm overflow-hidden hover:border-[var(--accent-cyan)] transition-colors">
                        <div className="bg-[var(--defense-header)] p-3 border-b border-[var(--defense-border)] flex items-center gap-2">
                          <CheckCircle size={16} className="text-[var(--defense-title)]" />
                          <span className="font-bold text-white text-sm font-mono">{playbook.port} / {playbook.service}</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--defense-title)] font-bold uppercase tracking-wider border border-[var(--defense-border)]">Playbook</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[var(--accent-blue)] mb-1 flex items-center gap-1"><Activity size={12}/> Monitor</div>
                            <ul className="list-disc pl-4 text-xs text-[var(--text-primary)] space-y-0.5 marker:text-[var(--accent-blue)]">
                              {playbook.monitor.map((m: string, mi: number) => <li key={mi}>{m}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#F59E0B] mb-1 flex items-center gap-1"><Search size={12}/> Detect</div>
                            <ul className="list-disc pl-4 text-xs text-[var(--text-primary)] space-y-0.5 marker:text-[#F59E0B]">
                              {playbook.detect.map((d: string, di: number) => <li key={di}>{d}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#22C55E] mb-1 flex items-center gap-1"><Shield size={12}/> Prevent</div>
                            <ul className="list-disc pl-4 text-xs text-[var(--text-primary)] space-y-0.5 marker:text-[#22C55E]">
                              {playbook.prevent.map((p: string, pi: number) => <li key={pi}>{p}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#EF4444] mb-1 flex items-center gap-1"><Zap size={12}/> Respond</div>
                            <ul className="list-disc pl-4 text-xs text-[var(--text-primary)] space-y-0.5 marker:text-[#EF4444]">
                              {playbook.respond.map((r: string, ri: number) => <li key={ri}>{r}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="text-sm text-[var(--text-secondary)] italic p-3 bg-[var(--defense-card)] rounded border border-[var(--defense-border)] shadow-sm">No exposed services requiring service-specific monitoring were identified.</div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-[var(--defense-card)] border border-[var(--defense-border)] rounded-lg p-4 text-center shadow-sm hover:border-[var(--accent-cyan)] transition-colors">
                    <div className="text-3xl font-bold text-[#F8FAFC] mb-1">{recommendations.length}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">Controls Advised</div>
                  </div>
                  <div className="bg-[var(--defense-card)] border border-[var(--defense-border)] rounded-lg p-4 text-center shadow-sm hover:border-[var(--accent-cyan)] transition-colors">
                    <div className="text-2xl font-bold text-[var(--accent-blue)] mb-1 mt-1">{counts.critical > 0 ? 'High Risk' : 'Moderate'}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">Security Posture</div>
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

const MetricCard = ({ title, value, color, colSpan = "col-span-1" }: { title: string, value: string | number, color: string, colSpan?: string }) => (
  <div className={`${colSpan} bg-[var(--bg-panel)] border border-[var(--border-primary)] rounded-lg p-4 flex flex-col justify-center shadow-sm transition-colors duration-300`}>
    <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1 transition-colors duration-300">{title}</div>
    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
  </div>
);

export default Dashboard;
