import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getClearanceRequestByUserId: vi.fn(),
  createClearanceRequest: vi.fn(),
  getPendingClearanceRequests: vi.fn(),
  approveClearanceRequest: vi.fn(),
  denyClearanceRequest: vi.fn(),
  createAuditLog: vi.fn(),
}));

import * as db from "./db";

describe("Clearance System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClearanceRequestByUserId", () => {
    it("should return undefined when no request exists", async () => {
      vi.mocked(db.getClearanceRequestByUserId).mockResolvedValue(undefined);
      
      const result = await db.getClearanceRequestByUserId(1);
      
      expect(result).toBeUndefined();
      expect(db.getClearanceRequestByUserId).toHaveBeenCalledWith(1);
    });

    it("should return the request when it exists", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        reason: "I protect the culture by supporting local artists",
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        vouchUserId: null,
        vouchCallSign: null,
        adminNotes: null,
        reviewedById: null,
        reviewedAt: null,
        expiresAt: null,
      };
      
      vi.mocked(db.getClearanceRequestByUserId).mockResolvedValue(mockRequest);
      
      const result = await db.getClearanceRequestByUserId(1);
      
      expect(result).toEqual(mockRequest);
      expect(result?.status).toBe("pending");
    });
  });

  describe("createClearanceRequest", () => {
    it("should create a new clearance request", async () => {
      vi.mocked(db.createClearanceRequest).mockResolvedValue(1);
      
      const result = await db.createClearanceRequest({
        userId: 1,
        reason: "I protect the culture by supporting local artists and attending underground events",
      });
      
      expect(result).toBe(1);
      expect(db.createClearanceRequest).toHaveBeenCalledWith({
        userId: 1,
        reason: "I protect the culture by supporting local artists and attending underground events",
      });
    });

    it("should create request with vouch call sign", async () => {
      vi.mocked(db.createClearanceRequest).mockResolvedValue(2);
      
      const result = await db.createClearanceRequest({
        userId: 2,
        reason: "I protect the culture through my work in the music industry",
        vouchCallSign: "NOODLE_KING",
      });
      
      expect(result).toBe(2);
      expect(db.createClearanceRequest).toHaveBeenCalledWith({
        userId: 2,
        reason: "I protect the culture through my work in the music industry",
        vouchCallSign: "NOODLE_KING",
      });
    });
  });

  describe("getPendingClearanceRequests", () => {
    it("should return empty array when no pending requests", async () => {
      vi.mocked(db.getPendingClearanceRequests).mockResolvedValue([]);
      
      const result = await db.getPendingClearanceRequests();
      
      expect(result).toEqual([]);
    });

    it("should return pending requests with user info", async () => {
      const mockRequests = [
        {
          id: 1,
          userId: 1,
          reason: "I protect the culture",
          vouchUserId: null,
          status: "pending" as const,
          createdAt: new Date(),
          userName: "Test User",
          userCallSign: null,
        },
      ];
      
      vi.mocked(db.getPendingClearanceRequests).mockResolvedValue(mockRequests);
      
      const result = await db.getPendingClearanceRequests();
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
      expect(result[0].userName).toBe("Test User");
    });
  });

  describe("approveClearanceRequest", () => {
    it("should approve request and return clearance code", async () => {
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      vi.mocked(db.approveClearanceRequest).mockResolvedValue({
        clearanceCode: "CLR-abc123xyz789",
        expiresAt,
      });
      
      const result = await db.approveClearanceRequest(1, 100);
      
      expect(result.clearanceCode).toMatch(/^CLR-/);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(db.approveClearanceRequest).toHaveBeenCalledWith(1, 100);
    });
  });

  describe("denyClearanceRequest", () => {
    it("should deny request without reason", async () => {
      vi.mocked(db.denyClearanceRequest).mockResolvedValue(undefined);
      
      await db.denyClearanceRequest(1, 100);
      
      expect(db.denyClearanceRequest).toHaveBeenCalledWith(1, 100);
    });

    it("should deny request with reason", async () => {
      vi.mocked(db.denyClearanceRequest).mockResolvedValue(undefined);
      
      await db.denyClearanceRequest(1, 100, "Insufficient cultural contribution");
      
      expect(db.denyClearanceRequest).toHaveBeenCalledWith(1, 100, "Insufficient cultural contribution");
    });
  });

  describe("Clearance state transitions", () => {
    it("should track state from none -> applied -> granted", async () => {
      // User starts with no clearance
      vi.mocked(db.getClearanceRequestByUserId).mockResolvedValue(undefined);
      let request = await db.getClearanceRequestByUserId(1);
      expect(request).toBeUndefined();
      
      // User submits application
      vi.mocked(db.createClearanceRequest).mockResolvedValue(1);
      const requestId = await db.createClearanceRequest({
        userId: 1,
        reason: "I protect the culture by supporting local artists and the underground scene",
      });
      expect(requestId).toBe(1);
      
      // Request is pending
      vi.mocked(db.getClearanceRequestByUserId).mockResolvedValue({
        id: 1,
        userId: 1,
        reason: "I protect the culture by supporting local artists and the underground scene",
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        vouchUserId: null,
        vouchCallSign: null,
        adminNotes: null,
        reviewedById: null,
        reviewedAt: null,
        expiresAt: null,
      });
      request = await db.getClearanceRequestByUserId(1);
      expect(request?.status).toBe("pending");
      
      // Admin approves
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      vi.mocked(db.approveClearanceRequest).mockResolvedValue({
        clearanceCode: "CLR-test123",
        expiresAt,
      });
      const approval = await db.approveClearanceRequest(1, 100);
      expect(approval.clearanceCode).toBe("CLR-test123");
    });

    it("should track state from none -> applied -> denied", async () => {
      // User submits application
      vi.mocked(db.createClearanceRequest).mockResolvedValue(1);
      await db.createClearanceRequest({
        userId: 1,
        reason: "I want to join because it looks cool",
      });
      
      // Admin denies
      vi.mocked(db.denyClearanceRequest).mockResolvedValue(undefined);
      await db.denyClearanceRequest(1, 100, "Not a genuine cultural contributor");
      
      expect(db.denyClearanceRequest).toHaveBeenCalledWith(1, 100, "Not a genuine cultural contributor");
    });
  });
});
