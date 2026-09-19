import React from 'react';
import { Shield, Search, Target, Lock, Server, Terminal, Crosshair, AlertTriangle } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 transition-colors duration-300">
      <div className="bg-white dark:bg-[#091827] border border-[#E2E8F0] dark:border-[#1A4263] rounded-xl p-8 shadow-sm dark:shadow-[0_0_18px_rgba(14,82,140,0.10)] relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-[#102A46] border border-blue-200 dark:border-[#1689D8] flex items-center justify-center text-blue-600 dark:text-[#22D3EE] transition-colors duration-300">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] transition-colors duration-300">Unified Security Monitor</h1>
            <p className="text-sm text-[#64748B] dark:text-[#8FA6BD] mt-1 uppercase tracking-widest font-medium transition-colors duration-300">Enterprise SOC Dashboard & Assessment Platform</p>
          </div>
        </div>
        
        <p className="text-[#64748B] dark:text-[#A8BBCB] leading-relaxed max-w-3xl transition-colors duration-300">
          Security Monitor is a premium, dual-perspective cybersecurity assessment tool designed to simulate adversary perspectives while providing actionable defender playbooks. By bridging the gap between offensive exposure and defensive controls, it provides a holistic view of your attack surface.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Capabilities */}
        <div className="bg-slate-50 dark:bg-[#071522] border border-[#E2E8F0] dark:border-[#164562] rounded-xl p-6 shadow-sm transition-colors duration-300">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#60C7FF] mb-6 flex items-center gap-2 border-b border-[#E2E8F0] dark:border-[#164562] pb-3 uppercase tracking-wider transition-colors duration-300">
            <Target size={18} /> Core Capabilities
          </h2>
          <div className="space-y-4">
            <FeatureRow icon={<Search size={16}/>} title="Service Discovery" desc="Automated mapping of exposed ports, protocols, and service versions." />
            <FeatureRow icon={<AlertTriangle size={16}/>} title="Vulnerability Analysis" desc="Real-time CVE mapping and risk severity evaluation." />
            <FeatureRow icon={<Crosshair size={16}/>} title="Simulated Offense" desc="Data-driven modeling of potential attack scenarios based on actual exposure." />
            <FeatureRow icon={<Shield size={16}/>} title="Defender Playbooks" desc="Actionable monitoring, detection, and response recommendations." />
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-slate-50 dark:bg-[#071522] border border-[#E2E8F0] dark:border-[#164562] rounded-xl p-6 shadow-sm transition-colors duration-300">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#60C7FF] mb-6 flex items-center gap-2 border-b border-[#E2E8F0] dark:border-[#164562] pb-3 uppercase tracking-wider transition-colors duration-300">
            <Server size={18} /> Technology Stack
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <TechCard title="Frontend" items={["React 19", "TypeScript", "Tailwind CSS", "Recharts", "Vite"]} />
            <TechCard title="Backend" items={["Python", "Flask", "Nmap Integration", "CVE Database", "REST API"]} />
          </div>
        </div>
      </div>

      {/* Dual Perspective Architecture */}
      <div className="bg-white dark:bg-[#091827] border border-[#E2E8F0] dark:border-[#1A4263] rounded-xl p-8 shadow-sm transition-colors duration-300">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-6 uppercase tracking-wider transition-colors duration-300">Dual Perspective Architecture</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50 dark:bg-[#120B10] p-6 rounded-lg border border-red-200 dark:border-[#9F1D2E] transition-colors duration-300">
            <h3 className="text-red-600 dark:text-[#FF4D55] font-bold mb-3 flex items-center gap-2"><Crosshair size={18}/> OFFENSE (Red Team)</h3>
            <p className="text-sm text-slate-600 dark:text-[#A98B93] mb-4">Focuses on discovering the attack surface exactly as an external threat actor would see it.</p>
            <ul className="text-xs text-slate-700 dark:text-[#E2E8F0] space-y-2 list-disc pl-4 marker:text-red-500">
              <li>Port and Service enumeration</li>
              <li>Version-specific vulnerability mapping</li>
              <li>Attack vector simulation</li>
              <li>Risk distribution and severity scoring</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-[#0A1A29] p-6 rounded-lg border border-blue-200 dark:border-[#1685C7] transition-colors duration-300">
            <h3 className="text-blue-600 dark:text-[#38BDF8] font-bold mb-3 flex items-center gap-2"><Shield size={18}/> DEFENSE (Blue Team)</h3>
            <p className="text-sm text-slate-600 dark:text-[#8EAFC6] mb-4">Focuses on mitigating risks identified during the offensive assessment.</p>
            <ul className="text-xs text-slate-700 dark:text-[#E2E8F0] space-y-2 list-disc pl-4 marker:text-blue-500">
              <li>Control coverage calculation</li>
              <li>Log monitoring priorities</li>
              <li>Service-specific detection playbooks</li>
              <li>Incident response strategies</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safety & Scope */}
      <div className="bg-amber-50 dark:bg-[#1A1408] border border-amber-200 dark:border-[#B45309] rounded-xl p-6 shadow-sm flex items-start gap-4 transition-colors duration-300">
        <Lock className="text-amber-600 dark:text-[#F59E0B] flex-shrink-0 mt-1" size={24} />
        <div>
          <h2 className="text-sm font-bold text-amber-800 dark:text-[#FCD34D] mb-2 uppercase tracking-wider transition-colors duration-300">Safety & Scope Boundary</h2>
          <p className="text-sm text-amber-700 dark:text-[#D97706] leading-relaxed transition-colors duration-300">
            This platform operates in a strict, non-destructive assessment mode. It performs passive and active discovery (like banner grabbing and port scanning) but <strong>does not</strong> execute exploits, send malicious payloads, brute-force credentials, or modify the target environment. All attack scenarios presented are data-driven simulations based on discovered metadata.
          </p>
        </div>
      </div>

    </div>
  );
};

const FeatureRow = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-[#2563EB] dark:text-[#38BDF8]">{icon}</div>
    <div>
      <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">{title}</div>
      <div className="text-xs text-[#64748B] dark:text-[#8EAFC6] mt-0.5">{desc}</div>
    </div>
  </div>
);

const TechCard = ({ title, items }: { title: string, items: string[] }) => (
  <div className="bg-white dark:bg-[#0A1A29] p-4 rounded-lg border border-[#E2E8F0] dark:border-[#1A3652]">
    <div className="text-xs font-bold text-[#0F172A] dark:text-[#8EAFC6] mb-3 uppercase tracking-wider">{title}</div>
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-xs text-[#64748B] dark:text-[#F8FAFC] flex items-center gap-2">
          <Terminal size={10} className="text-[#2563EB] dark:text-[#38BDF8]"/> {item}
        </li>
      ))}
    </ul>
  </div>
);

export default About;
