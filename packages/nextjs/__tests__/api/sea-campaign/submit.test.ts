import { NextRequest } from "next/server";
import { POST } from "../../../app/api/sea-campaign/submit/route";
import { getServerSession } from "next-auth";
import { createMocks } from "node-mocks-http";

// Mock dependencies
jest.mock("next-auth");
jest.mock("../../../services/database/repositories/seaCampaignSubmissions");
jest.mock("../../../services/database/repositories/seaCampaignProgress");

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("/api/sea-campaign/submit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("should reject unauthenticated requests", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject invalid week number", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          userAddress: "0x1234567890123456789012345678901234567890",
          role: "USER",
        },
      } as any);

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 7, // Invalid week number
          githubUrl: "https://github.com/user/repo",
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 7,
          githubUrl: "https://github.com/user/repo",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid week number");
    });

    it("should reject invalid GitHub URL", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          userAddress: "0x1234567890123456789012345678901234567890",
          role: "USER",
        },
      } as any);

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 1,
          githubUrl: "not-a-valid-url",
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 1,
          githubUrl: "not-a-valid-url",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid GitHub URL format");
    });

    it("should accept valid submission", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          userAddress: "0x1234567890123456789012345678901234567890",
          role: "USER",
        },
      } as any);

      // Mock database operations
      const mockCreateSubmission =
        require("../../../services/database/repositories/seaCampaignSubmissions").createSeaCampaignSubmission;
      const mockUpdateProgress =
        require("../../../services/database/repositories/seaCampaignProgress").updateSeaCampaignProgress;

      mockCreateSubmission.mockResolvedValue({
        id: 1,
        userAddress: "0x1234567890123456789012345678901234567890",
        weekNumber: 1,
        githubUrl: "https://github.com/user/repo",
        reviewStatus: "PENDING",
        createdAt: new Date(),
      });

      mockUpdateProgress.mockResolvedValue({});

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
          contractAddress: "0x1234567890123456789012345678901234567890",
          description: "My first smart contract",
          technologies: ["Solidity", "Hardhat"],
          socialPostUrl: "https://twitter.com/user/status/123",
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
          contractAddress: "0x1234567890123456789012345678901234567890",
          description: "My first smart contract",
          technologies: ["Solidity", "Hardhat"],
          socialPostUrl: "https://twitter.com/user/status/123",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("submitted successfully");
      expect(mockCreateSubmission).toHaveBeenCalled();
      expect(mockUpdateProgress).toHaveBeenCalled();
    });

    it("should validate Ethereum address format for contract address", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          userAddress: "0x1234567890123456789012345678901234567890",
          role: "USER",
        },
      } as any);

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
          contractAddress: "invalid-address",
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
          contractAddress: "invalid-address",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid contract address format");
    });

    it("should handle missing required fields", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          userAddress: "0x1234567890123456789012345678901234567890",
          role: "USER",
        },
      } as any);

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 1,
          // Missing githubUrl
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 1,
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("GitHub URL is required");
    });

    it("should handle database errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          userAddress: "0x1234567890123456789012345678901234567890",
          role: "USER",
        },
      } as any);

      // Mock database error
      const mockCreateSubmission =
        require("../../../services/database/repositories/seaCampaignSubmissions").createSeaCampaignSubmission;
      mockCreateSubmission.mockRejectedValue(new Error("Database connection failed"));

      const { req } = createMocks({
        method: "POST",
        body: {
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
        },
      });

      const request = new NextRequest(req.url || "http://localhost:3000/api/sea-campaign/submit", {
        method: "POST",
        body: JSON.stringify({
          weekNumber: 1,
          githubUrl: "https://github.com/user/repo",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to submit challenge");
    });
  });
});
