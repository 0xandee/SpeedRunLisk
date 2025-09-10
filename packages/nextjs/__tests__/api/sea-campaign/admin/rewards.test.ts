import { createMocks } from 'node-mocks-http';
import { POST, GET } from '../../../../app/api/sea-campaign/admin/rewards/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../../../services/contracts/seaCampaignRewards');
jest.mock('../../../../services/database/repositories/seaCampaignSubmissions');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockAllocateRewardsOnChain = require('../../../../services/contracts/seaCampaignRewards').allocateRewardsOnChain;
const mockGetContractStats = require('../../../../services/contracts/seaCampaignRewards').getContractStats;
const mockGetSubmissionsByWeek = require('../../../../services/database/repositories/seaCampaignSubmissions').getSubmissionsByWeek;

describe('/api/sea-campaign/admin/rewards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Reward Distribution', () => {
    it('should reject non-admin requests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'USER', // Not admin
        },
      } as any);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate week number', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 7, // Invalid week number
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 7,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid week number');
    });

    it('should validate reward type', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'INVALID_TYPE',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'INVALID_TYPE',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid reward type');
    });

    it('should validate recipient addresses', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: [], // Empty array
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: [],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid recipients');
    });

    it('should process valid reward distribution', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const mockSubmissions = [
        {
          id: 1,
          userAddress: '0x1111111111111111111111111111111111111111',
          weekNumber: 1,
          reviewStatus: 'APPROVED',
        },
        {
          id: 2,
          userAddress: '0x2222222222222222222222222222222222222222',
          weekNumber: 1,
          reviewStatus: 'APPROVED',
        },
      ];

      mockGetSubmissionsByWeek.mockResolvedValue(mockSubmissions);
      
      mockAllocateRewardsOnChain.mockResolvedValue({
        success: true,
        transactionHash: '0xabc123',
        gasUsed: '100000',
        allocatedCount: 2,
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: [
            '0x1111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222'
          ],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: [
            '0x1111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222'
          ],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactionHash).toBe('0xabc123');
      expect(data.allocatedCount).toBe(2);
      expect(data.message).toContain('Processed 2 TOP_QUALITY rewards for week 1');
      expect(mockAllocateRewardsOnChain).toHaveBeenCalled();
    });

    it('should handle no valid submissions found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      mockGetSubmissionsByWeek.mockResolvedValue([]);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No valid submissions found for recipients');
    });

    it('should handle blockchain errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const mockSubmissions = [
        {
          id: 1,
          userAddress: '0x1111111111111111111111111111111111111111',
          weekNumber: 1,
          reviewStatus: 'APPROVED',
        },
      ];

      mockGetSubmissionsByWeek.mockResolvedValue(mockSubmissions);
      mockAllocateRewardsOnChain.mockRejectedValue(new Error('Transaction failed'));

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses: ['0x1111111111111111111111111111111111111111'],
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to distribute rewards');
      expect(data.details).toBe('Transaction failed');
    });
  });

  describe('GET - Contract Statistics', () => {
    it('should return contract statistics for admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const mockContractStats = {
        balance: '0.5',
        totalAllocated: '0.2',
        totalPaid: '0.1',
        remainingBudget: '1.8',
      };

      mockGetContractStats.mockResolvedValue(mockContractStats);

      const url = new URL('http://localhost:3000/api/sea-campaign/admin/rewards');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contractStats).toEqual(mockContractStats);
      expect(data.rewardStructure).toBeDefined();
      expect(data.rewardStructure.topQuality.amount).toBe(50);
      expect(data.rewardStructure.topEngagement.amount).toBe(50);
      expect(data.rewardStructure.fastCompletion.amount).toBe(20);
      expect(data.weeklyLimits).toBeDefined();
    });

    it('should reject non-admin requests for stats', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'USER',
        },
      } as any);

      const url = new URL('http://localhost:3000/api/sea-campaign/admin/rewards');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle contract errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      mockGetContractStats.mockRejectedValue(new Error('Contract not deployed'));

      const url = new URL('http://localhost:3000/api/sea-campaign/admin/rewards');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get reward statistics');
      expect(data.details).toBe('Contract not deployed');
    });
  });

  describe('Reward Amount Calculation', () => {
    it('should calculate TOP_QUALITY rewards correctly', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const mockSubmissions = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        userAddress: `0x${(i + 1).toString().padStart(40, '0')}`,
        weekNumber: 1,
        reviewStatus: 'APPROVED',
      }));

      mockGetSubmissionsByWeek.mockResolvedValue(mockSubmissions);
      
      mockAllocateRewardsOnChain.mockResolvedValue({
        success: true,
        transactionHash: '0xabc123',
        gasUsed: '150000',
        allocatedCount: 10, // Should be limited to top 10
      });

      const recipientAddresses = mockSubmissions.slice(0, 15).map(s => s.userAddress);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses,
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 1,
          rewardType: 'TOP_QUALITY',
          recipientAddresses,
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.allocatedCount).toBe(10); // Limited to top 10
      expect(data.totalAmount).toBe(500); // 10 * $50
    });

    it('should calculate FAST_COMPLETION rewards correctly', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          userAddress: '0x1234567890123456789012345678901234567890',
          role: 'ADMIN',
        },
      } as any);

      const mockSubmissions = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        userAddress: `0x${(i + 1).toString().padStart(40, '0')}`,
        weekNumber: 6, // Week 6 for fast completion
        reviewStatus: 'APPROVED',
      }));

      mockGetSubmissionsByWeek.mockResolvedValue(mockSubmissions);
      
      mockAllocateRewardsOnChain.mockResolvedValue({
        success: true,
        transactionHash: '0xdef456',
        gasUsed: '200000',
        allocatedCount: 50, // Limited to 50 fast completion rewards
      });

      const recipientAddresses = mockSubmissions.map(s => s.userAddress);

      const { req } = createMocks({
        method: 'POST',
        body: {
          weekNumber: 6,
          rewardType: 'FAST_COMPLETION',
          recipientAddresses,
        },
      });

      const request = new NextRequest(req.url || 'http://localhost:3000/api/sea-campaign/admin/rewards', {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: 6,
          rewardType: 'FAST_COMPLETION',
          recipientAddresses,
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.allocatedCount).toBe(50); // Limited to 50
      expect(data.totalAmount).toBe(1000); // 50 * $20
    });
  });
});