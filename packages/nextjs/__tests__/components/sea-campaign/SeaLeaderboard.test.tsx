import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeeklyLeaderboard as SeaLeaderboard } from '../../../app/_components/sea-campaign/WeeklyLeaderboard';
import * as reactQuery from '@tanstack/react-query';

// Mock react-query
const mockUseQuery = jest.spyOn(reactQuery, 'useQuery');

describe('SeaLeaderboard', () => {
  const mockLeaderboardData = [
    {
      userAddress: '0x1111111111111111111111111111111111111111',
      weekNumber: 1,
      submissionCount: 1,
      totalScore: 95,
      qualityScore: 90,
      engagementScore: 100,
      speedScore: 95,
      lastSubmissionAt: new Date('2024-01-15T10:00:00Z'),
      rank: 1,
    },
    {
      userAddress: '0x2222222222222222222222222222222222222222',
      weekNumber: 1,
      submissionCount: 1,
      totalScore: 88,
      qualityScore: 85,
      engagementScore: 90,
      speedScore: 90,
      lastSubmissionAt: new Date('2024-01-15T11:00:00Z'),
      rank: 2,
    },
    {
      userAddress: '0x3333333333333333333333333333333333333333',
      weekNumber: 1,
      submissionCount: 1,
      totalScore: 82,
      qualityScore: 80,
      engagementScore: 85,
      speedScore: 80,
      lastSubmissionAt: new Date('2024-01-15T12:00:00Z'),
      rank: 3,
    },
  ];

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

    render(<SeaLeaderboard weekNumber={1} />);

    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
  });

  it('should render leaderboard with correct data', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // Check headers
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Total Score')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();

    // Check first place data
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('0x1111...1111')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('should display addresses in shortened format', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    expect(screen.getByText('0x1111...1111')).toBeInTheDocument();
    expect(screen.getByText('0x2222...2222')).toBeInTheDocument();
    expect(screen.getByText('0x3333...3333')).toBeInTheDocument();
  });

  it('should show different styling for top 3 positions', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // First place should have gold styling
    const firstPlaceRow = screen.getByText('1').closest('tr');
    expect(firstPlaceRow).toHaveClass('bg-yellow-50');

    // Second place should have silver styling
    const secondPlaceRow = screen.getByText('2').closest('tr');
    expect(secondPlaceRow).toHaveClass('bg-gray-50');

    // Third place should have bronze styling
    const thirdPlaceRow = screen.getByText('3').closest('tr');
    expect(thirdPlaceRow).toHaveClass('bg-orange-50');
  });

  it('should allow filtering by week', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // Should have week filter dropdown
    const weekFilter = screen.getByLabelText(/select week/i);
    expect(weekFilter).toBeInTheDocument();

    // Change to week 2
    await user.selectOptions(weekFilter, '2');

    // Should trigger a new query for week 2
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('should show overall leaderboard when "All Weeks" is selected', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: null, // Overall leaderboard
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    const weekFilter = screen.getByLabelText(/select week/i);
    await user.selectOptions(weekFilter, 'all');

    expect(screen.getByText(/overall leaderboard/i)).toBeInTheDocument();
  });

  it('should handle empty leaderboard', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: [],
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    expect(screen.getByText(/no participants yet/i)).toBeInTheDocument();
    expect(screen.getByText(/be the first to submit/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch leaderboard'),
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    expect(screen.getByText(/error loading leaderboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should show correct scores and ranking', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // Check scores for first place
    expect(screen.getByText('95')).toBeInTheDocument(); // Total score
    expect(screen.getByText('90')).toBeInTheDocument(); // Quality score
    expect(screen.getByText('100')).toBeInTheDocument(); // Engagement score

    // Check that ranking is correct (highest score first)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row
    expect(firstDataRow).toHaveTextContent('1'); // Rank
    expect(firstDataRow).toHaveTextContent('95'); // Total score
  });

  it('should display submission timestamps', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // Should show formatted timestamps
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
  });

  it('should refresh data when retry button is clicked', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show pagination controls when there are many entries', () => {
    const manyEntries = Array.from({ length: 60 }, (_, i) => ({
      userAddress: `0x${i.toString().padStart(40, '0')}`,
      weekNumber: 1,
      submissionCount: 1,
      totalScore: 100 - i,
      qualityScore: 90 - i,
      engagementScore: 85 - i,
      speedScore: 80 - i,
      lastSubmissionAt: new Date('2024-01-15T10:00:00Z'),
      rank: i + 1,
    }));

    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: manyEntries,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // Should show only first 50 entries by default
    expect(screen.getAllByRole('row')).toHaveLength(51); // 50 data rows + 1 header row

    // Should have pagination controls if there are more than 50 entries
    expect(screen.getByText(/showing 1-50 of 60/i)).toBeInTheDocument();
  });

  it('should allow copying address to clipboard', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    const addressElement = screen.getByText('0x1111...1111');
    await user.click(addressElement);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
  });

  it('should display leaderboard without user highlighting', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // Should display all addresses without special highlighting
    expect(screen.getByText('0x2222...2222')).toBeInTheDocument();
  });

  it('should show quality indicators for scores', () => {
    mockUseQuery.mockReturnValue({
      data: {
        leaderboard: mockLeaderboardData,
        weekNumber: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<SeaLeaderboard weekNumber={1} />);

    // High scores should have success styling
    const highScore = screen.getByText('100'); // Engagement score of 100
    expect(highScore).toHaveClass('text-success');

    // Medium scores should have warning styling  
    const mediumScore = screen.getByText('85'); // Some quality scores
    expect(mediumScore).toHaveClass('text-warning');
  });
});