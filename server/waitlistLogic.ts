/**
 * Waitlist Logic
 * 
 * Handles capacity management and waitlist operations for gatherings.
 * 
 * Flow:
 * 1. User requests pass → check capacity
 * 2. If spots available → grant pass immediately
 * 3. If full → add to waitlist with position
 * 4. When spot opens (cancel/revoke) → promote next in waitlist
 */

import type { Event, EventPass } from "../drizzle/schema";

export interface CapacityInfo {
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  spotsRemaining: number;
  isFull: boolean;
  hasWaitlist: boolean;
}

export interface WaitlistResult {
  success: boolean;
  isWaitlisted: boolean;
  waitlistPosition?: number;
  message: string;
}

export interface PromotionResult {
  promoted: boolean;
  promotedUserId?: number;
  promotedPassId?: number;
  newWaitlistCount: number;
}

/**
 * Calculate capacity info for an event
 */
export function calculateCapacityInfo(
  event: Event,
  passes: EventPass[]
): CapacityInfo {
  const capacity = event.capacity || 0;
  
  // Count confirmed passes (not waitlisted, not revoked)
  const confirmedCount = passes.filter(p => 
    !p.isWaitlisted && 
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  ).length;
  
  // Count waitlisted passes
  const waitlistCount = passes.filter(p => 
    p.isWaitlisted && 
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  ).length;
  
  const spotsRemaining = Math.max(0, capacity - confirmedCount);
  const isFull = spotsRemaining === 0;
  const hasWaitlist = waitlistCount > 0;
  
  return {
    capacity,
    confirmedCount,
    waitlistCount,
    spotsRemaining,
    isFull,
    hasWaitlist,
  };
}

/**
 * Get the next waitlist position for an event
 */
export function getNextWaitlistPosition(passes: EventPass[]): number {
  const waitlistedPasses = passes.filter(p => 
    p.isWaitlisted && 
    p.waitlistPosition !== null &&
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  );
  
  if (waitlistedPasses.length === 0) {
    return 1;
  }
  
  const maxPosition = Math.max(...waitlistedPasses.map(p => p.waitlistPosition!));
  return maxPosition + 1;
}

/**
 * Get the next pass to promote from waitlist
 */
export function getNextToPromote(passes: EventPass[]): EventPass | null {
  const waitlistedPasses = passes.filter(p => 
    p.isWaitlisted && 
    p.waitlistPosition !== null &&
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  );
  
  if (waitlistedPasses.length === 0) {
    return null;
  }
  
  // Sort by waitlist position (lowest first)
  waitlistedPasses.sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
  
  return waitlistedPasses[0];
}

/**
 * Determine if a new registration should be waitlisted
 */
export function shouldWaitlist(
  event: Event,
  passes: EventPass[]
): { shouldWaitlist: boolean; position?: number } {
  const capacityInfo = calculateCapacityInfo(event, passes);
  
  if (!capacityInfo.isFull) {
    return { shouldWaitlist: false };
  }
  
  const position = getNextWaitlistPosition(passes);
  return { shouldWaitlist: true, position };
}

/**
 * Get user's waitlist position (1-indexed, or null if not waitlisted)
 */
export function getUserWaitlistPosition(
  userId: number,
  passes: EventPass[]
): number | null {
  const userPass = passes.find(p => 
    p.userId === userId && 
    p.isWaitlisted && 
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  );
  
  if (!userPass || !userPass.waitlistPosition) {
    return null;
  }
  
  // Count how many people are ahead in the waitlist
  const aheadCount = passes.filter(p => 
    p.isWaitlisted && 
    p.waitlistPosition !== null &&
    p.waitlistPosition < userPass.waitlistPosition! &&
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  ).length;
  
  return aheadCount + 1;
}

/**
 * Recalculate waitlist positions after a promotion or cancellation
 * Returns the new positions for each waitlisted pass
 */
export function recalculateWaitlistPositions(
  passes: EventPass[]
): Map<number, number> {
  const waitlistedPasses = passes.filter(p => 
    p.isWaitlisted && 
    p.passStatus !== 'revoked' && 
    p.passStatus !== 'expired'
  );
  
  // Sort by original position or waitlistedAt
  waitlistedPasses.sort((a, b) => {
    if (a.waitlistPosition !== null && b.waitlistPosition !== null) {
      return a.waitlistPosition - b.waitlistPosition;
    }
    if (a.waitlistedAt && b.waitlistedAt) {
      return new Date(a.waitlistedAt).getTime() - new Date(b.waitlistedAt).getTime();
    }
    return 0;
  });
  
  const newPositions = new Map<number, number>();
  waitlistedPasses.forEach((pass, index) => {
    newPositions.set(pass.id, index + 1);
  });
  
  return newPositions;
}

/**
 * Format capacity status for display
 */
export function formatCapacityStatus(capacityInfo: CapacityInfo): string {
  if (capacityInfo.capacity === 0) {
    return 'Unlimited capacity';
  }
  
  if (capacityInfo.isFull) {
    if (capacityInfo.hasWaitlist) {
      return `Full (${capacityInfo.waitlistCount} on waitlist)`;
    }
    return 'Full';
  }
  
  if (capacityInfo.spotsRemaining <= 5) {
    return `${capacityInfo.spotsRemaining} spots left`;
  }
  
  return `${capacityInfo.confirmedCount}/${capacityInfo.capacity} registered`;
}

/**
 * Get urgency level for capacity display
 */
export function getCapacityUrgency(capacityInfo: CapacityInfo): 'none' | 'low' | 'medium' | 'high' | 'full' {
  if (capacityInfo.capacity === 0) {
    return 'none';
  }
  
  if (capacityInfo.isFull) {
    return 'full';
  }
  
  const percentFull = capacityInfo.confirmedCount / capacityInfo.capacity;
  
  if (percentFull >= 0.9) {
    return 'high';
  }
  if (percentFull >= 0.75) {
    return 'medium';
  }
  if (percentFull >= 0.5) {
    return 'low';
  }
  
  return 'none';
}
