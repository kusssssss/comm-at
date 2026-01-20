import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserLayer,
  getLayerLabel,
  checkLayerAccess,
  checkDropGating,
  getDropGatingInfo,
} from './gatingLogic';
import type { User, Drop } from '../drizzle/schema';

// Mock user factory
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'public',
    status: 'active',
    reputationPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as User;
}

// Mock drop factory
function createMockDrop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: 1,
    artistName: 'Test Artist',
    title: 'Test Drop',
    editionSize: 100,
    status: 'published',
    requiredLayer: 'outside',
    attendanceLockEventId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Drop;
}

describe('Gating Logic', () => {
  describe('getUserLayer', () => {
    it('should return outside for null user', () => {
      expect(getUserLayer(null)).toBe('outside');
    });

    it('should return outside for public user', () => {
      const user = createMockUser({ role: 'public' });
      expect(getUserLayer(user)).toBe('outside');
    });

    it('should return initiate for marked_initiate', () => {
      const user = createMockUser({ role: 'marked_initiate' });
      expect(getUserLayer(user)).toBe('initiate');
    });

    it('should return member for marked_member', () => {
      const user = createMockUser({ role: 'marked_member' });
      expect(getUserLayer(user)).toBe('member');
    });

    it('should return inner_circle for marked_inner_circle', () => {
      const user = createMockUser({ role: 'marked_inner_circle' });
      expect(getUserLayer(user)).toBe('inner_circle');
    });

    it('should return inner_circle for staff', () => {
      const user = createMockUser({ role: 'staff' });
      expect(getUserLayer(user)).toBe('inner_circle');
    });

    it('should return inner_circle for admin', () => {
      const user = createMockUser({ role: 'admin' });
      expect(getUserLayer(user)).toBe('inner_circle');
    });

    it('should return revoked for banned user', () => {
      const user = createMockUser({ status: 'banned' });
      expect(getUserLayer(user)).toBe('revoked');
    });

    it('should return revoked for revoked user', () => {
      const user = createMockUser({ status: 'revoked' });
      expect(getUserLayer(user)).toBe('revoked');
    });
  });

  describe('getLayerLabel', () => {
    it('should return Public for outside', () => {
      expect(getLayerLabel('outside')).toBe('Public');
    });

    it('should return STREETLIGHT for initiate', () => {
      expect(getLayerLabel('initiate')).toBe('STREETLIGHT');
    });

    it('should return VERIFIED for member', () => {
      expect(getLayerLabel('member')).toBe('VERIFIED');
    });

    it('should return INNER ROOM for inner_circle', () => {
      expect(getLayerLabel('inner_circle')).toBe('INNER ROOM');
    });
  });

  describe('checkLayerAccess', () => {
    it('should allow public user to access outside drops', () => {
      const user = createMockUser({ role: 'public' });
      expect(checkLayerAccess(user, 'outside')).toBe(true);
    });

    it('should deny public user access to initiate drops', () => {
      const user = createMockUser({ role: 'public' });
      expect(checkLayerAccess(user, 'initiate')).toBe(false);
    });

    it('should allow initiate to access initiate drops', () => {
      const user = createMockUser({ role: 'marked_initiate' });
      expect(checkLayerAccess(user, 'initiate')).toBe(true);
    });

    it('should allow member to access initiate drops', () => {
      const user = createMockUser({ role: 'marked_member' });
      expect(checkLayerAccess(user, 'initiate')).toBe(true);
    });

    it('should deny initiate access to member drops', () => {
      const user = createMockUser({ role: 'marked_initiate' });
      expect(checkLayerAccess(user, 'member')).toBe(false);
    });

    it('should allow inner_circle to access all drops', () => {
      const user = createMockUser({ role: 'marked_inner_circle' });
      expect(checkLayerAccess(user, 'outside')).toBe(true);
      expect(checkLayerAccess(user, 'initiate')).toBe(true);
      expect(checkLayerAccess(user, 'member')).toBe(true);
      expect(checkLayerAccess(user, 'inner_circle')).toBe(true);
    });

    it('should deny banned user access to any drops', () => {
      const user = createMockUser({ status: 'banned' });
      expect(checkLayerAccess(user, 'outside')).toBe(false);
    });

    it('should allow null user to access outside drops', () => {
      expect(checkLayerAccess(null, 'outside')).toBe(true);
    });

    it('should deny null user access to gated drops', () => {
      expect(checkLayerAccess(null, 'initiate')).toBe(false);
    });
  });

  describe('getDropGatingInfo', () => {
    it('should return not gated for outside drop', () => {
      const drop = createMockDrop({ requiredLayer: 'outside' });
      const info = getDropGatingInfo(drop);
      expect(info.isLayerGated).toBe(false);
      expect(info.isAttendanceLocked).toBe(false);
    });

    it('should return layer gated for initiate drop', () => {
      const drop = createMockDrop({ requiredLayer: 'initiate' });
      const info = getDropGatingInfo(drop);
      expect(info.isLayerGated).toBe(true);
      expect(info.requiredLayer).toBe('initiate');
      expect(info.requiredLayerLabel).toBe('STREETLIGHT');
    });

    it('should return attendance locked for event-gated drop', () => {
      const drop = createMockDrop({ attendanceLockEventId: 5 });
      const info = getDropGatingInfo(drop);
      expect(info.isAttendanceLocked).toBe(true);
      expect(info.attendanceLockEventId).toBe(5);
    });

    it('should return both gated for dual-gated drop', () => {
      const drop = createMockDrop({ 
        requiredLayer: 'member',
        attendanceLockEventId: 10 
      });
      const info = getDropGatingInfo(drop);
      expect(info.isLayerGated).toBe(true);
      expect(info.isAttendanceLocked).toBe(true);
    });
  });

  describe('checkDropGating', () => {
    const mockGetEventPassesByUser = vi.fn();
    const mockGetEventById = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should allow purchase for public drop by public user', async () => {
      const user = createMockUser({ role: 'public' });
      const drop = createMockDrop({ requiredLayer: 'outside' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(true);
    });

    it('should deny purchase for layer-gated drop by public user', async () => {
      const user = createMockUser({ role: 'public' });
      const drop = createMockDrop({ requiredLayer: 'initiate' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('STREETLIGHT');
    });

    it('should allow purchase for layer-gated drop by qualified user', async () => {
      const user = createMockUser({ role: 'marked_initiate' });
      const drop = createMockDrop({ requiredLayer: 'initiate' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(true);
    });

    it('should deny purchase for attendance-locked drop without attendance', async () => {
      const user = createMockUser({ id: 1, role: 'marked_member' });
      const drop = createMockDrop({ attendanceLockEventId: 5 });
      
      mockGetEventPassesByUser.mockResolvedValue([]);
      mockGetEventById.mockResolvedValue({ id: 5, title: 'Test Event' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Test Event');
    });

    it('should allow purchase for attendance-locked drop with attendance', async () => {
      const user = createMockUser({ id: 1, role: 'marked_member' });
      const drop = createMockDrop({ attendanceLockEventId: 5 });
      
      mockGetEventPassesByUser.mockResolvedValue([
        { eventId: 5, checkedInAt: new Date() }
      ]);
      mockGetEventById.mockResolvedValue({ id: 5, title: 'Test Event' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(true);
    });

    it('should deny purchase for dual-gated drop without both requirements', async () => {
      const user = createMockUser({ id: 1, role: 'marked_initiate' });
      const drop = createMockDrop({ 
        requiredLayer: 'member',
        attendanceLockEventId: 5 
      });
      
      mockGetEventPassesByUser.mockResolvedValue([]);
      mockGetEventById.mockResolvedValue({ id: 5, title: 'Test Event' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(false);
      expect(result.requirements?.type).toBe('both');
    });

    it('should deny purchase for banned user', async () => {
      const user = createMockUser({ status: 'banned' });
      const drop = createMockDrop({ requiredLayer: 'outside' });
      
      const result = await checkDropGating(user, drop, mockGetEventPassesByUser, mockGetEventById);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('restricted');
    });
  });
});
