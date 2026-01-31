/**
 * MissionMap v4 - Professional cartographic style
 * Pastel district colors matching reference image
 */

import { useRef } from 'react';
import { MapView } from '@/components/Map';
import { JAKARTA_DISTRICT_BOUNDARIES } from '@/lib/jakartaDistricts';

// Jakarta center
const JAKARTA_CENTER = { lat: -6.22, lng: 106.845 };

// Pastel district colors matching reference image
const DISTRICT_COLORS: Record<string, { fill: string; stroke: string; label: string; letter: string }> = {
  'West': { fill: '#F5B7B1', stroke: '#E74C3C', label: 'Jakarta Barat', letter: 'A' },      // Pink/salmon
  'North': { fill: '#AED6F1', stroke: '#3498DB', label: 'Jakarta Utara', letter: 'B' },    // Light blue
  'Central': { fill: '#D7BDE2', stroke: '#9B59B6', label: 'Jakarta Pusat', letter: 'C' },  // Light purple
  'East': { fill: '#F9E79F', stroke: '#F39C12', label: 'Jakarta Timur', letter: 'D' },     // Beige/cream
  'South': { fill: '#E8DAEF', stroke: '#8E44AD', label: 'Jakarta Selatan', letter: 'E' },  // Light lavender
};

// District center coordinates for letter markers
const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  'West': { lat: -6.17, lng: 106.73 },
  'North': { lat: -6.13, lng: 106.90 },
  'Central': { lat: -6.18, lng: 106.83 },
  'East': { lat: -6.22, lng: 106.92 },
  'South': { lat: -6.28, lng: 106.81 },
};

// Subdistricts (Kecamatan) with coordinates
const SUBDISTRICTS: { name: string; lat: number; lng: number; district: string }[] = [
  // West Jakarta
  { name: 'Kalideres', lat: -6.14, lng: 106.70, district: 'West' },
  { name: 'Cengkareng', lat: -6.15, lng: 106.73, district: 'West' },
  { name: 'Grogol', lat: -6.17, lng: 106.78, district: 'West' },
  { name: 'Kebon Jeruk', lat: -6.19, lng: 106.76, district: 'West' },
  { name: 'Kembangan', lat: -6.20, lng: 106.74, district: 'West' },
  { name: 'Palmerah', lat: -6.19, lng: 106.80, district: 'West' },
  // North Jakarta
  { name: 'Penjaringan', lat: -6.11, lng: 106.78, district: 'North' },
  { name: 'Pademangan', lat: -6.12, lng: 106.85, district: 'North' },
  { name: 'Tanjung Priok', lat: -6.12, lng: 106.88, district: 'North' },
  { name: 'Kelapa Gading', lat: -6.16, lng: 106.90, district: 'North' },
  { name: 'Cilincing', lat: -6.10, lng: 106.93, district: 'North' },
  // Central Jakarta
  { name: 'Gambir', lat: -6.17, lng: 106.82, district: 'Central' },
  { name: 'Menteng', lat: -6.19, lng: 106.84, district: 'Central' },
  { name: 'Tanah Abang', lat: -6.19, lng: 106.81, district: 'Central' },
  { name: 'Senen', lat: -6.18, lng: 106.85, district: 'Central' },
  { name: 'Kemayoran', lat: -6.16, lng: 106.86, district: 'Central' },
  // East Jakarta
  { name: 'Matraman', lat: -6.21, lng: 106.86, district: 'East' },
  { name: 'Jatinegara', lat: -6.22, lng: 106.88, district: 'East' },
  { name: 'Cakung', lat: -6.18, lng: 106.94, district: 'East' },
  { name: 'Duren Sawit', lat: -6.24, lng: 106.91, district: 'East' },
  { name: 'Makasar', lat: -6.27, lng: 106.90, district: 'East' },
  { name: 'Ciracas', lat: -6.32, lng: 106.88, district: 'East' },
  // South Jakarta
  { name: 'Kebayoran Baru', lat: -6.24, lng: 106.79, district: 'South' },
  { name: 'Kebayoran Lama', lat: -6.25, lng: 106.77, district: 'South' },
  { name: 'Mampang', lat: -6.25, lng: 106.83, district: 'South' },
  { name: 'Tebet', lat: -6.23, lng: 106.85, district: 'South' },
  { name: 'Pancoran', lat: -6.25, lng: 106.85, district: 'South' },
  { name: 'Cilandak', lat: -6.29, lng: 106.80, district: 'South' },
  { name: 'Pasar Minggu', lat: -6.29, lng: 106.84, district: 'South' },
  { name: 'Jagakarsa', lat: -6.33, lng: 106.82, district: 'South' },
];

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

function getDistrict(area: string, lat?: number, lng?: number): string {
  if (areaToDistrict[area]) return areaToDistrict[area];
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
    
    // Apply light cartographic style
    const lightStyle = new google.maps.StyledMapType([
      { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9c9c9" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#333333" }, { weight: 0.5 }] },
      { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
      { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "simplified" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e4f5" }] },
      { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
    ], { name: 'Light' });

    map.mapTypes.set('light', lightStyle);
    map.setMapTypeId('light');
    
    map.setOptions({
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });

    // Add district polygon overlays with pastel colors
    Object.entries(JAKARTA_DISTRICT_BOUNDARIES).forEach(([district, path]) => {
      const colors = getDistrictColor(district);
      new google.maps.Polygon({
        paths: path,
        strokeColor: colors.stroke,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: colors.fill,
        fillOpacity: 0.5,
        map,
        clickable: false,
      });
    });

    // Add district letter markers (A, B, C, D, E)
    Object.entries(DISTRICT_CENTERS).forEach(([district, coords]) => {
      const colors = getDistrictColor(district);
      
      const letterEl = document.createElement('div');
      letterEl.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          background: white;
          border: 2px solid ${colors.stroke};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: ${colors.stroke};
          font-family: Arial, sans-serif;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        ">${colors.letter}</div>
      `;

      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: coords,
        content: letterEl,
      });
    });

    // Add subdistrict labels
    SUBDISTRICTS.forEach((sub) => {
      const labelEl = document.createElement('div');
      labelEl.innerHTML = `
        <div style="
          font-size: 9px;
          color: #444;
          font-family: Arial, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          white-space: nowrap;
          text-shadow: 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white;
        ">${sub.name}</div>
      `;

      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: sub.lat, lng: sub.lng },
        content: labelEl,
      });
    });

    // Clear existing event markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    if (isAuthenticated) {
      // AUTHENTICATED: Show exact location pins
      eventsWithLocation.forEach((event: any) => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const district = getDistrict(event.area || 'Jakarta', lat, lng);
          const colors = getDistrictColor(district);
          
          const markerEl = document.createElement('div');
          markerEl.style.cssText = 'position: relative; cursor: pointer;';
          markerEl.innerHTML = `
            <div class="event-pin" style="
              width: 24px;
              height: 24px;
              background: ${colors.stroke};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
              color: white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              transition: transform 0.2s;
            ">@</div>
            <div style="
              position: absolute;
              bottom: calc(100% + 8px);
              left: 50%;
              transform: translateX(-50%);
              background: white;
              border: 1px solid #ddd;
              padding: 8px 12px;
              border-radius: 4px;
              white-space: nowrap;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.2s;
              z-index: 10;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            " class="marker-tip">
              <div style="color: #333; font-size: 12px; font-weight: 600;">${event.title}</div>
              <div style="color: #666; font-size: 10px; margin-top: 2px;">${event.venueName || event.area || 'Jakarta'}</div>
            </div>
          `;

          markerEl.addEventListener('mouseenter', () => {
            const tip = markerEl.querySelector('.marker-tip') as HTMLElement;
            const pin = markerEl.querySelector('.event-pin') as HTMLElement;
            if (tip) tip.style.opacity = '1';
            if (pin) pin.style.transform = 'scale(1.2)';
          });
          markerEl.addEventListener('mouseleave', () => {
            const tip = markerEl.querySelector('.marker-tip') as HTMLElement;
            const pin = markerEl.querySelector('.event-pin') as HTMLElement;
            if (tip) tip.style.opacity = '0';
            if (pin) pin.style.transform = 'scale(1)';
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
      // NOT AUTHENTICATED: Show area markers
      Object.entries(areaGroups).forEach(([area, areaEvents]) => {
        const coords = areaCoordinates[area] || areaCoordinates['Jakarta'];
        const count = areaEvents.length;
        const district = getDistrict(area);
        const colors = getDistrictColor(district);
        
        const markerEl = document.createElement('div');
        markerEl.style.cssText = 'position: relative; cursor: pointer;';
        markerEl.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: ${colors.stroke};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            position: relative;
          ">
            @
            <span style="
              position: absolute;
              top: -6px;
              right: -6px;
              background: #E74C3C;
              color: white;
              font-size: 10px;
              font-weight: bold;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
            ">${count}</span>
          </div>
          <div style="
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border: 1px solid #ddd;
            padding: 8px 12px;
            border-radius: 4px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          " class="marker-tip">
            <div style="color: #333; font-size: 12px; font-weight: 600;">${area}</div>
            <div style="color: #666; font-size: 10px; margin-top: 2px;">${count} event${count > 1 ? 's' : ''}</div>
            <div style="color: #999; font-size: 9px; margin-top: 2px;">Sign in to reveal</div>
          </div>
        `;

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
          position: coords,
          content: markerEl,
        });

        marker.addListener('click', () => {
          window.location.href = `/gatherings?area=${encodeURIComponent(area)}`;
        });

        markersRef.current.push(marker);
      });
    }

    // Fit bounds to show all of Jakarta
    const bounds = new google.maps.LatLngBounds(
      { lat: -6.38, lng: 106.68 }, // SW
      { lat: -6.08, lng: 106.98 }  // NE
    );
    map.fitBounds(bounds);
  };

  return (
    <div className={`relative ${className}`}>
      <MapView
        initialCenter={JAKARTA_CENTER}
        initialZoom={11}
        className="w-full h-full"
        onMapReady={handleMapReady}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 text-xs">
        <div className="font-bold text-gray-800 mb-2 text-sm">DISTRICTS</div>
        {Object.entries(DISTRICT_COLORS).map(([district, colors]) => (
          <div key={district} className="flex items-center gap-2 mb-1">
            <div 
              className="w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: colors.fill, borderColor: colors.stroke, color: colors.stroke }}
            >
              {colors.letter}
            </div>
            <span className="text-gray-700">{district} Jakarta</span>
            <span className="text-gray-400">({colors.label})</span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-700">
            {eventsWithLocation.length} active location{eventsWithLocation.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
