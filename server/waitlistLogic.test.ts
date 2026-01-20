import { describe, it, expect } from 'vitest';
import {
  calculateCapacityInfo,
  getNextWaitlistPosition,
  getNextToPromote,
  shouldWaitlist,
  getUserWaitlistPosition,
  recalculateWaitlistPositions,
  formatCapacityStatus,
  getCapacityUrgency,
} from './waitlistLogic';
import type { Event, EventPass } from '../drizzle/schema';

// Mock event factory
function createMockEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    title: 'Test Event',
    slug: 'test-event',
    chapter: 'South Jakarta',
    description: null,
    tagline: null,
    rules: null,
    capacity: 50,
    eligibilityMinState: 'member',
    contentVisibility: 'member',
    accessType: 'members_only',
    secretLevel: 'medium',
    timeRevealHoursBefore: 48,
    city: 'Jakarta',
    area: 'Kemang',
    venueName: 'Secret Venue',
    venueAddress: '123 Secret St',
    locationText: null,
    locationRevealHoursBefore: 24,
    locationRevealAt: null,
    coordinates: null,
    category: 'community',
    coverImageUrl: null,
    tags: null,
    eventDate: new Date('2026-02-01'),
    startDatetime: new Date('2026-02-01T19:00:00'),
    endDatetime: new Date('2026-02-01T23:00:00'),
    featuredOrder: 0,
    status: 'published',
    publishedAt: new Date(),
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Event;
}

// Mock pass factory
function createMockPass(overrides: Partial<EventPass> = {}): EventPass {
  return {
    id: Math.floor(Math.random() * 10000),
    eventId: 1,
    userId: Math.floor(Math.random() * 1000),
    markId: null,
    passStatus: 'claimed',
    scannableCode: `SC-${Math.random().toString(36).substring(7)}`,
    qrPayload: `EP-${Math.random().toString(36).substring(7)}`,
    plusOneName: null,
    rulesAcceptedAt: null,
    claimedAt: new Date(),
    usedAt: null,
    checkedInAt: null,
    checkedInById: null,
    reputationAwarded: 0,
    isWaitlisted: false,
    waitlistPosition: null,
    waitlistedAt: null,
    promotedFromWaitlistAt: null,
    revokedAt: null,
    revokedReason: null,
    revokedById: null,
    ...overrides,
  } as EventPass;
}

describe('Waitlist Logic', () => {
  describe('calculateCapacityInfo', () => {
    it('should return correct capacity info for empty event', () => {
      const event = createMockEvent({ capacity: 50 });
      const passes: EventPass[] = [];
      
      const info = calculateCapacityInfo(event, passes);
      
      expect(info.capacity).toBe(50);
      expect(info.confirmedCount).toBe(0);
      expect(info.waitlistCount).toBe(0);
      expect(info.spotsRemaining).toBe(50);
      expect(info.isFull).toBe(false);
      expect(info.hasWaitlist).toBe(false);
    });

    it('should count confirmed passes correctly', () => {
      const event = createMockEvent({ capacity: 10 });
      const passes = [
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
      ];
      
      const info = calculateCapacityInfo(event, passes);
      
      expect(info.confirmedCount).toBe(3);
      expect(info.spotsRemaining).toBe(7);
      expect(info.isFull).toBe(false);
    });

    it('should count waitlisted passes separately', () => {
      const event = createMockEvent({ capacity: 5 });
      const passes = [
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 1 }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 2 }),
      ];
      
      const info = calculateCapacityInfo(event, passes);
      
      expect(info.confirmedCount).toBe(5);
      expect(info.waitlistCount).toBe(2);
      expect(info.spotsRemaining).toBe(0);
      expect(info.isFull).toBe(true);
      expect(info.hasWaitlist).toBe(true);
    });

    it('should exclude revoked passes from counts', () => {
      const event = createMockEvent({ capacity: 10 });
      const passes = [
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false, passStatus: 'revoked' }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 1, passStatus: 'revoked' }),
      ];
      
      const info = calculateCapacityInfo(event, passes);
      
      expect(info.confirmedCount).toBe(1);
      expect(info.waitlistCount).toBe(0);
    });
  });

  describe('getNextWaitlistPosition', () => {
    it('should return 1 for empty waitlist', () => {
      const passes: EventPass[] = [];
      expect(getNextWaitlistPosition(passes)).toBe(1);
    });

    it('should return next position after highest', () => {
      const passes = [
        createMockPass({ isWaitlisted: true, waitlistPosition: 1 }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 2 }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 3 }),
      ];
      
      expect(getNextWaitlistPosition(passes)).toBe(4);
    });

    it('should ignore revoked passes', () => {
      const passes = [
        createMockPass({ isWaitlisted: true, waitlistPosition: 1 }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 5, passStatus: 'revoked' }),
      ];
      
      expect(getNextWaitlistPosition(passes)).toBe(2);
    });
  });

  describe('getNextToPromote', () => {
    it('should return null for empty waitlist', () => {
      const passes: EventPass[] = [];
      expect(getNextToPromote(passes)).toBeNull();
    });

    it('should return pass with lowest position', () => {
      const pass1 = createMockPass({ id: 1, isWaitlisted: true, waitlistPosition: 3 });
      const pass2 = createMockPass({ id: 2, isWaitlisted: true, waitlistPosition: 1 });
      const pass3 = createMockPass({ id: 3, isWaitlisted: true, waitlistPosition: 2 });
      
      const passes = [pass1, pass2, pass3];
      const next = getNextToPromote(passes);
      
      expect(next?.id).toBe(2);
    });

    it('should skip revoked passes', () => {
      const pass1 = createMockPass({ id: 1, isWaitlisted: true, waitlistPosition: 1, passStatus: 'revoked' });
      const pass2 = createMockPass({ id: 2, isWaitlisted: true, waitlistPosition: 2 });
      
      const passes = [pass1, pass2];
      const next = getNextToPromote(passes);
      
      expect(next?.id).toBe(2);
    });
  });

  describe('shouldWaitlist', () => {
    it('should not waitlist when spots available', () => {
      const event = createMockEvent({ capacity: 10 });
      const passes = [
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
      ];
      
      const result = shouldWaitlist(event, passes);
      
      expect(result.shouldWaitlist).toBe(false);
      expect(result.position).toBeUndefined();
    });

    it('should waitlist when at capacity', () => {
      const event = createMockEvent({ capacity: 2 });
      const passes = [
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
      ];
      
      const result = shouldWaitlist(event, passes);
      
      expect(result.shouldWaitlist).toBe(true);
      expect(result.position).toBe(1);
    });

    it('should return correct position with existing waitlist', () => {
      const event = createMockEvent({ capacity: 2 });
      const passes = [
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: false }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 1 }),
        createMockPass({ isWaitlisted: true, waitlistPosition: 2 }),
      ];
      
      const result = shouldWaitlist(event, passes);
      
      expect(result.shouldWaitlist).toBe(true);
      expect(result.position).toBe(3);
    });
  });

  describe('getUserWaitlistPosition', () => {
    it('should return null for user not on waitlist', () => {
      const passes = [
        createMockPass({ userId: 1, isWaitlisted: false }),
      ];
      
      expect(getUserWaitlistPosition(1, passes)).toBeNull();
    });

    it('should return correct position for waitlisted user', () => {
      const passes = [
        createMockPass({ userId: 1, isWaitlisted: true, waitlistPosition: 1 }),
        createMockPass({ userId: 2, isWaitlisted: true, waitlistPosition: 2 }),
        createMockPass({ userId: 3, isWaitlisted: true, waitlistPosition: 3 }),
      ];
      
      expect(getUserWaitlistPosition(2, passes)).toBe(2);
    });

    it('should recalculate position based on people ahead', () => {
      const passes = [
        createMockPass({ userId: 1, isWaitlisted: true, waitlistPosition: 1, passStatus: 'revoked' }),
        createMockPass({ userId: 2, isWaitlisted: true, waitlistPosition: 2 }),
        createMockPass({ userId: 3, isWaitlisted: true, waitlistPosition: 3 }),
      ];
      
      // User 3 should be position 2 since user 1 is revoked
      expect(getUserWaitlistPosition(3, passes)).toBe(2);
    });
  });

  describe('recalculateWaitlistPositions', () => {
    it('should return empty map for no waitlisted passes', () => {
      const passes = [
        createMockPass({ isWaitlisted: false }),
      ];
      
      const positions = recalculateWaitlistPositions(passes);
      
      expect(positions.size).toBe(0);
    });

    it('should renumber positions sequentially', () => {
      const pass1 = createMockPass({ id: 1, isWaitlisted: true, waitlistPosition: 1 });
      const pass2 = createMockPass({ id: 2, isWaitlisted: true, waitlistPosition: 5 });
      const pass3 = createMockPass({ id: 3, isWaitlisted: true, waitlistPosition: 10 });
      
      const passes = [pass1, pass2, pass3];
      const positions = recalculateWaitlistPositions(passes);
      
      expect(positions.get(1)).toBe(1);
      expect(positions.get(2)).toBe(2);
      expect(positions.get(3)).toBe(3);
    });
  });

  describe('formatCapacityStatus', () => {
    it('should show unlimited for zero capacity', () => {
      const info = {
        capacity: 0,
        confirmedCount: 5,
        waitlistCount: 0,
        spotsRemaining: 0,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(formatCapacityStatus(info)).toBe('Unlimited capacity');
    });

    it('should show spots left when available', () => {
      const info = {
        capacity: 50,
        confirmedCount: 45,
        waitlistCount: 0,
        spotsRemaining: 5,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(formatCapacityStatus(info)).toBe('5 spots left');
    });

    it('should show full with waitlist count', () => {
      const info = {
        capacity: 50,
        confirmedCount: 50,
        waitlistCount: 10,
        spotsRemaining: 0,
        isFull: true,
        hasWaitlist: true,
      };
      
      expect(formatCapacityStatus(info)).toBe('Full (10 on waitlist)');
    });

    it('should show registered count for high availability', () => {
      const info = {
        capacity: 100,
        confirmedCount: 30,
        waitlistCount: 0,
        spotsRemaining: 70,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(formatCapacityStatus(info)).toBe('30/100 registered');
    });
  });

  describe('getCapacityUrgency', () => {
    it('should return none for unlimited capacity', () => {
      const info = {
        capacity: 0,
        confirmedCount: 100,
        waitlistCount: 0,
        spotsRemaining: 0,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(getCapacityUrgency(info)).toBe('none');
    });

    it('should return full when at capacity', () => {
      const info = {
        capacity: 50,
        confirmedCount: 50,
        waitlistCount: 5,
        spotsRemaining: 0,
        isFull: true,
        hasWaitlist: true,
      };
      
      expect(getCapacityUrgency(info)).toBe('full');
    });

    it('should return high when 90%+ full', () => {
      const info = {
        capacity: 100,
        confirmedCount: 95,
        waitlistCount: 0,
        spotsRemaining: 5,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(getCapacityUrgency(info)).toBe('high');
    });

    it('should return medium when 75-90% full', () => {
      const info = {
        capacity: 100,
        confirmedCount: 80,
        waitlistCount: 0,
        spotsRemaining: 20,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(getCapacityUrgency(info)).toBe('medium');
    });

    it('should return low when 50-75% full', () => {
      const info = {
        capacity: 100,
        confirmedCount: 60,
        waitlistCount: 0,
        spotsRemaining: 40,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(getCapacityUrgency(info)).toBe('low');
    });

    it('should return none when less than 50% full', () => {
      const info = {
        capacity: 100,
        confirmedCount: 30,
        waitlistCount: 0,
        spotsRemaining: 70,
        isFull: false,
        hasWaitlist: false,
      };
      
      expect(getCapacityUrgency(info)).toBe('none');
    });
  });
});
