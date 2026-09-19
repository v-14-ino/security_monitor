import React from 'react';
import { Network, Hash, Shield, HardDrive, Info } from 'lucide-react';
import type { PortAnalysis } from '../services/api';

interface OpenPortsProps {
  portAnalysis?: PortAnalysis;
}

export const OpenPorts: React.FC<OpenPortsProps> = ({ portAnalysis }) => {
  if (!portAnalysis || !portAnalysis.available || portAnalysis.open_port_count === 0 || !portAnalysis.ports || portAnalysis.ports.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <Network className="h-6 w-6 text-blue-500" />
            OPEN PORTS & SERVICES
          </h2>
        </div>
        <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50">
          No open port data available in this report.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mt-6 shadow-2xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
          <Network className="h-6 w-6 text-blue-500" />
          OPEN PORTS & SERVICES
        </h2>
        <span className="text-sm text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/20 font-medium">
          {portAnalysis.open_port_count} open port{portAnalysis.open_port_count !== 1 ? 's' : ''} detected
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold border-b border-slate-700 w-24">
                <div className="flex items-center gap-2"><Hash className="w-4 h-4" /> Port</div>
              </th>
              <th className="p-4 font-semibold border-b border-slate-700 w-32">
                <div className="flex items-center gap-2"><Network className="w-4 h-4" /> Service</div>
              </th>
              <th className="p-4 font-semibold border-b border-slate-700 w-48">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Product</div>
              </th>
              <th className="p-4 font-semibold border-b border-slate-700 w-48">
                <div className="flex items-center gap-2"><HardDrive className="w-4 h-4" /> Version</div>
              </th>
              <th className="p-4 font-semibold border-b border-slate-700">
                <div className="flex items-center gap-2"><Info className="w-4 h-4" /> Extra Info</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
            {portAnalysis.ports.map((entry, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono text-emerald-400 font-medium">
                  {entry.port}
                </td>
                <td className="p-4 text-slate-200 font-medium">
                  {entry.service}
                </td>
                <td className="p-4 text-slate-300">
                  {entry.product}
                </td>
                <td className="p-4 text-slate-400 text-sm font-mono">
                  {entry.version}
                </td>
                <td className="p-4 text-slate-500 text-sm">
                  {entry.extra_info && entry.extra_info !== 'Unknown' ? entry.extra_info : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
