import React, { useState, useEffect } from 'react';
import { Waves, Mountain, Activity, CheckSquare, Shield, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SurvivalGuides() {
  const { language, setLanguage } = useApp();
  const [guides, setGuides] = useState([]);
  const [selectedGuideId, setSelectedGuideId] = useState('guide-flood');
  const [activePhase, setActivePhase] = useState('during'); // default to 'during' for immediate emergency action

  useEffect(() => {
    // Load bundled guides from public directory or fallback to hardcoded
    fetch('/data/guides.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setGuides(data);
        }
      })
      .catch(err => console.warn('Could not fetch guides.json, fallback in place', err));
  }, []);

  const activeGuide = guides.find(g => g.id === selectedGuideId) || guides[0];
  if (!activeGuide) return null;

  const getGuideTitle = (g) => {
    if (language === 'as' && g.title_as) return g.title_as;
    if (language === 'hi' && g.title_hi) return g.title_hi;
    return g.title;
  };

  const getPhaseData = (phaseKey) => {
    const phase = activeGuide.phases?.[phaseKey];
    if (!phase) return { title: phaseKey, items: [] };

    let title = phase.title;
    let items = phase.items;

    if (language === 'as') {
      if (phase.title_as) title = phase.title_as;
      if (phase.items_as) items = phase.items_as;
    } else if (language === 'hi') {
      if (phase.title_hi) title = phase.title_hi;
      if (phase.items_hi) items = phase.items_hi;
    }

    return { title, items };
  };

  const phaseContent = getPhaseData(activePhase);

  const getHazardIcon = (hazard) => {
    switch (hazard) {
      case 'FLOOD':
        return Waves;
      case 'LANDSLIDE':
        return Mountain;
      case 'EARTHQUAKE':
        return Activity;
      default:
        return Shield;
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-5">
      {/* Header & Language selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-750 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Offline Survival & Preparedness Guides
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-cached for offline access during blackout and network loss.
          </p>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
              language === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('as')}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
              language === 'as' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            অসমীয়া
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
              language === 'hi' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Guide Hazard Selection Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {guides.map((g) => {
          const Icon = getHazardIcon(g.hazard);
          const isSelected = g.id === selectedGuideId;

          return (
            <button
              key={g.id}
              onClick={() => setSelectedGuideId(g.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-750 hover:text-slate-200 border border-slate-750'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{g.hazard}</span>
            </button>
          );
        })}
      </div>

      {/* Title of Active Guide */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
        <h3 className="text-base sm:text-lg font-black text-sky-300">
          {getGuideTitle(activeGuide)}
        </h3>
      </div>

      {/* Before / During / After Phase Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { key: 'during', label: 'DURING (Action Now)', highlight: true },
          { key: 'before', label: 'BEFORE (Prep & Warning)' },
          { key: 'after', label: 'AFTER (Recovery & Safety)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActivePhase(tab.key)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold border-b-2 text-center transition-colors ${
              activePhase === tab.key
                ? tab.highlight
                  ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                  : 'border-sky-500 text-sky-300 bg-sky-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action Checklist */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Critical Checklist: {phaseContent.title}
        </h4>

        <div className="space-y-2.5">
          {phaseContent.items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-750 flex items-start gap-3 shadow-sm hover:border-slate-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
