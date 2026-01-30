// Futuristic Mission Control Map Style
// Dark theme with mint/cyan accents for tactical look

export const missionMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#0a0a0a" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0a0a0a" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a5568" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6FCF97" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a9079" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d4f5f" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0d1f12" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3C7A47" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f0f1a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a5568" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e3a5f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0d1f35" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6FCF97" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#15152a" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6FCF97" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#050510" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1a3a4a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050510" }],
  },
];

// Alternative: Even darker tactical style
export const tacticalMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#050508" }],
  },
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#6FCF97", weight: 0.5 }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#0d1a15" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1a2f28" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020205" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0a1a0f" }],
  },
];
