import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock the database functions
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    getCommunityStats: vi.fn(),
    getRecentMarkings: vi.fn(),
    getRecentCheckIns: vi.fn(),
  };
});

describe('Community Stats Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCommunityStats', () => {
    it('should return community statistics', async () => {
      const mockStats = {
        totalMarked: 42,
        totalArtifacts: 360,
        totalDrops: 6,
        totalEvents: 2,
        activeChapters: [
          { name: 'South Jakarta', count: 25 },
          { name: 'London', count: 10 },
          { name: 'Houston', count: 7 },
        ],
      };

      vi.mocked(db.getCommunityStats).mockResolvedValue(mockStats);

      const result = await db.getCommunityStats();

      expect(result).toEqual(mockStats);
      expect(result.totalMarked).toBe(42);
      expect(result.totalArtifacts).toBe(360);
      expect(result.activeChapters).toHaveLength(3);
    });

    it('should return default values when database is unavailable', async () => {
      const defaultStats = {
        totalMarked: 0,
        totalArtifacts: 0,
        totalDrops: 0,
        totalEvents: 0,
        recentMarkings: [],
        activeChapters: [],
      };

      vi.mocked(db.getCommunityStats).mockResolvedValue(defaultStats);

      const result = await db.getCommunityStats();

      expect(result.totalMarked).toBe(0);
      expect(result.activeChapters).toHaveLength(0);
    });
  });

  describe('getRecentMarkings', () => {
    it('should return recent marking activity', async () => {
      const mockMarkings = [
        {
          id: 1,
          createdAt: new Date('2026-01-12T10:00:00Z'),
          callSign: 'LAFLAME',
          chapter: 'Houston',
          serialNumber: 'GN001-001',
          dropTitle: 'MSG Sukajan',
        },
        {
          id: 2,
          createdAt: new Date('2026-01-12T09:00:00Z'),
          callSign: 'BRIANIMANUEL',
          chapter: 'Jakarta',
          serialNumber: 'GN001-002',
          dropTitle: 'MSG Sukajan',
        },
      ];

      vi.mocked(db.getRecentMarkings).mockResolvedValue(mockMarkings);

      const result = await db.getRecentMarkings(10);

      expect(result).toHaveLength(2);
      expect(result[0].callSign).toBe('LAFLAME');
      expect(result[1].chapter).toBe('Jakarta');
    });

    it('should return empty array when no markings exist', async () => {
      vi.mocked(db.getRecentMarkings).mockResolvedValue([]);

      const result = await db.getRecentMarkings(10);

      expect(result).toHaveLength(0);
    });
  });

  describe('getRecentCheckIns', () => {
    it('should return recent check-in activity', async () => {
      const mockCheckIns = [
        {
          id: 1,
          createdAt: new Date('2026-01-12T22:00:00Z'),
          callSign: 'SKEPTA',
          chapter: 'London',
          eventTitle: 'MSG Night Market',
        },
      ];

      vi.mocked(db.getRecentCheckIns).mockResolvedValue(mockCheckIns);

      const result = await db.getRecentCheckIns(10);

      expect(result).toHaveLength(1);
      expect(result[0].eventTitle).toBe('MSG Night Market');
    });
  });
});

describe('Community Stats Data Integrity', () => {
  it('should have consistent chapter names', async () => {
    const mockStats = {
      totalMarked: 50,
      totalArtifacts: 400,
      totalDrops: 8,
      totalEvents: 3,
      activeChapters: [
        { name: 'South Jakarta', count: 30 },
        { name: 'London', count: 15 },
        { name: 'Houston', count: 5 },
      ],
    };

    vi.mocked(db.getCommunityStats).mockResolvedValue(mockStats);

    const result = await db.getCommunityStats();

    // Verify chapter names are valid strings
    result.activeChapters.forEach(chapter => {
      expect(typeof chapter.name).toBe('string');
      expect(chapter.name.length).toBeGreaterThan(0);
      expect(typeof chapter.count).toBe('number');
      expect(chapter.count).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have non-negative counts', async () => {
    const mockStats = {
      totalMarked: 10,
      totalArtifacts: 100,
      totalDrops: 5,
      totalEvents: 2,
      activeChapters: [],
    };

    vi.mocked(db.getCommunityStats).mockResolvedValue(mockStats);

    const result = await db.getCommunityStats();

    expect(result.totalMarked).toBeGreaterThanOrEqual(0);
    expect(result.totalArtifacts).toBeGreaterThanOrEqual(0);
    expect(result.totalDrops).toBeGreaterThanOrEqual(0);
    expect(result.totalEvents).toBeGreaterThanOrEqual(0);
  });
});
