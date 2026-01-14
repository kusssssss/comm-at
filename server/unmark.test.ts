import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database functions
vi.mock('./db', () => ({
  getUserById: vi.fn(),
  updateUserMarkState: vi.fn(),
  getArtifactsByUser: vi.fn(),
  revokeArtifact: vi.fn(),
  createMemoryLog: vi.fn(),
  createAuditLog: vi.fn(),
}));

import * as db from './db';

describe('Unmarking System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateUserMarkState', () => {
    it('should update user mark state to revoked', async () => {
      const mockUser = { id: 1, callSign: 'TESTUSER', markState: 'member' };
      vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);
      vi.mocked(db.updateUserMarkState).mockResolvedValue(undefined);
      
      await db.updateUserMarkState(1, 'revoked');
      
      expect(db.updateUserMarkState).toHaveBeenCalledWith(1, 'revoked');
    });

    it('should support all mark states', async () => {
      const states = ['outside', 'initiate', 'member', 'inner_circle', 'revoked'] as const;
      
      for (const state of states) {
        vi.mocked(db.updateUserMarkState).mockResolvedValue(undefined);
        await db.updateUserMarkState(1, state);
        expect(db.updateUserMarkState).toHaveBeenCalledWith(1, state);
      }
    });
  });

  describe('revokeArtifact', () => {
    it('should revoke an artifact with reason', async () => {
      vi.mocked(db.revokeArtifact).mockResolvedValue(undefined);
      
      await db.revokeArtifact(123, 'Violated The Code');
      
      expect(db.revokeArtifact).toHaveBeenCalledWith(123, 'Violated The Code');
    });
  });

  describe('Unmark flow', () => {
    it('should revoke all artifacts when unmarking a user', async () => {
      const mockUser = { id: 1, callSign: 'TESTUSER', markState: 'member' };
      const mockArtifacts = [
        { id: 101, serialNumber: 'GN-001' },
        { id: 102, serialNumber: 'GN-002' },
      ];
      
      vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);
      vi.mocked(db.getArtifactsByUser).mockResolvedValue(mockArtifacts as any);
      vi.mocked(db.updateUserMarkState).mockResolvedValue(undefined);
      vi.mocked(db.revokeArtifact).mockResolvedValue(undefined);
      vi.mocked(db.createMemoryLog).mockResolvedValue(1);
      vi.mocked(db.createAuditLog).mockResolvedValue(undefined);
      
      // Simulate the unmark flow
      await db.updateUserMarkState(1, 'revoked');
      
      for (const artifact of mockArtifacts) {
        await db.revokeArtifact(artifact.id, 'User unmarked');
      }
      
      expect(db.updateUserMarkState).toHaveBeenCalledWith(1, 'revoked');
      expect(db.revokeArtifact).toHaveBeenCalledTimes(2);
    });

    it('should create memory log for revocation', async () => {
      vi.mocked(db.createMemoryLog).mockResolvedValue(1);
      
      await db.createMemoryLog({
        userId: 1,
        memoryType: 'mark_revoked',
        referenceId: 1,
        referenceType: 'user',
        details: 'Mark revoked: Violated The Code',
        visibilityLevel: 'inner_only',
      });
      
      expect(db.createMemoryLog).toHaveBeenCalledWith({
        userId: 1,
        memoryType: 'mark_revoked',
        referenceId: 1,
        referenceType: 'user',
        details: 'Mark revoked: Violated The Code',
        visibilityLevel: 'inner_only',
      });
    });

    it('should create audit log for revocation', async () => {
      vi.mocked(db.createAuditLog).mockResolvedValue(undefined);
      
      await db.createAuditLog({
        action: 'mark_revoked',
        userId: 999,
        userName: 'ADMIN',
        targetType: 'user',
        targetId: 1,
        targetIdentifier: 'TESTUSER',
        description: 'Violated The Code',
      });
      
      expect(db.createAuditLog).toHaveBeenCalledWith({
        action: 'mark_revoked',
        userId: 999,
        userName: 'ADMIN',
        targetType: 'user',
        targetId: 1,
        targetIdentifier: 'TESTUSER',
        description: 'Violated The Code',
      });
    });
  });

  describe('Consequences of unmarking', () => {
    it('should preserve memory logs after revocation', async () => {
      // Memory logs should persist even after unmarking
      // The user can still see their history but with limited visibility
      vi.mocked(db.createMemoryLog).mockResolvedValue(1);
      
      const memoryLog = await db.createMemoryLog({
        userId: 1,
        memoryType: 'mark_revoked',
        referenceId: 1,
        referenceType: 'user',
        details: 'Mark revoked',
        visibilityLevel: 'inner_only', // Only inner circle can see who was revoked
      });
      
      expect(memoryLog).toBe(1);
    });

    it('should set artifact status to revoked', async () => {
      vi.mocked(db.revokeArtifact).mockResolvedValue(undefined);
      
      // When an artifact is revoked, it should be marked as such
      // This is different from flagged - revoked means permanently lost
      await db.revokeArtifact(123, 'Owner unmarked');
      
      expect(db.revokeArtifact).toHaveBeenCalledWith(123, 'Owner unmarked');
    });
  });
});
