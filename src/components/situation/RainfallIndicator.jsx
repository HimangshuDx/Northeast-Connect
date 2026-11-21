import React, { useState, useEffect } from 'react';
import { CloudRain, CloudLightning, Sun, Droplets, Info } from 'lucide-react';
import { DISTRICTS } from '../../constants/districts';

export default function RainfallIndicator({ districtId }) {
  const [rainfallData, setRainfallData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPrecipitation = async () => {
      const district = DISTRICTS.find(d => d.id === districtId) || DISTRICTS[1];
      if (!district.lat || !district.lng) return;

      setLoading(true);
      setError(false);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${district.lat}&longitude=${district.lng}&current=precipitation,rain,weather_code&hourly=precipitation&forecast_days=1`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('API response not ok');
        const data = await res.json();
        
        if (active) {
          const currentRain = data.current?.precipitation || data.current?.rain || 0;
          // Calculate max hourly rain in next 6 hours
          const next6HoursRain = data.hourly?.precipitation?.slice(0, 6) || [];
          const maxRain = Math.max(currentRain, ...next6HoursRain, 0);

          let riskLevel = 'Low';
          let color = 'text-emerald-400 bg-emerald-950/60 border-emerald-600/40';
          let desc = 'Minimal rainfall expected. Drainage functioning normally.';

          if (maxRain > 15) {
            riskLevel = 'High';
            color = 'text-rose-400 bg-rose-950/60 border-rose-600/40';
            desc = 'Heavy precipitation (>15mm/hr). High risk of flash flooding and road washouts.';
          } else if (maxRain > 3) {
            riskLevel = 'Medium';
            color = 'text-amber-400 bg-amber-950/60 border-amber-600/40';
            desc = 'Moderate rainfall expected. Watch for localized waterlogging in low terrain.';
          }

          setRainfallData({
            currentRain,
            maxRain,
            riskLevel,
            color,
            desc
          });
        }
      } catch (err) {
        if (active) {
          setError(true);
          // Graceful fallback simulation based on active alerts
          setRainfallData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPrecipitation();
    return () => { active = false; };
  }, [districtId]);

  return (
    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Monsoon Rainfall Indicator</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-500" />
          Open-Meteo
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-1 text-xs text-slate-400 animate-pulse">
          <CloudRain className="w-4 h-4 text-sky-400" />
          <span>Assessing atmospheric radar data...</span>
        </div>
      ) : error || !rainfallData ? (
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CloudRain className="w-4 h-4 text-slate-500" />
            <span>Monsoon radar offline. Refer to local DDMA weather bulletins.</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            STANDBY
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${rainfallData.color}`}>
              {rainfallData.riskLevel === 'High' ? (
                <CloudLightning className="w-5 h-5 text-rose-400 animate-pulse" />
              ) : rainfallData.riskLevel === 'Medium' ? (
                <CloudRain className="w-5 h-5 text-amber-400" />
              ) : (
                <Sun className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Rain Risk: {rainfallData.riskLevel}</span>
                <span className="text-xs text-slate-400">({rainfallData.maxRain} mm/hr peak)</span>
              </div>
              <p className="text-[11px] text-slate-300">{rainfallData.desc}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-500 mt-2 italic border-t border-slate-750 pt-1.5">
        Rainfall indicator. Not an official forecast. Always adhere to ASDMA/IMD official orders.
      </p>
    </div>
  );
}
