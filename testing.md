📋 SEA Campaign Manual Testing Checklist

1. Database & Environment Setup ✅

-   PostgreSQL database is running (docker compose up -d)
-   Database migrations applied (yarn drizzle-kit migrate)
-   Environment variables configured in .env.local:
    -   POSTGRES_URL set correctly
    -   LISK_SEPOLIA_RPC_URL configured
    -   SEA_CAMPAIGN_REWARDS_CONTRACT_ADDRESS (after deployment)
    -   ADMIN_PRIVATE_KEY for reward distribution
-   Development server running (yarn start)

2. User Registration & Authentication 🔐

-   Connect wallet (MetaMask/WalletConnect)
-   Sign-In with Ethereum (SIWE) works
-   User profile creation with country field
-   Southeast Asia country selection shows:
    -   Philippines, Vietnam, Thailand, Indonesia, Malaysia, Singapore, Myanmar,
        Cambodia, Laos, Brunei
-   Non-SEA country users can still participate

3. Campaign Landing Page (/sea-campaign) 🏠

-   Page loads without errors
-   Campaign overview displays correctly
-   6-week challenge cards visible
-   Real-time participant count shows
-   "Get Started" button works for new users
-   Progress indicator shows for returning users
-   Social media links (Twitter/X hashtag #SpeedrunLiskSEA)

4. Weekly Challenge Pages (/sea-campaign/week/[1-6]) 📚

Week 1: Deploy & Verify

-   Challenge description loads
-   Requirements clearly listed
-   Submission form shows:
    -   GitHub repository URL field
    -   Contract address field
    -   Transaction hash field
    -   Social media post URL field
    -   Project description textarea
-   Form validation works:
    -   Invalid GitHub URL rejected
    -   Invalid Ethereum address rejected
    -   Required fields enforced

Week 2: Frontend Connect

-   Frontend integration requirements shown
-   Demo URL field available
-   Submission accepts React/Next.js projects

Week 3: Indexing & Display

-   Indexing requirements displayed
-   Additional fields for data sources

Week 4: Oracle + Sponsored UX

-   Oracle integration guide available
-   Sponsored transactions explanation

Week 5: NFT Badge / Mini-Game

-   Creative project guidelines shown
-   NFT minting instructions

Week 6: Mini-DEX / Lending

-   Advanced DeFi requirements listed
-   Complex smart contract guidelines

5. Challenge Submission Flow 📝

-   Submit button disabled until required fields filled
-   Loading state shows during submission
-   Success message appears after submission
-   Error messages display for failures:
    -   Network errors
    -   Validation errors
    -   Duplicate submission attempts
-   Form clears after successful submission
-   Submission appears in user's progress

6. Leaderboard (/sea-campaign/leaderboard) 🏆

-   Overall leaderboard loads
-   Week filter dropdown works (Week 1-6, All)
-   Displays correct columns:
    -   Rank
    -   User address (shortened format)
    -   Total score
    -   Quality score
    -   Engagement score
    -   Speed score
-   Top 3 have special styling (gold/silver/bronze)
-   Current user highlighted if in leaderboard
-   Pagination works if >50 entries

7. User Progress Tracking 📊

-   Progress bar shows completion percentage
-   Completed weeks marked with checkmarks
-   Pending submissions show "Under Review"
-   Rejected submissions show with feedback
-   Next recommended challenge highlighted
-   Graduation status shows after 6 weeks completed

8. KPI Dashboard (/sea-campaign/kpis) 📈

-   Total participants count displays
-   Weekly submission targets vs actual
-   SEA country percentage shows
-   Country distribution chart/list
-   Dropout rate calculation
-   Campaign health score (0-100)
-   Average quality scores
-   Real-time data updates

9. Admin Dashboard (/admin/sea-campaign) 👨‍💼

Access Control:

-   Only ADMIN role can access
-   Non-admins redirected or see error

Submission Management:

-   List of all submissions by week
-   Filter by status (Pending/Approved/Rejected)
-   Review individual submissions:
    -   View GitHub repository
    -   Check contract on block explorer
    -   Verify social media post
-   Approve/Reject buttons work
-   Add review notes functionality
-   Score assignment (quality/engagement/speed)

Reward Distribution:

-   Select week for rewards
-   Choose reward type:
    -   Top Quality (10 × $50)
    -   Top Engagement (10 × $50)
    -   Fast Completion (50 × $20, Week 6 only)
-   Preview recipient list
-   Execute on-chain distribution
-   Transaction hash displayed
-   Success/error handling

Analytics:

-   Campaign KPIs overview
-   Week-by-week performance
-   Budget utilization tracking
-   Export data functionality

10. Smart Contract Integration ⛓️

-   Contract deployed to Lisk Sepolia
-   Contract verified on block explorer
-   Fund contract with initial budget
-   Reward allocation function works
-   Claim rewards function (user-side)
-   Contract stats viewable
-   Emergency withdrawal (admin only)

11. Error Handling & Edge Cases ⚠️

-   Network disconnection handled gracefully
-   Wallet switch during session
-   Invalid/expired session handling
-   Rate limiting on submissions (1 per week per user)
-   Duplicate submission prevention
-   Large file upload handling
-   Slow network/timeout handling

12. Mobile Responsiveness 📱

-   Landing page responsive
-   Challenge pages mobile-friendly
-   Submission form usable on mobile
-   Leaderboard scrollable on mobile
-   Admin dashboard functional on tablet
-   Navigation menu works on mobile

13. Social Features 🌐

-   Social media post validation
-   Hashtag #SpeedrunLiskSEA tracking
-   Share buttons work
-   Social engagement scoring

14. Data Integrity 🔒

-   User can't submit same week twice
-   Progress updates after submission
-   Scores persist correctly
-   Reward claims tracked
-   No data loss on page refresh

15. Performance Testing ⚡

-   Page load times < 3 seconds
-   API responses < 1 second
-   Leaderboard with 100+ entries loads smoothly
-   Search/filter operations responsive
-   No memory leaks during extended use

16. Cross-Browser Testing 🌐

-   Chrome/Brave
-   Firefox
-   Safari
-   Edge
-   Mobile browsers (iOS Safari, Chrome Android)

17. Wallet Testing 👛

-   MetaMask connection
-   WalletConnect integration
-   Coinbase Wallet
-   Trust Wallet
-   Network switching to Lisk Sepolia

18. End-to-End User Journey 🚀

-   New user registration → Week 1 submission → Review → Approval → Leaderboard
    appearance
-   Complete 6 weeks → Graduation → Reward eligibility
-   Claim rewards → Transaction confirmation

19. Documentation & Help 📖

-   Challenge guides accessible
-   Technical requirements clear
-   FAQ section helpful
-   Support contact information available
-   Video tutorials (if available)

20. Security Checks 🔐

-   SQL injection attempts blocked
-   XSS prevention working
-   CSRF protection active
-   Rate limiting enforced
-   Admin routes protected
-   Sensitive data not exposed in responses

This comprehensive testing checklist ensures all aspects of the SEA Campaign work
correctly before launch. Focus on critical paths first (registration → submission →
review → rewards) before testing edge cases.
