import { useState, useEffect } from 'react';
import { Shield, Clock } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const History = () => {
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/scans`)
      .then(res => res.json())
      .then(data => setScans(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-blue-600 dark:text-blue-400" size={24} />
        <h2 className="text-xl font-semibold text-slate-900 text-[var(--text-primary)]">Scan History</h2>
      </div>

      <div className="bg-[var(--bg-panel)] bg-[var(--bg-header)] border border-[var(--border-primary)] border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="p-5 border-b border-[var(--border-primary)] border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-card)] bg-[var(--bg-body)] transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-700 text-[var(--text-primary)] tracking-wide">Previous Assessments</h3>
          <span className="text-xs bg-slate-200 dark:bg-[#102A46] text-slate-600 text-[var(--text-secondary)] px-2 py-1 rounded font-medium transition-colors duration-300">
            {scans.length} records
          </span>
        </div>
        
        {scans.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Clock size={32} className="mx-auto mb-3 opacity-50" />
            <p>No scan history available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="text-xs uppercase bg-[var(--table-header)] bg-[var(--bg-body)] border-b border-[#E2E8F0] border-[var(--border-primary)] text-[var(--text-secondary)] text-[var(--text-secondary)] transition-colors duration-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Scan ID</th>
                  <th className="px-6 py-4 font-semibold">Target</th>
                  <th className="px-6 py-4 font-semibold">Started</th>
                  <th className="px-6 py-4 font-semibold">Mode</th>
                  <th className="px-6 py-4 font-semibold">Open Ports</th>
                  <th className="px-6 py-4 font-semibold">Findings</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--grid-border)] divide-[var(--grid-border)] bg-[var(--table-body)] bg-[var(--bg-header)] transition-colors duration-300">
                {scans.map((scan, idx) => (
                  <tr key={idx} className="hover:bg-[var(--table-header)] hover:bg-[var(--table-header)] transition-colors duration-300">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-[var(--text-secondary)] text-[var(--text-secondary)]">{scan.scan_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)] text-[var(--text-primary)]">
                      {scan.target}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-secondary)] text-[var(--text-secondary)]">
                      {new Date(scan.scan_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-semibold text-[var(--text-secondary)] text-[var(--text-secondary)]">
                      {scan.scan_mode}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-primary)] text-[var(--text-primary)] font-medium">
                      {scan.ports}
                    </td>
                    <td className="px-6 py-4">
                      {scan.vulnerabilities > 0 ? (
                         <span className="text-orange-600 dark:text-orange-400 font-bold">{scan.vulnerabilities}</span>
                      ) : (
                         <span className="text-[var(--text-secondary)] text-[var(--text-secondary)]">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold bg-green-50 dark:bg-[#062615] text-green-700 dark:text-[#22C55E] border border-green-200 dark:border-[#0F5A30]">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/dashboard?assessment=${scan.scan_id}`} className="text-blue-600 dark:text-[#60C7FF] hover:text-blue-700 dark:hover:text-[#F8FAFC] font-medium text-xs bg-blue-50 dark:bg-[#102A46] hover:bg-blue-100 dark:hover:bg-[#1A4263] px-3 py-1.5 rounded transition-colors border border-blue-100 dark:border-[#1689D8]">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
