import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Phone, AlertCircle } from 'lucide-react';
import { DISTRICTS } from '../../constants/districts';

const PIN_COLORS = {
  OPEN_AVAILABLE: '#22c55e', // Green
  NEAR_CAPACITY: '#f59e0b', // Amber
  FULL: '#ef4444', // Red
  TEMPORARILY_CLOSED: '#64748b', // Slate
  UNKNOWN: '#94a3b8' // Slate light
};

const createPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

export default function ResourceMap({ resources = [], selectedDistrictId }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [tileError, setTileError] = useState(false);

  const selectedDist = DISTRICTS.find(d => d.id === selectedDistrictId);
  const centerLat = selectedDist?.lat || 26.2006;
  const centerLng = selectedDist?.lng || 92.9376;
  const zoom = selectedDist?.lat ? 11 : 7;

  // Filter resources with coordinates
  const validResources = resources.filter(r => r.latitude && r.longitude);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        scrollWheelZoom: false
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], zoom);
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, zoom]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    validResources.forEach((res) => {
      const pinColor = PIN_COLORS[res.capacity_status] || '#0284c7';
      const icon = createPinIcon(pinColor);

      const marker = L.marker([res.latitude, res.longitude], { icon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; min-width: 170px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0369a1; margin-bottom: 2px;">
            ${res.type?.replace(/_/g, ' ')}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
            ${res.name}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            ${res.landmark || res.area}
          </div>
          <div style="margin-bottom: 6px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #e0f2fe; color: #0369a1;">
              Status: ${res.capacity_status?.replace(/_/g, ' ')}
            </span>
          </div>
          ${res.contact_phone ? `
            <a href="tel:${res.contact_phone}" style="display: inline-block; font-size: 11px; font-weight: 700; color: #0284c7; text-decoration: none;">
              📞 Call: ${res.contact_phone}
            </a>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current.addLayer(marker);
    });
  }, [validResources]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-sky-400" />
          Interactive Relief Shelter Map
        </h3>
        <span className="text-[11px] text-slate-400">
          {validResources.length} mapped locations
        </span>
      </div>

      <div className="h-72 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 relative shadow-inner">
        {tileError && (
          <div className="absolute top-2 left-2 right-2 z-20 bg-amber-950/90 text-amber-200 border border-amber-600/60 p-2 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Map tiles unavailable in offline mode. The directory below is fully accessible.</span>
          </div>
        )}

        <div ref={mapContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
