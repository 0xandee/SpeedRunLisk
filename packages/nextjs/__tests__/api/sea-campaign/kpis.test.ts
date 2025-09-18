import { NextRequest } from "next/server";
import { GET } from "../../../app/api/sea-campaign/kpis/route";
import { createMocks } from "node-mocks-http";

// Mock dependencies
jest.mock("../../../services/database/repositories/seaCampaignSubmissions");
jest.mock("../../../services/database/repositories/seaCampaignProgress");
jest.mock("../../../services/database/repositories/users");

const mockGetSubmissionStats =
  require("../../../services/database/repositories/seaCampaignSubmissions").getSeaCampaignSubmissionStats;
const mockGetWeeklySubmissions =
  require("../../../services/database/repositories/seaCampaignSubmissions").getWeeklySubmissionCounts;
const mockGetProgressStats =
  require("../../../services/database/repositories/seaCampaignProgress").getSeaCampaignProgressStats;
const mockGetUserStats = require("../../../services/database/repositories/users").getSeaCampaignUserStats;

describe("/api/sea-campaign/kpis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return comprehensive KPI data", async () => {
      const mockSubmissionStats = {
        totalSubmissions: 150,
        approvedSubmissions: 120,
        pendingSubmissions: 25,
        rejectedSubmissions: 5,
        avgQualityScore: 82.5,
        avgEngagementScore: 78.3,
        avgSpeedScore: 75.8,
      };

      const mockWeeklyData = [
        { weekNumber: 1, submissionCount: 45, targetCount: 200, achievementRate: 22.5 },
        { weekNumber: 2, submissionCount: 35, targetCount: 100, achievementRate: 35.0 },
        { weekNumber: 3, submissionCount: 28, targetCount: 80, achievementRate: 35.0 },
        { weekNumber: 4, submissionCount: 22, targetCount: 60, achievementRate: 36.7 },
        { weekNumber: 5, submissionCount: 15, targetCount: 40, achievementRate: 37.5 },
        { weekNumber: 6, submissionCount: 5, targetCount: 30, achievementRate: 16.7 },
      ];

      const mockProgressStats = {
        totalParticipants: 180,
        graduatedUsers: 12,
        activeUsers: 85,
        dropoutRate: 15.2,
        avgCompletionTime: 42.5,
      };

      const mockUserStats = {
        totalUsers: 180,
        seaCountryUsers: 115,
        seaCountryPercentage: 63.9,
        countryDistribution: [
          { country: "Philippines", userCount: 35, percentage: 19.4 },
          { country: "Vietnam", userCount: 28, percentage: 15.6 },
          { country: "Thailand", userCount: 22, percentage: 12.2 },
          { country: "Indonesia", userCount: 18, percentage: 10.0 },
          { country: "Malaysia", userCount: 12, percentage: 6.7 },
        ],
      };

      mockGetSubmissionStats.mockResolvedValue(mockSubmissionStats);
      mockGetWeeklySubmissions.mockResolvedValue(mockWeeklyData);
      mockGetProgressStats.mockResolvedValue(mockProgressStats);
      mockGetUserStats.mockResolvedValue(mockUserStats);

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.submissionStats.totalSubmissions).toBe(150);
      expect(data.weeklyProgress).toHaveLength(6);
      expect(data.userStats.totalUsers).toBe(180);
      expect(data.userStats.seaCountryPercentage).toBe(63.9);
      expect(data.progressStats.graduatedUsers).toBe(12);
      expect(data.campaignHealth.overallScore).toBeGreaterThan(0);
    });

    it("should calculate campaign health score correctly", async () => {
      const mockSubmissionStats = {
        totalSubmissions: 100,
        approvedSubmissions: 90,
        pendingSubmissions: 8,
        rejectedSubmissions: 2,
        avgQualityScore: 85.0,
        avgEngagementScore: 80.0,
        avgSpeedScore: 75.0,
      };

      const mockWeeklyData = [
        { weekNumber: 1, submissionCount: 180, targetCount: 200, achievementRate: 90.0 },
        { weekNumber: 2, submissionCount: 85, targetCount: 100, achievementRate: 85.0 },
      ];

      const mockProgressStats = {
        totalParticipants: 200,
        graduatedUsers: 15,
        activeUsers: 150,
        dropoutRate: 10.0,
        avgCompletionTime: 40.0,
      };

      const mockUserStats = {
        totalUsers: 200,
        seaCountryUsers: 140,
        seaCountryPercentage: 70.0,
        countryDistribution: [],
      };

      mockGetSubmissionStats.mockResolvedValue(mockSubmissionStats);
      mockGetWeeklySubmissions.mockResolvedValue(mockWeeklyData);
      mockGetProgressStats.mockResolvedValue(mockProgressStats);
      mockGetUserStats.mockResolvedValue(mockUserStats);

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.campaignHealth.overallScore).toBeGreaterThanOrEqual(70); // Should be high due to good metrics
      expect(data.campaignHealth.participationHealth).toBeGreaterThan(80);
      expect(data.campaignHealth.qualityHealth).toBeGreaterThan(80);
      expect(data.campaignHealth.retentionHealth).toBeGreaterThan(80);
    });

    it("should handle empty data gracefully", async () => {
      mockGetSubmissionStats.mockResolvedValue({
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0,
        rejectedSubmissions: 0,
        avgQualityScore: 0,
        avgEngagementScore: 0,
        avgSpeedScore: 0,
      });

      mockGetWeeklySubmissions.mockResolvedValue([]);
      mockGetProgressStats.mockResolvedValue({
        totalParticipants: 0,
        graduatedUsers: 0,
        activeUsers: 0,
        dropoutRate: 0,
        avgCompletionTime: 0,
      });

      mockGetUserStats.mockResolvedValue({
        totalUsers: 0,
        seaCountryUsers: 0,
        seaCountryPercentage: 0,
        countryDistribution: [],
      });

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.submissionStats.totalSubmissions).toBe(0);
      expect(data.weeklyProgress).toHaveLength(0);
      expect(data.userStats.totalUsers).toBe(0);
      expect(data.campaignHealth.overallScore).toBe(0);
    });

    it("should include weekly targets and achievement rates", async () => {
      const mockWeeklyData = [
        { weekNumber: 1, submissionCount: 180, targetCount: 200, achievementRate: 90.0 },
        { weekNumber: 2, submissionCount: 75, targetCount: 100, achievementRate: 75.0 },
        { weekNumber: 3, submissionCount: 60, targetCount: 80, achievementRate: 75.0 },
        { weekNumber: 4, submissionCount: 40, targetCount: 60, achievementRate: 66.7 },
        { weekNumber: 5, submissionCount: 25, targetCount: 40, achievementRate: 62.5 },
        { weekNumber: 6, submissionCount: 15, targetCount: 30, achievementRate: 50.0 },
      ];

      mockGetSubmissionStats.mockResolvedValue({
        totalSubmissions: 395,
        approvedSubmissions: 350,
        pendingSubmissions: 30,
        rejectedSubmissions: 15,
        avgQualityScore: 80,
        avgEngagementScore: 75,
        avgSpeedScore: 70,
      });

      mockGetWeeklySubmissions.mockResolvedValue(mockWeeklyData);
      mockGetProgressStats.mockResolvedValue({
        totalParticipants: 200,
        graduatedUsers: 20,
        activeUsers: 120,
        dropoutRate: 20,
        avgCompletionTime: 45,
      });

      mockGetUserStats.mockResolvedValue({
        totalUsers: 200,
        seaCountryUsers: 130,
        seaCountryPercentage: 65,
        countryDistribution: [],
      });

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeklyProgress).toHaveLength(6);
      expect(data.weeklyProgress[0].targetCount).toBe(200);
      expect(data.weeklyProgress[0].achievementRate).toBe(90.0);
      expect(data.weeklyProgress[5].achievementRate).toBe(50.0);
    });

    it("should handle database errors gracefully", async () => {
      mockGetSubmissionStats.mockRejectedValue(new Error("Database connection failed"));

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch campaign KPIs");
    });

    it("should include social engagement metrics", async () => {
      const mockSubmissionStats = {
        totalSubmissions: 100,
        approvedSubmissions: 85,
        pendingSubmissions: 12,
        rejectedSubmissions: 3,
        avgQualityScore: 82,
        avgEngagementScore: 88,
        avgSpeedScore: 76,
        socialPostsCount: 95,
        avgSocialEngagement: 25.5,
      };

      mockGetSubmissionStats.mockResolvedValue(mockSubmissionStats);
      mockGetWeeklySubmissions.mockResolvedValue([]);
      mockGetProgressStats.mockResolvedValue({
        totalParticipants: 100,
        graduatedUsers: 8,
        activeUsers: 70,
        dropoutRate: 15,
        avgCompletionTime: 40,
      });

      mockGetUserStats.mockResolvedValue({
        totalUsers: 100,
        seaCountryUsers: 65,
        seaCountryPercentage: 65,
        countryDistribution: [],
      });

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.submissionStats.avgEngagementScore).toBe(88);
      expect(data.submissionStats.socialPostsCount).toBe(95);
    });

    it("should calculate retention and dropout rates correctly", async () => {
      const mockProgressStats = {
        totalParticipants: 200,
        graduatedUsers: 25,
        activeUsers: 120,
        dropoutRate: 25.0, // 25% dropout rate
        avgCompletionTime: 38.5,
      };

      mockGetSubmissionStats.mockResolvedValue({
        totalSubmissions: 300,
        approvedSubmissions: 250,
        pendingSubmissions: 40,
        rejectedSubmissions: 10,
        avgQualityScore: 80,
        avgEngagementScore: 75,
        avgSpeedScore: 70,
      });

      mockGetWeeklySubmissions.mockResolvedValue([]);
      mockGetProgressStats.mockResolvedValue(mockProgressStats);
      mockGetUserStats.mockResolvedValue({
        totalUsers: 200,
        seaCountryUsers: 120,
        seaCountryPercentage: 60,
        countryDistribution: [],
      });

      const url = new URL("http://localhost:3000/api/sea-campaign/kpis");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progressStats.dropoutRate).toBe(25.0);
      expect(data.progressStats.graduatedUsers).toBe(25);
      expect(data.campaignHealth.retentionHealth).toBeLessThan(80); // Should be lower due to 25% dropout
    });
  });
});
