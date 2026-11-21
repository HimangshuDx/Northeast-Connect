import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, AlertTriangle, Home, ShieldAlert, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    {
      to: '/',
      label: 'Situation',
      icon: Activity,
    },
    {
      to: '/report',
      label: 'Report / Help',
      icon: AlertTriangle,
      highlight: true
    },
    {
      to: '/resources',
      label: 'Shelters & Guides',
      icon: BookOpen,
    },
    {
      to: '/coordinator',
      label: 'Coordinator',
      icon: ShieldAlert,
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 shadow-2xl"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-bold transition-all min-w-[64px] min-h-[48px] ${
                    item.highlight && !isActive
                      ? 'text-rose-400 hover:text-rose-300'
                      : isActive
                      ? 'text-sky-400 bg-slate-800/80 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110 text-sky-400' : ''}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sub-Navbar Bar */}
      <div className="hidden md:block bg-slate-950 border-b border-slate-800/80 sticky top-[92px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                    isActive
                      ? 'border-sky-500 text-sky-400 bg-slate-900/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
