# SpeedRun Lisk Week 5: Build a Simple NFT Marketplace

## Video Script (~10 Minutes)

---

## [0:00-0:45] OPENING & HOOK

**[VISUAL: Animated title card with "Week 5: NFT Marketplace" + Lisk logo, transition to OpenSea-style interface mockup]**

**SPEAKER:**

"Ever wondered how OpenSea, Blur, and Rarible actually work under the hood? What if I told you that you could build your own fully functional NFT marketplace in under an hourcomplete with listing, buying, selling, AND real-time USD price display powered by oracles?

Welcome to SpeedRun Lisk Week 5! Today we're building a production-ready NFT marketplace using the modern escrowless design that every major platform uses.

By the end of this tutorial, you'll have a working marketplace deployed to Lisk Sepolia where users can list their NFTs for sale, browse available listings, and purchase themall with live USD equivalent prices.

Before we start, make sure you've completed Weeks 1 through 4. You should have MyNFT deployed, a working frontend, an events page, and oracle integration. Ready? Let's build the future of digital commerce!"

**[VISUAL: Quick montage of final product - NFT grid view, listing modal, purchase transaction, USD prices updating]**

---

## [1:00-2:15] UNDERSTANDING NFT MARKETPLACES

**[VISUAL: Animated comparison diagram showing two marketplace architectures]**

**SPEAKER:**

"First, let's understand NFT marketplaces. There are two fundamental designs, and the difference is crucial.

**[VISUAL: Traditional escrow flow animation]**

Traditional escrow marketplaces work like this: Seller sends NFT to the marketplace contract. The contract holds it. Buyer purchases. NFT gets transferred to buyer.

Sounds safe, right? But there are problems:

- You pay gas TWICEonce to deposit, once when it sells
- You lose access to your NFT while it's listed
- No utility from your NFT during listing
- Extra security risks from holding assets

**[VISUAL: Modern escrowless flow animation]**

Modern escrowless marketplaceswhat we're building todaywork differently:

```
Escrowless Flow:
  Seller → Approves marketplace contract → Lists NFT (keeps it!)
  → Buyer purchases → NFT transfers directly from seller to buyer
```

Why is this better?

-  **Gas efficient**: No deposit transaction needed
-  **Safer**: Sellers keep their NFTs until sold
-  **Flexible**: Use NFT utilities while listed (gaming, staking, etc.)
-  **Modern standard**: OpenSea, Blur, LooksRare all use this!

The magic? **ERC721 approvals**. Let me explain this critical concept..."

---

## [2:15-3:30] ERC721 APPROVALS DEEP DIVE

**[VISUAL: Split screen showing NFT in wallet on left, marketplace contract on right]**

**SPEAKER:**

"Here's the problem: Your NFT is sitting in YOUR wallet. The marketplace contract needs to transfer it when someone buys it. How does the marketplace get permission?

**ERC721 gives us two approval methods**, and understanding them is essential:

**[VISUAL: Code snippet with Method 1 highlighted]**

**Method 1: approve(address to, uint256 tokenId)**

This approves a specific address to transfer a SPECIFIC token.

```solidity
// Approve marketplace to transfer ONLY token #5
myNFT.approve(marketplaceAddress, 5);
```

Great for one-time transfers, but terrible for marketplaces. Why? You'd need to approve EVERY time you list an NFT!

**[VISUAL: Code snippet with Method 2 highlighted]**

**Method 2: setApprovalForAll(address operator, bool approved)**

This approves an address to transfer ALL your NFTscurrent AND future.

```solidity
// Approve marketplace to transfer ANY of your NFTs
myNFT.setApprovalForAll(marketplaceAddress, true);
```

**This is what marketplaces use!** You approve ONCE, then list unlimited NFTs without additional approvals. Better UX, less gas over time.

**[VISUAL: Security warning badge]**

Now, 'approve all my NFTs' sounds scary, right? Here's the key: **Only approve verified, audited marketplace contracts**. Always check the contract is verified on Blockscout before approving. Once verified, you're trusting the CODE, not a personand our marketplace code is open source and auditable!

This is the foundation of every major NFT marketplace. Let's build it!"

---

## [3:30-5:00] BUILDING THE NFTMARKETPLACE CONTRACT

**[VISUAL: VS Code editor showing contracts folder]**

**SPEAKER:**

"Create `NFTMarketplace.sol` in your contracts folder. This is beautifully simple.

**[VISUAL: Show contract structure]**

```solidity
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    IERC721 public nftContract;
    mapping(uint256 => Listing) public listings;
}
```

Three key pieces:

1. **IERC721** interface to interact with MyNFT
2. **ReentrancyGuard** for security (prevents reentrancy attacks)
3. **listings** mapping to track all active listings

**[VISUAL: Highlight Listing struct]**

```solidity
struct Listing {
    address seller;    // Who owns it
    uint256 price;     // Price in wei (ETH)
    bool isActive;     // Is it listed?
}
```

Everything we need to know about a listing in one struct!

Now the three core functions:

**[VISUAL: Show listItem function with highlights]**

**1. listItem()** - List an NFT for sale

```solidity
function listItem(uint256 tokenId, uint256 price) external {
    require(price > 0, "Price must be greater than 0");
    require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
    require(
        nftContract.getApproved(tokenId) == address(this) ||
        nftContract.isApprovedForAll(msg.sender, address(this)),
        "Marketplace not approved"
    );
    // Create listing...
}
```

Notice the approval check! We verify the marketplace CAN transfer the NFT before allowing the listing.

**[VISUAL: Show buyItem function with security highlights]**

**2. buyItem()** - Purchase a listed NFT

```solidity
function buyItem(uint256 tokenId) external payable nonReentrant {
    // Validate listing
    require(listing.isActive, "Item not listed");
    require(msg.value >= listing.price, "Insufficient payment");

    // Mark sold BEFORE transfers (security!)
    listings[tokenId].isActive = false;

    // Transfer NFT from seller to buyer
    nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

    // Transfer ETH to seller
    (bool success, ) = payable(listing.seller).call{value: listing.price}("");
    require(success, "Transfer failed");
}
```

**[VISUAL: Highlight security pattern]**

See the pattern? **Checks-Effects-Interactions**:
1. Check requirements
2. Update state (mark as sold)
3. THEN do external calls

This plus `nonReentrant` makes it bulletproof!

**[VISUAL: Show cancelListing briefly]**

**3. cancelListing()** - Sellers can remove their listing anytime

Simple permission check, mark inactive, emit event. Clean!

**[VISUAL: Terminal showing deployment]**

Deploy with your Week 1 MyNFT address, and we have a working marketplace! Now for the frontend..."

---

## [5:00-6:30] BUILDING THE MARKETPLACE FRONTEND

**[VISUAL: Create marketplace/page.tsx and component files]**

**SPEAKER:**

"The frontend has three key pieces: the page, the grid, and the NFT card.

**[VISUAL: Show MarketplaceGrid component]**

`MarketplaceGrid` is simplefetch total supply from MyNFT, create an array of token IDs, map them to NFT cards. Clean grid layout with Tailwind.

The magic is in the `NFTCard` component. This handles EVERYTHING for one NFT.

**[VISUAL: Highlight key state and hooks]**

```tsx
const [showListModal, setShowListModal] = useState(false);
const [isApproved, setIsApproved] = useState(false);
const [isApproving, setIsApproving] = useState(false); // ⚠️ Critical!

// Get marketplace address
const { data: marketplaceContract } = useDeployedContractInfo("NFTMarketplace");
const marketplaceAddress = marketplaceContract?.address;

// Check approvals
const { data: approvedAddress } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "getApproved",
    args: [BigInt(tokenId)],
});

const { data: isApprovedForAll } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "isApprovedForAll",
    args: [owner, marketplaceAddress],
});
```

We check BOTH approval methodscovers all cases!

**[VISUAL: Show the critical approval flow with loading state]**

Now here's the MOST IMPORTANT partthe approval loading state. Watch this:

```tsx
const { writeAsync: approveMarketplace } = useScaffoldContractWrite({
    contractName: "MyNFT",
    functionName: "setApprovalForAll",
    args: [marketplaceAddress, true],
    onBlockConfirmation: async (txnReceipt) => {
        await refetchApproved();
        await refetchApprovedForAll();
        setIsApproving(false); // ✅ Reset AFTER confirmation
        notification.success("Marketplace approved!");
    },
});

const handleApprove = async () => {
    try {
        setIsApproving(true); // 🔴 Set BEFORE transaction
        await approveMarketplace();
        notification.success("Approval transaction sent!");
    } catch (error) {
        setIsApproving(false); // Reset on error
    }
};
```

**[VISUAL: Three-state button animation]**

This creates THREE button states:

1. **"Approve Marketplace"** - Initial state
2. **"Approving..."** (disabled, spinner) - Transaction confirming on blockchain
3. **"List for Sale"** - Only shows AFTER blockchain confirmation

**[VISUAL: Warning badge]**

Why is this critical? On testnets, confirmations take 5-15 seconds. Without this loading state, users would see "List for Sale" too early, try to list, and get "Marketplace not approved" errors!

The `onBlockConfirmation` callback waits for ACTUAL blockchain confirmation AND refetches approval status before showing the listing button. This prevents race conditions!

**[VISUAL: Show dynamic button rendering]**

```tsx
{isOwner && !isListed && !isApproved && !isApproving && (
    <button onClick={handleApprove}>Approve Marketplace</button>
)}

{isOwner && !isListed && isApproving && (
    <button disabled className="loading">Approving...</button>
)}

{isOwner && !isListed && isApproved && !isApproving && (
    <button onClick={() => setShowListModal(true)}>List for Sale</button>
)}

{isOwner && isListed && (
    <button onClick={handleCancel}>Cancel Listing</button>
)}

{!isOwner && isListed && (
    <button onClick={handleBuy}>Buy Now</button>
)}
```

Different buttons for different states! Sellers see approve → list → cancel flow. Buyers see buy button. Perfect UX!

Add the list modal for price input, buy and cancel handlers, and we have a complete marketplace interface!"

---

## [6:30-7:45] INTEGRATING ORACLE PRICE DISPLAY

**[VISUAL: Split screen - NFT card without USD prices on left, with USD prices on right]**

**SPEAKER:**

"Now let's add the cherry on toplive USD price display using the oracle from Week 4!

**[VISUAL: Add imports to NFTCard.tsx]**

```tsx
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { getSignersForDataServiceId } from "@redstone-finance/sdk";
import { ethers } from "ethers";
```

Same RedStone pattern from Week 4!

**[VISUAL: Show the oracle fetch function]**

```tsx
const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
const { data: priceFeedContract } = useDeployedContractInfo("PriceFeed");

const fetchEthPrice = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(
        priceFeedContract.address,
        priceFeedContract.abi,
        provider
    );

    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
        dataPackagesIds: ["ETH"],
        authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),
    });

    const priceData = await wrappedContract.getEthPrice();
    setEthPriceUSD(Number(priceData) / 1e8); // 8 decimals
};

// Auto-refresh every 30 seconds
useEffect(() => {
    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 30000);
    return () => clearInterval(interval);
}, [priceFeedContract]);
```

Exact same WrapperBuilder pattern! Fetch price, convert from 8 decimals, auto-refresh.

**[VISUAL: Show USD calculation and display]**

```tsx
const priceInEth = listing?.price ? formatEther(listing.price) : "0";
const priceInUSD = ethPriceUSD > 0
    ? (parseFloat(priceInEth) * ethPriceUSD).toFixed(2)
    : "0.00";
```

Simple multiplication! 0.5 ETH × $2,500 = $1,250 USD.

**[VISUAL: Show the display in the card UI]**

```tsx
{isListed && (
    <div className="stats shadow mt-2">
        <div className="stat p-4">
            <div className="stat-title text-xs">Price</div>
            <div className="stat-value text-lg">
                {parseFloat(priceInEth).toFixed(4)} ETH
            </div>
            {ethPriceUSD > 0 && (
                <div className="stat-desc">
                    ~${priceInUSD} USD
                </div>
            )}
        </div>
    </div>
)}
```

**[VISUAL: Live demo showing prices updating]**

Beautiful! NFT prices in ETH with live USD equivalents that update every 30 seconds. Just like the pros!

**[VISUAL: Show list modal with USD preview]**

Bonuswe can show USD preview in the listing modal as users type the price:

```tsx
{listPrice && ethPriceUSD > 0 && (
    <label className="label">
        <span className="label-text-alt">
            ~${(parseFloat(listPrice) * ethPriceUSD).toFixed(2)} USD
        </span>
    </label>
)}
```

Real-time feedback! Users see exactly what their listing is worth. This is production-ready UX!"

---

## [7:45-8:45] TESTING & DEPLOYMENT

**[VISUAL: Three terminal windows side by side]**

**SPEAKER:**

"Testing time! Your Week 1-4 infrastructure makes this smooth.

**[VISUAL: Terminal commands executing]**

```bash
# Terminal 1
yarn chain

# Terminal 2
yarn deploy

# Terminal 3
yarn start
```

**[VISUAL: Browser showing localhost:3000 with marketplace page]**

Navigate to your marketplace page. Let's walk through the complete seller flow:

**[VISUAL: Step-by-step demo with annotations]**

1. **Mint NFTs** - Go to home page, mint 3-4 NFTs
2. **See them in marketplace** - All your NFTs appear in grid
3. **Click "Approve Marketplace"** - Watch it change to "Approving..." with spinner
4. **Wait for confirmation** - 5-15 seconds on testnet
5. **"List for Sale" appears** - Now it's safe to list!
6. **Enter price** - See USD equivalent update live
7. **Confirm listing** - NFT shows "Listed" badge with price
8. **See USD equivalent** - Updated every 30 seconds from oracle

**[VISUAL: Switch to incognito window with different wallet]**

Now buyer flow:

1. **Browse marketplace** - See listed NFTs with USD prices
2. **Click "Buy Now"** - Transaction prompts for exact price
3. **Confirm purchase** - NFT transfers, ETH goes to seller
4. **You own it!** - NFT now shows YOU as owner

**[VISUAL: Show cancel flow]**

Sellers can cancel anytimejust click "Cancel Listing". Clean!

**[VISUAL: Terminal showing deployment to Lisk Sepolia]**

For testnet deployment:

```bash
yarn deploy --network liskSepolia
yarn hardhat-verify --network liskSepolia \
  --contract contracts/NFTMarketplace.sol:NFTMarketplace \
  YOUR_MARKETPLACE_ADDRESS
```

Your MyNFT and PriceFeed are already deployed from previous weeksyou only need to deploy and verify the marketplace!

**[VISUAL: Show Blockscout with verified contract and transactions]**

Test the full flow on testnet, verify everything works, and you're ready to submit!"

---

## [8:45-10:00] WRAP-UP & ADVANCED FEATURES

**[VISUAL: Final montage showing marketplace in action - grid view, listings, purchases, USD prices]**

**SPEAKER:**

"And there you have it! You've built a production-ready NFT marketplace with:

-  Modern escrowless design (like OpenSea!)
-  Secure approval mechanisms
-  List, buy, and cancel functionality
-  Live USD price display from oracles
-  Smart loading states (no race conditions!)
-  Beautiful, responsive UI

**[VISUAL: Journey graphic showing Weeks 1-5 progression]**

Look at your journey:

- **Week 1**: Deployed MyNFT and MyToken
- **Week 2**: Built frontend with wallet integration
- **Week 3**: Created events page
- **Week 4**: Added oracles and gasless transactions
- **Week 5**: Built a full marketplace!

You've gone from zero to building a platform like OpenSea in five weeks. That's incredible!

**[VISUAL: Show submission checklist]**

Submit to speedrunlisk.xyz/sea-campaign/week/5 with:

- Your deployed frontend URL with /marketplace route
- NFTMarketplace, MyNFT, and PriceFeed contract addresses
- Verified contract links on Blockscout
- GitHub repository
- A marketplace transaction hash (list, buy, or cancel)

Bonus points for screenshots showing NFTs with live USD prices!

**[VISUAL: Code snippets showing advanced features]**

Want to go further? Here are some ideas:

**1. Offers/Bidding System**
```solidity
mapping(uint256 => mapping(address => uint256)) public offers;
function makeOffer(uint256 tokenId) external payable { }
function acceptOffer(uint256 tokenId, address buyer) external { }
```

**2. Marketplace Fees** (2.5% platform fee)
```solidity
uint256 public feePercent = 250;
uint256 fee = (listing.price * feePercent) / 10000;
```

**3. Auction System** - Time-based, highest bidder wins, automatic refunds

**4. Multiple Collections** - Support any ERC721 contract, not just MyNFT

**5. Activity Feed** - Recent sales, trending NFTs, price history charts

**6. IPFS Integration** - Real NFT metadata and images

**[VISUAL: Production marketplace examples - opensea, blur interfaces]**

You're now using the same patterns as billion-dollar platforms! The escrowless design, approval mechanisms, and oracle pricingthis is how the pros build.

**[VISUAL: End card with community links]**

Join the LiskSEA Telegram if you have questions, share your marketplace on Twitter with #SpeedRunLiskSEA, and get ready for the final challenges!

You've learned smart contract security, event-driven architecture, oracle integration, and production dApp patterns. You're not just following tutorials anymoreyou're a Web3 builder!

Get your submission in, and I'll see you in the next challenge. Keep building, keep shipping! 🚀"

**[VISUAL: Fade to end card with submission link, Telegram QR code, GitHub repository, and #SpeedRunLiskSEA hashtag]**

---

## SCRIPT END

**Total Estimated Time: 10:00**
**Word Count: ~2,150 words**
**Speaking Pace: ~215 words/minute** (slightly faster pacing for action-heavy demo sections)

---

## PRODUCTION NOTES

### VISUAL ASSETS NEEDED

1. **Title Cards & Transitions**
   - Opening title card with Week 5 branding
   - "NFT Marketplace" animated logo
   - Section transition animations
   - End card with Week 5 completion badge
   - Week 1-5 journey progression graphic

2. **Diagrams & Graphics**
   - Escrow vs Escrowless marketplace comparison (animated flow)
   - NFT in wallet → Marketplace → Buyer transfer flow
   - approve() vs setApprovalForAll() comparison table
   - Three-button-state diagram (Approve → Approving... → List for Sale)
   - Checks-Effects-Interactions security pattern visualization
   - USD price calculation formula overlay

3. **Code Displays**
   - Syntax-highlighted Solidity snippets
   - TypeScript/React component code with highlights
   - Side-by-side approval method comparison
   - Loading state flow with annotations
   - Terminal command displays with proper formatting
   - File creation animations

4. **Live Demos**
   - NFT grid view with multiple cards
   - Approval button changing states (with timer showing 5-15 sec wait)
   - Listing modal with price input and USD preview
   - Listed NFT with badge and price display
   - Purchase transaction flow (wallet prompt → confirmation → ownership transfer)
   - Cancel listing action
   - USD prices updating live (show timestamp)
   - Blockscout transaction confirmations

5. **UI Mockups**
   - Marketplace page layout with NFT grid
   - NFT card in different states (unlisted, approving, listed, sold)
   - List modal with USD conversion
   - Price display cards showing ETH and USD
   - Owner vs buyer button variations
   - Mobile responsive view

6. **Security Highlights**
   - "Verified Contract" checkmark badge
   - ReentrancyGuard protection visualization
   - "Race condition prevented!" graphic for loading state
   - onBlockConfirmation callback flow diagram

### B-ROLL SUGGESTIONS

- OpenSea/Blur marketplace interfaces (for comparison)
- NFT collections scrolling
- Ethereum wallet approving transactions
- MetaMask approval dialogs
- Price tickers updating
- Developer typing code
- Multiple browser windows (testing with different wallets)
- Blockscout explorer views
- Transaction confirmation animations
- NFT ownership transferring visually
- Gas fee displays
- USD/ETH price charts
- Grid layouts organizing
- Mobile phone showing marketplace (responsive design)
- Community screenshots (Telegram/Discord)

### SCREEN RECORDINGS NEEDED

1. **Development Environment**
   - VS Code with Solidity extension
   - File explorer showing project structure
   - Multiple terminal windows with clear labels
   - Contract compilation output
   - Deployment logs

2. **Frontend Development**
   - Component file creation
   - Import statements being typed
   - Code autocomplete in action
   - Browser DevTools showing state updates
   - React component tree

3. **User Flows**
   - Complete seller journey (mint → approve → wait → list → cancel)
   - Complete buyer journey (browse → buy → own)
   - Approval loading state transition (with real 10-second wait)
   - USD price updating every 30 seconds
   - Multiple NFTs being listed
   - Different wallet addresses (show ownership clearly)

4. **Deployment Process**
   - Terminal deployment commands
   - Contract verification on Blockscout
   - Verified contract view with code
   - Transaction history on explorer

### MUSIC & AUDIO

**Background Music:**
- Genre: Upbeat electronic/tech
- Tempo: 125-135 BPM (slightly faster than Week 4 for energy)
- Mood: Exciting, innovative, professional
- Volume:
  - Lower during code explanations (20-25%)
  - Medium during demos (30-35%)
  - Higher during transitions (40-45%)
  - Peak during opening and closing (50%)

**Sound Effects:**
- Transaction confirmation chimes
- Button click sounds
- "Ka-ching!" for successful purchases
- Approval success bell
- Listing creation whoosh
- Price update ticks
- Modal open/close sounds
- Transition swooshes
- Error buzz (for showing what NOT to do)

### EDITING NOTES

**Pacing:**
- Fast-paced intro (45 seconds max)
- Slow down for ERC721 approvals section (critical concept)
- Medium pace for contract building
- Faster for frontend (visual demos help)
- Pause on the "Approving..." loading state (critical fix)
- Quick cuts during testing demo
- Strong, energetic close

**Text Overlays:**
- **BOLD** for key terms on first mention (Escrowless, setApprovalForAll, WrapperBuilder)
- Code snippets with syntax highlighting and line numbers
- Animated arrows pointing to critical code lines
- Timer overlay during "Approving..." state demo
- Checkmarks for completed steps
- Warning badges for security notes
- USD calculation formulas as overlays
- "Week X" badges when referencing previous challenges

**Transitions:**
- Smooth fades for concept explanations
- Quick cuts for action sequences
- Wipe transitions for major sections
- Zoom transitions for code → UI connections
- Split-screen for comparisons

**Annotations:**
- Highlight approval check in listItem function
- Circle the nonReentrant modifier
- Arrow pointing to isApproving state changes
- Box around onBlockConfirmation callback
- Underline security patterns
- Highlight USD price calculations

### CALL-TO-ACTION ELEMENTS

**Throughout Video:**
- "Comment below if you've used OpenSea before!" at 1:30
- "Like & Subscribe if you're building along!" at 3:30
- "Drop a 🔥 if you're excited about building marketplaces!" at 5:30
- "Join the LiskSEA Telegram for help with approvals!" at 7:00

**End Screen (9:00-10:00):**
- Submission form link (large, centered)
- Week 6 teaser text
- Telegram QR code (bottom left)
- GitHub repo link (bottom right)
- Twitter/X hashtag #SpeedRunLiskSEA
- "Show us your marketplace!" CTA

**Mid-roll Engagement:**
- "Type 'APPROVED' when your approval transaction confirms!" at 6:00
- "Pause here and check your approval status!" at 6:00
- "Test this flow yourself before continuing!" at 8:00

### ACCESSIBILITY

- **Closed Captions**:
  - Full transcript throughout
  - Code snippets as [CODE BLOCK] with descriptions
  - Sound effects described [Ka-ching sound]

- **Visual Descriptions**:
  - Describe UI states verbally ("notice the button is now disabled with a spinner")
  - Announce what's on screen ("on the left, escrow design; on the right, escrowless")

- **High Contrast**:
  - White or yellow text on dark backgrounds
  - Syntax highlighting with sufficient contrast ratios
  - Large, readable code fonts (minimum 16pt when shown)

- **Clear Pronunciation**:
  - Spell out "ERC721" as "E-R-C seven twenty-one"
  - Emphasize "approve all" vs "approve one"
  - Pause after technical terms

### THUMBNAIL SUGGESTIONS

**Option 1:** NFT card with "Listed" badge, large "$1,250" USD price overlay, "BUILD YOUR OPENSEA" text

**Option 2:** Split design - OpenSea logo on left (blurred), "BUILD YOUR OWN" arrow pointing to custom marketplace on right

**Option 3:** Three-panel showing approve → list → buy flow with emojis (= → =→ → )

**Option 4:** Code editor with NFTMarketplace.sol file, NFT grid overlay, "WEEK 5" badge

**Option 5:** Giant shopping cart icon filled with NFTs, "GASLESS MARKETPLACE" text (combining Week 4 + 5)

**Text Overlay:**
- Primary: "Build an NFT Marketplace" or "Your Own OpenSea"
- Secondary: "Week 5" badge
- Accent: "Oracle Prices!" or "Live USD Display"

**Color Scheme:**
- Lisk brand colors (purple/blue gradients)
- High contrast yellow/white text
- NFT cards with colorful gradients
- Shopping cart icon in accent color

### CHAPTER MARKERS (for YouTube)

- 0:00 - Introduction & Hook
- 0:45 - What are NFT Marketplaces?
- 1:30 - Escrow vs Escrowless Design
- 2:15 - ERC721 Approvals Explained
- 3:30 - Building NFTMarketplace Contract
- 4:30 - Security Patterns
- 5:00 - Marketplace Frontend Setup
- 5:45 - The Critical Loading State
- 6:30 - Oracle Integration for USD Prices
- 7:45 - Testing Complete Flow
- 8:15 - Deploying to Lisk Sepolia
- 8:45 - What You Built
- 9:15 - Advanced Features
- 9:45 - Submission & Next Steps

---

## ALTERNATIVE VERSIONS

### 5-Minute Express Version

Focus on:
- 0:00-0:30 Hook
- 0:30-1:30 Escrowless design + approvals (combined)
- 1:30-3:00 Contract + frontend (highlights only)
- 3:00-4:00 Oracle integration quick demo
- 4:00-4:45 Testing flow
- 4:45-5:00 Submission CTA

### Extended 15-Minute Deep Dive

Add:
- Detailed Solidity line-by-line explanation
- Live coding session (type the contract from scratch)
- Troubleshooting common errors in real-time
- Advanced features implementation (offers system)
- Gas optimization tips
- Security audit walkthrough
- Multiple buyer/seller demo with 3+ wallets
- IPFS metadata integration preview

### Tutorial Series Version (3 videos)

**Part 1: Understanding & Building the Contract** (6 min)
- NFT marketplace concepts
- Approvals deep dive
- Contract implementation
- Security patterns

**Part 2: Frontend & Oracle Integration** (6 min)
- Marketplace UI components
- Approval flow with loading states
- Oracle USD price display
- User experience optimization

**Part 3: Testing, Deployment & Going Further** (5 min)
- Complete flow testing
- Multi-wallet testing
- Testnet deployment
- Verification
- Advanced features overview
- Community showcase

---

## ENGAGEMENT HOOKS

**Opening Questions:**
- "Ever wondered how much it would cost to build the next OpenSea?"
- "What if I told you your Week 1 NFT contract is already marketplace-ready?"
- "Can you build an NFT marketplace in under an hour?"

**Mid-Video Engagement:**
- "Comment '🔥' if you're testing this on localhost right now!"
- "Drop your favorite NFT marketplace in the comments!"
- "Who's listing their first NFT? Tag #SpeedRunLiskSEA!"
- "Type 'APPROVED' when your approval transaction confirms!"
- "Pause and test the three-button flow yourself!"

**Closing CTA:**
- "Show us your marketplace in the Telegram group!"
- "Tag @LiskSEA on Twitter with your NFT listings!"
- "Share screenshots of your USD price displays!"
- "Comment your marketplace URL when you deploy!"
- "Who's adding the offers feature? Let us know!"

**Community Challenges:**
- "First person to list 10 NFTs wins recognition!"
- "Most creative NFT marketplace name?"
- "Showcase your marketplace in the community call!"

---

## KEYWORDS FOR SEO

**Primary:**
NFT marketplace tutorial, build NFT marketplace, OpenSea clone, blockchain marketplace, Lisk NFT marketplace, Web3 marketplace development

**Secondary:**
ERC721 approvals, setApprovalForAll tutorial, escrowless marketplace, NFT marketplace smart contract, Scaffold-ETH marketplace, oracle price integration, USD price feed NFT

**Long-tail:**
- How to build NFT marketplace from scratch
- ERC721 approve vs setApprovalForAll explained
- NFT marketplace without escrow tutorial
- Integrate oracle prices into NFT marketplace
- Fix marketplace not approved error
- NFT marketplace loading state best practices
- Build OpenSea alternative tutorial
- Lisk Sepolia NFT marketplace deployment
- RedStone oracle NFT price display
- Gasless NFT marketplace with account abstraction

**Technical Terms:**
- ReentrancyGuard pattern
- Checks-Effects-Interactions
- onBlockConfirmation callback
- WrapperBuilder RedStone
- useDeployedContractInfo hook
- NFT approval race condition fix
- Escrowless marketplace security

**Platform/Tools:**
Scaffold-Lisk, thirdweb, RedStone oracle, Lisk blockchain, Hardhat deployment, Blockscout verification, Next.js NFT marketplace, Wagmi hooks, Viem Ethereum, TailwindCSS NFT UI

---

## ERROR PREVENTION CALLOUTS

**Common Mistakes to Highlight:**

1. **"Marketplace not approved" error**
   - Show the loading state solution
   - Emphasize waiting for blockchain confirmation
   - Visual: side-by-side wrong vs right approach

2. **Wrong marketplace address**
   - Show `useDeployedContractInfo` vs reading `nftContract()`
   - Explain the difference clearly
   - Visual: highlight the correct import

3. **Timestamp oracle errors**
   - Reference Week 4's validateTimestamp fix
   - Quick reminder that PriceFeed needs extended tolerance
   - Visual: show the override function

4. **Trying to list before approval confirms**
   - Demonstrate the race condition
   - Show how isApproving state prevents it
   - Visual: timeline showing transaction → confirmation → button change

---

## SUCCESS METRICS TRACKING

**Encourage viewers to share:**
- "Comment your NFT marketplace URL when deployed!"
- "How many NFTs did you list? Tell us below!"
- "What USD price is your NFT showing? Screenshot it!"
- "First transaction hash? Share it with #SpeedRunLiskSEA!"

**Progress Indicators:**
- Week 1  (Deploy contracts)
- Week 2  (Build frontend)
- Week 3  (Events page)
- Week 4  (Oracles + Gasless)
- Week 5  (NFT Marketplace) → YOU ARE HERE
- Week X? (Coming soon teaser)

---

_Video script created for SpeedRun Lisk Week 5 tutorial. Target duration: 10 minutes. Target audience: Intermediate Web3 developers who completed Weeks 1-4. Focus: NFT marketplace mechanics, ERC721 approvals, oracle integration, production-ready patterns._
