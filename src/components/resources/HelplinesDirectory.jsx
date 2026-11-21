import React, { useState, useEffect } from 'react';
import { PhoneCall, ShieldAlert, AlertCircle, Info } from 'lucide-react';

export default function HelplinesDirectory() {
  const [helplines, setHelplines] = useState([]);

  useEffect(() => {
    fetch('/data/helplines.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHelplines(data);
      })
      .catch(err => console.warn('Could not load helplines.json', err));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Official Emergency Helplines</h2>
        </div>
        <span className="text-xs text-rose-300 font-semibold">Toll-Free 24x7</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {helplines.map((line) => (
          <div
            key={line.id}
            className="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-600 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-750">
                  {line.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">{line.available}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-100">{line.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{line.description}</p>
            </div>

            <a
              href={`tel:${line.number}`}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-black text-sm bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-md transition-colors"
              aria-label={`Call ${line.name} at ${line.number}`}
            >
              <PhoneCall className="w-4 h-4 fill-white text-white" />
              <span>Dial {line.number}</span>
            </a>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 italic pt-1">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        Note: Verify helpline numbers locally before emergency use. Numbers connect directly through your device's cellular telephone network.
      </p>
    </div>
  );
}
