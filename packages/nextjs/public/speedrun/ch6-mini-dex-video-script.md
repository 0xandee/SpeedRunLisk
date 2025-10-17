# SpeedRun Lisk Week 6: Build a Simple DEX

## Video Script (~10 Minutes)

---

## [0:00-0:45] OPENING & HOOK

**[VISUAL: Animated title card with "Week 6: Simple DEX" + Lisk logo, transition to Uniswap-style interface mockup]**

**SPEAKER:**

"Ever used Uniswap, PancakeSwap, or SushiSwap? What if I told you that you could build your own fully functional decentralized exchange in under an hour—complete with token swaps, liquidity pools, and the same automated market maker formula that powers billions of dollars in DeFi trading?

Welcome to SpeedRun Lisk Week 6! Today we're building a production-ready DEX from scratch. No centralized order books, no intermediaries—just pure smart contract magic using the constant product formula.

By the end of this tutorial, you'll have a working DEX deployed to Lisk Sepolia where users can swap tokens, provide liquidity, and earn trading fees—all the core mechanics that power the biggest DeFi protocols!

Before we start, make sure you've completed Weeks 1 through 5. You should have your token contracts ready and understand basic smart contract development. Ready? Let's build the future of decentralized finance!"

**[VISUAL: Quick montage of final product - swap interface, liquidity pool stats, transaction confirmations]**

---

## [0:45-2:30] UNDERSTANDING AUTOMATED MARKET MAKERS

**[VISUAL: Animated comparison showing traditional exchange vs DEX]**

**SPEAKER:**

"First, let's understand what makes DEXs revolutionary. Traditional exchanges—like Coinbase or Binance—use order books. You place a buy order, someone else places a sell order, and they match. Simple, but it requires lots of traders and centralized infrastructure.

**[VISUAL: Transition to AMM animation]**

DEXs use Automated Market Makers instead. Here's the magic: instead of matching orders, you trade directly against a liquidity pool—a smart contract holding two tokens!

**[VISUAL: Show liquidity pool with 100 MTK + 200 sUSDC]**

Imagine a pool containing 100 MyToken and 200 SimpleUSDC. Anyone can trade instantly against this pool. The price is automatic based on the ratio. No waiting, no order matching, always available!

Now here's the genius—the constant product formula: **x times y equals k**.

**[VISUAL: Animated formula with actual numbers changing]**

Let me show you exactly how this works:

```
Pool contains:
  100 MTK (x) × 200 sUSDC (y) = 20,000 (k)

Current price:
  1 MTK = 200 / 100 = 2 sUSDC
```

When someone swaps, k stays constant—well, almost. Watch this:

**[VISUAL: Step-by-step swap animation]**

User swaps 10 MTK for sUSDC:

```
Step 1: Add 10 MTK to pool
  New MTK: 100 + 10 = 110

Step 2: Calculate new sUSDC to maintain k
  110 × y = 20,000
  y = 181.8 sUSDC

Step 3: User receives the difference
  200 - 181.8 = 18.2 sUSDC

After swap:
  Pool: 110 MTK × 181.8 sUSDC
  New price: 1 MTK = 1.65 sUSDC
```

Notice two things: the price moved from 2 to 1.65, and k actually increased slightly to 20,005! That's the 0.3% trading fee staying in the pool!

**[VISUAL: Show fee accumulation visualization]**

This is brilliant—liquidity providers deposit tokens into the pool and earn 0.3% on every single trade. The more volume, the more fees! It's passive income from DeFi.

Let's build it!"

---

## [2:30-4:30] BUILDING THE SIMPLEDEX CONTRACT

**[VISUAL: VS Code showing contracts folder]**

**SPEAKER:**

"Create `SimpleDEX.sol` in your contracts folder. This contract is the heart of everything.

**[VISUAL: Show contract structure overview]**

```solidity
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleDEX is ReentrancyGuard {
    IERC20 public immutable tokenA;  // MyToken
    IERC20 public immutable tokenB;  // SimpleUSDC

    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    uint256 public constant FEE_NUMERATOR = 3;      // 0.3% fee
    uint256 public constant FEE_DENOMINATOR = 1000;
}
```

Three core functions power this DEX:

**[VISUAL: Highlight addLiquidity function]**

**1. addLiquidity()** - Deposit tokens, receive LP shares

```solidity
function addLiquidity(uint256 amountA, uint256 amountB)
    external
    returns (uint256 liquidityMinted)
{
    // Transfer tokens from user
    tokenA.transferFrom(msg.sender, address(this), amountA);
    tokenB.transferFrom(msg.sender, address(this), amountB);

    // Calculate LP shares
    if (totalLiquidity == 0) {
        // First depositor sets the ratio
        liquidityMinted = amountA;
    } else {
        // Maintain pool ratio
        liquidityMinted = (amountA * totalLiquidity) / reserveA;
    }

    // Update state
    liquidity[msg.sender] += liquidityMinted;
    totalLiquidity += liquidityMinted;
    reserveA += amountA;
    reserveB += amountB;
}
```

The first person to add liquidity sets the initial price ratio. After that, everyone must match that ratio!

**[VISUAL: Show swap function with formula highlighted]**

**2. swap()** - The money maker!

```solidity
function swap(address tokenIn, uint256 amountIn)
    external
    returns (uint256 amountOut)
{
    // Get reserves
    (uint256 reserveIn, uint256 reserveOut) = isTokenA
        ? (reserveA, reserveB)
        : (reserveB, reserveA);

    // Apply 0.3% fee
    uint256 amountInWithFee = amountIn * 997;  // 99.7% after fee

    // Constant product formula
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = (reserveIn * 1000) + amountInWithFee;
    amountOut = numerator / denominator;

    // Transfer tokens
    tokenInContract.transferFrom(msg.sender, address(this), amountIn);
    tokenOutContract.transfer(msg.sender, amountOut);

    // Update reserves
    reserveA += isTokenA ? amountIn : -amountOut;
    reserveB += isTokenA ? -amountOut : amountIn;
}
```

**[VISUAL: Highlight security pattern]**

See the pattern? We multiply by 997 instead of 1000—that's the 0.3% fee! The fee stays in the pool, making every LP slightly richer with each trade.

**[VISUAL: Show removeLiquidity briefly]**

**3. removeLiquidity()** - Burn LP shares, get tokens back proportionally

Simple math: your LP tokens divided by total LP tokens equals your share of the pool!

**[VISUAL: Security features highlighted]**

Security is critical:
- **ReentrancyGuard** prevents reentrancy attacks
- **Immutable token addresses** can't be changed after deployment
- **Checks-Effects-Interactions** pattern: validate, update state, then transfer

**[VISUAL: Terminal showing deployment]**

Now deploy! First create SimpleUSDC (a stablecoin with 6 decimals to match real USDC), then deploy SimpleDEX with both token addresses.

```bash
yarn deploy
```

Your DEX is live! Now for the interface..."

---

## [4:30-6:30] BUILDING THE DEX FRONTEND

**[VISUAL: Create dex/page.tsx file]**

**SPEAKER:**

"The frontend has two main parts: swap and liquidity management.

**[VISUAL: Show DEX page with tab navigation]**

Create `app/dex/page.tsx` with tab navigation:

```tsx
const DEX: NextPage = () => {
  const [activeTab, setActiveTab] = useState<"swap" | "liquidity">("swap");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>💱 Simple DEX</h1>

      <div className="tabs tabs-boxed">
        <button onClick={() => setActiveTab("swap")}>💱 Swap</button>
        <button onClick={() => setActiveTab("liquidity")}>💧 Liquidity</button>
      </div>

      {activeTab === "swap" ? <SwapPanel /> : <LiquidityPanel />}
    </div>
  );
};
```

Clean and simple!

**[VISUAL: Show SwapPanel component]**

The `SwapPanel` is where the magic happens:

```tsx
const SwapPanel = () => {
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isTokenAInput, setIsTokenAInput] = useState(true);

  // Get real-time price quote
  const { data: swapQuote } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getSwapAmount",
    args: [tokenIn, parseUnits(inputAmount, isTokenAInput ? 18 : 6)],
  });

  // Update output automatically
  useEffect(() => {
    if (swapQuote) {
      setOutputAmount(formatUnits(swapQuote, isTokenAInput ? 6 : 18));
    }
  }, [swapQuote]);
}
```

**[VISUAL: Highlight decimal handling with visual overlay]**

Critical detail: MyToken uses 18 decimals, SimpleUSDC uses 6 decimals like real USDC!

```tsx
// Always use correct decimals!
parseUnits(amount, isTokenAInput ? 18 : 6)  // Input
formatUnits(output, isTokenAInput ? 6 : 18)  // Output
```

**[VISUAL: Show token direction toggle]**

The flip button swaps direction—MTK to sUSDC or sUSDC to MTK:

```tsx
const handleFlipTokens = () => {
  setIsTokenAInput(!isTokenAInput);
  setInputAmount(outputAmount);
  setOutputAmount(inputAmount);
};
```

One interface, both directions!

**[VISUAL: Show LiquidityPanel component]**

The `LiquidityPanel` manages the pool:

```tsx
const LiquidityPanel = () => {
  // Pool statistics
  const { data: reserves } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getReserves",
  });

  const reserveA = reserves?.[0];
  const reserveB = reserves?.[1];
  const totalLiquidity = reserves?.[2];

  // User's position
  const { data: userLiquidity } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getUserLiquidity",
    args: [connectedAddress],
  });

  const userShare = (userLiquidity * 100) / totalLiquidity;
}
```

**[VISUAL: Show pool statistics dashboard]**

Display pool stats beautifully:

```tsx
<div className="stats stats-horizontal">
  <div className="stat">
    <div className="stat-title">Reserve MTK</div>
    <div className="stat-value">{formatBalance(reserveA, 18)}</div>
  </div>
  <div className="stat">
    <div className="stat-title">Reserve sUSDC</div>
    <div className="stat-value">{formatBalance(reserveB, 6)}</div>
  </div>
  <div className="stat">
    <div className="stat-title">Your Share</div>
    <div className="stat-value">{userShare.toFixed(2)}%</div>
  </div>
</div>
```

**[VISUAL: Show add liquidity flow]**

Adding liquidity requires approving BOTH tokens:

```tsx
{!isApprovedA && (
  <button onClick={handleApproveA}>Approve MTK</button>
)}
{!isApprovedB && (
  <button onClick={handleApproveB}>Approve sUSDC</button>
)}
{isApprovedA && isApprovedB && (
  <button onClick={handleAddLiquidity}>Add Liquidity</button>
)}
```

**[VISUAL: Show remove liquidity preview]**

When removing liquidity, show exactly what they'll receive:

```tsx
const expectedA = (removeAmount * reserveA) / totalLiquidity;
const expectedB = (removeAmount * reserveB) / totalLiquidity;

<div className="alert alert-info">
  <p>You will receive:</p>
  <p>• {formatBalance(expectedA, 18)} MTK</p>
  <p>• {formatBalance(expectedB, 6)} sUSDC</p>
</div>
```

Users love seeing exactly what they'll get before confirming!

Add the DEX link to your header navigation and you're ready to test!"

---

## [6:30-8:00] TESTING COMPLETE FLOW

**[VISUAL: Three terminal windows + browser]**

**SPEAKER:**

"Testing time! Let's walk through the complete flow.

**[VISUAL: Terminal commands]**

```bash
# Terminal 1
yarn chain

# Terminal 2
yarn deploy

# Terminal 3
yarn start
```

**[VISUAL: Browser showing Debug Contracts page]**

Navigate to the Debug Contracts page and mint test tokens:

**Step 1: Get tokens**

```
MyToken.mint():
  to: Your address
  amount: 1000000000000000000000  (1000 MTK with 18 decimals)

SimpleUSDC.mint():
  to: Your address
  amount: 1000000000  (1000 sUSDC with 6 decimals!)
```

Notice the decimal difference—super important!

**[VISUAL: DEX page - Liquidity tab]**

**Step 2: Add initial liquidity**

Go to `/dex`, click "Liquidity" tab:

- Enter amounts: 100 MTK, 200 sUSDC (sets a 1:2 ratio)
- Click "Approve MTK" → confirm transaction
- Click "Approve sUSDC" → confirm transaction
- Click "Add Liquidity" → confirm transaction

**[VISUAL: Pool statistics updating]**

Watch the pool stats appear:
- Reserve MTK: 100.0000
- Reserve sUSDC: 200.0000
- Your Share: 100% (you're the only LP!)

**[VISUAL: Switch to Swap tab]**

**Step 3: Test a swap**

Click "Swap" tab:

- Enter input: 10 MTK
- Watch output appear automatically: ~18.2 sUSDC
- See exchange rate: 1 MTK ≈ 1.82 sUSDC

Notice it's not exactly 2? That's the 0.3% fee plus price impact!

- Click "Approve MTK" if needed
- Click "Swap" → confirm

**[VISUAL: Show balances changing]**

Your MTK balance decreased by 10, sUSDC increased by ~18! It works!

**[VISUAL: Back to Liquidity tab, Remove section]**

**Step 4: Remove liquidity**

In the "Remove Liquidity" section:

- Enter LP amount: 50 (half your liquidity)
- See expected outputs: ~55 MTK, ~109 sUSDC

Wait—why more than you put in? Because you earned fees from that swap!

- Click "Remove Liquidity" → confirm

**[VISUAL: Show final balances]**

You got your tokens back PLUS a share of the 0.3% fee. That's how LPs make money!

**[VISUAL: Quick demo with second wallet]**

For bonus points, test with a second wallet:
- Add liquidity from wallet #2
- See your share % split correctly
- Swaps benefit both LPs proportionally

Perfect!"

---

## [8:00-9:00] DEPLOY TO LISK SEPOLIA

**[VISUAL: Terminal showing testnet deployment]**

**SPEAKER:**

"Ready for testnet? Let's deploy to Lisk Sepolia!

**[VISUAL: Setup commands]**

```bash
yarn generate  # Create deployer wallet
yarn account   # Check balance
```

Get testnet ETH from the Lisk Sepolia faucet at docs.lisk.com/lisk-tools/faucets.

**[VISUAL: Deployment command running]**

```bash
yarn deploy --network liskSepolia
```

You'll see all three contracts deploy:

```
✅ MyToken deployed at: 0x704a50...
✅ SimpleUSDC deployed at: 0x67b7Ea...
✅ SimpleDEX deployed at: 0xe5af77...
```

**[VISUAL: Blockscout verification]**

Verify each contract on Blockscout:

```bash
yarn hardhat-verify --network liskSepolia \
  --contract contracts/MyToken.sol:MyToken \
  0x704a50...

yarn hardhat-verify --network liskSepolia \
  --contract contracts/SimpleUSDC.sol:SimpleUSDC \
  0x67b7Ea...

yarn hardhat-verify --network liskSepolia \
  --contract contracts/SimpleDEX.sol:SimpleDEX \
  0xe5af77...
```

**[VISUAL: Blockscout showing verified contracts with green checkmarks]**

All verified!

**[VISUAL: Adding liquidity on testnet]**

Important: Add initial liquidity on testnet so others can test swaps:
- Mint yourself some tokens
- Add 100 MTK + 200 sUSDC to the pool
- Now anyone can trade!

**[VISUAL: Frontend deployment to Vercel]**

Deploy your frontend:

```bash
yarn build
git push origin main
```

Connect to Vercel, deploy, and your live DEX is online!

**[VISUAL: Live DEX interface on testnet]**

Test the complete flow on testnet, verify everything works, and you're ready to submit!"

---

## [9:00-10:30] WRAP-UP & ADVANCED FEATURES

**[VISUAL: Final montage of DEX in action]**

**SPEAKER:**

"And there you have it! You've built a fully functional decentralized exchange with:

- ✅ Automated Market Maker using constant product formula
- ✅ Add and remove liquidity with LP share tracking
- ✅ Token swaps with dynamic pricing
- ✅ 0.3% trading fees that reward liquidity providers
- ✅ Beautiful, responsive UI with real-time quotes
- ✅ Production-ready smart contracts with security best practices

**[VISUAL: Journey visualization Week 1-6]**

Look at your journey:
- **Week 1**: Deployed ERC20 tokens
- **Week 2**: Built frontend with wallet integration
- **Week 3**: Learned event handling
- **Week 4**: Integrated oracles and gasless transactions
- **Week 5**: Created an NFT marketplace
- **Week 6**: Built a DEX using those same tokens!

You've gone from zero to building the infrastructure that powers DeFi. That's incredible!

**[VISUAL: Code snippets showing advanced features]**

Want to go further? Here are five powerful features to add:

**1. Multiple Token Pairs (Factory Pattern)**

```solidity
contract DEXFactory {
    mapping(address => mapping(address => address)) public getPair;

    function createPair(address tokenA, address tokenB)
        external
        returns (address pair)
    {
        pair = address(new SimpleDEX(tokenA, tokenB));
        getPair[tokenA][tokenB] = pair;
    }
}
```

Support unlimited trading pairs—just like Uniswap!

**2. ERC20 LP Tokens**

```solidity
contract SimpleDEX is ERC20, ReentrancyGuard {
    function addLiquidity(...) external {
        _mint(msg.sender, liquidityMinted);  // Mint ERC20 LP tokens
    }
}
```

Make LP shares transferable and usable in other DeFi protocols!

**3. Price Impact Warnings**

```tsx
const priceImpact = ((outputAmount * reserveIn) / (inputAmount * reserveOut) - 1) * 100;

{priceImpact > 5 && (
  <div className="alert alert-warning">
    ⚠️ High price impact: {priceImpact.toFixed(2)}%
  </div>
)}
```

Warn users when large swaps will move the price significantly!

**4. Slippage Protection**

```solidity
function swap(
    address tokenIn,
    uint256 amountIn,
    uint256 minAmountOut  // New parameter
) external returns (uint256 amountOut) {
    amountOut = calculateSwap(tokenIn, amountIn);
    require(amountOut >= minAmountOut, "Slippage exceeded");
    // Execute swap
}
```

Let users set maximum acceptable slippage!

**5. Router Contract (Multi-hop Swaps)**

```solidity
contract DEXRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 minAmountOut,
        address[] calldata path,  // [MTK, USDC, ETH]
        address to
    ) external {
        // Swap MTK → USDC, then USDC → ETH in one transaction!
    }
}
```

Enable swaps through multiple pools for better rates!

**[VISUAL: Show Uniswap, PancakeSwap, SushiSwap logos]**

These are the exact patterns used by billion-dollar protocols:
- Uniswap V2: Same constant product formula
- PancakeSwap: Same AMM mechanics
- SushiSwap: Fork of Uniswap with minor changes

Over $100 billion in liquidity across these protocols. You're using production patterns!

**[VISUAL: Real DeFi stats overlay]**

You've learned the fundamentals that power the entire DeFi ecosystem. Token swaps, liquidity provision, automated pricing—these concepts unlock everything from yield farming to derivatives trading.

You're not just following tutorials anymore—you're a DeFi builder!"

---

## [10:30-11:00] SUBMISSION & CALL TO ACTION

**[VISUAL: Show submission checklist]**

**SPEAKER:**

"Time to submit your work! Head to speedrunlisk.xyz/sea-campaign/week/6 and submit:

- ✅ Your deployed frontend URL with `/dex` route
- ✅ Three contract addresses: MyToken, SimpleUSDC, and SimpleDEX
- ✅ Verified contract links on Lisk Sepolia Blockscout
- ✅ Your GitHub repository
- ✅ Transaction hashes: Add liquidity, swap, and remove liquidity

**[VISUAL: Bonus points overlay]**

Bonus points for:
- Screenshots of your pool statistics!
- Adding liquidity to help others test swaps
- Tweeting about building a DEX with #SpeedRunLiskSEA

**[VISUAL: Community links appearing]**

Questions? Join the @LiskSEA Telegram! Share your DEX, help others debug, and celebrate your progress.

**[VISUAL: Progress badges Week 1-6]**

You've completed six weeks of intensive Web3 development:
- Smart contract security
- Event-driven architecture
- Oracle integration
- NFT marketplaces
- Automated Market Makers

You started with zero knowledge. Now you can build the protocols that define DeFi.

**[VISUAL: Encouraging final message]**

Get your submission in, keep building, keep learning, and remember—every major DeFi protocol started exactly where you are now: with a simple swap function and a dream to decentralize finance.

You're building the future. Keep shipping! 🚀"

**[VISUAL: Fade to end card with submission link, Telegram QR code, #SpeedRunLiskSEA, and "Keep Building!" message]**

---

## SCRIPT END

**Total Estimated Time: 10:30**
**Word Count: ~2,100 words**
**Speaking Pace: ~200 words/minute** (slightly slower for math sections, faster for demos)

---

## PRODUCTION NOTES

### VISUAL ASSETS NEEDED

**Title Cards & Transitions**
- Opening title card with Week 6 branding
- "Simple DEX" animated logo with trading symbols
- Section transition animations
- End card with Week 6 completion badge
- Week 1-6 journey progression graphic

**Diagrams & Animations**
- CEX vs DEX comparison (order book vs liquidity pool)
- Constant product formula animation (x*y=k with changing values)
- Swap flow visualization (tokens moving, reserves updating)
- Price impact diagram showing larger swaps = bigger price change
- LP share calculation visual
- Fee accumulation visualization (0.3% staying in pool)

**Code Displays**
- Syntax-highlighted Solidity snippets
- TypeScript/React component code
- addLiquidity() function with annotations
- swap() function with fee calculation highlighted
- Decimal handling comparison (18 vs 6)
- Terminal command displays

**Live Demos**
- Swap interface with real-time quotes
- Liquidity panel with pool statistics
- Add liquidity flow (approve MTK → approve sUSDC → add)
- Remove liquidity with expected outputs
- Balance changes after swap
- Multi-user testing demonstration

**Mathematical Examples**
- Pool state: 100 MTK × 200 sUSDC = 20,000
- Swap calculation with actual numbers
- Before/after pool states
- Price calculation (reserveOut / reserveIn)
- LP share percentage calculation

### CHAPTER MARKERS (for YouTube)

- 0:00 - Introduction & Hook
- 0:45 - What are Automated Market Makers?
- 1:15 - Constant Product Formula (x*y=k)
- 2:30 - Building SimpleDEX Contract
- 3:15 - The Swap Function
- 4:00 - Security Patterns
- 4:30 - Building the Frontend
- 5:00 - SwapPanel Component
- 5:45 - LiquidityPanel Component
- 6:30 - Testing Complete Flow
- 7:15 - First Swap Transaction
- 8:00 - Deploy to Lisk Sepolia
- 8:30 - Verify on Blockscout
- 9:00 - What You Built
- 9:30 - Top 5 Advanced Features
- 10:30 - Submission & Next Steps

### THUMBNAIL SUGGESTIONS

**Option 1:** Split design - Uniswap logo on left, "BUILD YOUR OWN" arrow pointing to custom DEX on right

**Option 2:** Swap interface mockup with large "💱" emoji, "10-MINUTE DEX" text overlay

**Option 3:** Constant product formula (x*y=k) with money symbols, "LEARN THE MATH" badge

**Option 4:** Pool statistics dashboard with colorful stats, "EARN 0.3% FEES" highlight

**Text Overlay:**
- Primary: "Build a DEX in 10 Minutes"
- Secondary: "Week 6" badge
- Accent: "Uniswap Clone" or "AMM Formula"

**Color Scheme:**
- Lisk brand colors (purple/blue gradients)
- High contrast yellow/white text
- Trading green/red accents for swap arrows

### EDITING NOTES

**Pacing:**
- Fast-paced intro (45 seconds)
- Moderate pace for AMM explanation (show examples clearly)
- Medium pace for contract building
- Faster cuts during frontend/testing demo
- Strong, energetic close

**Text Overlays:**
- **BOLD** terms: AMM, Constant Product Formula, Liquidity Pool, LP Shares
- Formula overlays: x*y=k prominently displayed during math section
- Decimal indicators: "18 decimals" and "6 decimals" labels
- Calculation breakdowns showing step-by-step math
- Checkmarks for completed steps

**Visual Emphasis:**
- Highlight 0.3% fee mechanism
- Show k increasing after swaps (fee effect)
- Emphasize approve BOTH tokens
- Display pool ratio calculations
- Mark price changes during swaps

### KEYWORDS FOR SEO

**Primary:**
Build DEX tutorial, Uniswap clone, automated market maker, constant product formula, liquidity pool tutorial, DeFi development

**Secondary:**
x*y=k formula, DEX smart contract, provide liquidity crypto, LP tokens explained, token swap tutorial, AMM development

**Long-tail:**
- How to build decentralized exchange from scratch
- Constant product formula explained with examples
- Create liquidity pool smart contract
- Build Uniswap V2 clone tutorial
- DEX development on Lisk blockchain

---

_Video script created for SpeedRun Lisk Week 6 tutorial. Target duration: 10 minutes. Target audience: Developers who completed Weeks 1-5. Focus: AMM mechanics, DeFi smart contracts, liquidity provision._
