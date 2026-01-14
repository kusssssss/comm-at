import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user types
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Helper to create mock context
function createMockContext(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Helper to create test users
function createTestUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "public",
    status: "active",
    callSign: null,
    chapter: null,
    phoneNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

describe("Auth Router", () => {
  describe("auth.me", () => {
    it("returns null for unauthenticated users", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).toBeNull();
    });

    it("returns user data for authenticated users", async () => {
      const user = createTestUser({ callSign: "TestAgent" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).toBeDefined();
      expect(result?.callSign).toBe("TestAgent");
    });
  });

  describe("auth.logout", () => {
    it("clears session cookie and returns success", async () => {
      const user = createTestUser();
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.logout();
      
      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });
});

describe("Role-Based Access Control", () => {
  describe("Marked user access", () => {
    it("allows marked_initiate to access inside feed", async () => {
      const user = createTestUser({ 
        role: "marked_initiate",
        callSign: "Initiate1",
        chapter: "South Jakarta"
      });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      // This should not throw - marked users can access inside
      const result = await caller.inside.getFeed();
      expect(result).toBeDefined();
    });

    it("allows marked_member to access inside feed", async () => {
      const user = createTestUser({ 
        role: "marked_member",
        callSign: "Member1",
        chapter: "South Jakarta"
      });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.inside.getFeed();
      expect(result).toBeDefined();
    });

    it("allows marked_inner_circle to access inside feed", async () => {
      const user = createTestUser({ 
        role: "marked_inner_circle",
        callSign: "InnerCircle1",
        chapter: "South Jakarta"
      });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.inside.getFeed();
      expect(result).toBeDefined();
    });
  });

  describe("Staff access", () => {
    it("allows staff to access staff portal", async () => {
      const user = createTestUser({ role: "staff" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.staff.getEvents();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("allows admin to access staff portal", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.staff.getEvents();
      expect(result).toBeDefined();
    });
  });

  describe("Admin access", () => {
    it("allows admin to list users", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.user.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("allows admin to list drops", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.drop.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("denies non-admin from listing users", async () => {
      const user = createTestUser({ role: "marked_member" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.user.list()).rejects.toThrow();
    });
  });
});

describe("Artifact Verification", () => {
  describe("artifact.getBySerial", () => {
    it("returns null for non-existent serial", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.artifact.getBySerial({ 
        serialNumber: "NONEXISTENT-SERIAL" 
      });
      
      expect(result).toBeNull();
    });
  });
});

describe("Event System", () => {
  describe("event.list", () => {
    it("returns events for marked users", async () => {
      const user = createTestUser({ 
        role: "marked_initiate",
        callSign: "TestUser",
        chapter: "South Jakarta"
      });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.event.list();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("event.listAll (admin)", () => {
    it("returns all events for admin", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.event.listAll();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("denies non-admin from listing all events", async () => {
      const user = createTestUser({ role: "marked_member" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.event.listAll()).rejects.toThrow();
    });
  });
});

describe("Doctrine Cards", () => {
  describe("doctrine.list", () => {
    it("returns doctrine cards for admin", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.doctrine.list();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("Audit Logging", () => {
  describe("audit.getLogs", () => {
    it("returns audit logs for admin", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.audit.getLogs();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("denies non-admin from viewing audit logs", async () => {
      const user = createTestUser({ role: "staff" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.audit.getLogs()).rejects.toThrow();
    });
  });

  describe("audit.getMarkingLogs", () => {
    it("returns marking logs for admin", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.audit.getMarkingLogs();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

// ============================================================================
// UGC TESTS
// ============================================================================

describe("UGC System", () => {
  describe("ugc.getByDrop", () => {
    it("returns empty array for non-existent drop", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.ugc.getByDrop({ dropId: 99999 });
      
      expect(result).toEqual([]);
    });
    
    it("works for authenticated users", async () => {
      const user = createTestUser({ role: "marked_initiate" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.ugc.getByDrop({ dropId: 1 });
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("ugc.getByArtifact", () => {
    it("returns empty array for non-existent artifact", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.ugc.getByArtifact({ serialNumber: "FAKE-0000-0001" });
      
      expect(result).toEqual([]);
    });
  });

  describe("ugc.list (admin)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.ugc.list()).rejects.toThrow();
    });
    
    it("denies non-admin users", async () => {
      const user = createTestUser({ role: "marked_member" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.ugc.list()).rejects.toThrow();
    });
    
    it("returns list for admin user", async () => {
      const user = createTestUser({ role: "admin" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.ugc.list();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("ugc.create (admin)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.ugc.create({
        type: 'image',
        storageUrl: 'https://example.com/image.jpg',
        dropId: 1,
        visibility: 'public',
        sortOrder: 0,
      })).rejects.toThrow();
    });
    
    it("denies non-admin users", async () => {
      const user = createTestUser({ role: "staff" });
      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.ugc.create({
        type: 'image',
        storageUrl: 'https://example.com/image.jpg',
        dropId: 1,
        visibility: 'public',
        sortOrder: 0,
      })).rejects.toThrow();
    });
  });

  describe("ugc.delete (admin)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.ugc.delete({ id: 1 })).rejects.toThrow();
    });
  });
  
  describe("ugc.update (admin)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.ugc.update({ id: 1, visibility: 'inside_only' })).rejects.toThrow();
    });
  });
});

describe("Drop Public Access", () => {
  describe("drop.getById", () => {
    it("returns null for non-existent drop", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.drop.getById({ id: 99999 });
      
      expect(result).toBeNull();
    });
    
    it("works without authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw, even if drop doesn't exist
      const result = await caller.drop.getById({ id: 1 });
      
      // Result can be null or a drop object
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
