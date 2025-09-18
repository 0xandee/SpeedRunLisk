import { NextRequest } from "next/server";
import { GET } from "../../../app/api/sea-campaign/leaderboard/route";
import { createMocks } from "node-mocks-http";

// Mock dependencies
jest.mock("../../../services/database/repositories/seaCampaignSubmissions");

const mockGetLeaderboard =
  require("../../../services/database/repositories/seaCampaignSubmissions").getSeaCampaignLeaderboard;

describe("/api/sea-campaign/leaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return weekly leaderboard data", async () => {
      const mockLeaderboardData = [
        {
          userAddress: "0x1234567890123456789012345678901234567890",
          weekNumber: 1,
          submissionCount: 1,
          totalScore: 85,
          qualityScore: 80,
          engagementScore: 90,
          speedScore: 75,
          lastSubmissionAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          userAddress: "0x2345678901234567890123456789012345678901",
          weekNumber: 1,
          submissionCount: 1,
          totalScore: 78,
          qualityScore: 75,
          engagementScore: 80,
          speedScore: 80,
          lastSubmissionAt: new Date("2024-01-15T11:00:00Z"),
        },
      ];

      mockGetLeaderboard.mockResolvedValue(mockLeaderboardData);

      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?weekNumber=1");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(2);
      expect(data.leaderboard[0].userAddress).toBe("0x1234567890123456789012345678901234567890");
      expect(data.leaderboard[0].totalScore).toBe(85);
      expect(data.weekNumber).toBe(1);
      expect(mockGetLeaderboard).toHaveBeenCalledWith(1, 50);
    });

    it("should return overall leaderboard when no week specified", async () => {
      const mockLeaderboardData = [
        {
          userAddress: "0x1234567890123456789012345678901234567890",
          weekNumber: null,
          submissionCount: 3,
          totalScore: 255,
          qualityScore: 250,
          engagementScore: 270,
          speedScore: 245,
          lastSubmissionAt: new Date("2024-01-20T10:00:00Z"),
        },
      ];

      mockGetLeaderboard.mockResolvedValue(mockLeaderboardData);

      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(1);
      expect(data.leaderboard[0].submissionCount).toBe(3);
      expect(data.weekNumber).toBeNull();
      expect(mockGetLeaderboard).toHaveBeenCalledWith(undefined, 50);
    });

    it("should respect custom limit parameter", async () => {
      mockGetLeaderboard.mockResolvedValue([]);

      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?limit=10");
      const request = new NextRequest(url);

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetLeaderboard).toHaveBeenCalledWith(undefined, 10);
    });

    it("should handle invalid week number", async () => {
      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?weekNumber=7");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid week number");
    });

    it("should handle invalid limit parameter", async () => {
      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?limit=0");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Limit must be between 1 and 100");
    });

    it("should handle limit parameter exceeding maximum", async () => {
      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?limit=150");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Limit must be between 1 and 100");
    });

    it("should handle database errors gracefully", async () => {
      mockGetLeaderboard.mockRejectedValue(new Error("Database connection failed"));

      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?weekNumber=1");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch leaderboard");
    });

    it("should return leaderboard with ranking information", async () => {
      const mockLeaderboardData = [
        {
          userAddress: "0x1111111111111111111111111111111111111111",
          weekNumber: 2,
          submissionCount: 1,
          totalScore: 95,
          qualityScore: 90,
          engagementScore: 100,
          speedScore: 95,
          lastSubmissionAt: new Date("2024-01-22T10:00:00Z"),
        },
        {
          userAddress: "0x2222222222222222222222222222222222222222",
          weekNumber: 2,
          submissionCount: 1,
          totalScore: 88,
          qualityScore: 85,
          engagementScore: 90,
          speedScore: 90,
          lastSubmissionAt: new Date("2024-01-22T11:00:00Z"),
        },
        {
          userAddress: "0x3333333333333333333333333333333333333333",
          weekNumber: 2,
          submissionCount: 1,
          totalScore: 82,
          qualityScore: 80,
          engagementScore: 85,
          speedScore: 80,
          lastSubmissionAt: new Date("2024-01-22T12:00:00Z"),
        },
      ];

      mockGetLeaderboard.mockResolvedValue(mockLeaderboardData);

      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?weekNumber=2");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(3);

      // Check that leaderboard is sorted by totalScore descending
      expect(data.leaderboard[0].totalScore).toBe(95);
      expect(data.leaderboard[1].totalScore).toBe(88);
      expect(data.leaderboard[2].totalScore).toBe(82);
    });

    it("should return empty leaderboard when no submissions exist", async () => {
      mockGetLeaderboard.mockResolvedValue([]);

      const url = new URL("http://localhost:3000/api/sea-campaign/leaderboard?weekNumber=3");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(0);
      expect(data.weekNumber).toBe(3);
    });
  });
});
