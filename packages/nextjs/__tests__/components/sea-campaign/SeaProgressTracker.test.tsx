import { render, screen, waitFor } from '@testing-library/react';
import { SeaProgressTracker } from '../../../app/_components/sea-campaign/SeaProgressTracker';
import * as reactQuery from '@tanstack/react-query';

// Mock react-query
const mockUseQuery = jest.spyOn(reactQuery, 'useQuery');

describe('SeaProgressTracker', () => {
  const mockUserAddress = '0x1234567890123456789012345678901234567890';
  
  const mockProgressData = {
    userAddress: mockUserAddress,
    progress: {
      totalSubmissions: 3,
      completedWeeks: [1, 2, 3],
      highestWeekCompleted: 3,
      isGraduated: false,
      lastActivityAt: new Date('2024-01-20T10:00:00Z'),
      completionPercentage: 50, // 3/6 weeks
    },
    submissions: [
      {
        id: 1,
        weekNumber: 1,
        githubUrl: 'https://github.com/user/week1',
        reviewStatus: 'APPROVED',
        qualityScore: 85,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 2,
        weekNumber: 2,
        githubUrl: 'https://github.com/user/week2',
        reviewStatus: 'APPROVED',
        qualityScore: 90,
        submittedAt: new Date('2024-01-18T10:00:00Z'),
      },
      {
        id: 3,
        weekNumber: 3,
        githubUrl: 'https://github.com/user/week3',
        reviewStatus: 'PENDING',
        qualityScore: null,
        submittedAt: new Date('2024-01-20T10:00:00Z'),
      },
    ],
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

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText(/loading progress/i)).toBeInTheDocument();
  });

  it('should render progress overview correctly', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText('3 / 6')).toBeInTheDocument(); // Completed weeks
    expect(screen.getByText('50%')).toBeInTheDocument(); // Completion percentage
    expect(screen.getByText('3')).toBeInTheDocument(); // Total submissions
  });

  it('should display progress bar with correct completion percentage', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('should show week-by-week status correctly', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    // Completed weeks should show success
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
    
    // Week 3 should show as pending (submitted but not approved)
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    
    // Weeks 4-6 should show as not started
    expect(screen.getByText('Week 4')).toBeInTheDocument();
    expect(screen.getByText('Week 5')).toBeInTheDocument();
    expect(screen.getByText('Week 6')).toBeInTheDocument();
  });

  it('should display submission details for each week', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    // Should show GitHub URLs for completed submissions
    expect(screen.getByText('github.com/user/week1')).toBeInTheDocument();
    expect(screen.getByText('github.com/user/week2')).toBeInTheDocument();
    expect(screen.getByText('github.com/user/week3')).toBeInTheDocument();
  });

  it('should show quality scores for approved submissions', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText('85')).toBeInTheDocument(); // Week 1 quality score
    expect(screen.getByText('90')).toBeInTheDocument(); // Week 2 quality score
    
    // Week 3 should not show quality score (pending)
    const week3Container = screen.getByText('Week 3').closest('.week-container');
    expect(week3Container).not.toHaveTextContent('Score:');
  });

  it('should handle graduated user correctly', () => {
    const graduatedData = {
      ...mockProgressData,
      progress: {
        ...mockProgressData.progress,
        completedWeeks: [1, 2, 3, 4, 5, 6],
        highestWeekCompleted: 6,
        isGraduated: true,
        completionPercentage: 100,
      },
    };

    mockUseQuery.mockReturnValue({
      data: graduatedData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/graduated/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle user with no progress', () => {
    const noProgressData = {
      userAddress: mockUserAddress,
      progress: {
        totalSubmissions: 0,
        completedWeeks: [],
        highestWeekCompleted: 0,
        isGraduated: false,
        lastActivityAt: null,
        completionPercentage: 0,
      },
      submissions: [],
    };

    mockUseQuery.mockReturnValue({
      data: noProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
  });

  it('should display different status badges correctly', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    // Approved submissions should have success badge
    expect(screen.getAllByText('APPROVED')).toHaveLength(2);
    
    // Pending submission should have warning badge
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    
    // Not started weeks should have neutral badge
    expect(screen.getAllByText('NOT STARTED')).toHaveLength(3);
  });

  it('should handle error state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch progress'),
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText(/error loading progress/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should show next challenge recommendation', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    // Since user completed week 3, should recommend week 4
    expect(screen.getByText(/next: week 4/i)).toBeInTheDocument();
    expect(screen.getByText(/oracle/i)).toBeInTheDocument(); // Week 4 is Oracle + Sponsored UX
  });

  it('should display submission timestamps', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    // Should show formatted dates
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 18/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 20/)).toBeInTheDocument();
  });

  it('should handle invalid user address', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Invalid address format'),
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress="invalid-address" />);

    expect(screen.getByText(/invalid address/i)).toBeInTheDocument();
  });

  it('should show average score across completed weeks', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    // Average of 85 and 90 should be 87.5
    expect(screen.getByText('87.5')).toBeInTheDocument();
  });

  it('should display time since last activity', () => {
    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText(/last activity/i)).toBeInTheDocument();
  });

  it('should refresh data when retry button is clicked', async () => {
    const mockRefetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show completion milestone celebrations', () => {
    const halfwayData = {
      ...mockProgressData,
      progress: {
        ...mockProgressData.progress,
        completionPercentage: 50,
      },
    };

    mockUseQuery.mockReturnValue({
      data: halfwayData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaProgressTracker userAddress={mockUserAddress} />);

    expect(screen.getByText(/halfway there/i)).toBeInTheDocument();
  });
});