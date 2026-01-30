/**
 * MissionMap - Futuristic tactical map component
 * Uses the existing MapView component with the Manus proxy
 * Features: Dark theme, pulse markers, HUD overlays
 */

import { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { MapPin, Lock, Target, Radio, Crosshair } from 'lucide-react';
import { MapView } from '@/components/Map';

// Area center coordinates for Jakarta neighborhoods
const areaCoordinates: Record<string, { lat: number; lng: number }> = {
  'Blok M': { lat: -6.2436, lng: 106.7981 },
  'Kemang': { lat: -6.2607, lng: 106.8137 },
  'SCBD': { lat: -6.2270, lng: 106.8085 },
  'Senopati': { lat: -6.2350, lng: 106.8010 },
  'Menteng': { lat: -6.1950, lng: 106.8400 },
  'PIK': { lat: -6.1100, lng: 106.7400 },
  'Sudirman': { lat: -6.2150, lng: 106.8180 },
  'Kuningan': { lat: -6.2300, lng: 106.8300 },
  'Kelapa Gading': { lat: -6.1600, lng: 106.9050 },
  'Jakarta': { lat: -6.2088, lng: 106.8456 },
};

// Dark tactical map style
const missionMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#6FCF97" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#3d4f5f" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d1f12" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f0f1a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#6FCF97" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#15152a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050510" }] },
];

// HUD Corner decorations
function HUDCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4 rotate-90',
    'bottom-left': 'bottom-4 left-4 -rotate-90',
    'bottom-right': 'bottom-4 right-4 rotate-180',
  };

  return (
    <div className={`absolute ${positionClasses[position]} pointer-events-none z-20`}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M0 40V0H40" stroke="#6FCF97" strokeWidth="2" strokeOpacity="0.5" />
        <path d="M0 30V0H30" stroke="#6FCF97" strokeWidth="1" strokeOpacity="0.3" />
      </svg>
    </div>
  );
}

// Scan line animation
function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <div 
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6FCF97]/50 to-transparent"
        style={{
          animation: 'scan 4s linear infinite',
        }}
      />
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Grid overlay
function GridOverlay() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10 opacity-10"
      style={{
        backgroundImage: `
          linear-gradient(to right, #6FCF97 1px, transparent 1px),
          linear-gradient(to bottom, #6FCF97 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  );
}

interface MissionMapProps {
  events: any[];
  isAuthenticated: boolean;
  className?: string;
}

export function MissionMap({ events, isAuthenticated, className = '' }: MissionMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Filter events with location data
  const eventsWithLocation = events.filter((e: any) => e.latitude && e.longitude || e.area);

  // Group events by area for non-authenticated users
  const areaGroups = eventsWithLocation.reduce((acc: Record<string, any[]>, event: any) => {
    const area = event.area || 'Jakarta';
    if (!acc[area]) acc[area] = [];
    acc[area].push(event);
    return acc;
  }, {});

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Apply dark tactical style
    map.setOptions({ styles: missionMapStyle });
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    if (isAuthenticated) {
      // LOGGED IN: Show specific location pins with pulse effect
      eventsWithLocation.forEach((event: any) => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const markerContent = document.createElement('div');
          markerContent.innerHTML = `
            <div style="position: relative; cursor: pointer;">
              <div style="
                position: absolute;
                inset: -8px;
                border-radius: 50%;
                background: rgba(111, 207, 151, 0.2);
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                background: rgba(111, 207, 151, 0.3);
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              "></div>
              <div style="
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #6FCF97;
                border: 2px solid white;
                box-shadow: 0 0 20px rgba(111, 207, 151, 0.5);
              "></div>
            </div>
            <style>
              @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
              @keyframes pulse { 50% { opacity: .5; } }
            </style>
          `;

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            title: event.title,
            content: markerContent,
          });

          // Add click listener
          marker.addListener('click', () => {
            window.location.href = `/gatherings/${event.id}`;
          });

          markersRef.current.push(marker);
        }
      });
    } else {
      // NOT LOGGED IN: Show area indicators only
      Object.entries(areaGroups).forEach(([area, areaEvents]) => {
        const coords = areaCoordinates[area] || areaCoordinates['Jakarta'];
        const eventCount = areaEvents.length;
        
        const markerContent = document.createElement('div');
        markerContent.innerHTML = `
          <div style="
            position: relative;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            border: 2px solid rgba(111, 207, 151, 0.5);
            border-radius: 24px;
            padding: 12px 20px;
            box-shadow: 0 0 30px rgba(111, 207, 151, 0.2);
            cursor: pointer;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #6FCF97;
                animation: pulse 2s infinite;
              "></div>
              <span style="
                color: #6FCF97;
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                font-family: monospace;
              ">${area}</span>
              <span style="
                color: rgba(255,255,255,0.5);
                font-size: 12px;
                font-family: monospace;
              ">(${eventCount})</span>
            </div>
          </div>
          <style>
            @keyframes pulse { 50% { opacity: .5; } }
          </style>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          title: `${area} - ${eventCount} events`,
          content: markerContent,
        });

        markersRef.current.push(marker);
      });
    }

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      if (isAuthenticated) {
        eventsWithLocation.forEach((event: any) => {
          const lat = parseFloat(event.latitude);
          const lng = parseFloat(event.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng });
          }
        });
      } else {
        Object.keys(areaGroups).forEach((area) => {
          const coords = areaCoordinates[area] || areaCoordinates['Jakarta'];
          bounds.extend(coords);
        });
      }
      map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
    }
  };

  if (eventsWithLocation.length === 0) {
    return (
      <div className={`bg-[#050508] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Crosshair className="w-12 h-12 text-[#6FCF97]/30 mx-auto mb-4" />
          <p className="text-[#6FCF97]/50 uppercase tracking-wider text-sm font-mono">No targets detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* HUD Corners */}
      <HUDCorner position="top-left" />
      <HUDCorner position="top-right" />
      <HUDCorner position="bottom-left" />
      <HUDCorner position="bottom-right" />

      {/* Grid Overlay */}
      <GridOverlay />

      {/* Scan Line */}
      <ScanLine />

      {/* Status Bar - Top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-sm border border-[#6FCF97]/30 rounded-full px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6FCF97] animate-pulse" />
            <span className="text-[#6FCF97] text-xs font-mono uppercase">
              {isAuthenticated ? 'CLEARANCE: ACTIVE' : 'CLEARANCE: PENDING'}
            </span>
          </div>
          <div className="w-px h-4 bg-[#6FCF97]/30" />
          <span className="text-white/60 text-xs font-mono">
            {eventsWithLocation.length} TARGETS
          </span>
        </div>
      </div>

      {/* Map */}
      <MapView
        className="w-full h-full"
        initialCenter={{ lat: -6.2088, lng: 106.8456 }}
        initialZoom={11}
        onMapReady={handleMapReady}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
    </div>
  );
}

export default MissionMap;
