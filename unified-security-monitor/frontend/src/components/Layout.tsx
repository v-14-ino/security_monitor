import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Settings, Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[var(--bg-body)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(14, 82, 140, 0.10) 0%, transparent 70%)' }}></div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-[var(--border-primary)] bg-[var(--bg-header)] flex items-center justify-between px-8 z-20 shadow-sm relative transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-50/10 border border-[var(--accent-blue)] flex items-center justify-center text-[var(--accent-cyan)] transition-colors duration-300">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-[var(--text-primary)] font-bold tracking-wide text-sm transition-colors duration-300">Security Monitor</h1>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-0.5 font-medium transition-colors duration-300">Discover • Analyze • Defend</p>
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
                <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse"></span>
                <span className="text-[var(--text-secondary)] transition-colors duration-300">System Online</span>
              </div>
              <div className="h-4 w-px bg-[var(--border-primary)] transition-colors duration-300"></div>
              <span className="text-[var(--text-secondary)] transition-colors duration-300">Last Updated: Just now</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 hover:bg-[var(--bg-card)] rounded-lg">
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
            ? 'text-[var(--accent-blue)] bg-[var(--bg-card)] font-bold border-[var(--accent-blue)]'
            : 'text-[var(--text-secondary)] bg-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border-transparent'
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
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors duration-300"
      >
        {getIcon(theme)}
        {getLabel(theme)}
        <ChevronDown size={14} className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-[var(--bg-header)] border border-[var(--border-primary)] z-50 overflow-hidden">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); setIsOpen(false); }}
              className={`w-full text-left flex items-center px-4 py-2 text-xs transition-colors duration-200 ${
                theme === t 
                  ? 'bg-[var(--bg-card)] text-[var(--accent-blue)] font-bold' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
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
