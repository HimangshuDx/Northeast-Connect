import React from 'react';
import { Shield, Inbox, Globe, MapPin, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISTRICTS } from '../../constants/districts';

export default function Navbar({ onResetData }) {
  const { 
    selectedDistrict, 
    setSelectedDistrict, 
    language, 
    setLanguage, 
    outboxItems, 
    setIsOutboxOpen 
  } = useApp();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-[41px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-md shadow-sky-950/40 border border-sky-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white">Northeast Connect</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-950 text-sky-400 border border-sky-800">PS05</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Stay Informed. Stay Connected. Stay Prepared.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* District selector */}
          <div className="relative flex items-center">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
              aria-label="Select district filter"
            >
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language toggle */}
          <div className="relative hidden md:flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="pl-7 pr-2 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              aria-label="Select interface language"
            >
              <option value="en">English</option>
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            title="Reset sample data to initial state"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-amber-400 text-xs transition-colors"
            aria-label="Reset demo sample data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Outbox Drawer Trigger Button */}
          <button
            onClick={() => setIsOutboxOpen(true)}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            aria-label="View queued outbox submissions"
          >
            <Inbox className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Outbox</span>
            {outboxItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-bounce">
                {outboxItems.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
