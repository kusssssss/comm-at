import { describe, it, expect } from "vitest";
import {
  getUserVisibilityLevel,
  canSeeContent,
  getMarkState,
  filterDropForVisibility,
  filterUgcForVisibility,
  filterEventForVisibility,
  getVisibilityMessage,
  VISIBILITY_LEVELS,
} from "./visibility";
import type { User } from "../drizzle/schema";

// Helper to create mock users
function createMockUser(role: User['role']): User {
  return {
    id: 1,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    loginMethod: 'oauth',
    phoneNumber: null,
    role,
    status: 'active',
    callSign: 'TEST_USER',
    chapter: 'South Jakarta',
    invitedById: null,
    invitesAvailable: 0,
    markState: null,
    clearanceState: 'none',
    clearanceCode: null,
    clearanceExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as User;
}

describe("Visibility System", () => {
  describe("getUserVisibilityLevel", () => {
    it("returns public_fragment for null user", () => {
      expect(getUserVisibilityLevel(null)).toBe("public_fragment");
    });

    it("returns public_fragment for public role", () => {
      const user = createMockUser("public");
      expect(getUserVisibilityLevel(user)).toBe("public_fragment");
    });

    it("returns marked_fragment for initiate", () => {
      const user = createMockUser("marked_initiate");
      expect(getUserVisibilityLevel(user)).toBe("marked_fragment");
    });

    it("returns full_context for member", () => {
      const user = createMockUser("marked_member");
      expect(getUserVisibilityLevel(user)).toBe("full_context");
    });

    it("returns inner_only for inner circle", () => {
      const user = createMockUser("marked_inner_circle");
      expect(getUserVisibilityLevel(user)).toBe("inner_only");
    });

    it("returns inner_only for admin", () => {
      const user = createMockUser("admin");
      expect(getUserVisibilityLevel(user)).toBe("inner_only");
    });

    it("returns inner_only for staff", () => {
      const user = createMockUser("staff");
      expect(getUserVisibilityLevel(user)).toBe("inner_only");
    });
  });

  describe("canSeeContent", () => {
    it("public user cannot see full_context content", () => {
      expect(canSeeContent(null, "full_context")).toBe(false);
    });

    it("public user can see public_fragment content", () => {
      expect(canSeeContent(null, "public_fragment")).toBe(true);
    });

    it("member can see full_context content", () => {
      const user = createMockUser("marked_member");
      expect(canSeeContent(user, "full_context")).toBe(true);
    });

    it("initiate cannot see full_context content", () => {
      const user = createMockUser("marked_initiate");
      expect(canSeeContent(user, "full_context")).toBe(false);
    });

    it("inner circle can see all content", () => {
      const user = createMockUser("marked_inner_circle");
      expect(canSeeContent(user, "inner_only")).toBe(true);
      expect(canSeeContent(user, "full_context")).toBe(true);
      expect(canSeeContent(user, "marked_fragment")).toBe(true);
      expect(canSeeContent(user, "public_fragment")).toBe(true);
    });
  });

  describe("getMarkState", () => {
    it("returns outside for null user", () => {
      expect(getMarkState(null)).toBe("outside");
    });

    it("returns outside for public role", () => {
      const user = createMockUser("public");
      expect(getMarkState(user)).toBe("outside");
    });

    it("returns initiate for marked_initiate", () => {
      const user = createMockUser("marked_initiate");
      expect(getMarkState(user)).toBe("initiate");
    });

    it("returns member for marked_member", () => {
      const user = createMockUser("marked_member");
      expect(getMarkState(user)).toBe("member");
    });

    it("returns inner_circle for marked_inner_circle", () => {
      const user = createMockUser("marked_inner_circle");
      expect(getMarkState(user)).toBe("inner_circle");
    });
  });

  describe("filterDropForVisibility", () => {
    const mockDrop = {
      id: 1,
      title: "Test Drop",
      description: "This is a test drop with a long description that should be truncated for outside users",
      priceIdr: 500000,
      heroImageUrl: "/images/test.jpg",
      productImages: "['/images/1.jpg']",
      storyBlurb: "A story about this drop that reveals cultural significance",
      visibilityLevel: "full_context",
    };

    it("hides price and truncates description for outside users", () => {
      const filtered = filterDropForVisibility(mockDrop, null);
      
      expect(filtered.priceIdr).toBeNull();
      expect(filtered.storyBlurb).toBeNull();
      expect(filtered.description?.endsWith('...')).toBe(true);
      expect(filtered.isBlurred).toBe(true);
      expect(filtered.isRestricted).toBe(true);
    });

    it("shows price but truncates story for initiates", () => {
      const user = createMockUser("marked_initiate");
      const filtered = filterDropForVisibility(mockDrop, user);
      
      expect(filtered.priceIdr).toBe(500000);
      expect(filtered.storyBlurb?.endsWith("...")).toBe(true);
      expect(filtered.isBlurred).toBe(false);
      expect(filtered.isRestricted).toBe(true);
    });

    it("shows full content for members", () => {
      const user = createMockUser("marked_member");
      const filtered = filterDropForVisibility(mockDrop, user);
      
      expect(filtered.priceIdr).toBe(500000);
      expect(filtered.storyBlurb).toBe(mockDrop.storyBlurb);
      expect(filtered.isBlurred).toBe(false);
      expect(filtered.isRestricted).toBe(false);
    });
  });

  describe("filterUgcForVisibility", () => {
    const mockUgc = [
      { id: 1, storageUrl: "/ugc/1.jpg", visibility: "public", caption: "Public caption" },
      { id: 2, storageUrl: "/ugc/2.jpg", visibility: "inside_only", caption: "Secret caption" },
    ];

    it("blurs inside_only UGC for outside users", () => {
      const filtered = filterUgcForVisibility(mockUgc, null);
      
      expect(filtered[0].isBlurred).toBe(false);
      expect(filtered[1].isBlurred).toBe(true);
      expect(filtered[1].caption).toBeNull();
    });

    it("shows all UGC for members", () => {
      const user = createMockUser("marked_member");
      const filtered = filterUgcForVisibility(mockUgc, user);
      
      expect(filtered[0].isBlurred).toBe(false);
      expect(filtered[1].isBlurred).toBe(false);
      expect(filtered[1].caption).toBe("Secret caption");
    });
  });

  describe("filterEventForVisibility", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const mockEvent = {
      id: 1,
      title: "Secret Gathering",
      description: "A secret event for the collective members only",
      venue: "Underground Club",
      address: "123 Secret St",
      eligibilityMinState: "member",
      contentVisibility: "member",
      locationRevealHoursBefore: 24,
      startTime: futureDate,
    };

    it("hides location and restricts for outside users", () => {
      const filtered = filterEventForVisibility(mockEvent, null);
      
      expect(filtered.venue).toBeNull();
      expect(filtered.address).toBeNull();
      expect(filtered.isBlurred).toBe(true);
      expect(filtered.isRestricted).toBe(true);
      expect(filtered.canClaimPass).toBe(false);
    });

    it("hides location before reveal time for members", () => {
      const user = createMockUser("marked_member");
      const filtered = filterEventForVisibility(mockEvent, user);
      
      expect(filtered.venue).toBe("[Location Hidden]");
      expect(filtered.address).toBeNull();
      expect(filtered.locationRevealed).toBe(false);
      expect(filtered.canClaimPass).toBe(true);
    });

    it("shows location after reveal time", () => {
      const pastEvent = {
        ...mockEvent,
        startTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        locationRevealHoursBefore: 24, // Should reveal 24 hours before
      };
      
      const user = createMockUser("marked_member");
      const filtered = filterEventForVisibility(pastEvent, user);
      
      expect(filtered.locationRevealed).toBe(true);
      expect(filtered.venue).toBe("Underground Club");
    });
  });

  describe("getVisibilityMessage", () => {
    it("returns clearance message for outside", () => {
      expect(getVisibilityMessage("outside")).toBe("Request clearance to see full content");
    });

    it("returns activation message for initiate", () => {
      expect(getVisibilityMessage("initiate")).toBe("Activate your Mark to unlock full access");
    });

    it("returns null for member", () => {
      expect(getVisibilityMessage("member")).toBeNull();
    });

    it("returns null for inner_circle", () => {
      expect(getVisibilityMessage("inner_circle")).toBeNull();
    });
  });

  describe("VISIBILITY_LEVELS ordering", () => {
    it("has correct hierarchy", () => {
      expect(VISIBILITY_LEVELS.public_fragment).toBeLessThan(VISIBILITY_LEVELS.marked_fragment);
      expect(VISIBILITY_LEVELS.marked_fragment).toBeLessThan(VISIBILITY_LEVELS.full_context);
      expect(VISIBILITY_LEVELS.full_context).toBeLessThan(VISIBILITY_LEVELS.inner_only);
    });
  });
});
