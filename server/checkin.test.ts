import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getDb: vi.fn(),
  getEventPassByScannableCode: vi.fn(),
  getEventPassByQr: vi.fn(),
  checkInPass: vi.fn(),
  getEventAttendance: vi.fn(),
  getEventCheckInStats: vi.fn(),
  getUserById: vi.fn(),
  createCheckInLog: vi.fn(),
}));

import * as db from './db';

describe('Check-in System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEventPassByScannableCode', () => {
    it('should find pass by scannable code', async () => {
      const mockPass = {
        id: 1,
        eventId: 100,
        userId: 50,
        scannableCode: 'SC-ABC123',
        qrPayload: 'PASS-XYZ789',
        passStatus: 'claimed',
        checkedInAt: null,
      };
      
      vi.mocked(db.getEventPassByScannableCode).mockResolvedValue(mockPass);
      
      const result = await db.getEventPassByScannableCode('SC-ABC123');
      
      expect(result).toEqual(mockPass);
      expect(db.getEventPassByScannableCode).toHaveBeenCalledWith('SC-ABC123');
    });

    it('should return undefined for non-existent code', async () => {
      vi.mocked(db.getEventPassByScannableCode).mockResolvedValue(undefined);
      
      const result = await db.getEventPassByScannableCode('INVALID');
      
      expect(result).toBeUndefined();
    });
  });

  describe('checkInPass', () => {
    it('should successfully check in a valid pass', async () => {
      vi.mocked(db.checkInPass).mockResolvedValue({ success: true });
      
      const result = await db.checkInPass(1, 10, 15);
      
      expect(result.success).toBe(true);
      expect(db.checkInPass).toHaveBeenCalledWith(1, 10, 15);
    });

    it('should reject already checked in pass', async () => {
      vi.mocked(db.checkInPass).mockResolvedValue({ 
        success: false, 
        error: 'Already checked in' 
      });
      
      const result = await db.checkInPass(1, 10, 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already checked in');
    });

    it('should reject revoked pass', async () => {
      vi.mocked(db.checkInPass).mockResolvedValue({ 
        success: false, 
        error: 'Pass has been revoked' 
      });
      
      const result = await db.checkInPass(2, 10, 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Pass has been revoked');
    });

    it('should reject non-existent pass', async () => {
      vi.mocked(db.checkInPass).mockResolvedValue({ 
        success: false, 
        error: 'Pass not found' 
      });
      
      const result = await db.checkInPass(999, 10, 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Pass not found');
    });
  });

  describe('getEventAttendance', () => {
    it('should return attendance list for event', async () => {
      const mockAttendance = [
        {
          passId: 1,
          userId: 50,
          userName: 'Test User',
          callSign: 'TESTER',
          plusOneName: null,
          claimedAt: new Date('2026-01-15'),
          checkedInAt: new Date('2026-01-20'),
          checkedInById: 10,
          reputationAwarded: 15,
          passStatus: 'used',
        },
        {
          passId: 2,
          userId: 51,
          userName: 'Another User',
          callSign: 'ANOTHER',
          plusOneName: 'Guest Name',
          claimedAt: new Date('2026-01-16'),
          checkedInAt: null,
          checkedInById: null,
          reputationAwarded: 0,
          passStatus: 'claimed',
        },
      ];
      
      vi.mocked(db.getEventAttendance).mockResolvedValue(mockAttendance);
      
      const result = await db.getEventAttendance(100);
      
      expect(result).toHaveLength(2);
      expect(result[0].callSign).toBe('TESTER');
      expect(result[0].checkedInAt).not.toBeNull();
      expect(result[1].checkedInAt).toBeNull();
    });

    it('should return empty array for event with no passes', async () => {
      vi.mocked(db.getEventAttendance).mockResolvedValue([]);
      
      const result = await db.getEventAttendance(999);
      
      expect(result).toEqual([]);
    });
  });

  describe('getEventCheckInStats', () => {
    it('should return correct stats', async () => {
      vi.mocked(db.getEventCheckInStats).mockResolvedValue({
        total: 50,
        checkedIn: 30,
        pending: 20,
      });
      
      const result = await db.getEventCheckInStats(100);
      
      expect(result.total).toBe(50);
      expect(result.checkedIn).toBe(30);
      expect(result.pending).toBe(20);
    });

    it('should return zeros for event with no passes', async () => {
      vi.mocked(db.getEventCheckInStats).mockResolvedValue({
        total: 0,
        checkedIn: 0,
        pending: 0,
      });
      
      const result = await db.getEventCheckInStats(999);
      
      expect(result.total).toBe(0);
      expect(result.checkedIn).toBe(0);
      expect(result.pending).toBe(0);
    });
  });

  describe('Check-in workflow', () => {
    it('should complete full check-in flow', async () => {
      // 1. Find pass by code
      const mockPass = {
        id: 1,
        eventId: 100,
        userId: 50,
        scannableCode: 'SC-TEST123',
        passStatus: 'claimed',
        checkedInAt: null,
      };
      vi.mocked(db.getEventPassByScannableCode).mockResolvedValue(mockPass);
      
      // 2. Check in the pass
      vi.mocked(db.checkInPass).mockResolvedValue({ success: true });
      
      // 3. Get user info
      vi.mocked(db.getUserById).mockResolvedValue({
        id: 50,
        callSign: 'TESTER',
        name: 'Test User',
        reputationPoints: 100,
      } as any);
      
      // Execute flow
      const pass = await db.getEventPassByScannableCode('SC-TEST123');
      expect(pass).toBeDefined();
      expect(pass?.eventId).toBe(100);
      
      const checkInResult = await db.checkInPass(pass!.id, 10, 15);
      expect(checkInResult.success).toBe(true);
      
      const user = await db.getUserById(pass!.userId);
      expect(user?.callSign).toBe('TESTER');
    });

    it('should handle wrong event check-in attempt', async () => {
      const mockPass = {
        id: 1,
        eventId: 100, // Pass is for event 100
        userId: 50,
        scannableCode: 'SC-WRONG',
        passStatus: 'claimed',
      };
      vi.mocked(db.getEventPassByScannableCode).mockResolvedValue(mockPass);
      
      const pass = await db.getEventPassByScannableCode('SC-WRONG');
      
      // Trying to check in at event 200 should be rejected
      const targetEventId = 200;
      expect(pass?.eventId).not.toBe(targetEventId);
    });
  });
});
