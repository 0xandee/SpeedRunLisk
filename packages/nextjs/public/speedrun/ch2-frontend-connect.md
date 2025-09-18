# Connect Your Contracts to Frontend

📚 This tutorial builds upon [Challenge 1](/speedrun/ch1-deploy-verify.md) where you deployed and verified ERC20 token and ERC721 NFT contracts on Lisk Sepolia.

🌟 You'll now connect these smart contracts to a React/Next.js frontend with wallet integration, allowing users to interact with your deployed contracts through a beautiful Web3 interface!

🚀 The final deliverable is a fully functional dApp deployed to Vercel/Netlify that connects to your verified contracts, enabling token transfers and NFT minting with proper wallet integration.

---

## Challenge Overview

Connect your smart contracts from Week 1 to a React/Next.js frontend with wallet integration.

## Key Requirements

- Create a React/Next.js application using Scaffold-Lisk
- Connect to user's wallet (recommended using Rabby Wallet)
- Display token balance and NFT ownership
- Allow users to mint NFTs and transfer tokens
- Deploy frontend to Vercel/Netlify

## Learning Objectives

- Web3 frontend development
- Wallet integration patterns
- Contract interaction via JavaScript
- State management for Web3 apps

💬 Meet other builders working on this challenge and get help in the [@LiskSEA Telegram](https://t.me/LiskSEA)!

---

## Checkpoint 0: 📦 Prerequisites 📚

**⚠️ Important: You must complete [Challenge 1](/speedrun/ch1-deploy-verify.md) first!**

Before you begin, ensure you have:

- ✅ **Completed Challenge 1**: Deployed and verified MyToken and MyNFT contracts
- ✅ **Contract addresses**: Your deployed contract addresses from Challenge 1
- ✅ **Verified contracts**: Both contracts verified on [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com)
- ✅ **Scaffold-Lisk setup**: Your existing Scaffold-Lisk environment from Challenge 1

> Navigate to your Challenge 1 project directory and start the development server:

```sh
cd ch1-deploy-verify
yarn start
```

📱 Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Checkpoint 1: 🔧 Configure Your Contracts

> ✏️ Let's connect your deployed contracts to the frontend!

### Import Your Contract ABIs

Your contracts from Challenge 1 are already deployed and verified. The Scaffold-Lisk framework will automatically generate TypeScript ABIs from your contract files when you build the project.

### Verify Network Configuration

Your `packages/nextjs/scaffold.config.ts` should already be configured for Lisk Sepolia from Challenge 1. Verify it contains:

```typescript
// The networks on which your DApp is live
targetNetworks: [chains.liskSepolia],
```

> If not already configured, update the targetNetworks to point to Lisk Sepolia.

### Connect to Your Deployed Contracts

Your contracts from Challenge 1 are already deployed to Lisk Sepolia. The frontend will automatically connect to them using the contract addresses from your previous deployment.

> If you need to update contract addresses, check `packages/hardhat/deployments/liskSepolia/` directory for your deployment artifacts.

> 💡 **Key Concept: Contract Discovery**
>
> Scaffold-Lisk automatically finds your contracts by:
> 1. Reading deployment artifacts from `deployments/[network]/`
> 2. Generating TypeScript types from contract ABIs
> 3. Making contracts available via `useScaffoldContract*` hooks
>
> This means you don't need to manually copy-paste contract addresses or ABIs!

---

## Checkpoint 2: 🦊 Wallet Integration & Connection

> 🔗 Let's set up wallet connections using RainbowKit!

Scaffold-Lisk comes pre-configured with RainbowKit for wallet connections. Let's verify and test the wallet integration.

### Test Wallet Connection

Your wallet should already be configured for Lisk Sepolia from Challenge 1.

1. **Test Connection**:
   - Click "Connect Wallet" in the top right
   - Select your wallet and connect your account
   - You should see your address and balance displayed

> ⛽️ Ensure you have Lisk Sepolia ETH for gas fees (you should have some remaining from Challenge 1).

> 🔒 **Key Concept: Wallet Security**
>
> When you connect your wallet:
> - **Read permissions**: dApp can see your address and balance
> - **Transaction approval**: You must approve each transaction individually
> - **Private keys**: Never shared with the dApp (stay in your wallet)
> - **Network switching**: Wallet can prompt you to switch networks automatically
>
> Always verify transaction details before signing!

---

## Understanding Scaffold-Lisk Hooks 🧠

> 🔧 Let's understand the powerful hooks that make Web3 development easier!

Before building our components, it's important to understand the key hooks that Scaffold-Lisk provides to simplify blockchain interactions:

### `useScaffoldContractRead` Hook

This hook automatically handles reading data from your smart contracts:

```typescript
const { data: tokenBalance } = useScaffoldContractRead({
  contractName: "MyToken",      // Contract name from your deployment
  functionName: "balanceOf",    // Contract function to call
  args: [userAddress],          // Function arguments
});
```

**What it does:**
- ✅ **Auto-loads contract**: Finds your contract ABI and address automatically
- ✅ **Real-time updates**: Watches for changes and updates data automatically
- ✅ **Type safety**: Provides TypeScript types for function arguments and return values
- ✅ **Error handling**: Built-in error states and loading indicators
- ✅ **Network aware**: Automatically connects to the correct network

### `useScaffoldContractWrite` Hook

This hook handles writing transactions to your smart contracts:

```typescript
const { writeContractAsync: writeMyTokenAsync } = useScaffoldContractWrite("MyToken");

// Later in your component
await writeMyTokenAsync({
  functionName: "transfer",
  args: [recipient, amount],
});
```

**What it does:**
- ✅ **Transaction management**: Handles the entire transaction lifecycle
- ✅ **User notifications**: Shows success/error messages automatically
- ✅ **Network validation**: Ensures user is on correct network before sending
- ✅ **Gas estimation**: Estimates gas costs before transaction
- ✅ **Loading states**: Provides `isMining` state for UI feedback

### `useAccount` Hook (from Wagmi)

This hook manages wallet connection state:

```typescript
const { address: connectedAddress } = useAccount();
```

**What it provides:**
- ✅ **Connection status**: Whether wallet is connected
- ✅ **User address**: The connected wallet address
- ✅ **Account info**: Balance, ENS name, and other account details

### Key Benefits of These Hooks

🎯 **Simplified Development**: No need to manually manage contract ABIs, addresses, or connection logic
📱 **Better UX**: Built-in loading states, error handling, and user notifications
🔒 **Type Safety**: Full TypeScript support prevents common errors
⚡ **Performance**: Automatic caching and optimized re-renders
🌐 **Multi-network**: Easy switching between different blockchain networks

---

## Architecture Overview 🏗️

> 🌊 Understanding the data flow from blockchain to your UI!

Before we build components, let's understand how everything connects:

### Web3 dApp Architecture Flow

```
🔗 Blockchain (Lisk Sepolia)
     ↕️
📡 RPC Provider (Alchemy/Infura)
     ↕️
🧠 Wagmi Hooks (useContractRead/Write)
     ↕️
🔧 Scaffold-Lisk Hooks (useScaffoldContract*)
     ↕️
⚛️  React Components (TokenBalance, etc.)
     ↕️
👤 User Interface (Your dApp)
```

### Key Interactions Explained

**1. Wallet Connection Flow:**
```typescript
// User clicks "Connect Wallet" → RainbowKit modal opens
// → User selects wallet → Wallet prompts for connection
// → useAccount() hook provides connected address
// → Components can now interact with blockchain
```

**2. Reading Contract Data:**
```typescript
// Component mounts → useScaffoldContractRead() calls contract
// → Blockchain returns data → Hook updates component state
// → UI shows real-time balance/NFT count
// → Hook continues watching for changes
```

**3. Writing to Contracts (Transactions):**
```typescript
// User fills form → clicks button → useScaffoldContractWrite()
// → Wallet prompts for signature → Transaction sent to mempool
// → Block confirmations → Success notification → UI updates
```

### Component Responsibilities

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **TokenBalance** | Display token info | Real-time balance, token name/symbol |
| **TokenTransfer** | Send tokens | Input validation, transaction handling |
| **NFTCollection** | Mint & display NFTs | Total supply, user balance, minting |

### State Management Pattern

Each component follows this pattern:
1. **Check wallet connection** (`useAccount`)
2. **Read contract data** (`useScaffoldContractRead`)
3. **Handle user input** (React state)
4. **Write to contract** (`useScaffoldContractWrite`)
5. **Show feedback** (loading, success, error)

---

## Checkpoint 3: 🪙 Build Token Interface

> 💰 Create components to display and interact with your ERC20 token!

### Create Token Balance Component

Create `packages/nextjs/components/example-ui/TokenBalance.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const TokenBalance = () => {
  const { address: connectedAddress } = useAccount();

  const { data: tokenBalance } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: tokenSymbol } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: tokenName } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "name",
  });

  if (!connectedAddress) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Token Balance</h2>
          <p>Please connect your wallet to view token balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          {tokenName} ({tokenSymbol})
        </h2>
        <div className="stats">
          <div className="stat">
            <div className="stat-title">Your Balance</div>
            <div className="stat-value text-primary">
              {tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(4) : "0.0000"}
            </div>
            <div className="stat-desc">{tokenSymbol}</div>
          </div>
        </div>
        <div className="card-actions justify-end">
          <Address address={connectedAddress} />
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the TokenBalance Component

Let's break down this component to understand how it works:

#### **Key Imports Explained**
```typescript
import { useAccount } from "wagmi";                    // Wallet connection state
import { Address, Balance } from "~~/components/scaffold-eth";  // Pre-built UI components
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth"; // Contract reading hook
```

#### **Data Fetching Pattern**
```typescript
// 1. Get connected wallet address
const { address: connectedAddress } = useAccount();

// 2. Read token balance for connected address
const { data: tokenBalance } = useScaffoldContractRead({
  contractName: "MyToken",
  functionName: "balanceOf",
  args: [connectedAddress],  // Pass user's address as argument
});

// 3. Read token metadata (name & symbol)
const { data: tokenSymbol } = useScaffoldContractRead({
  contractName: "MyToken",
  functionName: "symbol",
});
```

**🔄 Real-time Updates**: These hooks automatically watch the blockchain and update when:
- User receives tokens
- User sends tokens
- New blocks are mined

#### **Conditional Rendering Pattern**
```typescript
if (!connectedAddress) {
  return <div>Please connect your wallet</div>;
}
```
This ensures the component only tries to fetch data when a wallet is connected.

#### **Data Display & Formatting**
```typescript
// Convert from Wei (18 decimals) to human-readable format
{tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(4) : "0.0000"}
```

**💡 Why divide by 1e18?** ERC20 tokens store values in "Wei" (smallest unit). Most tokens use 18 decimal places, so we divide by 10^18 to show the actual token amount.

#### **UI Framework (DaisyUI)**
The component uses DaisyUI classes for styling:
- `card w-96 bg-base-100 shadow-xl`: Creates a styled card container
- `stat`, `stat-title`, `stat-value`: Statistics display components
- `text-primary`: Theme-aware color styling

### Create Token Transfer Component

Create `packages/nextjs/components/example-ui/TokenTransfer.tsx`:

```tsx
"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const TokenTransfer = () => {
  const { address: connectedAddress } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { writeContractAsync: writeMyTokenAsync } = useScaffoldContractWrite("MyToken");

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      notification.error("Please fill in all fields");
      return;
    }

    try {
      await writeMyTokenAsync({
        functionName: "transfer",
        args: [recipient, parseEther(amount)],
      });

      notification.success("Token transfer successful!");
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      notification.error("Transfer failed. Please try again.");
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Transfer Tokens</h2>
          <p>Please connect your wallet to transfer tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Transfer Tokens</h2>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Recipient Address</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            className="input input-bordered w-full max-w-xs"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Amount</span>
          </label>
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered w-full max-w-xs"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={handleTransfer} disabled={!recipient || !amount}>
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the TokenTransfer Component

This component demonstrates transaction handling and user input management:

#### **State Management for User Input**
```typescript
const [recipient, setRecipient] = useState("");  // Recipient wallet address
const [amount, setAmount] = useState("");        // Token amount to send
```

#### **Contract Write Hook Setup**
```typescript
const { writeContractAsync: writeMyTokenAsync } = useScaffoldContractWrite("MyToken");
```
This gives us a function to call contract methods that modify state (require transactions).

#### **Transaction Flow Breakdown**
```typescript
const handleTransfer = async () => {
  // 1. Input validation
  if (!recipient || !amount) {
    notification.error("Please fill in all fields");
    return;
  }

  try {
    // 2. Send transaction
    await writeMyTokenAsync({
      functionName: "transfer",
      args: [recipient, parseEther(amount)],  // Convert to Wei
    });

    // 3. Success feedback
    notification.success("Token transfer successful!");
    setRecipient("");  // Clear form
    setAmount("");
  } catch (error) {
    // 4. Error handling
    notification.error("Transfer failed. Please try again.");
  }
};
```

#### **Key Concepts Explained**

**🔄 parseEther() Function:**
```typescript
parseEther(amount)  // Converts "1.5" → "1500000000000000000"
```
This converts human-readable amounts to Wei (blockchain's smallest unit).

**⛽ Transaction Lifecycle:**
1. User clicks "Transfer" → Wallet prompts for signature
2. User signs → Transaction sent to mempool
3. Miners include transaction in block → Confirmation
4. `useScaffoldContractWrite` automatically shows notifications

**✅ Input Validation:**
- Button disabled until both fields filled
- Client-side validation before sending transaction
- Server-side validation happens in smart contract

#### **User Experience Features**
- **Real-time button state**: Disabled when form incomplete
- **Automatic notifications**: Success/error messages handled automatically
- **Form reset**: Clears inputs after successful transfer
- **Error resilience**: Catches and displays transaction failures

#### **Security Considerations**
- Input validation prevents empty transactions
- `parseEther` prevents decimal precision errors
- Smart contract enforces balance checks
- User must explicitly sign each transaction

---

## Checkpoint 4: 🎨 Build NFT Interface

> 🖼️ Create components to display and mint your NFTs!

### Create NFT Collection Component

Create `packages/nextjs/components/example-ui/NFTCollection.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const NFTCollection = () => {
  const { address: connectedAddress } = useAccount();
  const [mintToAddress, setMintToAddress] = useState("");

  const { data: nftName } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "name",
  });

  const { data: nftSymbol } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "symbol",
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "totalSupply",
  });

  const { data: userBalance } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { writeContractAsync: writeMyNFTAsync } = useScaffoldContractWrite("MyNFT");

  const handleMint = async () => {
    const targetAddress = mintToAddress || connectedAddress;

    if (!targetAddress) {
      notification.error("Please connect wallet or specify address");
      return;
    }

    try {
      await writeMyNFTAsync({
        functionName: "mint",
        args: [targetAddress],
      });

      notification.success("NFT minted successfully!");
      setMintToAddress("");
    } catch (error) {
      console.error("Mint failed:", error);
      notification.error("Minting failed. Please try again.");
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">NFT Collection</h2>
          <p>Please connect your wallet to view and mint NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          {nftName} ({nftSymbol})
        </h2>

        <div className="stats">
          <div className="stat">
            <div className="stat-title">Total Minted</div>
            <div className="stat-value text-secondary">{totalSupply?.toString() || "0"}</div>
          </div>
          <div className="stat">
            <div className="stat-title">You Own</div>
            <div className="stat-value text-accent">{userBalance?.toString() || "0"}</div>
          </div>
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Mint to address (leave empty for yourself)</span>
          </label>
          <input
            type="text"
            placeholder="0x... or leave empty"
            className="input input-bordered w-full max-w-xs"
            value={mintToAddress}
            onChange={e => setMintToAddress(e.target.value)}
          />
        </div>

        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={handleMint}>
            Mint NFT
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <Address address={connectedAddress} />
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the NFTCollection Component

This component demonstrates NFT interactions and collection management:

#### **Multiple Contract Reads**
```typescript
// Reading various NFT contract properties
const { data: nftName } = useScaffoldContractRead({
  contractName: "MyNFT",
  functionName: "name",
});

const { data: totalSupply } = useScaffoldContractRead({
  contractName: "MyNFT",
  functionName: "totalSupply",  // Total NFTs minted
});

const { data: userBalance } = useScaffoldContractRead({
  contractName: "MyNFT",
  functionName: "balanceOf",
  args: [connectedAddress],     // How many NFTs user owns
});
```

#### **Smart Minting Logic**
```typescript
const handleMint = async () => {
  // Allow minting to self or specified address
  const targetAddress = mintToAddress || connectedAddress;

  await writeMyNFTAsync({
    functionName: "mint",
    args: [targetAddress],  // Mint to target address
  });
};
```

#### **Key Features Explained**

**📊 Statistics Display:**
- **Total Minted**: Shows how many NFTs exist in the collection
- **You Own**: Shows user's personal NFT count
- Real-time updates when new NFTs are minted

**🎯 Flexible Minting:**
```typescript
// If input empty, mint to self
// If input provided, mint to that address
const targetAddress = mintToAddress || connectedAddress;
```

**🔢 Data Type Handling:**
```typescript
{totalSupply?.toString() || "0"}
```
Smart contracts return BigNumber types, so we convert to string for display.

#### **NFT Standards (ERC721)**

This component works with ERC721 NFTs which have these key properties:
- **Unique tokens**: Each NFT has a unique token ID
- **Ownership tracking**: `balanceOf()` shows how many NFTs an address owns
- **Transferable**: NFTs can be sent between wallets
- **Metadata**: Each NFT can have associated metadata (images, properties)

#### **User Experience Features**

**💡 Smart Defaults:**
- Empty input field defaults to minting for yourself
- Clear placeholder text guides user behavior
- Immediate feedback after minting

**📈 Real-time Statistics:**
- Total supply updates immediately after minting
- User balance updates when receiving NFTs
- Collection grows visibly as users interact

#### **Gas Optimization Tip**
NFT minting is typically more expensive than token transfers because:
- Creates new token with unique ID
- Updates multiple contract mappings
- May store metadata on-chain
- Always test gas costs on testnet first!

### Update Main Page

Edit `packages/nextjs/app/page.tsx` to include your new components:

```tsx
"use client";

import type { NextPage } from "next";
import { NFTCollection } from "~~/components/example-ui/NFTCollection";
import { TokenBalance } from "~~/components/example-ui/TokenBalance";
import { TokenTransfer } from "~~/components/example-ui/TokenTransfer";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Lisk Builder dApp</span>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Connected to your Week 1 contracts</p>
          </div>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <TokenBalance />
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <TokenTransfer />
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <NFTCollection />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
```

---

## Checkpoint 5: 🚀 Deploy to Production

> 🌐 Deploy your dApp to Vercel for the world to use!

### Prepare for Deployment

1. **Verify Contract Deployment**: Ensure your contracts from Challenge 1 are properly deployed and verified.

2. **Environment Variables**: Create `.env.local` for sensitive data:

```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

> 🌍 **Key Concept: Environment Variables**
>
> **NEXT_PUBLIC_** prefix makes variables available to browser:
> - ✅ `NEXT_PUBLIC_ALCHEMY_API_KEY` - Safe for client-side
> - ❌ `PRIVATE_KEY` - Server-only, never use NEXT_PUBLIC_ for secrets
>
> **Why separate environments?**
> - **Development**: Uses `.env.local` (not committed to git)
> - **Production**: Set via Vercel dashboard (secure)
> - **Different networks**: Easy to switch API endpoints

### Deploy to Vercel

1. **Push to GitHub**:

```sh
git add .
git commit -m "feat: add Web3 frontend for token and NFT contracts"
git push origin main
```

2. **Deploy on Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Configure environment variables in Vercel dashboard
   - Deploy!

3. **Alternative: Deploy to Netlify**:
   - Build the app: `yarn build`
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `dist` folder
   - Configure environment variables

### Test Your Deployed dApp

1. ✅ Connect wallet on live site
2. ✅ Check token balance displays correctly
3. ✅ Test token transfer functionality
4. ✅ Verify NFT minting works
5. ✅ Confirm all transactions appear on Lisk Sepolia Blockscout

---

## Checkpoint 6: 📋 Submit Your Challenge

🎯 Time to submit your completed Week 2 challenge!

Go to [Week 2 Submission](https://speedrunlisk.xyz/sea-campaign/week/2) and submit:

- ✅ **Frontend URL**: Your deployed Vercel/Netlify URL
- ✅ **Contract Addresses**: Your MyToken and MyNFT contract addresses from Week 1
- ✅ **GitHub Repository**: Link to your code repository

---

## 💡 Advanced Development Tips

### 🔧 Development Best Practices

**Local Testing Strategy:**
```bash
# Terminal 1: Always run local chain first
yarn chain

# Terminal 2: Deploy contracts to local network
yarn deploy

# Terminal 3: Start frontend
yarn start
```

**Debugging Contract Interactions:**
```typescript
// Add console.logs to understand hook behavior
const { data: balance, error, isLoading } = useScaffoldContractRead({
  contractName: "MyToken",
  functionName: "balanceOf",
  args: [address],
});

console.log("Balance data:", balance);
console.log("Is loading:", isLoading);
console.log("Error:", error);
```

### ⚡ Performance Optimization

**Minimize Re-renders:**
```typescript
// ✅ Good: Specific hooks for each data point
const { data: tokenName } = useScaffoldContractRead({
  contractName: "MyToken",
  functionName: "name",
});

// ❌ Bad: Single hook for multiple calls
// This causes unnecessary re-renders
```

**Handle Loading States:**
```typescript
const { data: balance, isLoading } = useScaffoldContractRead({...});

if (isLoading) return <div className="loading loading-spinner"></div>;
if (!balance) return <div>No balance found</div>;
```

### 🔒 Security Considerations

**Input Validation:**
```typescript
// Always validate before sending transactions
if (!recipient || !amount || parseFloat(amount) <= 0) {
  notification.error("Invalid input data");
  return;
}

// Check for valid Ethereum address format
if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
  notification.error("Invalid recipient address");
  return;
}
```

**Gas Management:**
```typescript
// Consider gas limits for complex operations
await writeMyTokenAsync({
  functionName: "transfer",
  args: [recipient, parseEther(amount)],
  gasLimit: 100000n, // Optional: set gas limit
});
```

### 📱 User Experience Tips

**Real-time Updates:**
- All `useScaffoldContractRead` hooks automatically watch for changes
- Consider using `refetch()` for manual updates
- Show transaction confirmations clearly

**Error Boundaries:**
```typescript
// Wrap components in error boundaries
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

**Mobile Optimization:**
- Test on mobile devices (smaller screens)
- Consider touch targets for buttons
- Test wallet connections on mobile browsers

## 🆘 Troubleshooting

### Common Issues:

**Wallet not connecting**:

- Ensure you're on Lisk Sepolia network
- Clear browser cache and reconnect
- Check console for connection errors

**Contract interactions failing**:

- Verify contract addresses are correct
- Ensure you have enough ETH for gas
- Check if contracts are verified on Blockscout

**Components not displaying data**:

- Verify scaffold.config.ts points to liskSepolia
- Check contract function names match exactly
- Ensure wallet is connected before calling contract functions

**Build/deployment issues**:

- Run `yarn build` locally to check for errors
- Ensure all environment variables are set correctly
- Check that all imports are correct

**Need help?** Join our [@LiskSEA Telegram](https://t.me/LiskSEA)! 💬

---

> 💬 Problems, questions, comments on the stack? Post them to [@LiskSEA](https://t.me/LiskSEA)
