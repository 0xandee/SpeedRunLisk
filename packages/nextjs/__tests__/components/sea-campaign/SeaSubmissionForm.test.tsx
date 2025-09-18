import { SeaSubmissionForm } from "../../../app/_components/sea-campaign/SeaSubmissionForm";
import { ChallengeId } from "../../../services/database/config/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("SeaSubmissionForm", () => {
  const defaultProps = {
    weekNumber: 1,
    challengeId: ChallengeId.SEA_WEEK_1_HELLO_TOKEN_NFT,
    userAddress: "0x1234567890123456789012345678901234567890",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  it("should render the form with all required fields", () => {
    render(<SeaSubmissionForm {...defaultProps} />);

    expect(screen.getByLabelText(/github repository url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contract address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/technologies used/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/social media post url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit challenge/i })).toBeInTheDocument();
  });

  it("should validate required GitHub URL field", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    expect(screen.getByText(/github repository url is required/i)).toBeInTheDocument();
  });

  it("should validate GitHub URL format", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const githubInput = screen.getByLabelText(/github repository url/i);
    await user.type(githubInput, "not-a-valid-url");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    expect(screen.getByText(/please enter a valid github repository url/i)).toBeInTheDocument();
  });

  it("should validate Ethereum address format for contract address", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const githubInput = screen.getByLabelText(/github repository url/i);
    const contractInput = screen.getByLabelText(/contract address/i);

    await user.type(githubInput, "https://github.com/user/repo");
    await user.type(contractInput, "invalid-address");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    expect(screen.getByText(/please enter a valid ethereum address/i)).toBeInTheDocument();
  });

  it("should accept valid form submission", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/my-project");
    await user.type(screen.getByLabelText(/contract address/i), "0x1234567890123456789012345678901234567890");
    await user.type(screen.getByLabelText(/project description/i), "My first smart contract project");
    await user.type(screen.getByLabelText(/technologies used/i), "Solidity, Hardhat, React");
    await user.type(screen.getByLabelText(/social media post url/i), "https://twitter.com/user/status/123456");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sea-campaign/submit",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("https://github.com/user/my-project"),
        }),
      );
    });
  });

  it("should show loading state during submission", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<SeaSubmissionForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/repo");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("should handle submission errors gracefully", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Submission failed" }),
    } as Response);

    render(<SeaSubmissionForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/repo");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });
  });

  it("should show success message after successful submission", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/repo");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/challenge submitted successfully/i)).toBeInTheDocument();
    });
  });

  it("should clear form after successful submission", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const githubInput = screen.getByLabelText(/github repository url/i);
    const descriptionInput = screen.getByLabelText(/project description/i);

    await user.type(githubInput, "https://github.com/user/repo");
    await user.type(descriptionInput, "Test description");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(githubInput).toHaveValue("");
      expect(descriptionInput).toHaveValue("");
    });
  });

  it("should validate social media URL format when provided", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const githubInput = screen.getByLabelText(/github repository url/i);
    const socialInput = screen.getByLabelText(/social media post url/i);

    await user.type(githubInput, "https://github.com/user/repo");
    await user.type(socialInput, "invalid-social-url");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    expect(screen.getByText(/please enter a valid social media url/i)).toBeInTheDocument();
  });

  it("should handle different challenge types appropriately", () => {
    const { rerender } = render(<SeaSubmissionForm {...defaultProps} />);

    // Week 1 should show contract address field
    expect(screen.getByLabelText(/contract address/i)).toBeInTheDocument();

    // Week 2 should show frontend-specific fields
    rerender(
      <SeaSubmissionForm {...defaultProps} weekNumber={2} challengeId={ChallengeId.SEA_WEEK_2_FRONTEND_CONNECT} />,
    );
    expect(screen.getByLabelText(/github repository url/i)).toBeInTheDocument();

    // Week 3 should show indexing-specific fields
    rerender(
      <SeaSubmissionForm {...defaultProps} weekNumber={3} challengeId={ChallengeId.SEA_WEEK_3_INDEXING_DISPLAY} />,
    );
    expect(screen.getByLabelText(/github repository url/i)).toBeInTheDocument();
  });

  it("should submit correct challenge ID and week number", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/repo");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sea-campaign/submit",
        expect.objectContaining({
          body: expect.stringContaining(`"weekNumber":${defaultProps.weekNumber}`),
        }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sea-campaign/submit",
        expect.objectContaining({
          body: expect.stringContaining(`"challengeId":"${defaultProps.challengeId}"`),
        }),
      );
    });
  });

  it("should handle network errors gracefully", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<SeaSubmissionForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/repo");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to submit challenge/i)).toBeInTheDocument();
    });
  });

  it("should show character count for description field", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const descriptionInput = screen.getByLabelText(/project description/i);
    await user.type(descriptionInput, "This is a test description");

    expect(screen.getByText(/26\/500/)).toBeInTheDocument();
  });

  it("should enforce maximum character limit for description", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    const longDescription = "a".repeat(501);
    const descriptionInput = screen.getByLabelText(/project description/i);

    await user.type(descriptionInput, longDescription);
    expect(descriptionInput).toHaveValue("a".repeat(500)); // Should be truncated to 500 chars
  });

  it("should parse technologies from comma-separated string", async () => {
    const user = userEvent.setup();
    render(<SeaSubmissionForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/github repository url/i), "https://github.com/user/repo");
    await user.type(screen.getByLabelText(/technologies used/i), "React, TypeScript, Tailwind CSS");

    const submitButton = screen.getByRole("button", { name: /submit challenge/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sea-campaign/submit",
        expect.objectContaining({
          body: expect.stringContaining(`"technologies":["React","TypeScript","Tailwind CSS"]`),
        }),
      );
    });
  });
});
