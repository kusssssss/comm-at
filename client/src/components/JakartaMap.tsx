import { useState, useEffect, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

interface EventLocation {
  id: number;
  title: string;
  latitude: number | null;
  longitude: number | null;
  district: string;
}

interface JakartaMapProps {
  events?: EventLocation[];
  className?: string;
  showLabels?: boolean;
}

// District colors matching the reference image
const DISTRICT_COLORS: Record<string, { fill: string; hover: string; name: string; indonesian: string }> = {
  'JAKARTA BARAT': { fill: '#F5B7B1', hover: '#E6A8A2', name: 'West Jakarta', indonesian: 'Jakarta Barat' },
  'JAKARTA UTARA': { fill: '#AED6F1', hover: '#9FC7E2', name: 'North Jakarta', indonesian: 'Jakarta Utara' },
  'JAKARTA PUSAT': { fill: '#D7BDE2', hover: '#C8AED3', name: 'Central Jakarta', indonesian: 'Jakarta Pusat' },
  'JAKARTA TIMUR': { fill: '#F9E79F', hover: '#EAD890', name: 'East Jakarta', indonesian: 'Jakarta Timur' },
  'JAKARTA SELATAN': { fill: '#E8DAEF', hover: '#D9CBE0', name: 'South Jakarta', indonesian: 'Jakarta Selatan' },
  'KEPULAUAN SERIBU': { fill: '#A9DFBF', hover: '#9AD0B0', name: 'Thousand Islands', indonesian: 'Kepulauan Seribu' },
};

// District letter markers
const DISTRICT_LETTERS: Record<string, string> = {
  'JAKARTA BARAT': 'A',
  'JAKARTA UTARA': 'B',
  'JAKARTA PUSAT': 'C',
  'JAKARTA TIMUR': 'D',
  'JAKARTA SELATAN': 'E',
};

// Map district names to their approximate area for non-authenticated view
const getDistrictFromCoords = (lat: number, lng: number): string => {
  if (lat > -6.15 && lng < 106.8) return 'West Jakarta';
  if (lat > -6.12) return 'North Jakarta';
  if (lat > -6.18 && lat < -6.12 && lng > 106.8 && lng < 106.88) return 'Central Jakarta';
  if (lng > 106.85) return 'East Jakarta';
  return 'South Jakarta';
};

export function JakartaMap({ events = [], className = '', showLabels = true }: JakartaMapProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  // Load GeoJSON
  useEffect(() => {
    fetch('/jakarta-districts.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load Jakarta map data:', err));
  }, []);

  // Group events by district for non-authenticated view
  const eventsByDistrict = useMemo(() => {
    const grouped: Record<string, EventLocation[]> = {};
    events.forEach(event => {
      if (event.latitude && event.longitude) {
        const district = getDistrictFromCoords(event.latitude, event.longitude);
        if (!grouped[district]) grouped[district] = [];
        grouped[district].push(event);
      }
    });
    return grouped;
  }, [events]);

  // District centroids for area markers
  const districtCentroids: Record<string, [number, number]> = {
    'West Jakarta': [106.73, -6.17],
    'North Jakarta': [106.88, -6.12],
    'Central Jakarta': [106.84, -6.18],
    'East Jakarta': [106.90, -6.24],
    'South Jakarta': [106.82, -6.28],
  };

  if (!geoData) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 45000,
          center: [106.845, -6.21],
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
          {/* District polygons */}
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const districtName = geo.properties.Name;
                const colors = DISTRICT_COLORS[districtName] || { fill: '#E5E5E5', hover: '#D5D5D5', name: districtName, indonesian: '' };
                const isHovered = hoveredDistrict === districtName;
                const letter = DISTRICT_LETTERS[districtName];

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered ? colors.hover : colors.fill}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    style={{
                      default: { outline: 'none', transition: 'fill 0.2s ease' },
                      hover: { outline: 'none', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => setHoveredDistrict(districtName)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    onClick={() => navigate(`/gatherings?district=${encodeURIComponent(colors.name)}`)}
                  />
                );
              })
            }
          </Geographies>

          {/* District letter labels */}
          {showLabels && (
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const districtName = geo.properties.Name;
                  const letter = DISTRICT_LETTERS[districtName];
                  const centroid = geo.properties.centroid;

                  if (!letter || !centroid) return null;

                  return (
                    <Marker key={`label-${geo.rsmKey}`} coordinates={centroid}>
                      <g transform="translate(-12, -12)">
                        <circle
                          r="12"
                          cx="12"
                          cy="12"
                          fill="white"
                          stroke="#333"
                          strokeWidth="2"
                        />
                        <text
                          x="12"
                          y="12"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            fontFamily: 'system-ui, sans-serif',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fill: '#333',
                          }}
                        >
                          {letter}
                        </text>
                      </g>
                    </Marker>
                  );
                })
              }
            </Geographies>
          )}

          {/* Event markers */}
          {user ? (
            // Authenticated: Show exact event locations with @ markers
            events.map((event) => {
              if (!event.latitude || !event.longitude) return null;
              const isHovered = hoveredEvent === event.id;

              return (
                <Marker
                  key={`event-${event.id}`}
                  coordinates={[event.longitude, event.latitude]}
                  onClick={() => navigate(`/gatherings/${event.id}`)}
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <g style={{ cursor: 'pointer' }}>
                    {/* Pulse animation ring */}
                    <circle
                      r={isHovered ? 20 : 16}
                      fill="none"
                      stroke="var(--mint)"
                      strokeWidth="2"
                      opacity={0.4}
                      style={{
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    />
                    {/* Main marker */}
                    <circle
                      r={isHovered ? 14 : 12}
                      fill="var(--charcoal)"
                      stroke="var(--mint)"
                      strokeWidth="2"
                    />
                    {/* @ symbol */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: isHovered ? '14px' : '12px',
                        fontWeight: 'bold',
                        fill: 'var(--mint)',
                      }}
                    >
                      @
                    </text>
                    {/* Tooltip */}
                    {isHovered && (
                      <g transform="translate(20, -10)">
                        <rect
                          x="0"
                          y="-12"
                          width={event.title.length * 7 + 16}
                          height="24"
                          rx="4"
                          fill="var(--charcoal)"
                          stroke="var(--mint)"
                          strokeWidth="1"
                        />
                        <text
                          x="8"
                          y="0"
                          dominantBaseline="central"
                          style={{
                            fontFamily: 'system-ui, sans-serif',
                            fontSize: '11px',
                            fontWeight: '500',
                            fill: 'var(--ivory)',
                          }}
                        >
                          {event.title}
                        </text>
                      </g>
                    )}
                  </g>
                </Marker>
              );
            })
          ) : (
            // Non-authenticated: Show area indicators
            Object.entries(eventsByDistrict).map(([district, districtEvents]) => {
              const coords = districtCentroids[district];
              if (!coords) return null;
              const isHovered = hoveredDistrict === district;

              return (
                <Marker
                  key={`area-${district}`}
                  coordinates={coords}
                  onClick={() => navigate(`/gatherings?district=${encodeURIComponent(district)}`)}
                  onMouseEnter={() => setHoveredDistrict(district)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                >
                  <g style={{ cursor: 'pointer' }}>
                    {/* Outer ring */}
                    <circle
                      r={isHovered ? 24 : 20}
                      fill="none"
                      stroke="var(--mint)"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      opacity={0.6}
                    />
                    {/* Inner circle */}
                    <circle
                      r={isHovered ? 16 : 14}
                      fill="var(--charcoal)"
                      stroke="var(--mint)"
                      strokeWidth="2"
                    />
                    {/* @ symbol */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fill: 'var(--mint)',
                      }}
                    >
                      @
                    </text>
                    {/* Event count badge */}
                    <g transform="translate(12, -12)">
                      <circle r="8" fill="var(--mint)" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                          fontFamily: 'system-ui, sans-serif',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          fill: 'var(--charcoal)',
                        }}
                      >
                        {districtEvents.length}
                      </text>
                    </g>
                    {/* Tooltip */}
                    {isHovered && (
                      <g transform="translate(28, -8)">
                        <rect
                          x="0"
                          y="-10"
                          width={district.length * 7 + 60}
                          height="20"
                          rx="4"
                          fill="var(--charcoal)"
                          stroke="var(--mint)"
                          strokeWidth="1"
                        />
                        <text
                          x="8"
                          y="0"
                          dominantBaseline="central"
                          style={{
                            fontFamily: 'system-ui, sans-serif',
                            fontSize: '10px',
                            fill: 'var(--ivory)',
                          }}
                        >
                          {district} • {districtEvents.length} event{districtEvents.length > 1 ? 's' : ''}
                        </text>
                      </g>
                    )}
                  </g>
                </Marker>
              );
            })
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
        <div className="font-bold text-gray-800 mb-2">DISTRICTS</div>
        <div className="space-y-1">
          {Object.entries(DISTRICT_COLORS)
            .filter(([key]) => key !== 'KEPULAUAN SERIBU')
            .map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: value.fill }}
                >
                  {DISTRICT_LETTERS[key]}
                </div>
                <span className="text-gray-700">{value.name}</span>
                <span className="text-gray-400">({value.indonesian})</span>
              </div>
            ))}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--mint)] animate-pulse" />
        <span className="text-xs text-white font-medium">
          {events.length} active location{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

export default JakartaMap;
