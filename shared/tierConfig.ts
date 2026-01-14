/**
 * Tier Configuration for COMM@ Membership System
 * 
 * Defines the tier levels, requirements, and progression logic
 */

export type TierName = 'OUTSIDE' | 'INITIATE' | 'MEMBER' | 'INNER_CIRCLE';

export interface TierRequirement {
  marksOwned: number;
  eventsAttended: number;
  referralsMade: number;
}

export interface Tier {
  name: TierName;
  displayName: string;
  color: string;
  badge: string;
  description: string;
}

export interface TierStats {
  marksOwned: number;
  eventsAttended: number;
  referralsMade: number;
}

export interface RequirementProgress {
  current: number;
  required: number;
  progress: number;
  met: boolean;
}

export interface TierProgress {
  currentTier: Tier;
  nextTier: Tier | null;
  overallProgress: number;
  requirements: {
    marksOwned: RequirementProgress;
    eventsAttended: RequirementProgress;
    referralsMade: RequirementProgress;
  };
}

// Tier definitions
export const TIERS: Tier[] = [
  {
    name: 'OUTSIDE',
    displayName: 'Outside',
    color: '#6B7280',
    badge: '○',
    description: 'Not yet part of the collective.',
  },
  {
    name: 'INITIATE',
    displayName: 'Initiate',
    color: '#10B981',
    badge: '◐',
    description: 'Welcome to the collective. Your journey begins here.',
  },
  {
    name: 'MEMBER',
    displayName: 'Member',
    color: '#3B82F6',
    badge: '●',
    description: 'A recognized member of the collective.',
  },
  {
    name: 'INNER_CIRCLE',
    displayName: 'Inner Circle',
    color: '#9333EA',
    badge: '◉',
    description: 'Among the most dedicated members.',
  },
];

// Requirements for each tier
export const TIER_REQUIREMENTS: Record<TierName, TierRequirement> = {
  OUTSIDE: { marksOwned: 0, eventsAttended: 0, referralsMade: 0 },
  INITIATE: { marksOwned: 1, eventsAttended: 0, referralsMade: 0 },
  MEMBER: { marksOwned: 3, eventsAttended: 2, referralsMade: 0 },
  INNER_CIRCLE: { marksOwned: 5, eventsAttended: 5, referralsMade: 5 },
};

/**
 * Get a tier by name
 */
export function getTier(name: TierName): Tier {
  const tier = TIERS.find(t => t.name === name);
  return tier || TIERS[0]; // Default to OUTSIDE
}

/**
 * Get the index of a tier
 */
export function getTierIndex(name: TierName): number {
  return TIERS.findIndex(t => t.name === name);
}

/**
 * Get the next tier after the given tier
 */
export function getNextTier(name: TierName): Tier | null {
  const currentIndex = getTierIndex(name);
  if (currentIndex === -1 || currentIndex >= TIERS.length - 1) {
    return null;
  }
  return TIERS[currentIndex + 1];
}

/**
 * Calculate the user's current tier based on their stats
 */
export function calculateUserTier(stats: TierStats): TierName {
  // Check tiers from highest to lowest
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const tier = TIERS[i];
    const req = TIER_REQUIREMENTS[tier.name];
    
    if (
      stats.marksOwned >= req.marksOwned &&
      stats.eventsAttended >= req.eventsAttended &&
      stats.referralsMade >= req.referralsMade
    ) {
      return tier.name;
    }
  }
  
  return 'OUTSIDE';
}

/**
 * Calculate the user's progress toward the next tier
 */
export function calculateTierProgress(stats: TierStats): TierProgress {
  const currentTierName = calculateUserTier(stats);
  const currentTier = getTier(currentTierName);
  const nextTier = getNextTier(currentTierName);
  
  const currentReq = TIER_REQUIREMENTS[currentTierName];
  const nextReq = nextTier ? TIER_REQUIREMENTS[nextTier.name] : currentReq;
  
  // Calculate individual requirement progress
  const calculateReqProgress = (
    current: number,
    required: number,
    baseline: number
  ): RequirementProgress => {
    const range = required - baseline;
    let progress = 100;
    
    if (range > 0) {
      progress = Math.min(100, Math.round(((current - baseline) / range) * 100));
    }
    
    return {
      current,
      required,
      progress: Math.max(0, progress),
      met: current >= required,
    };
  };
  
  const requirements = {
    marksOwned: calculateReqProgress(
      stats.marksOwned,
      nextReq.marksOwned,
      currentReq.marksOwned
    ),
    eventsAttended: calculateReqProgress(
      stats.eventsAttended,
      nextReq.eventsAttended,
      currentReq.eventsAttended
    ),
    referralsMade: calculateReqProgress(
      stats.referralsMade,
      nextReq.referralsMade,
      currentReq.referralsMade
    ),
  };
  
  // Calculate overall progress
  let overallProgress = 100;
  if (nextTier) {
    // Count only requirements that have a non-zero target from current to next
    let totalProgress = 0;
    let activeRequirements = 0;
    
    if (nextReq.marksOwned > currentReq.marksOwned) {
      activeRequirements++;
      totalProgress += requirements.marksOwned.progress;
    }
    if (nextReq.eventsAttended > currentReq.eventsAttended) {
      activeRequirements++;
      totalProgress += requirements.eventsAttended.progress;
    }
    if (nextReq.referralsMade > currentReq.referralsMade) {
      activeRequirements++;
      totalProgress += requirements.referralsMade.progress;
    }
    
    if (activeRequirements > 0) {
      overallProgress = Math.round(totalProgress / activeRequirements);
    } else {
      // If no active requirements (shouldn't happen), default to 0
      overallProgress = 0;
    }
  }
  
  return {
    currentTier,
    nextTier,
    overallProgress,
    requirements,
  };
}
