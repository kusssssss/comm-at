import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

// District metadata
const DISTRICTS: Record<string, { name: string; nameId: string; letter: string; color: string; center: [number, number] }> = {
  'South Jakarta': { name: 'South Jakarta', nameId: 'Jakarta Selatan', letter: 'E', color: '#6FCF97', center: [-6.2615, 106.8100] },
  'East Jakarta': { name: 'East Jakarta', nameId: 'Jakarta Timur', letter: 'D', color: '#FFE66D', center: [-6.2250, 106.9200] },
  'Central Jakarta': { name: 'Central Jakarta', nameId: 'Jakarta Pusat', letter: 'C', color: '#A78BFA', center: [-6.1865, 106.8340] },
  'West Jakarta': { name: 'West Jakarta', nameId: 'Jakarta Barat', letter: 'A', color: '#FF6B6B', center: [-6.1685, 106.7650] },
  'North Jakarta': { name: 'North Jakarta', nameId: 'Jakarta Utara', letter: 'B', color: '#4ECDC4', center: [-6.1214, 106.9000] },
};

type DistrictName = keyof typeof DISTRICTS;

// Get district from coordinates
const getDistrictFromCoords = (lat: number, lng: number): DistrictName => {
  if (lat > -6.15 && lng < 106.80) return 'West Jakarta';
  if (lat > -6.15 && lng >= 106.80) return 'North Jakarta';
  if (lat >= -6.22 && lat <= -6.15 && lng >= 106.80 && lng <= 106.88) return 'Central Jakarta';
  if (lat > -6.22 && lng > 106.88) return 'East Jakarta';
  return 'South Jakarta';
};

// Custom @ marker icon
const createAtMarker = (color: string, isAuth: boolean, isHovered: boolean = false) => {
  const size = isAuth ? (isHovered ? 44 : 38) : (isHovered ? 36 : 30);
  const fontSize = isAuth ? (isHovered ? 20 : 18) : (isHovered ? 16 : 14);
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        ${isAuth ? `
          <div style="
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid ${color};
            opacity: 0.4;
            animation: pulse 2s ease-in-out infinite;
          "></div>
        ` : ''}
        <div style="
          width: ${size - 8}px;
          height: ${size - 8}px;
          border-radius: 50%;
          background: rgba(10, 10, 10, 0.95);
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 ${isHovered ? 20 : 10}px ${color}40;
          transition: all 0.2s ease;
        ">
          <span style="
            color: ${color};
            font-family: 'SF Mono', 'Monaco', monospace;
            font-size: ${fontSize}px;
            font-weight: bold;
          ">@</span>
        </div>
      </div>
    `,
    className: 'custom-at-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

interface EventLocation {
  id: number;
  title: string;
  tagline?: string;
  latitude: number | null;
  longitude: number | null;
  location?: string;
  district?: string;
}

interface JakartaMapProps {
  events?: EventLocation[];
  className?: string;
  height?: string;
  showDistricts?: boolean;
}

// Component to set map bounds
function SetBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[-6.38, 106.65], [-6.08, 107.05]], { padding: [20, 20] });
  }, [map]);
  return null;
}

export function JakartaMap({ 
  events = [], 
  className = '',
  height = '500px',
  showDistricts = true
}: JakartaMapProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  // Load GeoJSON
  useEffect(() => {
    fetch('/jakarta-real-boundaries.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load Jakarta boundaries:', err));
  }, []);

  // Group events by district
  const eventsByDistrict = useMemo(() => {
    const grouped: Record<string, EventLocation[]> = {};
    Object.keys(DISTRICTS).forEach(d => grouped[d] = []);
    events.forEach(event => {
      if (event.latitude && event.longitude) {
        const district = getDistrictFromCoords(event.latitude, event.longitude);
        grouped[district].push(event);
      }
    });
    return grouped;
  }, [events]);

  // Style function for GeoJSON
  const getStyle = (feature: any) => {
    const name = feature?.properties?.name;
    const color = feature?.properties?.color || '#888888';
    const isHovered = hoveredDistrict === name;
    
    return {
      fillColor: color,
      fillOpacity: isHovered ? 0.35 : 0.15,
      color: color,
      weight: isHovered ? 2.5 : 1.5,
      opacity: isHovered ? 1 : 0.7,
    };
  };

  // Event handlers for GeoJSON features
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const name = feature?.properties?.name;
    
    layer.on({
      mouseover: () => setHoveredDistrict(name),
      mouseout: () => setHoveredDistrict(null),
      click: () => navigate(`/gatherings?district=${encodeURIComponent(name)}`),
    });
  };

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <MapContainer
        center={[-6.2088, 106.8456]}
        zoom={11}
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        dragging={true}
      >
        {/* Dark tile layer - CartoDB Dark Matter */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        <SetBounds />

        {/* Real Jakarta district boundaries from GeoJSON */}
        {showDistricts && geoData && (
          <GeoJSON 
            key={hoveredDistrict || 'default'} 
            data={geoData} 
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Event markers */}
        {isAuthenticated ? (
          // Authenticated: Show exact event locations
          events.filter(e => e.latitude && e.longitude).map((event) => {
            const district = getDistrictFromCoords(event.latitude!, event.longitude!);
            const color = DISTRICTS[district]?.color || '#6FCF97';
            const isHovered = hoveredEvent === event.id;
            
            return (
              <Marker
                key={event.id}
                position={[event.latitude!, event.longitude!]}
                icon={createAtMarker(color, true, isHovered)}
                eventHandlers={{
                  click: () => navigate(`/gatherings/${event.id}`),
                  mouseover: () => setHoveredEvent(event.id),
                  mouseout: () => setHoveredEvent(null),
                }}
              >
                <Popup className="dark-popup">
                  <div className="p-3 min-w-[220px]">
                    <h3 className="font-bold text-sm text-white mb-1">{event.title}</h3>
                    {event.tagline && <p className="text-xs text-gray-400 mb-2">{event.tagline}</p>}
                    {event.location && <p className="text-xs text-gray-300 mb-3">{event.location}</p>}
                    <button 
                      onClick={() => navigate(`/gatherings/${event.id}`)}
                      className="w-full py-2 px-3 text-xs font-medium border border-[var(--mint)] text-[var(--mint)] rounded hover:bg-[var(--mint)] hover:text-black transition-all"
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })
        ) : (
          // Non-authenticated: Show district center markers with event count
          Object.entries(eventsByDistrict)
            .filter(([_, districtEvents]) => districtEvents.length > 0)
            .map(([districtName, districtEvents]) => {
              const district = DISTRICTS[districtName];
              if (!district) return null;
              const isHovered = hoveredDistrict === districtName;
              
              return (
                <Marker
                  key={districtName}
                  position={district.center}
                  icon={createAtMarker(district.color, false, isHovered)}
                  eventHandlers={{
                    click: () => navigate(`/gatherings?district=${encodeURIComponent(districtName)}`),
                    mouseover: () => setHoveredDistrict(districtName),
                    mouseout: () => setHoveredDistrict(null),
                  }}
                >
                  <Popup className="dark-popup">
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: district.color + '30', color: district.color }}
                        >
                          {district.letter}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-white block">{district.name}</span>
                          <span className="text-xs text-gray-500">{district.nameId}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {districtEvents.length} gathering{districtEvents.length !== 1 ? 's' : ''} in this area
                      </p>
                      <p className="text-xs text-[var(--mint)]">Sign in to reveal exact locations</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })
        )}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md rounded-xl p-4 z-[1000] border border-white/10">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-medium">Jakarta Districts</div>
        <div className="space-y-2">
          {Object.entries(DISTRICTS).map(([name, district]) => {
            const eventCount = eventsByDistrict[name]?.length || 0;
            return (
              <div 
                key={name} 
                className={`flex items-center gap-2 text-xs cursor-pointer transition-all ${
                  hoveredDistrict === name ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                onMouseEnter={() => setHoveredDistrict(name)}
                onMouseLeave={() => setHoveredDistrict(null)}
                onClick={() => navigate(`/gatherings?district=${encodeURIComponent(name)}`)}
              >
                <span 
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: district.color + '30', color: district.color }}
                >
                  {district.letter}
                </span>
                <span className="text-gray-300 flex-1">{district.name}</span>
                {eventCount > 0 && (
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: district.color + '20', color: district.color }}
                  >
                    {eventCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-md rounded-xl px-4 py-2.5 z-[1000] border border-white/10">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--mint)] animate-pulse"></span>
            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Live</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{events.filter(e => e.latitude && e.longitude).length} locations</span>
        </div>
      </div>

      {/* Auth prompt */}
      {!isAuthenticated && events.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md rounded-xl px-5 py-2.5 z-[1000] border border-white/10">
          <p className="text-xs text-gray-400">
            <span className="text-[var(--mint)] font-medium">Sign in</span> to reveal exact event locations
          </p>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
        .custom-at-marker {
          background: transparent !important;
          border: none !important;
        }
        .dark-popup .leaflet-popup-content-wrapper {
          background: rgba(10, 10, 10, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0 !important;
          color: white !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: rgba(10, 10, 10, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .dark-popup .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

export default JakartaMap;
