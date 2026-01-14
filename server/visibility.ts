/**
 * Stratified Reality Engine
 * 
 * Controls what content is visible based on user's mark_state:
 * - outside: Non-members see fragments, blurred photos, hidden prices
 * - initiate: New marks see titles/prices, limited UGC, no event passes
 * - member: Full context, Inside feed, can claim passes
 * - inner_circle: Planning notes, draft drops, admin-like visibility
 */

import type { User } from "../drizzle/schema";

// Visibility levels from lowest to highest access
export const VISIBILITY_LEVELS = {
  public: 0,            // Everyone can see
  public_fragment: 0,   // Outside users - fragments only (alias for public)
  marked_fragment: 1,   // Initiates - more but not full
  full_context: 2,      // Members - everything
  inner_only: 3,        // Inner circle - exclusive content
} as const;

// Human-readable tier names for UI display
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  public: 'Everyone',
  public_fragment: 'Everyone',
  marked_fragment: 'Initiate',
  full_context: 'Member',
  inner_only: 'Inner Circle',
};

// Get the minimum tier required to view content
export function getMinimumTierForContent(visibilityLevel: string): string {
  switch (visibilityLevel) {
    case 'public':
    case 'public_fragment':
      return 'Everyone';
    case 'marked_fragment':
      return 'Initiate';
    case 'full_context':
      return 'Member';
    case 'inner_only':
      return 'Inner Circle';
    default:
      return 'Member'; // Default to member if unknown
  }
}

export type VisibilityLevel = keyof typeof VISIBILITY_LEVELS;

// Map user roles to their visibility level
export function getUserVisibilityLevel(user: User | null): VisibilityLevel {
  if (!user) return 'public_fragment';
  
  switch (user.role) {
    case 'marked_inner_circle':
      return 'inner_only';
    case 'marked_member':
      return 'full_context';
    case 'marked_initiate':
      return 'marked_fragment';
    case 'staff':
    case 'admin':
      return 'inner_only'; // Staff/admin see everything
    default:
      return 'public_fragment';
  }
}

// Check if user can see content at a given visibility level
export function canSeeContent(user: User | null, contentVisibility: VisibilityLevel): boolean {
  const userLevel = VISIBILITY_LEVELS[getUserVisibilityLevel(user)];
  const contentLevel = VISIBILITY_LEVELS[contentVisibility];
  return userLevel >= contentLevel;
}

// Get the mark state from user role
export function getMarkState(user: User | null): 'outside' | 'initiate' | 'member' | 'inner_circle' {
  if (!user) return 'outside';
  
  switch (user.role) {
    case 'marked_inner_circle':
      return 'inner_circle';
    case 'marked_member':
      return 'member';
    case 'marked_initiate':
      return 'initiate';
    case 'staff':
    case 'admin':
      return 'inner_circle'; // Staff/admin have full access
    default:
      return 'outside';
  }
}

// Content filtering helpers
export interface StratifiedContent<T> {
  full: T;
  fragment?: Partial<T>;
  blurred?: boolean;
}

// Filter drop data based on visibility
export function filterDropForVisibility<T extends {
  title: string;
  description?: string | null;
  priceIdr?: number | null;
  heroImageUrl?: string | null;
  productImages?: string | null;
  storyBlurb?: string | null;
  visibilityLevel?: string | null;
}>(drop: T, user: User | null): T & { isBlurred: boolean; isRestricted: boolean; minimumTierRequired: string | null } {
  const markState = getMarkState(user);
  const dropVisibility = drop.visibilityLevel || 'public';
  
  // Handle 'public' visibility - everyone can see
  if (dropVisibility === 'public') {
    return { ...drop, isBlurred: false, isRestricted: false, minimumTierRequired: null };
  }
  
  const canSee = canSeeContent(user, dropVisibility as VisibilityLevel);
  const minimumTier = getMinimumTierForContent(dropVisibility);
  
  if (canSee) {
    return { ...drop, isBlurred: false, isRestricted: false, minimumTierRequired: null };
  }
  
  // Apply restrictions based on mark state
  if (markState === 'outside') {
    return {
      ...drop,
      title: drop.title, // Keep title visible
      description: drop.description ? drop.description.substring(0, 100) + '...' : null,
      priceIdr: null, // Hide price
      storyBlurb: null, // Hide story
      isBlurred: true,
      isRestricted: true,
      minimumTierRequired: minimumTier,
    };
  }
  
  if (markState === 'initiate') {
    return {
      ...drop,
      title: drop.title,
      description: drop.description,
      priceIdr: drop.priceIdr, // Show price to initiates
      storyBlurb: drop.storyBlurb ? drop.storyBlurb.substring(0, 200) + '...' : null,
      isBlurred: false,
      isRestricted: true,
      minimumTierRequired: minimumTier,
    };
  }
  
  return { ...drop, isBlurred: false, isRestricted: false, minimumTierRequired: null };
}

// Filter UGC based on visibility
export function filterUgcForVisibility<T extends {
  visibility?: string | null;
  storageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
}>(ugc: T[], user: User | null): (T & { isBlurred: boolean })[] {
  const markState = getMarkState(user);
  
  return ugc.map(item => {
    const ugcVisibility = item.visibility || 'public';
    
    // Public UGC visible to all
    if (ugcVisibility === 'public') {
      return { ...item, isBlurred: false };
    }
    
    // Inside-only UGC
    if (ugcVisibility === 'inside_only') {
      if (markState === 'outside') {
        return {
          ...item,
          caption: null, // Hide caption
          isBlurred: true,
        };
      }
      return { ...item, isBlurred: false };
    }
    
    return { ...item, isBlurred: false };
  });
}

// Filter event based on visibility
export function filterEventForVisibility<T extends {
  title: string;
  description?: string | null;
  venue?: string | null;
  address?: string | null;
  eligibilityMinState?: string | null;
  contentVisibility?: string | null;
  locationRevealHoursBefore?: number | null;
  eventDate?: Date | null;
  startTime?: Date | null;
}>(event: T, user: User | null): T & { 
  isBlurred: boolean; 
  isRestricted: boolean;
  locationRevealed: boolean;
  canClaimPass: boolean;
  minimumTierRequired: string | null;
} {
  const markState = getMarkState(user);
  const eligibility = (event.eligibilityMinState || 'member') as 'initiate' | 'member' | 'inner_circle';
  const contentVisibility = (event.contentVisibility || 'member') as 'member' | 'inner_circle';
  
  // Get minimum tier for this event
  const minimumTier = eligibility === 'initiate' ? 'Initiate' : 
                      eligibility === 'member' ? 'Member' : 'Inner Circle';
  
  // Check if location should be revealed
  const now = new Date();
  const eventTime = event.startTime || event.eventDate;
  const revealHours = event.locationRevealHoursBefore || 24;
  const revealTime = eventTime ? new Date(eventTime.getTime() - revealHours * 60 * 60 * 1000) : null;
  const locationRevealed = revealTime ? now >= revealTime : false;
  
  // Check eligibility for pass claiming
  const eligibilityOrder = { outside: 0, initiate: 1, member: 2, inner_circle: 3 };
  const canClaimPass = eligibilityOrder[markState] >= eligibilityOrder[eligibility];
  
  // Check content visibility
  const visibilityOrder = { outside: 0, initiate: 1, member: 2, inner_circle: 3 };
  const contentVisibilityLevel = contentVisibility === 'inner_circle' ? 3 : 2;
  const canSeeFullContent = visibilityOrder[markState] >= contentVisibilityLevel;
  
  if (markState === 'outside') {
    return {
      ...event,
      description: event.description ? event.description.substring(0, 50) + '...' : null,
      venue: null,
      address: null,
      isBlurred: true,
      isRestricted: true,
      locationRevealed: false,
      canClaimPass: false,
      minimumTierRequired: minimumTier,
    };
  }
  
  if (!canSeeFullContent) {
    return {
      ...event,
      venue: locationRevealed ? event.venue : '[Location Hidden]',
      address: locationRevealed ? event.address : null,
      isBlurred: false,
      isRestricted: true,
      locationRevealed,
      canClaimPass,
      minimumTierRequired: canClaimPass ? null : minimumTier,
    };
  }
  
  return {
    ...event,
    venue: locationRevealed ? event.venue : '[Location Hidden]',
    address: locationRevealed ? event.address : null,
    isBlurred: false,
    isRestricted: false,
    locationRevealed,
    canClaimPass,
    minimumTierRequired: null,
  };
}

// Get visibility restrictions message
export function getVisibilityMessage(markState: 'outside' | 'initiate' | 'member' | 'inner_circle'): string | null {
  switch (markState) {
    case 'outside':
      return 'Request clearance to see full content';
    case 'initiate':
      return 'Activate your Mark to unlock full access';
    case 'member':
      return null; // Full access
    case 'inner_circle':
      return null; // Full access
  }
}
