import { render, screen, waitFor } from '@testing-library/react';
import { KpiDashboard as SeaKpiDashboard } from '../../../app/_components/sea-campaign/KpiDashboard';
import * as reactQuery from '@tanstack/react-query';

// Mock react-query
const mockUseQuery = jest.spyOn(reactQuery, 'useQuery');

describe('SeaKpiDashboard', () => {
  const mockKpiData = {
    submissionStats: {
      totalSubmissions: 150,
      approvedSubmissions: 120,
      pendingSubmissions: 25,
      rejectedSubmissions: 5,
      avgQualityScore: 82.5,
      avgEngagementScore: 78.3,
      avgSpeedScore: 75.8,
    },
    weeklyProgress: [
      { weekNumber: 1, submissionCount: 45, targetCount: 200, achievementRate: 22.5 },
      { weekNumber: 2, submissionCount: 35, targetCount: 100, achievementRate: 35.0 },
      { weekNumber: 3, submissionCount: 28, targetCount: 80, achievementRate: 35.0 },
      { weekNumber: 4, submissionCount: 22, targetCount: 60, achievementRate: 36.7 },
      { weekNumber: 5, submissionCount: 15, targetCount: 40, achievementRate: 37.5 },
      { weekNumber: 6, submissionCount: 5, targetCount: 30, achievementRate: 16.7 },
    ],
    userStats: {
      totalUsers: 180,
      seaCountryUsers: 115,
      seaCountryPercentage: 63.9,
      countryDistribution: [
        { country: 'Philippines', userCount: 35, percentage: 19.4 },
        { country: 'Vietnam', userCount: 28, percentage: 15.6 },
        { country: 'Thailand', userCount: 22, percentage: 12.2 },
        { country: 'Indonesia', userCount: 18, percentage: 10.0 },
        { country: 'Malaysia', userCount: 12, percentage: 6.7 },
      ],
    },
    progressStats: {
      totalParticipants: 180,
      graduatedUsers: 12,
      activeUsers: 85,
      dropoutRate: 15.2,
      avgCompletionTime: 42.5,
    },
    campaignHealth: {
      overallScore: 78.5,
      participationHealth: 82.1,
      qualityHealth: 85.0,
      retentionHealth: 68.3,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    expect(screen.getByText(/loading campaign analytics/i)).toBeInTheDocument();
  });

  it('should render KPI cards with correct data', async () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    // Check submission stats
    expect(screen.getByText('150')).toBeInTheDocument(); // Total submissions
    expect(screen.getByText('120')).toBeInTheDocument(); // Approved submissions
    expect(screen.getByText('25')).toBeInTheDocument(); // Pending submissions

    // Check user stats
    expect(screen.getByText('180')).toBeInTheDocument(); // Total users
    expect(screen.getByText('63.9%')).toBeInTheDocument(); // SEA country percentage

    // Check progress stats
    expect(screen.getByText('12')).toBeInTheDocument(); // Graduated users
    expect(screen.getByText('15.2%')).toBeInTheDocument(); // Dropout rate
  });

  it('should display campaign health score with correct color coding', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    const healthScore = screen.getByText('78.5');
    expect(healthScore).toBeInTheDocument();
    
    // Should have warning/yellow color for score between 70-85
    expect(healthScore.closest('.text-warning')).toBeInTheDocument();
  });

  it('should render weekly progress chart', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    // Check for weekly data
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 6')).toBeInTheDocument();
    expect(screen.getByText('45 / 200')).toBeInTheDocument(); // Week 1: actual / target
    expect(screen.getByText('22.5%')).toBeInTheDocument(); // Week 1 achievement rate
  });

  it('should display country distribution correctly', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    // Check top countries
    expect(screen.getByText('Philippines')).toBeInTheDocument();
    expect(screen.getByText('35 users (19.4%)')).toBeInTheDocument();
    expect(screen.getByText('Vietnam')).toBeInTheDocument();
    expect(screen.getByText('28 users (15.6%)')).toBeInTheDocument();
  });

  it('should show quality metrics with proper formatting', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    expect(screen.getByText('82.5')).toBeInTheDocument(); // Average quality score
    expect(screen.getByText('78.3')).toBeInTheDocument(); // Average engagement score
    expect(screen.getByText('75.8')).toBeInTheDocument(); // Average speed score
  });

  it('should handle error state gracefully', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch KPIs'),
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    expect(screen.getByText(/error loading campaign data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should display completion time statistics', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    expect(screen.getByText('42.5 days')).toBeInTheDocument(); // Average completion time
  });

  it('should show achievement rates for each week', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    // Check achievement rates for different weeks
    expect(screen.getByText('22.5%')).toBeInTheDocument(); // Week 1
    expect(screen.getByText('35.0%')).toBeInTheDocument(); // Week 2 & 3
    expect(screen.getByText('36.7%')).toBeInTheDocument(); // Week 4
    expect(screen.getByText('37.5%')).toBeInTheDocument(); // Week 5
    expect(screen.getByText('16.7%')).toBeInTheDocument(); // Week 6
  });

  it('should calculate and display approval rate', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    // Approval rate should be 120/150 = 80%
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('should show active participants vs total', () => {
    mockUseQuery.mockReturnValue({
      data: mockKpiData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    expect(screen.getByText('85')).toBeInTheDocument(); // Active users
    expect(screen.getByText('180')).toBeInTheDocument(); // Total participants
  });

  it('should display health indicators with correct styling', () => {
    const highHealthData = {
      ...mockKpiData,
      campaignHealth: {
        overallScore: 92.0,
        participationHealth: 95.0,
        qualityHealth: 90.0,
        retentionHealth: 91.0,
      },
    };

    mockUseQuery.mockReturnValue({
      data: highHealthData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    const healthScore = screen.getByText('92.0');
    expect(healthScore).toBeInTheDocument();
    
    // Should have success/green color for score > 85
    expect(healthScore.closest('.text-success')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData = {
      submissionStats: {
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0,
        rejectedSubmissions: 0,
        avgQualityScore: 0,
        avgEngagementScore: 0,
        avgSpeedScore: 0,
      },
      weeklyProgress: [],
      userStats: {
        totalUsers: 0,
        seaCountryUsers: 0,
        seaCountryPercentage: 0,
        countryDistribution: [],
      },
      progressStats: {
        totalParticipants: 0,
        graduatedUsers: 0,
        activeUsers: 0,
        dropoutRate: 0,
        avgCompletionTime: 0,
      },
      campaignHealth: {
        overallScore: 0,
        participationHealth: 0,
        qualityHealth: 0,
        retentionHealth: 0,
      },
    };

    mockUseQuery.mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaKpiDashboard />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Should show zeros
    expect(screen.getByText(/no campaign data available/i)).toBeInTheDocument();
  });

  it('should refresh data when retry button is clicked', async () => {
    const mockRefetch = jest.fn();
    
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    render(<SeaKpiDashboard />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalled();
  });
});