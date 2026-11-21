import React from 'react';
import { PhoneCall, AlertOctagon } from 'lucide-react';

export default function EmergencyStrip() {
  return (
    <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 border-b border-rose-700/60 text-white px-4 py-2 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-medium text-center sm:text-left">
          <AlertOctagon className="w-4 h-4 text-rose-300 flex-shrink-0 animate-pulse" />
          <span>
            <strong className="font-bold text-rose-200">EMERGENCY NOTICE:</strong> This app is an information & coordination tool. In immediate danger, call <strong className="underline text-white font-black">112</strong>.
          </span>
        </div>
        <a
          href="tel:112"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-white text-rose-900 hover:bg-rose-100 rounded-full font-black text-xs transition-colors shadow"
          aria-label="Call 112 National Emergency Helpline"
        >
          <PhoneCall className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
          <span>CALL 112 NOW</span>
        </a>
      </div>
    </div>
  );
}
