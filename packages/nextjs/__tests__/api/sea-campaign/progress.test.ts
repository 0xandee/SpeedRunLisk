import { createMocks } from 'node-mocks-http';
import { GET } from '../../../app/api/sea-campaign/progress/[userAddress]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('../../../services/database/repositories/seaCampaignProgress');
jest.mock('../../../services/database/repositories/seaCampaignSubmissions');

const mockGetUserProgress = require('../../../services/database/repositories/seaCampaignProgress').getSeaCampaignProgress;
const mockGetUserSubmissions = require('../../../services/database/repositories/seaCampaignSubmissions').getSubmissionsByUser;

describe('/api/sea-campaign/progress/[userAddress]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return user progress data', async () => {
      const userAddress = '0x1234567890123456789012345678901234567890';
      const mockProgress = {
        userAddress,
        totalSubmissions: 3,
        completedWeeks: [1, 2, 3],
        highestWeekCompleted: 3,
        isGraduated: false,
        lastActivityAt: new Date('2024-01-20T10:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
      };

      const mockSubmissions = [
        {
          id: 1,
          userAddress,
          weekNumber: 1,
          githubUrl: 'https://github.com/user/week1',
          reviewStatus: 'APPROVED',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 2,
          userAddress,
          weekNumber: 2,
          githubUrl: 'https://github.com/user/week2',
          reviewStatus: 'APPROVED',
          submittedAt: new Date('2024-01-18T10:00:00Z'),
        },
        {
          id: 3,
          userAddress,
          weekNumber: 3,
          githubUrl: 'https://github.com/user/week3',
          reviewStatus: 'PENDING',
          submittedAt: new Date('2024-01-20T10:00:00Z'),
        },
      ];

      mockGetUserProgress.mockResolvedValue(mockProgress);
      mockGetUserSubmissions.mockResolvedValue(mockSubmissions);

      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${userAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userAddress).toBe(userAddress);
      expect(data.progress.totalSubmissions).toBe(3);
      expect(data.progress.completedWeeks).toEqual([1, 2, 3]);
      expect(data.submissions).toHaveLength(3);
      expect(mockGetUserProgress).toHaveBeenCalledWith(userAddress);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith(userAddress);
    });

    it('should handle invalid Ethereum address format', async () => {
      const invalidAddress = 'invalid-address';
      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${invalidAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress: invalidAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid user address format');
    });

    it('should return empty progress for non-participating user', async () => {
      const userAddress = '0x9999999999999999999999999999999999999999';
      
      mockGetUserProgress.mockResolvedValue(null);
      mockGetUserSubmissions.mockResolvedValue([]);

      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${userAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userAddress).toBe(userAddress);
      expect(data.progress.totalSubmissions).toBe(0);
      expect(data.progress.completedWeeks).toEqual([]);
      expect(data.progress.isGraduated).toBe(false);
      expect(data.submissions).toHaveLength(0);
    });

    it('should calculate completion percentage correctly', async () => {
      const userAddress = '0x5555555555555555555555555555555555555555';
      const mockProgress = {
        userAddress,
        totalSubmissions: 4,
        completedWeeks: [1, 2, 3, 4],
        highestWeekCompleted: 4,
        isGraduated: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      mockGetUserProgress.mockResolvedValue(mockProgress);
      mockGetUserSubmissions.mockResolvedValue([]);

      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${userAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.completionPercentage).toBe(67); // 4/6 * 100, rounded
    });

    it('should handle graduated users correctly', async () => {
      const userAddress = '0x6666666666666666666666666666666666666666';
      const mockProgress = {
        userAddress,
        totalSubmissions: 6,
        completedWeeks: [1, 2, 3, 4, 5, 6],
        highestWeekCompleted: 6,
        isGraduated: true,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      mockGetUserProgress.mockResolvedValue(mockProgress);
      mockGetUserSubmissions.mockResolvedValue([]);

      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${userAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.isGraduated).toBe(true);
      expect(data.progress.completionPercentage).toBe(100);
      expect(data.progress.completedWeeks).toHaveLength(6);
    });

    it('should handle database errors gracefully', async () => {
      const userAddress = '0x7777777777777777777777777777777777777777';
      
      mockGetUserProgress.mockRejectedValue(new Error('Database connection failed'));

      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${userAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user progress');
    });

    it('should return detailed submission information', async () => {
      const userAddress = '0x8888888888888888888888888888888888888888';
      const mockProgress = {
        userAddress,
        totalSubmissions: 2,
        completedWeeks: [1, 2],
        highestWeekCompleted: 2,
        isGraduated: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const mockSubmissions = [
        {
          id: 1,
          userAddress,
          weekNumber: 1,
          githubUrl: 'https://github.com/user/week1',
          contractAddress: '0x1111111111111111111111111111111111111111',
          description: 'My first smart contract',
          technologies: ['Solidity', 'Hardhat'],
          socialPostUrl: 'https://twitter.com/user/status/123',
          reviewStatus: 'APPROVED',
          qualityScore: 85,
          engagementScore: 90,
          speedScore: 80,
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          reviewedAt: new Date('2024-01-16T10:00:00Z'),
          reviewNotes: 'Great work!',
        },
        {
          id: 2,
          userAddress,
          weekNumber: 2,
          githubUrl: 'https://github.com/user/week2',
          contractAddress: '0x2222222222222222222222222222222222222222',
          description: 'Frontend integration',
          technologies: ['React', 'Next.js', 'Web3'],
          socialPostUrl: 'https://twitter.com/user/status/456',
          reviewStatus: 'PENDING',
          qualityScore: null,
          engagementScore: null,
          speedScore: null,
          submittedAt: new Date('2024-01-18T10:00:00Z'),
          reviewedAt: null,
          reviewNotes: null,
        },
      ];

      mockGetUserProgress.mockResolvedValue(mockProgress);
      mockGetUserSubmissions.mockResolvedValue(mockSubmissions);

      const url = new URL(`http://localhost:3000/api/sea-campaign/progress/${userAddress}`);
      const request = new NextRequest(url);
      const params = { userAddress };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.submissions).toHaveLength(2);
      expect(data.submissions[0].reviewStatus).toBe('APPROVED');
      expect(data.submissions[0].qualityScore).toBe(85);
      expect(data.submissions[0].reviewNotes).toBe('Great work!');
      expect(data.submissions[1].reviewStatus).toBe('PENDING');
      expect(data.submissions[1].qualityScore).toBeNull();
    });

    it('should handle missing userAddress parameter', async () => {
      const url = new URL('http://localhost:3000/api/sea-campaign/progress/');
      const request = new NextRequest(url);
      const params = { userAddress: '' };

      const response = await GET(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User address is required');
    });
  });
});