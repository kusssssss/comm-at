/**
 * Gatherings Reveal System
 * 
 * Implements the Stratified Reality reveal mechanics:
 * - TEASE: Event announced but no details revealed
 * - WINDOW: Time window open, countdown to reveal
 * - LOCKED: Time revealed but location still hidden (layer-gated)
 * - REVEALED: Full details available to eligible members
 */

// Layer hierarchy (higher index = higher access)
export const LAYER_HIERARCHY = [
  'outside',      // 0 - Not a member
  'initiate',     // 1 - Streetlight (new member)
  'member',       // 2 - Verified / Signal
  'inner_circle', // 3 - Inner Room
  // 'black_label' would be 4 - reserved for future
] as const;

export type Layer = typeof LAYER_HIERARCHY[number];

export type RevealState = 'tease' | 'window' | 'locked' | 'revealed';

export interface RevealInfo {
  state: RevealState;
  timeRevealed: boolean;
  locationRevealed: boolean;
  eventDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  area: string | null;
  city: string | null;
  coordinates: string | null;
  latitude: string | null;
  longitude: string | null;
  timeRevealAt: Date | null;
  locationRevealAt: Date | null;
  countdownToTimeReveal: number | null; // milliseconds
  countdownToLocationReveal: number | null; // milliseconds
  countdownToEvent: number | null; // milliseconds
  userLayerSufficient: boolean;
  requiredLayer: Layer;
  message: string;
}

export interface GatheringData {
  id: number;
  title: string;
  eventDate: Date | null;
  startDatetime: Date | null;
  endDatetime: Date | null;
  timeRevealHoursBefore: number | null;
  locationRevealHoursBefore: number | null;
  markState: Layer; // minimum layer required
  venueName: string | null;
  venueAddress: string | null;
  area: string | null;
  city: string | null;
  coordinates: string | null;
  latitude: string | null;
  longitude: string | null;
}

/**
 * Get the numeric index of a layer for comparison
 */
export function getLayerIndex(layer: Layer | string): number {
  const index = LAYER_HIERARCHY.indexOf(layer as Layer);
  return index === -1 ? 0 : index;
}

/**
 * Check if user's layer meets the minimum requirement
 */
export function hasLayerAccess(userLayer: Layer | string, requiredLayer: Layer | string): boolean {
  return getLayerIndex(userLayer) >= getLayerIndex(requiredLayer);
}

/**
 * Calculate the reveal state and available information for a gathering
 */
export function calculateRevealInfo(
  gathering: GatheringData,
  userLayer: Layer | string = 'outside',
  now: Date = new Date()
): RevealInfo {
  const eventDate = gathering.eventDate ? new Date(gathering.eventDate) : null;
  const startDatetime = gathering.startDatetime ? new Date(gathering.startDatetime) : null;
  const endDatetime = gathering.endDatetime ? new Date(gathering.endDatetime) : null;
  
  // Calculate reveal timestamps
  const timeRevealHours = gathering.timeRevealHoursBefore ?? 168; // Default 7 days
  const locationRevealHours = gathering.locationRevealHoursBefore ?? 24; // Default 24 hours
  
  let timeRevealAt: Date | null = null;
  let locationRevealAt: Date | null = null;
  
  if (eventDate) {
    timeRevealAt = new Date(eventDate.getTime() - timeRevealHours * 60 * 60 * 1000);
    locationRevealAt = new Date(eventDate.getTime() - locationRevealHours * 60 * 60 * 1000);
  }
  
  // Check user's layer access
  const requiredLayer = gathering.markState || 'outside';
  const userLayerSufficient = hasLayerAccess(userLayer, requiredLayer);
  
  // Determine what's revealed based on time
  const timeRevealed = timeRevealAt ? now >= timeRevealAt : false;
  const locationTimeReached = locationRevealAt ? now >= locationRevealAt : false;
  
  // Location is revealed only if:
  // 1. The location reveal time has passed AND
  // 2. User has sufficient layer access
  const locationRevealed = locationTimeReached && userLayerSufficient;
  
  // Calculate countdowns
  const countdownToTimeReveal = timeRevealAt && !timeRevealed 
    ? timeRevealAt.getTime() - now.getTime() 
    : null;
  
  const countdownToLocationReveal = locationRevealAt && !locationTimeReached
    ? locationRevealAt.getTime() - now.getTime()
    : null;
  
  const countdownToEvent = eventDate && eventDate > now
    ? eventDate.getTime() - now.getTime()
    : null;
  
  // Determine reveal state
  let state: RevealState;
  let message: string;
  
  if (!timeRevealed) {
    state = 'tease';
    message = 'Event announced. Time reveals soon.';
  } else if (!locationTimeReached) {
    state = 'window';
    message = 'Time revealed. Location countdown active.';
  } else if (!locationRevealed) {
    state = 'locked';
    message = `Location locked. Requires ${formatLayerName(requiredLayer)} access.`;
  } else {
    state = 'revealed';
    message = 'Full details revealed. See you there.';
  }
  
  return {
    state,
    timeRevealed,
    locationRevealed,
    eventDate,
    startTime: timeRevealed && startDatetime ? formatTime(startDatetime) : null,
    endTime: timeRevealed && endDatetime ? formatTime(endDatetime) : null,
    venueName: locationRevealed ? gathering.venueName : null,
    venueAddress: locationRevealed ? gathering.venueAddress : null,
    area: locationRevealed ? gathering.area : null,
    city: gathering.city, // City is always shown
    coordinates: locationRevealed ? gathering.coordinates : null,
    latitude: locationRevealed ? gathering.latitude : null,
    longitude: locationRevealed ? gathering.longitude : null,
    timeRevealAt,
    locationRevealAt,
    countdownToTimeReveal,
    countdownToLocationReveal,
    countdownToEvent,
    userLayerSufficient,
    requiredLayer: requiredLayer as Layer,
    message,
  };
}

/**
 * Format layer name for display
 */
export function formatLayerName(layer: Layer | string): string {
  const names: Record<string, string> = {
    'outside': 'Streetlight',
    'initiate': 'Verified',
    'member': 'Signal',
    'inner_circle': 'Inner Room',
    'black_label': 'Black Label',
  };
  return names[layer] || layer;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get reveal state badge color
 */
export function getRevealStateColor(state: RevealState): string {
  const colors: Record<RevealState, string> = {
    'tease': '#888888',      // Gray
    'window': '#0ABAB5',     // Tiffany Blue
    'locked': '#FF6B6B',     // Red
    'revealed': '#00FF00',   // Green
  };
  return colors[state];
}

/**
 * Get reveal state label
 */
export function getRevealStateLabel(state: RevealState): string {
  const labels: Record<RevealState, string> = {
    'tease': 'TEASE',
    'window': 'WINDOW',
    'locked': 'LOCKED',
    'revealed': 'REVEALED',
  };
  return labels[state];
}
