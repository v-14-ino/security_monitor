import React, { useState, useEffect } from 'react';
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
        <Shield className="text-blue-600" size={24} />
        <h2 className="text-xl font-semibold text-slate-900">Scan History</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700 tracking-wide">Previous Assessments</h3>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium">
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
            <table className="w-full text-left text-sm text-[#475569]">
              <thead className="text-xs uppercase bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
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
              <tbody className="divide-y divide-[#E2E8F0] bg-[#FFFFFF]">
                {scans.map((scan, idx) => (
                  <tr key={idx} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-[#475569]">{scan.scan_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#0F172A]">
                      {scan.target}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#475569]">
                      {new Date(scan.scan_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-semibold text-[#475569]">
                      {scan.scan_mode}
                    </td>
                    <td className="px-6 py-4 text-[#0F172A] font-medium">
                      {scan.ports}
                    </td>
                    <td className="px-6 py-4">
                      {scan.vulnerabilities > 0 ? (
                         <span className="text-orange-600 font-bold">{scan.vulnerabilities}</span>
                      ) : (
                         <span className="text-[#475569]">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold bg-green-50 text-green-700 border border-green-200">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/dashboard?assessment=${scan.scan_id}`} className="text-blue-600 hover:text-blue-700 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors border border-blue-100">
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
