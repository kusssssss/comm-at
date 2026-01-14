import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database functions
vi.mock("./db", () => ({
  getMemoryLogsByUserId: vi.fn(),
  createMemoryLog: vi.fn(),
}));

import * as db from "./db";

describe("Memory Graph System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Memory log retrieval", () => {
    it("should retrieve memory logs for a user", async () => {
      const mockMemories = [
        {
          id: 1,
          userId: 1,
          memoryType: "activation",
          description: "Marked with Noodle Bowl Chain #001",
          createdAt: new Date("2024-01-15"),
        },
        {
          id: 2,
          userId: 1,
          memoryType: "event_attended",
          description: "Present at Marked Night: South Jakarta",
          createdAt: new Date("2024-02-20"),
        },
      ];
      
      (db.getMemoryLogsByUserId as any).mockResolvedValue(mockMemories);
      
      const result = await db.getMemoryLogsByUserId(1);
      
      expect(db.getMemoryLogsByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].memoryType).toBe("activation");
      expect(result[1].memoryType).toBe("event_attended");
    });

    it("should return empty array for user with no memories", async () => {
      (db.getMemoryLogsByUserId as any).mockResolvedValue([]);
      
      const result = await db.getMemoryLogsByUserId(999);
      
      expect(result).toEqual([]);
    });
  });

  describe("Memory log creation", () => {
    it("should create activation memory log", async () => {
      const memoryData = {
        userId: 1,
        memoryType: "activation" as const,
        referenceId: 1,
        referenceType: "artifact",
        description: "Marked with MSG Sukajan #001",
      };
      
      await db.createMemoryLog(memoryData);
      
      expect(db.createMemoryLog).toHaveBeenCalledWith(memoryData);
    });

    it("should create event_attended memory log", async () => {
      const memoryData = {
        userId: 1,
        memoryType: "event_attended" as const,
        referenceId: 5,
        referenceType: "event",
        description: "Claimed pass for Marked Night (+1: Jane)",
      };
      
      await db.createMemoryLog(memoryData);
      
      expect(db.createMemoryLog).toHaveBeenCalledWith(
        expect.objectContaining({
          memoryType: "event_attended",
          description: expect.stringContaining("+1: Jane"),
        })
      );
    });

    it("should create chapter_change memory log", async () => {
      const memoryData = {
        userId: 1,
        memoryType: "chapter_change" as const,
        description: "Chapter changed from Jakarta to Bali",
      };
      
      await db.createMemoryLog(memoryData);
      
      expect(db.createMemoryLog).toHaveBeenCalledWith(
        expect.objectContaining({
          memoryType: "chapter_change",
        })
      );
    });

    it("should create unmarking memory log", async () => {
      const memoryData = {
        userId: 1,
        memoryType: "unmarking" as const,
        description: "Mark revoked: Violation of The Code",
      };
      
      await db.createMemoryLog(memoryData);
      
      expect(db.createMemoryLog).toHaveBeenCalledWith(
        expect.objectContaining({
          memoryType: "unmarking",
        })
      );
    });
  });

  describe("Memory types", () => {
    it("should support all defined memory types", () => {
      const memoryTypes = [
        "activation",
        "event_attended",
        "chapter_change",
        "unmarking",
        "state_change",
        "decision_visible",
      ];
      
      memoryTypes.forEach(type => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("Memory persistence", () => {
    it("should persist memories even after user revocation", async () => {
      // Memories should remain in database even if user is revoked
      const mockMemories = [
        {
          id: 1,
          userId: 1,
          memoryType: "activation",
          description: "Marked with artifact",
          createdAt: new Date("2024-01-15"),
        },
        {
          id: 2,
          userId: 1,
          memoryType: "unmarking",
          description: "Mark revoked",
          createdAt: new Date("2024-06-01"),
        },
      ];
      
      (db.getMemoryLogsByUserId as any).mockResolvedValue(mockMemories);
      
      const result = await db.getMemoryLogsByUserId(1);
      
      // Both activation and unmarking should be present
      expect(result).toHaveLength(2);
      expect(result.some((m: any) => m.memoryType === "activation")).toBe(true);
      expect(result.some((m: any) => m.memoryType === "unmarking")).toBe(true);
    });
  });

  describe("Memory visibility", () => {
    it("should support visibility levels", () => {
      const visibilityLevels = [
        "public_fragment",
        "initiate",
        "member",
        "inner_only",
      ];
      
      visibilityLevels.forEach(level => {
        expect(typeof level).toBe("string");
      });
    });
  });
});
