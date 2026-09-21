import { useState, useEffect } from 'react';
import { FileText, Download, Target } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api`;

const Reports = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/scans`)
      .then(res => res.json())
      .then(data => setScans(data))
      .catch(console.error);
  }, []);

  const handleDownload = async (scanId: string, target: string) => {
    setIsDownloading(scanId);
    try {
      const res = await fetch(`${API_BASE}/reports/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scan_id: scanId })
      });
      
      if (!res.ok) throw new Error('PDF generation failed. Please check the backend report service.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security_report_${target}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      console.error('Download error:', e);
      alert(e.message || 'PDF generation failed. Please check the backend report service.');
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-emerald-600" size={24} />
        <h2 className="text-xl font-semibold text-slate-900">Security Reports</h2>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-card)]">
          <h3 className="text-sm font-semibold text-slate-700 tracking-wide">Available Reports</h3>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium">
            {scans.length} available
          </span>
        </div>
        
        {scans.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Target size={32} className="mx-auto mb-3 opacity-50" />
            <p>No reports generated yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-[var(--bg-card)] border-b border-[var(--border-primary)] text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Report Target</th>
                  <th className="px-6 py-4 font-semibold">Scan ID</th>
                  <th className="px-6 py-4 font-semibold">Created Date</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((scan, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-card)] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-slate-500" />
                      {scan.target} Assessment
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {scan.scan_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(scan.scan_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-semibold text-slate-500">
                      PDF Document
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDownload(scan.scan_id, scan.target)}
                        disabled={isDownloading === scan.scan_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-panel)] hover:bg-[var(--bg-card)] text-slate-700 transition-colors border border-slate-300 disabled:opacity-50 shadow-sm"
                      >
                        <Download size={14} /> 
                        {isDownloading === scan.scan_id ? 'Generating...' : 'Download PDF'}
                      </button>
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

export default Reports;
