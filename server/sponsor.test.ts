import { describe, it, expect, vi } from "vitest";
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

function createAdminUser(): AuthenticatedUser {
  return createTestUser({ role: "admin" });
}

describe("Sponsor System", () => {
  describe("sponsor.list (public)", () => {
    it("returns empty array when no sponsors exist", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const sponsors = await caller.sponsor.list();
      expect(Array.isArray(sponsors)).toBe(true);
    });
    
    it("only returns active sponsors", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const sponsors = await caller.sponsor.list();
      sponsors.forEach((sponsor: any) => {
        expect(sponsor.status).toBe("active");
      });
    });
  });
  
  describe("sponsor.homepage (public)", () => {
    it("returns sponsors marked for homepage display", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const sponsors = await caller.sponsor.homepage();
      expect(Array.isArray(sponsors)).toBe(true);
      sponsors.forEach((sponsor: any) => {
        expect(sponsor.showOnHomepage).toBe(true);
        expect(sponsor.status).toBe("active");
      });
    });
  });
  
  describe("sponsor.forEvent (public)", () => {
    it("returns sponsors for a specific event", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const sponsors = await caller.sponsor.forEvent({ eventId: 1 });
      expect(Array.isArray(sponsors)).toBe(true);
    });
  });
  
  describe("sponsor.forDrop (public)", () => {
    it("returns sponsors for a specific drop", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const sponsors = await caller.sponsor.forDrop({ dropId: 1 });
      expect(Array.isArray(sponsors)).toBe(true);
    });
  });
  
  describe("sponsor.track (public)", () => {
    it("tracks impression events", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      // This should not throw even with non-existent sponsor
      const result = await caller.sponsor.track({
        sponsorId: 999,
        eventType: "impression",
        pageType: "homepage",
      });
      
      expect(result.success).toBe(true);
    });
    
    it("tracks click events", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.sponsor.track({
        sponsorId: 999,
        eventType: "click",
        pageType: "sponsors",
      });
      
      expect(result.success).toBe(true);
    });
  });
  
  describe("sponsor.inquiry (public)", () => {
    it("creates a sponsor inquiry", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.sponsor.inquiry({
        companyName: "Test Company",
        contactName: "John Doe",
        contactEmail: "john@test.com",
        sponsorTier: "gold",
        message: "We want to sponsor your events",
      });
      
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });
    
    it("validates required fields", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.sponsor.inquiry({
          companyName: "",
          contactName: "John",
          contactEmail: "john@test.com",
        })
      ).rejects.toThrow();
    });
    
    it("validates email format", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.sponsor.inquiry({
          companyName: "Test",
          contactName: "John",
          contactEmail: "invalid-email",
        })
      ).rejects.toThrow();
    });
  });
  
  describe("sponsor.adminList (admin only)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.sponsor.adminList()).rejects.toThrow();
    });
    
    it("returns all sponsors for admin", async () => {
      const ctx = createMockContext(createAdminUser());
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const sponsors = await caller.sponsor.adminList();
      expect(Array.isArray(sponsors)).toBe(true);
    });
  });
  
  describe("sponsor.create (admin only)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.sponsor.create({
          name: "Test Sponsor",
          slug: "test-sponsor",
          tier: "bronze",
        })
      ).rejects.toThrow();
    });
    
    it("creates sponsor with valid data", async () => {
      const ctx = createMockContext(createAdminUser());
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const uniqueSlug = `test-sponsor-${Date.now()}`;
      const result = await caller.sponsor.create({
        name: "Test Sponsor",
        slug: uniqueSlug,
        tier: "gold",
        description: "A test sponsor",
        showOnHomepage: true,
      });
      
      expect(result.id).toBeDefined();
    });
  });
  
  describe("sponsor.analytics (admin only)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.sponsor.analytics({ sponsorId: 1 })
      ).rejects.toThrow();
    });
    
    it("returns analytics data for admin", async () => {
      const ctx = createMockContext(createAdminUser());
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const analytics = await caller.sponsor.analytics({ sponsorId: 1, days: 30 });
      
      expect(analytics).toHaveProperty("impressions");
      expect(analytics).toHaveProperty("clicks");
      expect(analytics).toHaveProperty("ctr");
      expect(analytics).toHaveProperty("byPage");
    });
  });
  
  describe("sponsor.inquiries (admin only)", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext();
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.sponsor.inquiries({})).rejects.toThrow();
    });
    
    it("returns inquiries for admin", async () => {
      const ctx = createMockContext(createAdminUser());
      const { appRouter } = await import("./routers");
      const caller = appRouter.createCaller(ctx);
      
      const inquiries = await caller.sponsor.inquiries({});
      expect(Array.isArray(inquiries)).toBe(true);
    });
  });
});
