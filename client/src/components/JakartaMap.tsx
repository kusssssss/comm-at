import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Trophy, TrendingUp, Flame, Crown } from 'lucide-react';

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

// Custom @ marker icon with improved styling
const createAtMarker = (color: string, isAuth: boolean, isHovered: boolean = false, rank?: number) => {
  const size = isAuth ? (isHovered ? 48 : 42) : (isHovered ? 40 : 34);
  const fontSize = isAuth ? (isHovered ? 22 : 20) : (isHovered ? 18 : 16);
  
  // Crown for #1 district
  const crownHtml = rank === 1 ? `
    <div style="
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
    ">👑</div>
  ` : '';
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
      ">
        ${crownHtml}
        ${isAuth ? `
          <div style="
            position: absolute;
            width: ${size + 10}px;
            height: ${size + 10}px;
            border-radius: 50%;
            border: 2px solid ${color};
            opacity: 0.3;
            animation: pulse 2s ease-in-out infinite;
          "></div>
          <div style="
            position: absolute;
            width: ${size + 20}px;
            height: ${size + 20}px;
            border-radius: 50%;
            border: 1px solid ${color};
            opacity: 0.15;
            animation: pulse 2s ease-in-out infinite 0.5s;
          "></div>
        ` : ''}
        <div style="
          width: ${size - 6}px;
          height: ${size - 6}px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.98), rgba(25, 25, 25, 0.95));
          border: 2.5px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 ${isHovered ? 25 : 15}px ${color}50, inset 0 0 10px ${color}20;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
        ">
          <span style="
            color: ${color};
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-size: ${fontSize}px;
            font-weight: 800;
            text-shadow: 0 0 10px ${color}80;
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

  // District rankings by event count
  const districtRankings = useMemo(() => {
    const rankings = Object.entries(eventsByDistrict)
      .map(([name, events]) => ({
        name,
        count: events.length,
        district: DISTRICTS[name],
      }))
      .sort((a, b) => b.count - a.count);
    
    // Assign ranks (handle ties)
    let currentRank = 1;
    return rankings.map((item, index) => {
      if (index > 0 && rankings[index - 1].count > item.count) {
        currentRank = index + 1;
      }
      return { ...item, rank: item.count > 0 ? currentRank : 0 };
    });
  }, [eventsByDistrict]);

  // Get rank for a district
  const getDistrictRank = (name: string): number => {
    return districtRankings.find(r => r.name === name)?.rank || 0;
  };

  // Style function for GeoJSON
  const getStyle = (feature: any) => {
    const name = feature?.properties?.name;
    const color = feature?.properties?.color || '#888888';
    const isHovered = hoveredDistrict === name;
    const rank = getDistrictRank(name);
    const isLeader = rank === 1 && eventsByDistrict[name]?.length > 0;
    
    return {
      fillColor: color,
      fillOpacity: isLeader ? 0.4 : (isHovered ? 0.3 : 0.12),
      color: color,
      weight: isLeader ? 3 : (isHovered ? 2.5 : 1.5),
      opacity: isLeader ? 1 : (isHovered ? 1 : 0.6),
      dashArray: isLeader ? '' : '',
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

  const leadingDistrict = districtRankings.find(r => r.rank === 1 && r.count > 0);
  const totalEvents = events.filter(e => e.latitude && e.longitude).length;

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
            key={`${hoveredDistrict}-${leadingDistrict?.name}`} 
            data={geoData} 
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Event markers - Always show @ markers for all events */}
        {isAuthenticated ? (
          // Authenticated: Show exact event locations with @ markers
          events.filter(e => e.latitude && e.longitude).map((event) => {
            const district = getDistrictFromCoords(event.latitude!, event.longitude!);
            const color = DISTRICTS[district]?.color || '#6FCF97';
            const isHovered = hoveredEvent === event.id;
            const rank = getDistrictRank(district);
            
            return (
              <Marker
                key={event.id}
                position={[event.latitude!, event.longitude!]}
                icon={createAtMarker(color, true, isHovered, rank)}
                eventHandlers={{
                  click: () => navigate(`/gatherings/${event.id}`),
                  mouseover: () => setHoveredEvent(event.id),
                  mouseout: () => setHoveredEvent(null),
                }}
              >
                <Popup className="dark-popup">
                  <div className="p-3 min-w-[240px]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm text-white">{event.title}</h3>
                      {rank === 1 && (
                        <span className="text-yellow-400 text-xs flex items-center gap-1">
                          <Crown className="w-3 h-3" /> #1
                        </span>
                      )}
                    </div>
                    {event.tagline && <p className="text-xs text-gray-400 mb-2">{event.tagline}</p>}
                    {event.location && (
                      <p className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                        {event.location}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 mb-3">{district}</p>
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
          // Non-authenticated: Show district center markers with event count and @ symbol
          Object.entries(eventsByDistrict)
            .filter(([_, districtEvents]) => districtEvents.length > 0)
            .map(([districtName, districtEvents]) => {
              const district = DISTRICTS[districtName];
              if (!district) return null;
              const isHovered = hoveredDistrict === districtName;
              const rank = getDistrictRank(districtName);
              
              return (
                <Marker
                  key={districtName}
                  position={district.center}
                  icon={createAtMarker(district.color, false, isHovered, rank)}
                  eventHandlers={{
                    click: () => navigate(`/gatherings?district=${encodeURIComponent(districtName)}`),
                    mouseover: () => setHoveredDistrict(districtName),
                    mouseout: () => setHoveredDistrict(null),
                  }}
                >
                  <Popup className="dark-popup">
                    <div className="p-3 min-w-[220px]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: district.color + '30', color: district.color }}
                          >
                            {district.letter}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-white block">{district.name}</span>
                            <span className="text-[10px] text-gray-500">{district.nameId}</span>
                          </div>
                        </div>
                        {rank === 1 && (
                          <span className="text-yellow-400">👑</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">
                          {districtEvents.length} gathering{districtEvents.length !== 1 ? 's' : ''}
                        </p>
                        {rank > 0 && rank <= 3 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                            rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            #{rank}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--mint)]">Sign in to reveal exact locations</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })
        )}
      </MapContainer>

      {/* District Competition Leaderboard */}
      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-md rounded-xl p-4 z-[1000] border border-white/10 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">District Battle</span>
        </div>
        
        <div className="space-y-2">
          {districtRankings.slice(0, 5).map((item, index) => {
            const isLeader = item.rank === 1 && item.count > 0;
            const isHovered = hoveredDistrict === item.name;
            
            return (
              <div 
                key={item.name}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  isLeader ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' :
                  isHovered ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
                onMouseEnter={() => setHoveredDistrict(item.name)}
                onMouseLeave={() => setHoveredDistrict(null)}
                onClick={() => navigate(`/gatherings?district=${encodeURIComponent(item.name)}`)}
              >
                {/* Rank */}
                <span className={`w-5 text-center text-xs font-bold ${
                  item.rank === 1 ? 'text-yellow-400' :
                  item.rank === 2 ? 'text-gray-300' :
                  item.rank === 3 ? 'text-orange-400' :
                  'text-gray-500'
                }`}>
                  {item.count > 0 ? (
                    item.rank === 1 ? '👑' : `#${item.rank}`
                  ) : '-'}
                </span>
                
                {/* District letter badge */}
                <span 
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: item.district.color + '25', color: item.district.color }}
                >
                  {item.district.letter}
                </span>
                
                {/* Name */}
                <span className={`flex-1 text-xs ${isLeader ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {item.district.name.replace(' Jakarta', '')}
                </span>
                
                {/* Event count with bar */}
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.count / Math.max(...districtRankings.map(r => r.count), 1)) * 100}%`,
                        backgroundColor: item.district.color 
                      }}
                    />
                  </div>
                  <span 
                    className="text-xs font-mono font-bold min-w-[20px] text-right"
                    style={{ color: item.count > 0 ? item.district.color : '#666' }}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Total stats */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase">Total Events</span>
          <span className="text-sm font-bold text-white">{totalEvents}</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-md rounded-xl px-4 py-2.5 z-[1000] border border-white/10">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--mint)] animate-pulse"></span>
            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Live</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{totalEvents} locations</span>
          {leadingDistrict && (
            <>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span style={{ color: leadingDistrict.district.color }}>
                  {leadingDistrict.district.name.replace(' Jakarta', '')} leads
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Auth prompt */}
      {!isAuthenticated && totalEvents > 0 && (
        <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md rounded-xl px-5 py-3 z-[1000] border border-white/10">
          <p className="text-xs text-gray-400">
            <span className="text-[var(--mint)] font-medium">Sign in</span> to reveal exact locations
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
          background: rgba(10, 10, 10, 0.98) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0 !important;
          color: white !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: rgba(10, 10, 10, 0.98) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

export default JakartaMap;
