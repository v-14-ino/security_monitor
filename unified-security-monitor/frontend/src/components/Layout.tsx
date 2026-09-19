import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Settings, Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#06101D] text-[#0F172A] dark:text-[#F8FAFC] font-sans overflow-hidden transition-colors duration-300">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(14, 82, 140, 0.10) 0%, transparent 70%)' }}></div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-[#E2E8F0] dark:border-[#18314A] bg-[#FFFFFF] dark:bg-[#071321] flex items-center justify-between px-8 z-20 shadow-sm relative transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-50 dark:bg-[#102A46] border border-blue-200 dark:border-[#1689D8] flex items-center justify-center text-blue-600 dark:text-[#22D3EE] transition-colors duration-300">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-[#0F172A] dark:text-[#F8FAFC] font-bold tracking-wide text-sm transition-colors duration-300">Security Monitor</h1>
              <p className="text-[10px] text-[#64748B] dark:text-[#8FA6BD] uppercase tracking-widest mt-0.5 font-medium transition-colors duration-300">Discover • Analyze • Defend</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/history" label="History" />
            <NavItem to="/reports" label="Reports" />
            <NavItem to="/about" label="About" />
          </nav>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                <span className="text-[#64748B] dark:text-[#8FA6BD] transition-colors duration-300">System Online</span>
              </div>
              <div className="h-4 w-px bg-[#E2E8F0] dark:bg-[#18314A] transition-colors duration-300"></div>
              <span className="text-[#64748B] dark:text-[#8FA6BD] transition-colors duration-300">Last Updated: Just now</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <button className="text-[#64748B] dark:text-[#8FA6BD] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors p-2 hover:bg-slate-100 dark:hover:bg-[#102A46] rounded-lg">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
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
        `px-4 py-2 rounded-lg transition-all duration-300 border-b-2 ${
          isActive
            ? 'text-[#2563EB] bg-blue-50 font-bold border-[#2563EB] dark:text-[#60C7FF] dark:bg-[#102A46] dark:border-[#1689D8]'
            : 'text-[#64748B] bg-transparent hover:text-[#0F172A] hover:bg-slate-100 border-transparent dark:text-[#8FA6BD] dark:hover:text-[#F8FAFC] dark:hover:bg-[#102A46]'
        }`
      }
    >
      {label}
    </NavLink>
  );
};

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (t: string) => {
    if (t === 'light') return <Sun size={14} className="mr-2" />;
    if (t === 'dark') return <Moon size={14} className="mr-2" />;
    return <Laptop size={14} className="mr-2" />;
  };

  const getLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 dark:border-[#18314A] dark:bg-[#102A46] dark:text-[#8FA6BD] dark:hover:text-[#F8FAFC] transition-colors duration-300"
      >
        {getIcon(theme)}
        {getLabel(theme)}
        <ChevronDown size={14} className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-white border border-[#E2E8F0] dark:bg-[#071321] dark:border-[#18314A] z-50 overflow-hidden">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); setIsOpen(false); }}
              className={`w-full text-left flex items-center px-4 py-2 text-xs transition-colors duration-200 ${
                theme === t 
                  ? 'bg-blue-50 text-[#2563EB] dark:bg-[#102A46] dark:text-[#60C7FF] font-bold' 
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] dark:text-[#8FA6BD] dark:hover:bg-[#102A46] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {getIcon(t)}
              {getLabel(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Layout;
