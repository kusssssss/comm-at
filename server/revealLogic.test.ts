import { describe, it, expect } from 'vitest';
import {
  calculateRevealInfo,
  getLayerIndex,
  hasLayerAccess,
  formatLayerName,
  getRevealStateLabel,
  getRevealStateColor,
  LAYER_HIERARCHY,
  type GatheringData,
  type RevealState,
} from './revealLogic';

describe('revealLogic', () => {
  describe('getLayerIndex', () => {
    it('returns correct index for each layer', () => {
      expect(getLayerIndex('outside')).toBe(0);
      expect(getLayerIndex('initiate')).toBe(1);
      expect(getLayerIndex('member')).toBe(2);
      expect(getLayerIndex('inner_circle')).toBe(3);
    });

    it('returns 0 for unknown layers', () => {
      expect(getLayerIndex('unknown' as any)).toBe(0);
      expect(getLayerIndex('')).toBe(0);
    });
  });

  describe('hasLayerAccess', () => {
    it('returns true when user layer >= required layer', () => {
      expect(hasLayerAccess('inner_circle', 'outside')).toBe(true);
      expect(hasLayerAccess('inner_circle', 'initiate')).toBe(true);
      expect(hasLayerAccess('inner_circle', 'member')).toBe(true);
      expect(hasLayerAccess('inner_circle', 'inner_circle')).toBe(true);
      expect(hasLayerAccess('member', 'initiate')).toBe(true);
      expect(hasLayerAccess('initiate', 'initiate')).toBe(true);
    });

    it('returns false when user layer < required layer', () => {
      expect(hasLayerAccess('outside', 'initiate')).toBe(false);
      expect(hasLayerAccess('initiate', 'member')).toBe(false);
      expect(hasLayerAccess('member', 'inner_circle')).toBe(false);
    });
  });

  describe('formatLayerName', () => {
    it('formats layer names correctly', () => {
      expect(formatLayerName('outside')).toBe('Streetlight');
      expect(formatLayerName('initiate')).toBe('Verified');
      expect(formatLayerName('member')).toBe('Signal');
      expect(formatLayerName('inner_circle')).toBe('Inner Room');
    });

    it('returns original string for unknown layers', () => {
      expect(formatLayerName('unknown')).toBe('unknown');
    });
  });

  describe('getRevealStateLabel', () => {
    it('returns correct labels for each state', () => {
      expect(getRevealStateLabel('tease')).toBe('TEASE');
      expect(getRevealStateLabel('window')).toBe('WINDOW');
      expect(getRevealStateLabel('locked')).toBe('LOCKED');
      expect(getRevealStateLabel('revealed')).toBe('REVEALED');
    });
  });

  describe('getRevealStateColor', () => {
    it('returns correct colors for each state', () => {
      expect(getRevealStateColor('tease')).toBe('#888888');
      expect(getRevealStateColor('window')).toBe('#0ABAB5');
      expect(getRevealStateColor('locked')).toBe('#FF6B6B');
      expect(getRevealStateColor('revealed')).toBe('#00FF00');
    });
  });

  describe('calculateRevealInfo', () => {
    const baseGathering: GatheringData = {
      id: 1,
      title: 'Test Event',
      eventDate: new Date('2026-02-15T22:00:00'),
      startDatetime: new Date('2026-02-15T22:00:00'),
      endDatetime: new Date('2026-02-16T04:00:00'),
      timeRevealHoursBefore: 48, // 2 days before
      locationRevealHoursBefore: 24, // 1 day before
      markState: 'member',
      venueName: 'Test Venue',
      venueAddress: '123 Test Street',
      area: 'Test Area',
      city: 'Jakarta',
      coordinates: '-6.2088,106.8456',
    };

    it('returns TEASE state when time reveal has not passed', () => {
      // 3 days before event (time reveals 2 days before)
      const now = new Date('2026-02-12T22:00:00');
      const result = calculateRevealInfo(baseGathering, 'member', now);

      expect(result.state).toBe('tease');
      expect(result.timeRevealed).toBe(false);
      expect(result.locationRevealed).toBe(false);
      expect(result.startTime).toBeNull();
      expect(result.venueName).toBeNull();
      expect(result.countdownToTimeReveal).toBeGreaterThan(0);
    });

    it('returns WINDOW state when time is revealed but location time not reached', () => {
      // 1.5 days before event (time revealed, location reveals in 12 hours)
      const now = new Date('2026-02-14T10:00:00');
      const result = calculateRevealInfo(baseGathering, 'member', now);

      expect(result.state).toBe('window');
      expect(result.timeRevealed).toBe(true);
      expect(result.locationRevealed).toBe(false);
      expect(result.startTime).not.toBeNull();
      expect(result.venueName).toBeNull();
      expect(result.countdownToLocationReveal).toBeGreaterThan(0);
    });

    it('returns LOCKED state when location time passed but user layer insufficient', () => {
      // 12 hours before event (location time passed)
      const now = new Date('2026-02-15T10:00:00');
      const result = calculateRevealInfo(baseGathering, 'initiate', now); // initiate < member

      expect(result.state).toBe('locked');
      expect(result.timeRevealed).toBe(true);
      expect(result.locationRevealed).toBe(false);
      expect(result.userLayerSufficient).toBe(false);
      expect(result.venueName).toBeNull();
    });

    it('returns REVEALED state when location time passed and user has sufficient layer', () => {
      // 12 hours before event (location time passed)
      const now = new Date('2026-02-15T10:00:00');
      const result = calculateRevealInfo(baseGathering, 'member', now);

      expect(result.state).toBe('revealed');
      expect(result.timeRevealed).toBe(true);
      expect(result.locationRevealed).toBe(true);
      expect(result.userLayerSufficient).toBe(true);
      expect(result.venueName).toBe('Test Venue');
      expect(result.venueAddress).toBe('123 Test Street');
      expect(result.area).toBe('Test Area');
      expect(result.coordinates).toBe('-6.2088,106.8456');
    });

    it('reveals location for higher layer users', () => {
      const now = new Date('2026-02-15T10:00:00');
      const result = calculateRevealInfo(baseGathering, 'inner_circle', now);

      expect(result.state).toBe('revealed');
      expect(result.locationRevealed).toBe(true);
      expect(result.userLayerSufficient).toBe(true);
    });

    it('always shows city regardless of reveal state', () => {
      const now = new Date('2026-02-12T22:00:00'); // TEASE state
      const result = calculateRevealInfo(baseGathering, 'outside', now);

      expect(result.city).toBe('Jakarta');
    });

    it('calculates countdown to event correctly', () => {
      const now = new Date('2026-02-15T10:00:00');
      const result = calculateRevealInfo(baseGathering, 'member', now);

      // 12 hours until event
      expect(result.countdownToEvent).toBe(12 * 60 * 60 * 1000);
    });

    it('handles null event date gracefully', () => {
      const gatheringNoDate = { ...baseGathering, eventDate: null };
      const result = calculateRevealInfo(gatheringNoDate, 'member', new Date());

      expect(result.state).toBe('tease');
      expect(result.timeRevealed).toBe(false);
      expect(result.locationRevealed).toBe(false);
      expect(result.timeRevealAt).toBeNull();
      expect(result.locationRevealAt).toBeNull();
    });

    it('uses default reveal hours when not specified', () => {
      const gatheringDefaults = {
        ...baseGathering,
        timeRevealHoursBefore: null,
        locationRevealHoursBefore: null,
      };
      // Event is 2026-02-15T22:00:00, default time reveal is 168 hours (7 days) before
      // So time reveals at 2026-02-08T22:00:00
      // Testing 8 days before event should be TEASE
      const result = calculateRevealInfo(gatheringDefaults, 'member', new Date('2026-02-07T22:00:00'));

      // Default is 168 hours (7 days) for time reveal
      // 8 days before event should be TEASE
      expect(result.state).toBe('tease');
    });

    it('formats start and end times correctly when revealed', () => {
      const now = new Date('2026-02-15T10:00:00');
      const result = calculateRevealInfo(baseGathering, 'member', now);

      expect(result.startTime).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
      expect(result.endTime).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
    });
  });
});
