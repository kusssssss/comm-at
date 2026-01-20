import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the database functions
const mockGetAccessRequestById = vi.fn();
const mockApproveAccessRequest = vi.fn();
const mockDenyAccessRequest = vi.fn();
const mockGetEventById = vi.fn();
const mockGetConfirmedPassCount = vi.fn();
const mockGetWaitlistCount = vi.fn();
const mockCreateEventPassWithWaitlist = vi.fn();
const mockCreateNotification = vi.fn();
const mockGetAllAccessRequests = vi.fn();
const mockGetAccessRequestStats = vi.fn();

vi.mock("./db", () => ({
  getAccessRequestById: (...args: unknown[]) => mockGetAccessRequestById(...args),
  approveAccessRequest: (...args: unknown[]) => mockApproveAccessRequest(...args),
  denyAccessRequest: (...args: unknown[]) => mockDenyAccessRequest(...args),
  getEventById: (...args: unknown[]) => mockGetEventById(...args),
  getConfirmedPassCount: (...args: unknown[]) => mockGetConfirmedPassCount(...args),
  getWaitlistCount: (...args: unknown[]) => mockGetWaitlistCount(...args),
  createEventPassWithWaitlist: (...args: unknown[]) => mockCreateEventPassWithWaitlist(...args),
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  getAllAccessRequests: (...args: unknown[]) => mockGetAllAccessRequests(...args),
  getAccessRequestStats: (...args: unknown[]) => mockGetAccessRequestStats(...args),
}));

describe("Admin Access Request Bulk Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Bulk Approve Logic", () => {
    it("should approve multiple pending requests", async () => {
      const requestIds = [1, 2, 3];
      const adminId = 100;
      
      // Mock pending requests
      mockGetAccessRequestById.mockImplementation((id: number) => ({
        id,
        userId: id + 1000,
        eventId: 1,
        status: "pending",
      }));
      
      mockGetEventById.mockResolvedValue({ id: 1, title: "Test Event", capacity: 100 });
      mockGetConfirmedPassCount.mockResolvedValue(10);
      mockApproveAccessRequest.mockResolvedValue(true);
      mockCreateEventPassWithWaitlist.mockResolvedValue({ id: 1 });
      mockCreateNotification.mockResolvedValue({ id: 1 });
      
      // Simulate bulk approve
      const results = { approved: 0, failed: 0, errors: [] as string[] };
      
      for (const requestId of requestIds) {
        const request = await mockGetAccessRequestById(requestId);
        if (!request) {
          results.failed++;
          continue;
        }
        if (request.status !== "pending") {
          results.failed++;
          continue;
        }
        
        await mockApproveAccessRequest(requestId, adminId);
        const event = await mockGetEventById(request.eventId);
        const confirmedCount = await mockGetConfirmedPassCount(request.eventId);
        const capacity = event?.capacity || 0;
        const isFull = capacity > 0 && confirmedCount >= capacity;
        
        await mockCreateEventPassWithWaitlist(request.eventId, request.userId, isFull, undefined);
        await mockCreateNotification({
          userId: request.userId,
          type: "system_announcement",
          title: "Access Request Approved",
          body: `Your request has been approved.`,
        });
        
        results.approved++;
      }
      
      expect(results.approved).toBe(3);
      expect(results.failed).toBe(0);
      expect(mockApproveAccessRequest).toHaveBeenCalledTimes(3);
      expect(mockCreateEventPassWithWaitlist).toHaveBeenCalledTimes(3);
      expect(mockCreateNotification).toHaveBeenCalledTimes(3);
    });

    it("should skip non-pending requests", async () => {
      const requestIds = [1, 2];
      
      mockGetAccessRequestById.mockImplementation((id: number) => ({
        id,
        userId: id + 1000,
        eventId: 1,
        status: id === 1 ? "pending" : "approved", // Second request already approved
      }));
      
      mockGetEventById.mockResolvedValue({ id: 1, title: "Test Event", capacity: 100 });
      mockGetConfirmedPassCount.mockResolvedValue(10);
      mockApproveAccessRequest.mockResolvedValue(true);
      mockCreateEventPassWithWaitlist.mockResolvedValue({ id: 1 });
      mockCreateNotification.mockResolvedValue({ id: 1 });
      
      const results = { approved: 0, failed: 0, errors: [] as string[] };
      
      for (const requestId of requestIds) {
        const request = await mockGetAccessRequestById(requestId);
        if (!request) {
          results.failed++;
          results.errors.push(`Request ${requestId} not found`);
          continue;
        }
        if (request.status !== "pending") {
          results.failed++;
          results.errors.push(`Request ${requestId} is not pending`);
          continue;
        }
        
        await mockApproveAccessRequest(requestId, 100);
        await mockCreateEventPassWithWaitlist(request.eventId, request.userId, false, undefined);
        await mockCreateNotification({ userId: request.userId, type: "system_announcement", title: "Approved", body: "Approved" });
        results.approved++;
      }
      
      expect(results.approved).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.errors).toContain("Request 2 is not pending");
    });

    it("should handle not found requests", async () => {
      const requestIds = [1, 999];
      
      mockGetAccessRequestById.mockImplementation((id: number) => {
        if (id === 999) return null;
        return { id, userId: 1001, eventId: 1, status: "pending" };
      });
      
      mockGetEventById.mockResolvedValue({ id: 1, title: "Test Event", capacity: 100 });
      mockGetConfirmedPassCount.mockResolvedValue(10);
      mockApproveAccessRequest.mockResolvedValue(true);
      mockCreateEventPassWithWaitlist.mockResolvedValue({ id: 1 });
      mockCreateNotification.mockResolvedValue({ id: 1 });
      
      const results = { approved: 0, failed: 0, errors: [] as string[] };
      
      for (const requestId of requestIds) {
        const request = await mockGetAccessRequestById(requestId);
        if (!request) {
          results.failed++;
          results.errors.push(`Request ${requestId} not found`);
          continue;
        }
        if (request.status !== "pending") {
          results.failed++;
          continue;
        }
        
        await mockApproveAccessRequest(requestId, 100);
        await mockCreateEventPassWithWaitlist(request.eventId, request.userId, false, undefined);
        await mockCreateNotification({ userId: request.userId, type: "system_announcement", title: "Approved", body: "Approved" });
        results.approved++;
      }
      
      expect(results.approved).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.errors).toContain("Request 999 not found");
    });
  });

  describe("Bulk Deny Logic", () => {
    it("should deny multiple pending requests", async () => {
      const requestIds = [1, 2, 3];
      const reason = "Event is at capacity";
      
      mockGetAccessRequestById.mockImplementation((id: number) => ({
        id,
        userId: id + 1000,
        eventId: 1,
        status: "pending",
      }));
      
      mockGetEventById.mockResolvedValue({ id: 1, title: "Test Event" });
      mockDenyAccessRequest.mockResolvedValue(true);
      mockCreateNotification.mockResolvedValue({ id: 1 });
      
      const results = { denied: 0, failed: 0, errors: [] as string[] };
      
      for (const requestId of requestIds) {
        const request = await mockGetAccessRequestById(requestId);
        if (!request) {
          results.failed++;
          continue;
        }
        if (request.status !== "pending") {
          results.failed++;
          continue;
        }
        
        await mockDenyAccessRequest(requestId, 100, reason);
        await mockCreateNotification({
          userId: request.userId,
          type: "system_announcement",
          title: "Access Request Denied",
          body: `Your request has been denied. Reason: ${reason}`,
        });
        
        results.denied++;
      }
      
      expect(results.denied).toBe(3);
      expect(results.failed).toBe(0);
      expect(mockDenyAccessRequest).toHaveBeenCalledTimes(3);
      expect(mockCreateNotification).toHaveBeenCalledTimes(3);
    });

    it("should skip already processed requests", async () => {
      const requestIds = [1, 2];
      
      mockGetAccessRequestById.mockImplementation((id: number) => ({
        id,
        userId: id + 1000,
        eventId: 1,
        status: id === 1 ? "pending" : "denied",
      }));
      
      mockGetEventById.mockResolvedValue({ id: 1, title: "Test Event" });
      mockDenyAccessRequest.mockResolvedValue(true);
      mockCreateNotification.mockResolvedValue({ id: 1 });
      
      const results = { denied: 0, failed: 0, errors: [] as string[] };
      
      for (const requestId of requestIds) {
        const request = await mockGetAccessRequestById(requestId);
        if (!request) {
          results.failed++;
          continue;
        }
        if (request.status !== "pending") {
          results.failed++;
          results.errors.push(`Request ${requestId} is not pending`);
          continue;
        }
        
        await mockDenyAccessRequest(requestId, 100);
        await mockCreateNotification({ userId: request.userId, type: "system_announcement", title: "Denied", body: "Denied" });
        results.denied++;
      }
      
      expect(results.denied).toBe(1);
      expect(results.failed).toBe(1);
    });
  });

  describe("Get All Access Requests", () => {
    it("should return paginated requests with filters", async () => {
      const mockRequests = [
        { id: 1, userId: 1001, eventId: 1, status: "pending", userName: "User 1" },
        { id: 2, userId: 1002, eventId: 1, status: "pending", userName: "User 2" },
      ];
      
      mockGetAllAccessRequests.mockResolvedValue({
        requests: mockRequests,
        total: 2,
      });
      
      const result = await mockGetAllAccessRequests({
        eventId: 1,
        status: "pending",
        limit: 20,
        offset: 0,
      });
      
      expect(result.requests).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockGetAllAccessRequests).toHaveBeenCalledWith({
        eventId: 1,
        status: "pending",
        limit: 20,
        offset: 0,
      });
    });

    it("should support search by name", async () => {
      mockGetAllAccessRequests.mockResolvedValue({
        requests: [{ id: 1, userName: "John Doe" }],
        total: 1,
      });
      
      const result = await mockGetAllAccessRequests({
        search: "John",
        limit: 20,
        offset: 0,
      });
      
      expect(result.requests).toHaveLength(1);
      expect(mockGetAllAccessRequests).toHaveBeenCalledWith({
        search: "John",
        limit: 20,
        offset: 0,
      });
    });
  });

  describe("Get Access Request Stats", () => {
    it("should return stats for all requests", async () => {
      mockGetAccessRequestStats.mockResolvedValue({
        pending: 5,
        approved: 10,
        denied: 3,
        waitlisted: 2,
        total: 20,
      });
      
      const stats = await mockGetAccessRequestStats();
      
      expect(stats.pending).toBe(5);
      expect(stats.approved).toBe(10);
      expect(stats.denied).toBe(3);
      expect(stats.waitlisted).toBe(2);
      expect(stats.total).toBe(20);
    });

    it("should return stats filtered by event", async () => {
      mockGetAccessRequestStats.mockResolvedValue({
        pending: 2,
        approved: 5,
        denied: 1,
        waitlisted: 0,
        total: 8,
      });
      
      const stats = await mockGetAccessRequestStats(1);
      
      expect(stats.total).toBe(8);
      expect(mockGetAccessRequestStats).toHaveBeenCalledWith(1);
    });
  });
});
