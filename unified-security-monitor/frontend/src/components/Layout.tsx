import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Settings } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#070B14] text-[#F8FAFC] font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-[#1E293B] bg-[#0A1020] flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#111C33] border border-[#3B82F6] flex items-center justify-center text-[#22D3EE]">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-[#F8FAFC] font-bold tracking-wide text-sm">Security Monitor</h1>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest mt-0.5 font-medium">Discover • Analyze • Defend</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/history" label="History" />
            <NavItem to="/reports" label="Reports" />
            <div className="text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C33] rounded-lg px-4 py-2 cursor-pointer transition-colors">About</div>
          </nav>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                <span className="text-[#94A3B8]">System Online</span>
              </div>
              <div className="h-4 w-px bg-[#334155]"></div>
              <span className="text-[#94A3B8]">Last Updated: Just now</span>
            </div>
            <button className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-2 hover:bg-[#111C33] rounded-lg">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 bg-[#070B14]">
          <div className="relative z-10 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg transition-all duration-200 border-b-2 ${
          isActive
            ? 'text-[#60A5FA] bg-[#111C33] font-bold border-[#3B82F6]'
            : 'text-[#94A3B8] bg-transparent hover:text-[#F8FAFC] hover:bg-[#111C33] border-transparent'
        }`
      }
    >
      {label}
    </NavLink>
  );
};

export default Layout;
