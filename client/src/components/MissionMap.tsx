/**
 * MissionMap v3 - District color-coded, click navigation
 * Dark tactical styling with hover-reveal markers
 */

import { useRef } from 'react';
import { MapView } from '@/components/Map';

// Jakarta center
const JAKARTA_CENTER = { lat: -6.2088, lng: 106.8200 };

// District color scheme
const DISTRICT_COLORS: Record<string, { primary: string; glow: string; rgba: string }> = {
  'West': { primary: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.4)', rgba: 'rgba(255, 107, 107, 0.3)' },      // Coral Red
  'North': { primary: '#4ECDC4', glow: 'rgba(78, 205, 196, 0.4)', rgba: 'rgba(78, 205, 196, 0.3)' },       // Teal
  'South': { primary: '#6FCF97', glow: 'rgba(111, 207, 151, 0.4)', rgba: 'rgba(111, 207, 151, 0.3)' },     // Mint (default)
  'East': { primary: '#FFE66D', glow: 'rgba(255, 230, 109, 0.4)', rgba: 'rgba(255, 230, 109, 0.3)' },      // Gold
  'Central': { primary: '#A78BFA', glow: 'rgba(167, 139, 250, 0.4)', rgba: 'rgba(167, 139, 250, 0.3)' },   // Purple
};

// Map areas to districts
const areaToDistrict: Record<string, string> = {
  'Blok M': 'South',
  'Kemang': 'South',
  'SCBD': 'South',
  'Senopati': 'South',
  'Menteng': 'Central',
  'PIK': 'North',
  'Sudirman': 'Central',
  'Kuningan': 'South',
  'Kelapa Gading': 'North',
  'Tangerang': 'West',
  'Cengkareng': 'West',
  'Grogol': 'West',
  'Cakung': 'East',
  'Bekasi': 'East',
  'Ciracas': 'East',
  'Jakarta': 'Central',
};

// District polygon boundaries (approximate)
const DISTRICT_POLYGONS: Record<string, { lat: number; lng: number }[]> = {
  'West': [
    { lat: -6.10, lng: 106.68 },
    { lat: -6.10, lng: 106.78 },
    { lat: -6.22, lng: 106.78 },
    { lat: -6.30, lng: 106.78 },
    { lat: -6.30, lng: 106.68 },
  ],
  'North': [
    { lat: -6.08, lng: 106.78 },
    { lat: -6.08, lng: 106.95 },
    { lat: -6.15, lng: 106.95 },
    { lat: -6.15, lng: 106.78 },
  ],
  'Central': [
    { lat: -6.15, lng: 106.78 },
    { lat: -6.15, lng: 106.88 },
    { lat: -6.22, lng: 106.88 },
    { lat: -6.22, lng: 106.78 },
  ],
  'East': [
    { lat: -6.15, lng: 106.88 },
    { lat: -6.15, lng: 106.98 },
    { lat: -6.30, lng: 106.98 },
    { lat: -6.30, lng: 106.88 },
    { lat: -6.22, lng: 106.88 },
  ],
  'South': [
    { lat: -6.22, lng: 106.78 },
    { lat: -6.22, lng: 106.88 },
    { lat: -6.35, lng: 106.88 },
    { lat: -6.35, lng: 106.78 },
  ],
};

// Area coordinates for non-authenticated markers
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

// Get district from area or coordinates
function getDistrict(area: string, lat?: number, lng?: number): string {
  if (areaToDistrict[area]) return areaToDistrict[area];
  
  // Fallback: determine by coordinates
  if (lat && lng) {
    if (lng < 106.78) return 'West';
    if (lat < -6.25) return 'South';
    if (lat > -6.15) return 'North';
    if (lng > 106.88) return 'East';
  }
  return 'Central';
}

function getDistrictColor(district: string) {
  return DISTRICT_COLORS[district] || DISTRICT_COLORS['Central'];
}

interface MissionMapProps {
  events: any[];
  isAuthenticated: boolean;
  className?: string;
}

export function MissionMap({ events, isAuthenticated, className = '' }: MissionMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const eventsWithLocation = events.filter((e: any) => e.latitude && e.longitude || e.area);

  const areaGroups = eventsWithLocation.reduce((acc: Record<string, any[]>, event: any) => {
    const area = event.area || 'Jakarta';
    if (!acc[area]) acc[area] = [];
    acc[area].push(event);
    return acc;
  }, {});

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Apply dark style
    const darkStyle = new google.maps.StyledMapType([
      { elementType: "geometry", stylers: [{ color: "#0a0a0f" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#2a2a3a" }] },
      { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2a" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#3a5a4a" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d1510" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#151520" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0a0a10" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1a2530" }] },
      { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#050508" }] },
      { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
    ], { name: 'Dark' });

    map.mapTypes.set('dark', darkStyle);
    map.setMapTypeId('dark');
    
    map.setOptions({
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });

    // Add district polygon overlays
    Object.entries(DISTRICT_POLYGONS).forEach(([district, path]) => {
      const colors = getDistrictColor(district);
      new google.maps.Polygon({
        paths: path,
        strokeColor: colors.primary,
        strokeOpacity: 0.4,
        strokeWeight: 1,
        fillColor: colors.primary,
        fillOpacity: 0.08,
        map,
        clickable: false,
      });
    });

    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    if (isAuthenticated) {
      // AUTHENTICATED: Show exact location pins with district colors
      eventsWithLocation.forEach((event: any) => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const district = getDistrict(event.area || 'Jakarta', lat, lng);
          const colors = getDistrictColor(district);
          
          const markerEl = document.createElement('div');
          markerEl.style.cssText = 'position: relative; cursor: pointer;';
          markerEl.innerHTML = `
            <div class="marker-at" style="
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              color: ${colors.primary};
              text-shadow: 0 0 20px ${colors.primary}, 0 0 40px ${colors.glow};
              position: relative;
              z-index: 2;
              transition: transform 0.2s, text-shadow 0.2s;
              font-family: system-ui, -apple-system, sans-serif;
            ">@</div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 44px;
              height: 44px;
              border: 2px solid ${colors.rgba};
              border-radius: 50%;
              animation: pulse-${district} 2s infinite;
            "></div>
            <div style="
              position: absolute;
              bottom: calc(100% + 10px);
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.95);
              border: 1px solid ${colors.primary};
              padding: 10px 14px;
              border-radius: 4px;
              white-space: nowrap;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.2s;
              z-index: 10;
            " class="marker-tip">
              <div style="color: #fff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${event.title}</div>
              <div style="color: ${colors.primary}; font-size: 10px; margin-top: 3px;">${event.venueName || event.area || 'Jakarta'}</div>
              <div style="color: ${colors.primary}; font-size: 9px; margin-top: 2px; opacity: 0.7;">${district} Jakarta</div>
            </div>
            <style>
              @keyframes pulse-${district} {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
                50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
              }
            </style>
          `;

          // Hover effect
          markerEl.addEventListener('mouseenter', () => {
            const tip = markerEl.querySelector('.marker-tip') as HTMLElement;
            const at = markerEl.querySelector('.marker-at') as HTMLElement;
            if (tip) tip.style.opacity = '1';
            if (at) {
              at.style.transform = 'scale(1.2)';
              at.style.textShadow = `0 0 30px ${colors.primary}, 0 0 60px ${colors.glow}`;
            }
          });
          markerEl.addEventListener('mouseleave', () => {
            const tip = markerEl.querySelector('.marker-tip') as HTMLElement;
            const at = markerEl.querySelector('.marker-at') as HTMLElement;
            if (tip) tip.style.opacity = '0';
            if (at) {
              at.style.transform = 'scale(1)';
              at.style.textShadow = `0 0 20px ${colors.primary}, 0 0 40px ${colors.glow}`;
            }
          });

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content: markerEl,
          });

          // Click to navigate
          marker.addListener('click', () => {
            window.location.href = `/gatherings/${event.id}`;
          });

          markersRef.current.push(marker);
        }
      });
    } else {
      // NOT AUTHENTICATED: Show area rings with district colors
      Object.entries(areaGroups).forEach(([area, areaEvents]) => {
        const coords = areaCoordinates[area] || areaCoordinates['Jakarta'];
        const count = areaEvents.length;
        const district = getDistrict(area);
        const colors = getDistrictColor(district);
        
        const markerEl = document.createElement('div');
        markerEl.style.cssText = 'position: relative; cursor: pointer;';
        markerEl.innerHTML = `
          <div style="
            width: 50px;
            height: 50px;
            border: 2px solid ${colors.rgba};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: areaPulse-${district} 3s infinite;
            transition: all 0.3s;
            position: relative;
          " class="area-ring">
            <span style="
              color: ${colors.primary};
              font-size: 28px;
              font-weight: bold;
              font-family: system-ui, -apple-system, sans-serif;
              text-shadow: 0 0 15px ${colors.glow};
            ">@</span>
            <span style="
              position: absolute;
              top: -6px;
              right: -6px;
              background: ${colors.primary};
              color: #000;
              font-size: 11px;
              font-weight: bold;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: monospace;
            ">${count}</span>
          </div>
          <div style="
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid ${colors.primary};
            color: ${colors.primary};
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-family: monospace;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            z-index: 10;
          " class="area-tip">
            <div>${area}</div>
            <div style="font-size: 9px; opacity: 0.7; margin-top: 2px;">${district} Jakarta</div>
          </div>
          <style>
            @keyframes areaPulse-${district} {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          </style>
        `;

        // Hover effect
        markerEl.addEventListener('mouseenter', () => {
          const tip = markerEl.querySelector('.area-tip') as HTMLElement;
          const ring = markerEl.querySelector('.area-ring') as HTMLElement;
          if (tip) tip.style.opacity = '1';
          if (ring) {
            ring.style.borderColor = colors.primary;
            ring.style.boxShadow = `0 0 30px ${colors.glow}`;
          }
        });
        markerEl.addEventListener('mouseleave', () => {
          const tip = markerEl.querySelector('.area-tip') as HTMLElement;
          const ring = markerEl.querySelector('.area-ring') as HTMLElement;
          if (tip) tip.style.opacity = '0';
          if (ring) {
            ring.style.borderColor = colors.rgba;
            ring.style.boxShadow = 'none';
          }
        });

        // Click to navigate to events page filtered by area
        markerEl.addEventListener('click', () => {
          window.location.href = `/gatherings?area=${encodeURIComponent(area)}`;
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          content: markerEl,
        });

        markersRef.current.push(marker);
      });
    }

    // Fit to Jakarta bounds
    setTimeout(() => {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: -6.30, lng: 106.75 });
      bounds.extend({ lat: -6.12, lng: 106.92 });
      map.fitBounds(bounds, 60);
    }, 100);
  };

  return (
    <div className={`relative bg-[#050508] ${className}`}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#6FCF97]/20 pointer-events-none z-20" />
      <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#6FCF97]/20 pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-[#6FCF97]/20 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#6FCF97]/20 pointer-events-none z-20" />

      {/* District Legend */}
      <div className="absolute top-4 right-4 z-30 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3">
        <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 font-mono">Districts</div>
        <div className="space-y-1.5">
          {Object.entries(DISTRICT_COLORS).map(([district, colors]) => (
            <div key={district} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: colors.primary, boxShadow: `0 0 6px ${colors.glow}` }}
              />
              <span className="text-[10px] text-white/70 font-mono uppercase">{district}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapView
        className="w-full h-full"
        initialCenter={JAKARTA_CENTER}
        initialZoom={13}
        onMapReady={handleMapReady}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,5,8,0.7) 100%)'
      }} />
    </div>
  );
}

export default MissionMap;
