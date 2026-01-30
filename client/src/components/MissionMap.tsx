/**
 * MissionMap v2 - Clean, minimal, Jakarta-focused
 * Dark tactical styling with hover-reveal markers
 */

import { useRef } from 'react';
import { MapView } from '@/components/Map';

// Jakarta center and bounds
const JAKARTA_CENTER = { lat: -6.2088, lng: 106.8200 };

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
    
    // Apply dark style via styledMapType
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
    
    // Disable all UI
    map.setOptions({
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });

    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    if (isAuthenticated) {
      // AUTHENTICATED: Show exact location pins with pulse
      eventsWithLocation.forEach((event: any) => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const markerEl = document.createElement('div');
          markerEl.style.cssText = 'position: relative; cursor: pointer;';
          markerEl.innerHTML = `
            <div style="
              width: 14px;
              height: 14px;
              background: #6FCF97;
              border-radius: 50%;
              box-shadow: 0 0 20px #6FCF97, 0 0 40px rgba(111, 207, 151, 0.4);
              position: relative;
              z-index: 2;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 30px;
              height: 30px;
              border: 2px solid rgba(111, 207, 151, 0.6);
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
            <div style="
              position: absolute;
              bottom: calc(100% + 10px);
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.95);
              border: 1px solid #6FCF97;
              padding: 10px 14px;
              border-radius: 4px;
              white-space: nowrap;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.2s;
              z-index: 10;
            " class="marker-tip">
              <div style="color: #fff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${event.title}</div>
              <div style="color: #6FCF97; font-size: 10px; margin-top: 3px;">${event.venueName || event.area || 'Jakarta'}</div>
            </div>
            <style>
              @keyframes pulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
                50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
              }
            </style>
          `;

          // Hover effect
          markerEl.addEventListener('mouseenter', () => {
            const tip = markerEl.querySelector('.marker-tip') as HTMLElement;
            if (tip) tip.style.opacity = '1';
          });
          markerEl.addEventListener('mouseleave', () => {
            const tip = markerEl.querySelector('.marker-tip') as HTMLElement;
            if (tip) tip.style.opacity = '0';
          });

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content: markerEl,
          });

          marker.addListener('click', () => {
            window.location.href = `/gatherings/${event.id}`;
          });

          markersRef.current.push(marker);
        }
      });
    } else {
      // NOT AUTHENTICATED: Show area rings
      Object.entries(areaGroups).forEach(([area, areaEvents]) => {
        const coords = areaCoordinates[area] || areaCoordinates['Jakarta'];
        const count = areaEvents.length;
        
        const markerEl = document.createElement('div');
        markerEl.style.cssText = 'position: relative; cursor: pointer;';
        markerEl.innerHTML = `
          <div style="
            width: 50px;
            height: 50px;
            border: 2px solid rgba(111, 207, 151, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: areaPulse 3s infinite;
            transition: all 0.3s;
          " class="area-ring">
            <span style="
              color: #6FCF97;
              font-size: 16px;
              font-weight: bold;
              font-family: monospace;
            ">${count}</span>
          </div>
          <div style="
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(111, 207, 151, 0.5);
            color: #6FCF97;
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
          " class="area-tip">${area}</div>
          <style>
            @keyframes areaPulse {
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
            ring.style.borderColor = '#6FCF97';
            ring.style.boxShadow = '0 0 30px rgba(111, 207, 151, 0.4)';
          }
        });
        markerEl.addEventListener('mouseleave', () => {
          const tip = markerEl.querySelector('.area-tip') as HTMLElement;
          const ring = markerEl.querySelector('.area-ring') as HTMLElement;
          if (tip) tip.style.opacity = '0';
          if (ring) {
            ring.style.borderColor = 'rgba(111, 207, 151, 0.3)';
            ring.style.boxShadow = 'none';
          }
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          content: markerEl,
        });

        markersRef.current.push(marker);
      });
    }

    // Fit to Jakarta bounds - tighter focus
    setTimeout(() => {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: -6.30, lng: 106.75 }); // SW
      bounds.extend({ lat: -6.12, lng: 106.92 }); // NE
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
