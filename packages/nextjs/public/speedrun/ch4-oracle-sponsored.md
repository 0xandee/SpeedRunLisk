# Oracles & Sponsored Transactions

📚 This tutorial builds upon [Challenge 1](/speedrun/ch1-deploy-verify.md), [Challenge 2](/speedrun/ch2-frontend-connect.md), and [Challenge 3](/speedrun/ch3-index-display.md) where you deployed contracts, created a frontend, and built an events page.

🌟 You'll now integrate real-world data using oracles and implement gasless transactions to improve user experience!

🚀 The final deliverable is a dApp that fetches live price data from oracles and allows users to interact with contracts without paying gas fees through sponsored transactions.

---

## Challenge Overview

Build advanced Web3 features using oracles for real-world data and meta-transactions for gasless interactions.

## Key Requirements

- Integrate oracle price feeds (RedStone) for live data
- Implement ERC-4337 Account Abstraction for gasless operations
- Use Smart Wallets with thirdweb paymaster to sponsor transactions
- Build frontend components for both features
- Deploy to Lisk Sepolia testnet

## Learning Objectives

- Oracle integration patterns
- Account Abstraction (ERC-4337) with Smart Wallets
- Paymaster-sponsored transactions (Lisk's recommended approach)
- Real-world data in smart contracts
- Modern Web3 UX patterns with thirdweb SDK

💬 Meet other builders working on this challenge and get help in the [@LiskSEA Telegram](https://t.me/LiskSEA)!

---

## Checkpoint 0: 📦 Prerequisites 📚

**⚠️ Important: You must complete [Challenge 1](/speedrun/ch1-deploy-verify.md), [Challenge 2](/speedrun/ch2-frontend-connect.md), and [Challenge 3](/speedrun/ch3-index-display.md) first!**

Before you begin, ensure you have:

- ✅ **Completed Challenge 1-3**: Deployed contracts, built frontend, and created events page
- ✅ **Verified contracts**: All contracts verified on [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com)
- ✅ **Working dApp**: Frontend connected to deployed contracts

> Navigate to your Scaffold-Lisk project directory:

```sh
cd scaffold-lisk
yarn start
```

📱 Open [http://localhost:3000](http://localhost:3000) to see your existing app.

---

## Understanding Oracles 🧠

**What is an Oracle?**

Smart contracts can't directly access external data (stock prices, weather, etc.). Oracles bridge this gap by bringing real-world data onto the blockchain.

**How Oracles Work:**

```
Real World Data → Oracle Network → Smart Contract → dApp Uses Data
```

**Oracle Options on Lisk Sepolia:**

- **RedStone Pull**: Inject data directly into transactions (recommended for testnet)
- **Tellor**: Decentralized oracle network (alternative option)

**Why RedStone Pull?**

- ✅ Works on testnet without deployment
- ✅ Low gas costs
- ✅ Wide variety of price feeds
- ✅ Chainlink-compatible interface

---

## Checkpoint 1: 🔮 Create Oracle Price Feed Contract

> 📊 Let's create a contract that fetches live price data!

### Install RedStone Package

First, install the RedStone EVM connector:

```sh
cd packages/hardhat
yarn add @redstone-finance/evm-connector
```

### Create Price Feed Contract

Create `packages/hardhat/contracts/PriceFeed.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";

/**
 * @title PriceFeed
 * @notice Fetches real-time price data using RedStone Pull oracle
 * @dev Uses MainDemoConsumerBase for testnet compatibility
 */
contract PriceFeed is MainDemoConsumerBase {

    /**
     * @notice Override timestamp validation to allow more lenient checks
     * @dev Allows oracle data from up to 15 minutes in the past or future
     * This is useful for local development where blockchain time may differ from real-time
     * @param receivedTimestampMilliseconds Timestamp from the oracle data package
     */
    function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
        // Convert block.timestamp from seconds to milliseconds
        uint256 blockTimestampMilliseconds = block.timestamp * 1000;

        // Allow data from 15 minutes in the past or future
        uint256 maxTimestampDiffMilliseconds = 15 * 60 * 1000; // 15 minutes

        // Check if timestamp is too far in the past
        if (blockTimestampMilliseconds > receivedTimestampMilliseconds) {
            require(
                blockTimestampMilliseconds - receivedTimestampMilliseconds <= maxTimestampDiffMilliseconds,
                "Timestamp too old"
            );
        }
        // Check if timestamp is too far in the future
        else {
            require(
                receivedTimestampMilliseconds - blockTimestampMilliseconds <= maxTimestampDiffMilliseconds,
                "Timestamp too far in future"
            );
        }
    }

    /**
     * @notice Get the latest ETH/USD price
     * @return price The current ETH price in USD (8 decimals)
     */
    function getEthPrice() public view returns (uint256) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = bytes32("ETH");

        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return prices[0];
    }

    /**
     * @notice Get the latest BTC/USD price
     * @return price The current BTC price in USD (8 decimals)
     */
    function getBtcPrice() public view returns (uint256) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = bytes32("BTC");

        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return prices[0];
    }

    /**
     * @notice Get multiple prices at once
     * @return ethPrice The current ETH price
     * @return btcPrice The current BTC price
     */
    function getMultiplePrices() public view returns (uint256 ethPrice, uint256 btcPrice) {
        bytes32[] memory dataFeedIds = new bytes32[](2);
        dataFeedIds[0] = bytes32("ETH");
        dataFeedIds[1] = bytes32("BTC");

        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return (prices[0], prices[1]);
    }
}
```

### 🧠 Understanding the PriceFeed Contract

Let's break down how this oracle contract works:

#### **RedStone Pull Architecture**

```
Traditional Oracle (Push): Data stored on-chain → expensive
RedStone Pull: Data in transaction calldata → cheaper
```

#### **Key Components Explained**

**1. MainDemoConsumerBase Import:**
```solidity
import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
```
- Pre-configured for testnet use
- No need to manage oracle addresses
- Includes data validation logic

**2. Data Feed IDs:**
```solidity
bytes32[] memory dataFeedIds = new bytes32[](1);
dataFeedIds[0] = bytes32("ETH");
```
- Uses string identifiers converted to bytes32
- Common feeds: "ETH", "BTC", "USDT", "USDC"
- Case-sensitive identifiers

**3. Price Extraction:**
```solidity
uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
```
- Extracts oracle data from transaction calldata
- Returns array of prices (8 decimals)
- Validates signatures automatically

#### **Price Format**

RedStone returns prices with 8 decimals:
- ETH price $2,500.50 → `250050000000` (2500.50 * 10^8)
- To display: `price / 10^8` → human-readable format

#### **Timestamp Validation Override**

The `validateTimestamp()` function override is crucial for development environments:

```solidity
function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    uint256 blockTimestampMilliseconds = block.timestamp * 1000;
    uint256 maxTimestampDiffMilliseconds = 15 * 60 * 1000; // 15 minutes
    // ... validation logic
}
```

**Why we need this:**
- RedStone data has real-time timestamps (from actual clock time)
- Local blockchain/testnet time may lag behind real-time
- Default validation allows only ~3 minutes tolerance
- We extend it to 15 minutes for development flexibility

**Production note:** For mainnet deployments, reduce this to 3-5 minutes to ensure data freshness!

#### **Security Features**

- ✅ **Signature Verification**: Oracle data is cryptographically signed
- ✅ **Timestamp Validation**: Ensures data freshness (customizable tolerance)
- ✅ **Multiple Signers**: Requires consensus from oracle nodes

### Create Deployment Script

Create `packages/hardhat/deploy/02_deploy_price_feed.ts`:

```typescript
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployPriceFeed: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("PriceFeed", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployPriceFeed;
deployPriceFeed.tags = ["PriceFeed"];
```

### Deploy to Lisk Sepolia

```sh
yarn deploy --network liskSepolia
```

> 💡 **Note**: Save your PriceFeed contract address for the frontend!

### Verify on Blockscout

```sh
yarn hardhat-verify --network liskSepolia --contract contracts/PriceFeed.sol:PriceFeed YOUR_CONTRACT_ADDRESS
```

---

## Checkpoint 2: 📊 Build Oracle Frontend

> 🖥️ Create a beautiful interface to display live price data!

### Step 1: Install RedStone Frontend Packages

```sh
cd packages/nextjs
yarn add @redstone-finance/evm-connector @redstone-finance/sdk ethers@^5.7.2
```

> **Note**: We need ethers.js v5 because RedStone's `WrapperBuilder` is designed for ethers contracts, not viem. We'll use ethers specifically for oracle calls while keeping viem for the rest of the app.

### Step 2: Create Oracle Page Structure

Create `packages/nextjs/app/oracle/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { PriceDisplay } from "~~/components/example-ui/PriceDisplay";

const Oracle: NextPage = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Oracle Price Feeds</h2>
            <p>Please connect your wallet to view live prices</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">🔮 Live Price Feeds</h1>
        <p className="text-center text-gray-600">Real-time cryptocurrency prices powered by RedStone Oracle</p>
      </div>

      <div className="flex justify-center items-center gap-6 flex-col sm:flex-row">
        <PriceDisplay symbol="ETH" />
        <PriceDisplay symbol="BTC" />
      </div>
    </div>
  );
};

export default Oracle;
```

### Step 3: Create PriceDisplay Component

Create `packages/nextjs/components/example-ui/PriceDisplay.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { getSignersForDataServiceId } from "@redstone-finance/sdk";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface PriceDisplayProps {
  symbol: "ETH" | "BTC";
}

export const PriceDisplay = ({ symbol }: PriceDisplayProps) => {
  const [price, setPrice] = useState<string>("0.00");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data: deployedContractData } = useDeployedContractInfo("PriceFeed");

  const fetchPrice = async () => {
    if (!deployedContractData) {
      setError("PriceFeed contract not deployed. Run: yarn deploy");
      setIsLoading(false);
      return;
    }

    if (typeof window === "undefined" || !window.ethereum) {
      setError("Please connect your wallet to view prices");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Create ethers provider from window.ethereum
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);

      // Create ethers contract instance
      const contract = new ethers.Contract(
        deployedContractData.address,
        deployedContractData.abi,
        provider
      );

      // Wrap contract with RedStone data using correct API
      const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
        dataPackagesIds: [symbol],
        authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),
      });

      // Call the appropriate price function
      const priceData = symbol === "ETH"
        ? await wrappedContract.getEthPrice()
        : await wrappedContract.getBtcPrice();

      if (!priceData) {
        throw new Error("No price data returned from oracle");
      }

      // Format price (8 decimals to 2 decimals)
      const formattedPrice = (Number(priceData) / 1e8).toFixed(2);
      setPrice(formattedPrice);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching price:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch price");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [deployedContractData, symbol]);

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title justify-center">
          {symbol}/USD
        </h2>

        {error ? (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="stats">
            <div className="stat">
              <div className="stat-title">Current Price</div>
              <div className="stat-value text-white">${price}</div>
              <div className="stat-desc">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        <div className="card-actions justify-end">
          <button
            className="btn btn-sm btn-outline"
            onClick={fetchPrice}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the Oracle Frontend

#### **Why Ethers.js + Viem Hybrid Approach?**

RedStone's `WrapperBuilder` was built for **ethers.js contracts**, not viem. So we use:
- **Viem**: For the rest of your app (faster, better TypeScript)
- **Ethers.js**: Specifically for RedStone oracle calls (library requirement)

Both libraries can coexist by accessing the same `window.ethereum` provider.

#### **WrapperBuilder Pattern (Updated API)**

```typescript
// Create ethers provider and contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(address, abi, provider);

// Wrap with RedStone data using CURRENT API
const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
  dataPackagesIds: [symbol],  // ✅ NEW: dataPackagesIds
  authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),  // ✅ NEW: authorizedSigners
});

// Call contract method directly (ethers style)
const priceData = await wrappedContract.getEthPrice();
```

**What changed from old API:**
- ❌ OLD: `dataServiceId`, `uniqueSignersCount`, `dataFeeds`
- ✅ NEW: `dataPackagesIds`, `authorizedSigners`

**What's happening:**
1. **Create ethers contract**: RedStone wrapper requires ethers, not viem
2. **Wrap contract**: Adds RedStone functionality to your contract
3. **Configure signers**: `getSignersForDataServiceId()` returns authorized oracle nodes for the demo service
4. **Define packages**: Which price feeds to include in transaction

#### **Data Injection Flow**

```
User clicks "Refresh"
  → WrapperBuilder fetches latest prices from RedStone API
  → Prices appended to transaction calldata (with cryptographic signatures)
  → Contract verifies signatures and reads prices from calldata
  → Price returned to frontend and displayed
```

**Security**: RedStone returns cryptographically signed data. Your smart contract verifies these signatures on-chain before trusting the price data!

---

## Understanding Account Abstraction 🧠

**What is Account Abstraction?**

Account Abstraction (ERC-4337) allows users to interact with blockchain using **Smart Wallets** instead of traditional wallets (EOAs). This enables gasless transactions, batch operations, and better security—all without protocol changes!

**Traditional Wallet vs Smart Wallet:**

```
Traditional (EOA):
  User → Signs Transaction → Pays Gas → Smart Contract

Smart Wallet (ERC-4337):
  User → Signs UserOperation → Bundler → Paymaster Sponsors Gas → Smart Contract
```

**ERC-4337 Components:**

- **UserOperation**: Like a transaction, but more flexible
- **Smart Wallet**: Your programmable account (smart contract)
- **Bundler**: Packages UserOps and submits them on-chain
- **Paymaster**: Sponsors gas fees for users
- **EntryPoint**: Singleton contract that validates and executes UserOps

**Why Lisk Recommends ERC-4337:**

- ✅ **Officially Supported**: Lisk documentation promotes this approach
- ✅ **Production-Ready**: thirdweb, Gelato, Biconomy provide infrastructure
- ✅ **Better UX**: Users don't need ETH for gas
- ✅ **Advanced Features**: Batch transactions, session keys, social recovery
- ✅ **Token Payments**: Pay gas in LSK or USDC instead of ETH

---

## Checkpoint 3: 🧠 Understanding Contract Compatibility

> ⛽ The beauty of ERC-4337: **existing contracts** work with Smart Wallets—no modifications needed!

### Smart Contracts Already Work with Account Abstraction!

Here's the magic: Your **MyToken** and **MyNFT** contracts from Week 1 are **already compatible** with gasless transactions! No changes needed.

**Key Insight:** With ERC-4337, you write **normal smart contracts**!

**Traditional Approach (ERC2771):**
- ❌ Import `ERC2771Context`
- ❌ Use `_msgSender()` instead of `msg.sender`
- ❌ Deploy separate forwarder contract
- ❌ Configure trusted forwarder addresses
- ❌ Complex signature verification

**ERC-4337 Approach:**
- ✅ Works with regular contracts (just use `msg.sender`)
- ✅ No special imports or inheritance needed
- ✅ Smart Wallets handle all the complexity
- ✅ **Your existing MyToken & MyNFT contracts work perfectly!**

**How It Works:**

When a user with a Smart Wallet calls `MyNFT.mint()` or `MyToken.transfer()`:
1. User signs a UserOperation (not a transaction)
2. thirdweb's bundler receives the UserOp
3. thirdweb's paymaster sponsors the gas
4. Bundler sends transaction from user's Smart Wallet
5. `msg.sender` = user's Smart Wallet address ✅
6. **User pays $0 in gas fees!**

### No New Contracts Needed!

We'll use your existing contracts from Week 1:
- **MyToken** (ERC20) - For gasless token transfers
- **MyNFT** (ERC721) - For gasless NFT minting

This demonstrates that ERC-4337 works with **any** contract, including standard OpenZeppelin implementations!

---

## Checkpoint 4: ⛽ Build Gasless Frontend with Smart Wallets

> 🎨 Integrate thirdweb Smart Wallets for truly gasless transactions!

### Step 1: Install thirdweb SDK

```sh
cd packages/nextjs
yarn add thirdweb
```

### Step 2: Get thirdweb API Key (Free)

1. Go to [thirdweb.com](https://thirdweb.com/dashboard)
2. Sign in with email or wallet
3. Navigate to **Settings → API Keys**
4. Click **Create API Key**
5. Copy your **Client ID** and **Secret Key**

### Step 3: Configure Environment Variables

Create or update `packages/nextjs/.env.local`:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```

### Step 4: Update Scaffold Configuration

We need to configure Lisk Sepolia chain for thirdweb. Edit `packages/nextjs/chains.ts`:

```typescript
import { defineChain } from "thirdweb";

export const liskSepolia = defineChain({
  id: 4202,
  name: "Lisk Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpc: "https://rpc.sepolia-api.lisk.com",
  blockExplorers: [
    {
      name: "Blockscout",
      url: "https://sepolia-blockscout.lisk.com",
    },
  ],
  testnet: true,
});
```

### Step 5: Wrap App with ThirdwebProvider

Edit `packages/nextjs/app/layout.tsx` to add thirdweb support:

```tsx
import { ThirdwebProvider } from "thirdweb/react";
// ... other imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThirdwebProvider>
          {/* ... existing providers ... */}
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
```

### Step 6: Create Gasless Page

Create `packages/nextjs/app/gasless/page.tsx`:

```tsx
"use client";

import type { NextPage } from "next";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { liskSepolia } from "~~/chains";
import { SmartWalletDemo } from "~~/components/example-ui/SmartWalletDemo";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const Gasless: NextPage = () => {
  const account = useActiveAccount();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">⛽ Gasless Transactions</h1>
        <p className="text-center text-gray-600 mb-4">
          Powered by ERC-4337 Smart Wallets - Pay $0 in gas fees!
        </p>

        {/* Smart Wallet Connect Button */}
        <div className="flex justify-center mb-8">
          <ConnectButton
            client={client}
            chain={liskSepolia}
            accountAbstraction={{
              chain: liskSepolia,
              sponsorGas: true, // ✅ This enables gasless transactions!
            }}
          />
        </div>
      </div>

      {account ? (
        <SmartWalletDemo />
      ) : (
        <div className="flex items-center justify-center">
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <h2 className="card-title justify-center">Create a Smart Wallet</h2>
              <p>Connect above to create your gasless Smart Wallet!</p>
              <div className="alert alert-info mt-4">
                <span className="text-xs">
                  ✨ Smart Wallets are deployed on-chain automatically and all transactions are
                  sponsored!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gasless;
```

### Step 7: Create Smart Wallet Demo Component

Create `packages/nextjs/components/example-ui/SmartWalletDemo.tsx`:

```tsx
"use client";

import { useState } from "react";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { useScaffoldContract, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const SmartWalletDemo = () => {
  const [mintToAddress, setMintToAddress] = useState("");
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const account = useActiveAccount();

  const { data: nftContract } = useScaffoldContract({
    contractName: "MyNFT",
  });

  const { data: totalSupply, refetch: refetchSupply } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "totalSupply",
  });

  const { data: userNFTBalance, refetch: refetchBalance } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "balanceOf",
    args: [account?.address as `0x${string}`],
  });

  const handleGaslessMint = async () => {
    const targetAddress = mintToAddress || account?.address;

    if (!targetAddress || !account || !nftContract) {
      notification.error("Please connect wallet");
      return;
    }

    setIsLoadingNFT(true);

    try {
      // Prepare the contract call
      const transaction = prepareContractCall({
        contract: nftContract,
        method: "function mint(address to)",
        params: [targetAddress as `0x${string}`],
      });

      // Send transaction - gas is automatically sponsored! 🎉
      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });

      notification.success(
        `Gasless NFT minted! View on Blockscout: https://sepolia-blockscout.lisk.com/tx/${transactionHash}`,
      );

      setMintToAddress("");

      // Refresh data
      setTimeout(() => {
        refetchSupply();
        refetchBalance();
      }, 2000);
    } catch (error: any) {
      console.error("Mint failed:", error);
      notification.error(error.message || "Mint failed");
    } finally {
      setIsLoadingNFT(false);
    }
  };

  return (
    <div className="flex justify-center gap-6 flex-col sm:flex-row">
      {/* Gasless NFT Minting */}
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🎨 Mint NFT (100% Gasless!)</h2>

          <div className="stats stats-vertical shadow mb-4">
            <div className="stat">
              <div className="stat-title">Total Minted</div>
              <div className="stat-value text-secondary">{totalSupply?.toString() || "0"}</div>
            </div>
            <div className="stat">
              <div className="stat-title">You Own</div>
              <div className="stat-value text-accent">{userNFTBalance?.toString() || "0"}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Smart Wallet</div>
              <div className="stat-desc text-xs font-mono">
                {account?.address?.slice(0, 10)}...{account?.address?.slice(-8)}
              </div>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Mint to address (optional)</span>
            </label>
            <input
              type="text"
              placeholder="Leave empty to mint to yourself"
              className="input input-bordered w-full"
              value={mintToAddress}
              onChange={e => setMintToAddress(e.target.value)}
            />
          </div>

          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary" onClick={handleGaslessMint} disabled={isLoadingNFT}>
              {isLoadingNFT ? "Minting..." : "Mint NFT (Gas Free!)"}
            </button>
          </div>

          <div className="alert alert-success mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs">
              ✨ Minting sponsored by thirdweb paymaster - $0 gas cost!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the Smart Wallet Integration

**Key Insight:** Notice how we're using your existing MyNFT contract from Week 1 with zero modifications!

**What Just Happened:**

```typescript
// 1. User connects with Smart Wallet support
<ConnectButton
  accountAbstraction={{
    chain: liskSepolia,
    sponsorGas: true,  // ✅ Magic happens here!
  }}
/>

// 2. Transaction is sent normally to YOUR existing contract
const transaction = prepareContractCall({
  contract: nftContract,  // Your MyNFT from Week 1!
  method: "function mint(address to)",
  params: [targetAddress],
});

await sendTransaction({ transaction, account });

// 3. thirdweb automatically:
//    - Converts tx to UserOperation
//    - Signs with Smart Wallet
//    - Sends to bundler
//    - Paymaster sponsors gas
//    - Transaction executes on-chain
//    - User pays $0!
```

**No Manual Steps Required:**
- ❌ No EIP712 signature creation
- ❌ No nonce management
- ❌ No forwarder contract calls
- ❌ No custom relayer setup
- ❌ **No contract modifications needed!**
- ✅ Just call your existing contracts - they work!

**Under the Hood:**

1. **Smart Wallet Creation**: First time a user connects, a Smart Wallet contract is deployed for them (gasless!)
2. **UserOperation**: Each transaction becomes a UserOperation
3. **Bundler**: thirdweb's bundler packages the UserOp
4. **Paymaster**: thirdweb's paymaster signs to sponsor gas
5. **Execution**: Bundler submits to EntryPoint contract
6. **Result**: Transaction executes on MyNFT contract, user pays $0

**Why This Is Amazing:**

Your MyNFT contract from Week 1 uses the standard OpenZeppelin ERC721 implementation. It has **zero** account abstraction code. Yet it works perfectly with gasless transactions! This proves that ERC-4337 truly works with any existing contract.

---

## Checkpoint 5: 🚀 Test & Deploy

### Test Locally

1. **Start local chain**:
   ```sh
   yarn chain
   ```

2. **Deploy contracts**:
   ```sh
   yarn deploy
   ```

3. **Start frontend**:
   ```sh
   yarn start
   ```

4. **Test Oracle Page** (http://localhost:3000/oracle):
   - ✅ Connect your wallet
   - ✅ View live ETH/BTC prices
   - ✅ Click refresh to update prices
   - ✅ Verify prices are formatted correctly ($X,XXX.XX)

5. **Test Gasless Page** (http://localhost:3000/gasless):
   - ✅ Click "Connect" button to create Smart Wallet
   - ✅ Sign to create your Smart Wallet (first time only)
   - ✅ See your existing MyNFT stats (Total Minted, You Own)
   - ✅ Click "Mint NFT (Gas Free!)" button
   - ✅ **Verify you paid $0 in gas!**
   - ✅ Check Blockscout to see the transaction
   - ✅ Verify NFT was minted (Total Minted and You Own counts increase)

### Update Navigation

Edit `packages/nextjs/components/Header.tsx` to add Oracle and Gasless links:

```tsx
import { CurrencyDollarIcon, SparklesIcon } from "@heroicons/react/24/outline";

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    label: "Oracle",
    href: "/oracle",
    icon: <CurrencyDollarIcon className="h-4 w-4" />,
  },
  {
    label: "Gasless",
    href: "/gasless",
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  // ... other links
];
```

### Deploy to Lisk Sepolia

1. **Deploy PriceFeed contract** (MyToken and MyNFT already deployed in Week 1):
   ```sh
   yarn deploy --network liskSepolia
   ```

2. **Verify PriceFeed contract on Blockscout**:
   ```sh
   yarn hardhat-verify --network liskSepolia --contract contracts/PriceFeed.sol:PriceFeed PRICEFEED_ADDRESS
   ```

   > **Note**: Your MyToken and MyNFT contracts are already deployed and verified from Week 1! No need to redeploy them.

3. **Test on testnet**:
   - Visit your deployed frontend
   - Create a Smart Wallet
   - Mint NFTs gaslessly on Lisk Sepolia
   - Monitor sponsored gas in thirdweb dashboard
   - Verify transactions show $0 gas cost

### Deploy Frontend to Production

```sh
yarn build
git add .
git commit -m "feat: add oracle integration and ERC-4337 gasless transactions"
git push origin main
```

Deploy via Vercel:
- Make sure to add `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` to Vercel environment variables
- Deploy and test your live dApp!

---

## 📋 Submit Your Challenge

🎯 Time to submit your completed Week 4 challenge!

Go to [Week 4 Submission](https://speedrunlisk.xyz/sea-campaign/week/4) and submit:

- ✅ **Frontend URL**: Your deployed Vercel URL with `/oracle` and `/gasless` routes
- ✅ **Contract Addresses**:
  - PriceFeed contract address (new)
  - MyToken contract address (from Week 1)
  - MyNFT contract address (from Week 1)
- ✅ **Verified Contracts**: Links to verified contracts on Blockscout
- ✅ **Smart Wallet Address**: Your Smart Wallet address (visible in the gasless page)
- ✅ **GitHub Repository**: Link to your code repository
- ✅ **Gasless NFT Mint Transaction**: Link to a gasless NFT mint transaction on Blockscout

**Bonus Points:**
- Share a screenshot of minting an NFT with $0 gas cost!
- Tweet about gasless NFT minting on Lisk with #LiskSEA
- Show your NFT collection growing without spending gas!

---

## 💡 What You Learned

✅ **Oracle Integration**: Fetching real-world data with RedStone Pull oracle

✅ **ERC-4337 Account Abstraction**: Modern approach to gasless transactions

✅ **Smart Wallets**: Programmable accounts for better UX

✅ **Paymaster-Sponsored Transactions**: Production-ready gasless infrastructure

✅ **thirdweb SDK**: Rapid Web3 development with built-in AA support

✅ **Lisk's Recommended Stack**: Building with officially supported tools

## 🚀 Going Further

### Advanced Features to Explore

**1. Session Keys** (For gaming/social apps):
```typescript
// Let users approve actions without signing each time
const sessionKey = await createSessionKey({
  account,
  approvedTargets: [greetingContract.address],
  nativeTokenLimitPerTransaction: 0,
});
```

**2. Batch Transactions**:
```typescript
// Execute multiple actions in one transaction
const batch = [
  prepareContractCall({ contract, method: "approve", params: [...] }),
  prepareContractCall({ contract, method: "transfer", params: [...] }),
];
await sendBatchTransaction({ transactions: batch, account });
```

**3. Pay Gas in ERC-20 Tokens**:
```typescript
// Let users pay gas in USDC, LSK, or other tokens
accountAbstraction={{
  sponsorGas: false,
  tokenPaymaster: {
    token: "USDC",
  }
}}
```

**4. Social Recovery**:
- Add trusted guardians to recover your Smart Wallet
- No more losing funds from lost seed phrases!

### Alternative Providers to Explore

If you want to explore other ERC-4337 providers on Lisk:

- **Gelato**: Lisk's infrastructure partner - [gelato.network](https://www.gelato.network/)
- **Biconomy**: Modular AA stack - [biconomy.io](https://www.biconomy.io/)
- **Pimlico**: Developer-focused bundler - [pimlico.io](https://www.pimlico.io/)
- **Alchemy**: Account Kit - [alchemy.com](https://www.alchemy.com/)

All support the OP Superchain (including Lisk) with ERC-4337!

## 🆘 Troubleshooting

### Oracle Issues

**"TimestampFromTooLongFuture" or "Timestamp too far in future" error:**
- This happens when oracle data timestamp is ahead of blockchain time
- **Solution**: Add the `validateTimestamp()` override to your PriceFeed contract (see contract code above)
- The override extends tolerance from 3 minutes to 15 minutes
- Common in local development where blockchain time lags real-time
- For production, reduce tolerance to 3-5 minutes for data freshness

**"Oracle data not found" or "Cannot read properties of undefined":**
- Make sure you installed **ethers.js v5**: `yarn add ethers@^5.7.2`
- Ensure you're creating an ethers contract, not using viem contract with WrapperBuilder
- Check you're using the NEW API: `dataPackagesIds` and `authorizedSigners`, not the old `dataServiceId`
- Verify contract inherits MainDemoConsumerBase

**Price shows as 0:**
- Check you're dividing by 1e8 (8 decimals)
- Ensure data feed ID is correct (case-sensitive)

**"Please connect your wallet to view prices":**
- The oracle component needs `window.ethereum` to create ethers provider
- Make sure MetaMask or another wallet is connected

### Smart Wallet / Gasless Transaction Issues

**"Failed to create Smart Wallet":**
- Verify thirdweb Client ID is correct in `.env.local`
- Check that you're connected to Lisk Sepolia network
- Ensure you have some ETH for the initial wallet creation (very small amount)

**"Transaction failed - insufficient funds":**
- You shouldn't see this with `sponsorGas: true`!
- Check thirdweb dashboard to see if paymaster is working
- Verify your API key has paymaster enabled (free tier includes it)

**"Smart Wallet not connecting":**
- Clear browser cache and try again
- Make sure `accountAbstraction` prop is correctly configured
- Check browser console for detailed error messages

**thirdweb API rate limits:**
- Free tier includes generous limits
- Upgrade to Growth plan if building production app
- Monitor usage in thirdweb dashboard

**Contract interactions fail:**
- Verify MyNFT and MyToken are deployed on Lisk Sepolia (from Week 1)
- Check that contract addresses in deployments are correct
- Ensure contract names match in both frontend and deployments
- Confirm MyNFT has a `mint(address)` function (should be there from Week 1)

**Need help?** Join our [@LiskSEA Telegram](https://t.me/LiskSEA)! 💬

---

> 💬 Problems, questions, comments on the stack? Post them to [@LiskSEA](https://t.me/LiskSEA)
