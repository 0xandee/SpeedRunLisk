# Week 2 Tutorial Video Script - Frontend Connect

## Total Duration: 12 Minutes (Extended for Educational Content)

### Pre-Recording Setup Checklist

- [ ] **COMPLETED Week 1 Challenge** with deployed and verified contracts
- [ ] Contract addresses from Week 1 handy (MyToken and MyNFT)
- [ ] Existing Challenge 1 scaffold-lisk project ready
- [ ] MetaMask configured with Lisk Sepolia from Week 1
- [ ] Code editor open (VS Code recommended)
- [ ] Terminal ready in Challenge 1 directory
- [ ] Lisk Sepolia ETH remaining from Week 1

---

## 🎬 INTRODUCTION & CONTEXT (0:00 - 1:00)

**[SCREEN: Show SpeedRunLisk.xyz Week 2 page]**

**Script:**
"Welcome to Week 2 of the Lisk SpeedRun Challenge! I'm excited to walk you through building a frontend that connects to the smart contracts you deployed and verified in Week 1.

**[SCREEN: Show the tutorial markdown file]**

⚠️ **IMPORTANT**: Before we begin, make sure you've completed Week 1 and have your deployed MyToken and MyNFT contract addresses ready. This tutorial builds directly on top of Week 1's foundation.

**[SCREEN: Show Week 1 contracts on Lisk Sepolia Blockscout]**

In Week 1, you deployed and verified ERC20 token and ERC721 NFT contracts on Lisk Sepolia. Today, we're going to build a beautiful React frontend that connects to those existing contracts and lets users interact with them through their web3 wallets.

**[SCREEN: Show final demo of what we'll build - 3 cards with token balance, transfer, and NFT minting]**

But this isn't just a copy-paste tutorial! We'll dive deep into understanding how Web3 frontend development works. You'll learn about Scaffold-Lisk's powerful hooks, the architecture of Web3 applications, and best practices for production dApps.

By the end of this tutorial, you'll not only have a fully functional dApp with wallet integration, token transfers, NFT minting deployed live on Vercel, but you'll also understand the 'why' behind every piece of code. Let's get started!"

---

## 🚀 CHECKPOINT 0: SETUP (1:00 - 2:30)

**[SCREEN: Terminal window in existing ch1-deploy-verify directory]**

**Script:**
"Since you already completed Week 1, we'll use your existing Scaffold-Lisk project. Make sure you have your contract addresses from Week 1 handy - you'll need both your MyToken and MyNFT contract addresses that are already deployed and verified on Lisk Sepolia.

**[SCREEN: Show existing project directory]**

Navigate to your Challenge 1 project directory:

**[TYPE IN TERMINAL:]**

```bash
cd ch1-deploy-verify
```

**[SCREEN: Show project structure in file explorer - already familiar from Week 1]**

Your Scaffold-Lisk environment is already set up with:

- Next.js frontend with React components
- Hardhat with your deployed contracts
- RainbowKit for wallet connections (already configured for Lisk Sepolia)
- Pre-built Web3 hooks for contract interactions

Let's start the development server:

**[TYPE IN TERMINAL:]**

```bash
yarn start
```

**[SCREEN: Show localhost:3000 opening with existing scaffold interface]**

Perfect! Your development environment is ready, and we can see it's already configured for Lisk Sepolia from Week 1. Now let's connect your deployed contracts to the frontend."

---

## ⚙️ CHECKPOINT 1: CONFIGURE CONTRACTS (2:30 - 4:30)

**[SCREEN: VS Code with file explorer open]**

**Script:**
"Great! Your contract files are already in place from Week 1. Let's verify they're there and ready for our frontend to use.

**[NAVIGATE: packages/hardhat/contracts/]**

**[SHOW EXISTING FILES: MyToken.sol and MyNFT.sol]**

Perfect! Your MyToken.sol and MyNFT.sol contracts are already here from Week 1. Scaffold-Lisk automatically generates TypeScript ABIs from these contract files, which our frontend components will use to interact with your deployed contracts.

**[HIGHLIGHT THE EXISTING FILES]**

These are the exact contracts you deployed and verified on Lisk Sepolia in Week 1, so our frontend will be able to connect to them seamlessly."

**[NAVIGATE: packages/nextjs/scaffold.config.ts]**

Let's verify our network configuration is set for Lisk Sepolia:

**[SHOW the targetNetworks line:]**

```typescript
targetNetworks: [chains.liskSepolia],
```

**[HIGHLIGHT AND EXPLAIN:]**
Perfect! This is already configured from Week 1 to connect to Lisk Sepolia.

**[NAVIGATE: packages/hardhat/deployments/liskSepolia/]**

Let's check your deployment artifacts from Week 1:

**[SHOW the deployment files: MyToken.json and MyNFT.json]**

Excellent! Your contract deployment artifacts are already here, containing the addresses and ABIs that our frontend will automatically use to connect to your deployed contracts.

**[HIGHLIGHT ADDRESS in one of the JSON files]**

The frontend will automatically read these deployment files to know which contracts to connect to on Lisk Sepolia."

---

## 🦊 CHECKPOINT 2: WALLET INTEGRATION (4:30 - 5:30)

**[SCREEN: Show browser with localhost:3000]**

**Script:**
"Excellent! Now let's test our wallet integration. Your wallet should already be configured for Lisk Sepolia from Week 1, and Scaffold-Lisk comes pre-configured with RainbowKit for beautiful wallet connection UI.

**[SCREEN: Show MetaMask extension - already configured for Lisk Sepolia]**

Your MetaMask is already configured for Lisk Sepolia from Week 1, so we can jump straight into testing the connection.

**[SCREEN: Back to localhost:3000]**

Let's connect our wallet. Click 'Connect Wallet' in the top right.

**[DEMONSTRATE: Clicking connect wallet, selecting MetaMask, approving connection]**

Perfect! You should see your address and ETH balance displayed. You should still have some Lisk Sepolia ETH remaining from Week 1 for gas fees.

**[SHOW: Wallet connected state with address visible]**

Great! Our wallet connection is working. Now before we jump into building components, let me explain the powerful tools that make Web3 development so much easier!"

---

## 🧠 UNDERSTANDING WEB3 ARCHITECTURE (5:30 - 6:30)

**[SCREEN: VS Code with tutorial open showing architecture diagram]**

**Script:**
"Before we start coding, it's crucial to understand how Web3 frontend development works. Let me show you the architecture we'll be working with.

**[SCREEN: Show the data flow diagram from tutorial]**

Here's how data flows in our dApp:

1. Your deployed contracts live on Lisk Sepolia blockchain
2. RPC providers like Alchemy connect us to the blockchain
3. Wagmi hooks handle the low-level blockchain interactions
4. Scaffold-Lisk hooks wrap Wagmi with developer-friendly features
5. React components display the data in beautiful UI

**[SCREEN: Show useScaffoldContractRead example in tutorial]**

The magic happens with these hooks. Instead of manually managing contract ABIs, addresses, and complex blockchain calls, `useScaffoldContractRead` automatically:

- Finds your contract from deployment files
- Provides TypeScript safety
- Watches for real-time blockchain changes
- Handles error states and loading

**[SCREEN: Show useScaffoldContractWrite example]**

And `useScaffoldContractWrite` handles transactions:

- Manages the entire transaction lifecycle
- Shows user notifications automatically
- Validates network connection
- Provides loading states for your UI

**[SCREEN: Show wallet connection flow]**

For wallet connections, RainbowKit gives us:

- Beautiful connection UI
- Support for multiple wallets
- Automatic network switching
- Secure connection management

This architecture means you can focus on building great user experiences instead of wrestling with blockchain complexity. Now let's put it into practice!"

---

## 🪙 CHECKPOINT 3: TOKEN INTERFACE (6:30 - 8:00)

**[SCREEN: VS Code]**

**Script:**
"Let's build our token interface. We'll create two components - one to display your token balance, and another to transfer tokens.

**[CREATE DIRECTORY: packages/nextjs/components/example-ui/]**
**[CREATE FILE: TokenBalance.tsx]**

I'll create our TokenBalance component:

**[TYPE KEY PARTS - explain as you go:]**

```tsx
export const TokenBalance = () => {
  const { address: connectedAddress } = useAccount();

  const { data: tokenBalance } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });
```

**[PAUSE and HIGHLIGHT useAccount:]**
First, `useAccount` from Wagmi gives us the connected wallet address. This hook automatically updates when users connect or disconnect their wallet.

**[HIGHLIGHT useScaffoldContractRead:]**
The magic happens here! `useScaffoldContractRead` automatically:

- Finds our MyToken contract from the deployment files
- Calls the balanceOf function with the user's address
- Returns the data in a React-friendly format
- Watches the blockchain for changes and updates automatically

**[HIGHLIGHT the data formatting part:]**

```tsx
{
  tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(4) : "0.0000";
}
```

**[EXPLAIN:]**
See this division by 1e18? That's converting from Wei (the smallest token unit) to human-readable format. ERC20 tokens use 18 decimal places, just like Ethereum.

**[CONTINUE TYPING - highlight the UI parts:]**
The component shows your token balance in a beautiful card format using DaisyUI styling - notice how the UI automatically updates when the blockchain data changes!"

**[CREATE FILE: TokenTransfer.tsx]**

Now for the transfer component:

**[TYPE AND HIGHLIGHT key parts:]**

```tsx
const { writeContractAsync: writeMyTokenAsync } = useScaffoldContractWrite("MyToken");

const handleTransfer = async () => {
  await writeMyTokenAsync({
    functionName: "transfer",
    args: [recipient, parseEther(amount)],
  });
};
```

**[PAUSE and HIGHLIGHT useScaffoldContractWrite:]**
`useScaffoldContractWrite` is our transaction powerhouse! It automatically:

- Validates that the user is on the correct network
- Prompts the user's wallet for transaction approval
- Shows loading states while the transaction is pending
- Displays success or error notifications
- Handles all the complex transaction lifecycle management

**[HIGHLIGHT parseEther:]**
`parseEther` converts "1.5" to "1500000000000000000" - that's Wei format that the blockchain understands.

**[HIGHLIGHT the input validation:]**

```tsx
if (!recipient || !amount) {
  notification.error("Please fill in all fields");
  return;
}
```

Always validate user input before sending transactions! This prevents empty or invalid transactions and provides clear feedback to users.

**[SHOW: Both components completed in file explorer]**

Now let's update our main page to display these components."

---

## 🎨 CHECKPOINT 4: NFT INTERFACE (8:00 - 9:30)

**[SCREEN: Continue in VS Code]**

**Script:**
"Now let's build our NFT interface. This will show NFT collection statistics and allow minting.

**[CREATE FILE: NFTCollection.tsx]**

**[TYPE AND HIGHLIGHT key functionality:]**

```tsx
const { data: totalSupply } = useScaffoldContractRead({
  contractName: "MyNFT",
  functionName: "totalSupply",
});

const { data: userBalance } = useScaffoldContractRead({
  contractName: "MyNFT",
  functionName: "balanceOf",
  args: [connectedAddress],
});
```

**[PAUSE and HIGHLIGHT multiple reads:]**
Notice we're making multiple contract reads simultaneously! Each `useScaffoldContractRead` hook works independently:

- `totalSupply` tells us how many NFTs exist in the entire collection
- `balanceOf` tells us how many NFTs the current user owns
- Both update automatically when new NFTs are minted

**[HIGHLIGHT the data type handling:]**

```tsx
{
  totalSupply?.toString() || "0";
}
```

Smart contracts return BigNumber types, so we convert them to strings for display. The optional chaining (?.) prevents errors if data hasn't loaded yet.

**[HIGHLIGHT the minting function:]**

```tsx
const handleMint = async () => {
  const targetAddress = mintToAddress || connectedAddress;
  await writeMyNFTAsync({
    functionName: "mint",
    args: [targetAddress],
  });
};
```

**[EXPLAIN the smart logic:]**
This minting logic is clever - if no address is specified, it mints to the current user. Otherwise, it mints to the specified address. This flexibility makes the component more user-friendly!

**[NAVIGATE: packages/nextjs/app/page.tsx]**

Now let's update our main page to include all three components:

**[UPDATE page.tsx - show the three-card layout:]**

```tsx
import { NFTCollection } from "~~/components/example-ui/NFTCollection";
import { TokenBalance } from "~~/components/example-ui/TokenBalance";
import { TokenTransfer } from "~~/components/example-ui/TokenTransfer";
```

**[SHOW: The three cards laid out horizontally]**

**[SAVE ALL FILES]**

**[SCREEN: Switch to browser, refresh localhost:3000]**

Let's see our dApp in action! You should now see three beautiful cards:

1. Token Balance - showing your LSEA token balance
2. Token Transfer - for sending tokens to other addresses
3. NFT Collection - showing collection stats and minting

**[DEMONSTRATE: Each component working - show token balance loading from deployed contract, try a small transfer, mint an NFT on live contract]**

Amazing! Our frontend is now fully connected to your deployed smart contracts from Week 1. You can see real data from your live contracts on Lisk Sepolia!"

---

## 💡 ADVANCED DEVELOPMENT TIPS (9:30 - 10:30)

**[SCREEN: Show tutorial section on development tips]**

**Script:**
"Before we deploy, let me share some crucial development tips that will make you a better Web3 developer.

**[SCREEN: Show debugging example in VS Code]**

**Debugging Contract Interactions:**
When things go wrong, add console.logs to understand what's happening:

```tsx
const { data: balance, error, isLoading } = useScaffoldContractRead({...});
console.log("Balance data:", balance);
console.log("Error:", error);
```

**[SCREEN: Show error handling patterns]**

**Error Handling Best Practices:**
Always handle different types of errors:

```tsx
try {
  await writeMyTokenAsync({...});
} catch (error) {
  if (error.code === 'ACTION_REJECTED') {
    notification.error("Transaction rejected by user");
  } else {
    notification.error("Transaction failed: " + error.message);
  }
}
```

**[SCREEN: Show input validation example]**

**Security Considerations:**
Never trust user input! Always validate:

```tsx
// Check for valid Ethereum address
if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
  notification.error("Invalid address format");
  return;
}
```

**[SCREEN: Show performance optimization tip]**

**Performance Tips:**

- Use specific hooks for each data point to minimize re-renders
- Implement loading states for better user experience
- Consider gas costs - NFT minting is more expensive than token transfers

These patterns will serve you well in production dApps!"

---

## 🚀 CHECKPOINT 5: DEPLOYMENT (10:30 - 11:30)

**[SCREEN: Terminal]**

**Script:**
"Now let's deploy our dApp to production so the world can use it! We'll use Vercel for this.

First, let's commit our changes to Git:

**[TYPE IN TERMINAL:]**

```bash
git add .
git commit -m "feat: add Web3 frontend for token and NFT contracts"
git push origin main
```

**[SCREEN: Switch to browser, navigate to vercel.com]**

Now go to Vercel.com and connect your GitHub repository:

**[DEMONSTRATE: Importing project from GitHub]**

1. Click 'New Project'
2. Import your GitHub repository
3. Configure build settings (default Next.js settings work perfectly)

**[SHOW: Environment variables configuration]**

If you're using custom API keys, add them in the Environment Variables section:

- NEXT_PUBLIC_ALCHEMY_API_KEY
- NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

**[CLICK: Deploy]**

**[SHOW: Deployment process]**

While it's deploying, let me mention - you could also deploy to Netlify using a similar process, or even to other platforms like Render or Railway.

**[SHOW: Deployment complete with live URL]**

Perfect! Let's test our live dApp:

**[NAVIGATE: To the deployed URL]**
**[DEMONSTRATE: Connecting wallet on production, testing one function with deployed contracts]**

Everything works perfectly! Our dApp is now live and anyone with a web3 wallet can interact with the smart contracts you deployed and verified in Week 1."

---

## 🎯 CONCLUSION & SUBMISSION (11:30 - 12:00)

**[SCREEN: Show speedrunlisk.xyz submission page]**

**Script:**
"Congratulations! You've successfully built and deployed a full-stack Web3 application. Let's submit your challenge.

Go to speedrunlisk.xyz/sea-campaign/week/2 and submit:

**[SHOW submission form fields:]**

1. Your deployed frontend URL from Vercel
2. Your MyToken contract address from Week 1
3. Your MyNFT contract address from Week 1
4. Your GitHub repository link

**[QUICK TROUBLESHOOTING TIPS:]**
If you run into issues:

- Make sure your wallet is on Lisk Sepolia network
- Verify your contract addresses are correct
- Check that you have enough ETH for gas fees
- Join our Telegram community for help: @LiskSEA

**[SCREEN: Show final working dApp]**

You've accomplished so much more than just building a dApp! You now understand:

**Technical Skills:**

- Web3 frontend development with React and Next.js
- Wallet integration using RainbowKit and Wagmi
- Smart contract interaction with Scaffold-Lisk hooks
- Production deployment with Vercel

**Core Concepts:**

- How Web3 data flows from blockchain to UI
- The architecture of decentralized applications
- Security best practices for Web3 frontends
- Performance optimization for blockchain interactions

**Development Practices:**

- Debugging Web3 applications effectively
- Error handling for transaction failures
- Input validation and user experience design
- Real-time data updates with blockchain watching

This deep understanding gives you a solid foundation for building production-ready dApps. You're not just copying code - you understand the 'why' behind every pattern.

In Week 3, we'll explore indexing and displaying blockchain data with The Graph.

Thanks for following along, and I'll see you in the next challenge!"

---

## 📝 Recording Notes

### Screen Recording Setup:

- **Primary Screen**: Browser with localhost:3000 and deployed site
- **Secondary Screen**: VS Code with project files
- **Third Window**: Terminal for commands

### Key Moments to Emphasize:

- **1:15** - Week 1 prerequisite reminder & educational focus
- **2:45** - Existing deployment artifacts verification
- **5:15** - Wallet connection success (already configured)
- **6:00** - Architecture explanation with visual diagram
- **6:45** - Hook explanations with real examples
- **7:30** - Data formatting and Wei conversion explanation
- **8:15** - Transaction lifecycle and error handling
- **9:00** - Multiple contract reads and data type handling
- **9:45** - Real-time blockchain data updates demonstration
- **10:00** - Advanced debugging and security tips
- **11:15** - Live deployment working
- **11:45** - Educational summary of concepts learned

### Visual Cues:

- Use zoom-in effects when showing code details and explanations
- Highlight important lines with cursor/selection during explanations
- Show the architecture diagram clearly during hook explanations
- Demonstrate loading states and transaction confirmations
- Display success notifications and real-time updates clearly
- Emphasize the educational breakdowns in the tutorial
- Show console.log outputs during debugging demonstrations

### Backup Plan:

If live demo fails:

- Have pre-recorded screenshots/GIFs ready
- Prepare a working deployment URL to showcase
- Keep sample transaction hashes for reference
