import { describe, it, expect } from 'vitest';
import { 
  calculateUserTier, 
  calculateTierProgress, 
  getTier, 
  getNextTier, 
  getTierIndex,
  TIERS,
  TIER_REQUIREMENTS 
} from '../shared/tierConfig';

describe('Tier Configuration', () => {
  it('should have 4 tiers defined', () => {
    expect(TIERS).toHaveLength(4);
  });

  it('should have correct tier order', () => {
    expect(TIERS[0].name).toBe('OUTSIDE');
    expect(TIERS[1].name).toBe('INITIATE');
    expect(TIERS[2].name).toBe('MEMBER');
    expect(TIERS[3].name).toBe('INNER_CIRCLE');
  });

  it('should have requirements for each tier', () => {
    expect(TIER_REQUIREMENTS.OUTSIDE).toBeDefined();
    expect(TIER_REQUIREMENTS.INITIATE).toBeDefined();
    expect(TIER_REQUIREMENTS.MEMBER).toBeDefined();
    expect(TIER_REQUIREMENTS.INNER_CIRCLE).toBeDefined();
  });
});

describe('getTier', () => {
  it('should return correct tier by name', () => {
    const tier = getTier('INITIATE');
    expect(tier.name).toBe('INITIATE');
    expect(tier.displayName).toBe('Initiate');
  });

  it('should return OUTSIDE for invalid tier name', () => {
    const tier = getTier('INVALID' as any);
    expect(tier.name).toBe('OUTSIDE');
  });
});

describe('getTierIndex', () => {
  it('should return correct index for each tier', () => {
    expect(getTierIndex('OUTSIDE')).toBe(0);
    expect(getTierIndex('INITIATE')).toBe(1);
    expect(getTierIndex('MEMBER')).toBe(2);
    expect(getTierIndex('INNER_CIRCLE')).toBe(3);
  });
});

describe('getNextTier', () => {
  it('should return next tier for non-max tiers', () => {
    expect(getNextTier('OUTSIDE')?.name).toBe('INITIATE');
    expect(getNextTier('INITIATE')?.name).toBe('MEMBER');
    expect(getNextTier('MEMBER')?.name).toBe('INNER_CIRCLE');
  });

  it('should return null for max tier', () => {
    expect(getNextTier('INNER_CIRCLE')).toBeNull();
  });
});

describe('calculateUserTier', () => {
  it('should return OUTSIDE for users with no stats', () => {
    const tier = calculateUserTier({
      marksOwned: 0,
      eventsAttended: 0,
      referralsMade: 0,
    });
    expect(tier).toBe('OUTSIDE');
  });

  it('should return INITIATE for users with 1 mark', () => {
    const tier = calculateUserTier({
      marksOwned: 1,
      eventsAttended: 0,
      referralsMade: 0,
    });
    expect(tier).toBe('INITIATE');
  });

  it('should return MEMBER for users meeting member requirements', () => {
    const tier = calculateUserTier({
      marksOwned: 3,
      eventsAttended: 2,
      referralsMade: 0,
    });
    expect(tier).toBe('MEMBER');
  });

  it('should return INNER_CIRCLE for users meeting all requirements', () => {
    const tier = calculateUserTier({
      marksOwned: 5,
      eventsAttended: 5,
      referralsMade: 5,
    });
    expect(tier).toBe('INNER_CIRCLE');
  });

  it('should not upgrade if only some requirements are met', () => {
    // Has enough marks but not enough events for MEMBER
    const tier = calculateUserTier({
      marksOwned: 3,
      eventsAttended: 1,
      referralsMade: 0,
    });
    expect(tier).toBe('INITIATE');
  });
});

describe('calculateTierProgress', () => {
  it('should calculate progress for OUTSIDE user', () => {
    const progress = calculateTierProgress({
      marksOwned: 0,
      eventsAttended: 0,
      referralsMade: 0,
    });
    
    expect(progress.currentTier.name).toBe('OUTSIDE');
    expect(progress.nextTier?.name).toBe('INITIATE');
    expect(progress.overallProgress).toBe(0);
  });

  it('should calculate partial progress correctly', () => {
    const progress = calculateTierProgress({
      marksOwned: 2,
      eventsAttended: 1,
      referralsMade: 0,
    });
    
    expect(progress.currentTier.name).toBe('INITIATE');
    expect(progress.nextTier?.name).toBe('MEMBER');
    // From INITIATE to MEMBER: marks 1->3 (range 2), events 0->2 (range 2)
    // marks: (2-1)/(3-1) = 1/2 = 50%
    // events: (1-0)/(2-0) = 1/2 = 50%
    // average = 50%
    expect(progress.overallProgress).toBeGreaterThanOrEqual(50);
    expect(progress.overallProgress).toBeLessThanOrEqual(60);
  });

  it('should show 100% progress for max tier', () => {
    const progress = calculateTierProgress({
      marksOwned: 10,
      eventsAttended: 10,
      referralsMade: 10,
    });
    
    expect(progress.currentTier.name).toBe('INNER_CIRCLE');
    expect(progress.nextTier).toBeNull();
    expect(progress.overallProgress).toBe(100);
  });

  it('should cap individual requirement progress at 100%', () => {
    const progress = calculateTierProgress({
      marksOwned: 10, // Way over requirement
      eventsAttended: 0,
      referralsMade: 0,
    });
    
    expect(progress.requirements.marksOwned.progress).toBe(100);
  });

  it('should include requirement details', () => {
    const progress = calculateTierProgress({
      marksOwned: 1,
      eventsAttended: 1,
      referralsMade: 0,
    });
    
    expect(progress.requirements.marksOwned.current).toBe(1);
    expect(progress.requirements.eventsAttended.current).toBe(1);
    expect(progress.requirements.referralsMade.current).toBe(0);
  });
});
