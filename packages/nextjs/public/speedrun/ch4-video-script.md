# SpeedRun Lisk Week 4: Oracles & Gasless Transactions

## Video Script (~10 Minutes)

---

## [0:00-0:45] OPENING & HOOK

**[VISUAL: Animated title card with "Week 4: Oracles & Sponsored Transactions" + Lisk logo]**

**SPEAKER:**

"What if I told you that you could build a dApp that fetches live Bitcoin and Ethereum prices from the real world... AND let users interact with it completely for free—zero gas fees? Sounds impossible, right?

Welcome to SpeedRun Lisk Week 4, where we're diving into two game-changing Web3 technologies: **Oracles** for real-world data, and **ERC-4337 Account Abstraction** for gasless transactions.

By the end of this tutorial, you'll have built a fully functional dApp with live price feeds and Smart Wallets that sponsor all transaction costs. No more asking users to buy ETH before they can try your app!

Before we start, make sure you've completed Weeks 1, 2, and 3. You should have Scaffold-Lisk installed, contracts deployed, and a working frontend. Got it? Perfect. Let's build something amazing."

**[VISUAL: Quick montage of final product - price feeds updating, gasless transaction succeeding]**

---

## [0:45-2:30] PART 1: UNDERSTANDING ORACLES

**[VISUAL: Split screen - blockchain on left, real world data (stock ticker, weather) on right]**

**SPEAKER:**

"First up: **Oracles**. Here's the problem—smart contracts are isolated. They can't access data from outside the blockchain. No stock prices, no weather data, no sports scores. Nothing.

That's where oracles come in. Think of them as bridges between the real world and the blockchain.

**[VISUAL: Animated diagram showing: Real World → Oracle Network → Smart Contract → dApp]**

Traditional oracles like Chainlink use a 'Push' model—they constantly write data on-chain. It's secure, but expensive. Every price update costs gas.

We're using **RedStone Pull**, which is brilliant for testnets and cost-sensitive apps. Instead of storing data on-chain, RedStone injects oracle data directly into your transaction's calldata.

**[VISUAL: Side-by-side comparison graphic]**

```
Traditional Oracle (Push):
  Data stored on-chain → More expensive → Always available

RedStone Pull:
  Data in transaction calldata → Cheaper → Fetched on-demand
```

The magic? Your smart contract reads the oracle data from the transaction itself. No storage costs, same security guarantees with cryptographic signatures. Let's build it!"

---

## [2:30-4:00] BUILDING THE ORACLE CONTRACT

**[VISUAL: VS Code editor, terminal window visible]**

**SPEAKER:**

"Open your terminal in the `packages/hardhat` directory. First, we need the RedStone package:

**[VISUAL: Terminal showing command]**

```bash
yarn add @redstone-finance/evm-connector
```

Now let's create our PriceFeed contract. This is beautifully simple.

**[VISUAL: Create new file `PriceFeed.sol`]**

The key here is inheriting from `MainDemoConsumerBase`—this gives us everything we need for testnet oracle access, pre-configured.

**[VISUAL: Highlight the import and contract declaration]**

```solidity
import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";

contract PriceFeed is MainDemoConsumerBase {
```

Now watch this—getting the ETH price is just three lines of code:

**[VISUAL: Highlight getEthPrice function]**

```solidity
function getEthPrice() public view returns (uint256) {
    bytes32[] memory dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = bytes32("ETH");

    uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
    return prices[0];
}
```

We're creating a feed ID for 'ETH', then calling `getOracleNumericValuesFromTxMsg`—this extracts the price from the transaction calldata. RedStone returns prices with 8 decimals, so $2,500.50 becomes 250050000000.

Now here's a crucial detail—we need to override the timestamp validation. Oracle data has real-time timestamps, but your local blockchain might lag behind. The default allows only 3 minutes tolerance, which can cause errors. We extend it to 15 minutes for development:

**[VISUAL: Highlight validateTimestamp override]**

```solidity
function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    uint256 blockTimestampMilliseconds = block.timestamp * 1000;
    uint256 maxTimestampDiffMilliseconds = 15 * 60 * 1000; // 15 minutes
    // ... validation logic
}
```

This prevents the dreaded 'TimestampFromTooLongFuture' error! For production, reduce this to 3-5 minutes to ensure data freshness.

**[VISUAL: Quick copy-paste for getBtcPrice and getMultiplePrices functions]**

Add the same for Bitcoin, and boom—you've got a multi-asset oracle with proper timestamp handling! Let's deploy this."

---

## [4:00-5:15] BUILDING THE ORACLE FRONTEND

**[VISUAL: Switch to Next.js frontend directory]**

**SPEAKER:**

"Frontend time! First, install RedStone for the frontend:

**[VISUAL: Terminal]**

```bash
cd packages/nextjs
yarn add @redstone-finance/evm-connector @redstone-finance/sdk ethers@^5.7.2
```

Wait—ethers.js? Here's the thing: RedStone's WrapperBuilder was built for ethers contracts, not viem. So we use a hybrid approach—viem for the rest of the app, ethers specifically for RedStone oracle calls. Both can work together perfectly!

**[VISUAL: Create oracle/page.tsx - show the clean UI structure]**

The magic happens in our `PriceDisplay` component. Let me show you the **WrapperBuilder pattern**—this is RedStone's secret sauce:

**[VISUAL: Highlight the key code in PriceDisplay.tsx]**

```typescript
// Create ethers provider and contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(address, abi, provider);

// Wrap with RedStone using the CURRENT API
const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
  dataPackagesIds: [symbol],
  authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),
});

// Call directly - ethers style!
const priceData = await wrappedContract.getEthPrice();
```

What's happening here?

1. We create an ethers contract (RedStone requirement)
2. Wrap it with RedStone functionality
3. Use the NEW API with `dataPackagesIds` and `authorizedSigners`
4. Call the method directly—no `.read.` needed with ethers!

When you call `getEthPrice()`, WrapperBuilder intercepts the call, fetches the latest signed price from RedStone's API, appends it to the transaction calldata with cryptographic signatures, and THEN executes your contract function. Your contract verifies the signatures on-chain. All automatic. All secure!

**[VISUAL: Live demo showing prices loading]**

Add a 30-second auto-refresh, format the prices, and you've got real-time crypto prices in your dApp! That's oracles done. Now for the really exciting part..."

---

## [5:15-6:30] UNDERSTANDING ACCOUNT ABSTRACTION

**[VISUAL: Animated comparison diagram]**

**SPEAKER:**

"Let's talk about **Account Abstraction**—specifically ERC-4337. This is the future of Web3 UX.

Here's the traditional flow:

**[VISUAL: Flow diagram]**

```
Traditional Wallet (EOA):
  User → Signs Transaction → PAYS GAS → Contract Executes
```

The problem? Users need ETH before they can do ANYTHING. Want to try an NFT game? Buy ETH first. Want to swap tokens? Need ETH for gas. It's terrible UX.

ERC-4337 changes everything:

**[VISUAL: New flow diagram with highlighted differences]**

```
Smart Wallet (ERC-4337):
  User → Signs UserOperation → Bundler → Paymaster Sponsors Gas → Contract Executes

  GAS COST: $0 ✨
```

Here's what's happening:

- **UserOperation**: Like a transaction, but more flexible
- **Smart Wallet**: Your account IS a smart contract (programmable!)
- **Bundler**: Packages your operation and submits it
- **Paymaster**: Pays the gas for you

But here's the BEST part—and this is why Lisk recommends ERC-4337 over older solutions—your smart contracts need **ZERO** special code.

**[VISUAL: Side-by-side comparison]**

```
Old Way (ERC2771):
❌ Import ERC2771Context
❌ Use _msgSender() instead of msg.sender
❌ Deploy forwarder contracts
❌ Complex signature verification

ERC-4337:
✅ Write normal contracts
✅ Just use msg.sender
✅ Works with existing contracts!
```

The complexity moves from your contracts to the account layer. Let me show you how simple this is."

---

## [6:30-7:30] USING EXISTING CONTRACTS & SETUP

**[VISUAL: Split screen showing MyNFT.sol and MyToken.sol from Week 1]**

**SPEAKER:**

"Here's where it gets amazing—we don't need to create ANY new contracts! Your MyNFT and MyToken contracts from Week 1 already work with Smart Wallets!

**[VISUAL: Highlight MyNFT mint function]**

```solidity
// Your existing MyNFT from Week 1
contract MyNFT is ERC721 {
    function mint(address to) public {
        _mint(to, _tokenIdCounter++);
        // Just regular msg.sender - no special code needed!
    }
}
```

Look—no ERC2771 imports, no meta-transaction logic, no forwarders. Just your standard OpenZeppelin ERC721. And it works perfectly with gasless transactions!

This is the power of ERC-4337: existing contracts become gasless-compatible without any modifications. The complexity lives in the account layer, not your contracts.

Now for the frontend setup. We're using **thirdweb**—they provide the bundler and paymaster infrastructure so we don't have to run our own.

**[VISUAL: Terminal showing install]**

```bash
yarn add thirdweb
```

Quick setup:

1. Go to thirdweb.com and create a free account
2. Get your Client ID from the dashboard
3. Add it to your `.env.local`:

**[VISUAL: Show .env.local]**

```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```

Create a `chains.ts` file to configure Lisk Sepolia for thirdweb—super straightforward chain definition.

Now the fun part—gasless NFT minting!"

---

## [7:30-8:45] BUILDING GASLESS FRONTEND

**[VISUAL: Create gasless/page.tsx]**

**SPEAKER:**

"The `/gasless` page has one critical component—the Connect Button with Smart Wallet support:

**[VISUAL: Highlight the ConnectButton code]**

```tsx
<ConnectButton
  client={client}
  chain={liskSepolia}
  accountAbstraction={{
    chain: liskSepolia,
    sponsorGas: true, // ← This ONE line enables gasless!
  }}
/>
```

That's it. One prop: `sponsorGas: true`. That's all you need to enable completely gasless transactions.

When a user clicks this button for the first time, thirdweb:

1. Creates a Smart Wallet contract for them (gasless!)
2. Deploys it on-chain (still gasless!)
3. Gives them a wallet address

From then on, every transaction through this Smart Wallet is sponsored.

Now in our `SmartWalletDemo` component, we're calling your MyNFT contract from Week 1:

**[VISUAL: Show the handleGaslessMint function]**

```typescript
// Prepare the contract call to YOUR existing MyNFT!
const transaction = prepareContractCall({
  contract: nftContract, // Your MyNFT from Week 1
  method: "function mint(address to)",
  params: [targetAddress],
});

// Send it - automatically gasless!
const { transactionHash } = await sendTransaction({
  transaction,
  account,
});
```

That's it! We're minting NFTs from your Week 1 contract, completely gasless. No special code. No EIP-712 signatures. No relay management. thirdweb handles:

- Converting your transaction to a UserOperation
- Signing with your Smart Wallet
- Sending to their bundler
- Getting their paymaster to sponsor it
- Executing on YOUR MyNFT contract

The user pays **$0** to mint an NFT!

**[VISUAL: Live demo showing NFT mint succeeding with $0 gas, counter increasing]**

Look at that—your NFT collection growing without spending a single wei on gas. That's the power of ERC-4337 with existing contracts!"

---

## [8:45-9:30] TESTING & DEPLOYMENT

**[VISUAL: Split screen - code and terminal]**

**SPEAKER:**

"Testing time! Three terminals:

**[VISUAL: Show three terminal windows]**

```bash
# Terminal 1
yarn chain

# Terminal 2
yarn deploy

# Terminal 3
yarn start
```

Navigate to `localhost:3000/oracle` - connect your wallet and watch those prices update in real-time!

Then hit `/gasless` - connect with your Smart Wallet. The first time takes a moment as your Smart Wallet deploys.

See your existing MyNFT stats—Total Minted and how many You Own. Now click 'Mint NFT (Gas Free!)' and watch the magic happen.

Check your wallet—gas cost? **Zero**. Check Blockscout—transaction confirmed. Your NFT counter goes up. Magic!

For Lisk Sepolia deployment:

**[VISUAL: Show deployment commands]**

```bash
yarn deploy --network liskSepolia
yarn hardhat-verify --network liskSepolia ...
```

Remember—your MyToken and MyNFT are already deployed from Week 1! You only need to deploy and verify PriceFeed. Test everything on testnet, and you're ready to submit!

**[VISUAL: Show submission requirements checklist]**

Submit to speedrunlisk.xyz/sea-campaign/week/4 with:

- Your deployed frontend URL
- PriceFeed, MyToken, and MyNFT contract addresses
- Smart Wallet address
- A gasless NFT mint transaction hash

Bonus points for screenshots of minting NFTs with $0 gas!"

---

## [9:30-10:00] WRAP-UP & ADVANCED FEATURES

**[VISUAL: Final montage - oracle prices updating, NFT minting gaslessly]**

**SPEAKER:**

"And there you have it! You've built:

- ✅ Live oracle price feeds with RedStone
- ✅ Gasless NFT minting with ERC-4337
- ✅ A complete dApp journey from Week 1 to Week 4!

And here's the best part—you upgraded your Week 1 contracts to be gasless WITHOUT changing a single line of contract code. That's the power of ERC-4337!

This is just the beginning. With Smart Wallets you can also:

- **Gasless token transfers**: Let users send MyToken for free
- **Batch transactions**: Mint multiple NFTs in one UserOp
- **Session keys**: Pre-approve actions without signing each time
- **Social recovery**: Never lose your wallet to a lost seed phrase
- **Pay gas in tokens**: Let users pay in USDC or LSK instead of ETH

**[VISUAL: Show advanced code snippets briefly]**

Week 4 is complete! You've seen the full progression:

- Week 1: Deploy contracts
- Week 2: Add frontend
- Week 3: Display events
- Week 4: Make it all gasless!

You're now building with the same tech that major dApps use in production. Oracles bring real-world data. Account Abstraction removes friction. This is how we onboard the next billion users to Web3.

Get your submission in, join the LiskSEA Telegram if you have questions, and I'll see you in Week 5!

Build fast. Ship faster. Welcome to the future! 🚀"

**[VISUAL: Fade to end card with submission link, Telegram QR code, and #SpeedRunLiskSEA hashtag]**

---

## SCRIPT END

**Total Estimated Time: 10:00**
**Word Count: ~1,580 words**
**Speaking Pace: ~158 words/minute**

---

## PRODUCTION NOTES

### VISUAL ASSETS NEEDED

1. **Title Cards & Transitions**

   - Opening title card with Week 4 branding
   - Section transition animations
   - End card with submission info

2. **Diagrams & Graphics**

   - Oracle architecture flow (Real World → Oracle → Contract → dApp)
   - Push vs Pull oracle comparison table
   - EOA vs Smart Wallet transaction flow
   - ERC2771 vs ERC-4337 feature comparison

3. **Code Displays**

   - Syntax-highlighted code snippets
   - Side-by-side code comparisons
   - Terminal command displays
   - File creation animations
   - Timestamp validation override with 3 min vs 15 min comparison graphic

4. **Live Demos**

   - Price feeds updating in real-time
   - Wallet connection flow
   - Smart Wallet creation process
   - Gasless NFT minting execution
   - NFT counter incrementing
   - Blockscout transaction confirmation showing $0 gas

5. **UI Mockups**
   - Oracle page layout
   - Gasless page layout with NFT stats
   - Price display cards
   - NFT minting interface with counters

### B-ROLL SUGGESTIONS

- Cryptocurrency price charts with live updates
- NFT gallery views showing minted tokens
- Blockscout explorer views
- MetaMask/wallet connection animations
- Smart Wallet creation animation
- NFT counter increasing animations
- Transaction success notifications
- Gas fee comparisons (showing $0 vs traditional costs)
- Developer typing code sequences
- Terminal command executions
- MyNFT and MyToken contracts from Week 1

### SCREEN RECORDINGS NEEDED

1. **Development Environment**

   - VS Code with file explorer visible
   - Multiple terminal windows
   - File creation sequences
   - Code editing with syntax highlighting

2. **Frontend Demos**

   - Browser showing localhost:3000
   - Navigation between pages
   - Wallet connection flows
   - Price updates happening live
   - NFT minting with counters updating
   - Transaction submissions with $0 gas cost

3. **Deployment Process**
   - Terminal showing deployment commands
   - Contract verification on Blockscout
   - Successful deployment confirmations

### MUSIC & AUDIO

**Background Music:**

- Genre: Upbeat tech/electronic
- Tempo: 120-130 BPM
- Mood: Energetic but focused
- Volume: Lower during technical explanations, slightly higher during transitions

**Sound Effects:**

- Success chimes for completed steps
- Subtle transition whooshes
- Click sounds for UI interactions
- "Cha-ching" for $0 gas reveals

### EDITING NOTES

**Pacing:**

- Keep intro punchy (under 45 seconds)
- Allow code snippets to remain on screen 2-3 seconds for readability
- Use quick cuts during demonstrations
- Slow down for key concept explanations

**Text Overlays:**

- Key terms in bold when first mentioned
- Code snippets with syntax highlighting
- Bullet points for checklists
- Highlighted important values (like $0 gas)

**Transitions:**

- Smooth fades between sections
- Quick cuts during same-section content
- Animated wipes for major section changes

### CALL-TO-ACTION ELEMENTS

**Throughout Video:**

- "Like & Subscribe" reminder at 2:00
- "Comment your questions below" at 5:00
- "Join the Telegram" mention at 7:00

**End Screen (9:30-10:00):**

- Submission form link
- Next week teaser
- Social media hashtags
- Telegram QR code
- GitHub repository link

### ACCESSIBILITY

- Include closed captions throughout
- High contrast text for readability
- Clear pronunciation of technical terms
- Visual representations of all key concepts

### THUMBNAIL SUGGESTIONS

**Option 1:** Split design showing oracle symbol on left, NFT + $0 gas on right
**Option 2:** NFT being minted with "GAS: $0.00" overlay
**Option 3:** Before/after showing NFT minting costs (traditional vs gasless)
**Option 4:** Code editor with highlighted "sponsorGas: true" line and NFT image

**Text Overlay:** "Mint NFTs for FREE" or "Gasless NFT Minting + Oracles" or "$0 GAS FEES!"

---

## ALTERNATIVE VERSIONS

### 5-Minute Quick Version

Focus on:

- 0:00-1:00 Hook and overview
- 1:00-2:30 Oracle contract only
- 2:30-4:00 Account Abstraction explanation
- 4:00-4:45 Quick demo
- 4:45-5:00 Call to action

### Extended 15-Minute Version

Add:

- Deeper dive into RedStone architecture
- Live coding sections
- Troubleshooting common errors
- More advanced features demo
- Q&A segment

### Tutorial Series Version

Break into 3 videos:

1. **Part 1:** Understanding & Building Oracles (5 min)
2. **Part 2:** Understanding & Building Account Abstraction (5 min)
3. **Part 3:** Deployment, Testing & Submission (3 min)

---

## ENGAGEMENT HOOKS

**Opening Questions:**

- "Have you ever wanted to build a dApp that doesn't require users to own ETH?"
- "What if your existing NFT contracts could become gasless without any code changes?"

**Mid-Video Engagement:**

- "Comment below which oracle you've used before!"
- "Drop a 🚀 if you want to see gasless token transfers next!"
- "Type 'GASLESS' if you're excited about $0 NFT minting!"

**Closing CTA:**

- "Show me your gasless NFT mints in the Telegram group!"
- "Tag @LiskSEA on Twitter with your $0 gas NFT transactions!"
- "Share screenshots of your growing NFT collection with zero gas fees!"

---

## KEYWORDS FOR SEO

Primary: Web3 development, blockchain tutorial, Lisk tutorial, oracle integration, gasless NFT minting

Secondary: ERC-4337, Account Abstraction, RedStone oracle, thirdweb, Smart Wallets, gasless transactions, NFT tutorial, Scaffold-ETH

Long-tail: How to mint NFTs for free, gasless NFT minting tutorial, ERC-4337 NFT implementation, RedStone oracle tutorial, Lisk Sepolia NFT deployment, free NFT minting Web3, fix TimestampFromTooLongFuture error, RedStone timestamp validation, oracle timestamp error fix

---

_Video script created for SpeedRun Lisk Week 4 tutorial. Target duration: 10 minutes. Target audience: Intermediate Web3 developers._
