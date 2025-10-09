# Build a Simple NFT Marketplace

=� This tutorial builds upon [Challenge 1](/speedrun/ch1-deploy-verify.md), [Challenge 2](/speedrun/ch2-frontend-connect.md), [Challenge 3](/speedrun/ch3-index-display.md), and [Challenge 4](/speedrun/ch4-oracle-sponsored.md) where you deployed contracts, created a frontend, built an events page, and integrated oracles.

< You'll now build a fully functional NFT marketplace where users can list, buy, and sell NFTs with real-time USD price display powered by oracles!

=� The final deliverable is a working NFT marketplace deployed to Lisk Sepolia with oracle-powered price feeds showing USD equivalents of ETH-priced NFTs.

---

## Challenge Overview

Build a simple NFT marketplace with listing, buying, and selling features, integrated with oracle price feeds.

## Key Requirements

- Create NFTMarketplace smart contract for MyNFT
- Implement list, buy, and cancel listing functions
- Build marketplace frontend with grid view
- Integrate oracle to display USD equivalent prices
- Deploy to Lisk Sepolia testnet

## Learning Objectives

- NFT marketplace mechanics (escrowless design)
- ERC721 approval mechanisms (approve vs setApprovalForAll)
- Smart contract events for marketplace activity
- Oracle integration for price display
- Building production-ready dApp interfaces

=� Meet other builders working on this challenge and get help in the [@LiskSEA Telegram](https://t.me/LiskSEA)!

---

## Checkpoint 0: =� Prerequisites =�

**� Important: You must complete Challenges 1-4 first!**

Before you begin, ensure you have:

-  **Completed Challenge 1**: Deployed and verified MyToken and MyNFT contracts on Lisk Sepolia
-  **Completed Challenge 2**: Built frontend with wallet integration
-  **Completed Challenge 3**: Created events page
-  **Completed Challenge 4**: Integrated oracle (PriceFeed) and understand price feeds
-  **Working dApp**: Frontend connected to deployed contracts

> Navigate to your Scaffold-Lisk project directory:

```sh
cd scaffold-lisk
yarn start
```

=� Open [http://localhost:3000](http://localhost:3000) to see your existing app.

---

## Understanding NFT Marketplaces >�

**What is an NFT Marketplace?**

An NFT marketplace is a platform where users can list their NFTs for sale, browse available NFTs, and purchase them. Think OpenSea, Blur, or Rarible.

**How NFT Marketplaces Work:**

```
Traditional (Escrow) Marketplace:
  Seller � Sends NFT to marketplace contract � Buyer purchases � NFT sent to buyer

Modern (Escrowless) Marketplace:
  Seller � Approves marketplace contract � Lists NFT (keeps it) � Buyer purchases � NFT transferred directly
```

**Why Escrowless?**

-  **Gas efficient**: No need to transfer NFT twice
-  **Safer**: Sellers keep their NFTs until sold
-  **Flexible**: Sellers can use NFT utilities while listed
-  **Modern standard**: Used by all major marketplaces

**Key Components:**

1. **Listing**: Seller approves marketplace and creates listing with price
2. **Buying**: Buyer sends ETH, marketplace transfers NFT from seller to buyer
3. **Canceling**: Seller can remove listing anytime
4. **Approval**: Marketplace needs permission to transfer NFTs

---

## Understanding ERC721 Approvals =

Before building the marketplace, you need to understand how NFT approvals work!

**The Problem:**

Your NFT is in your wallet. The marketplace contract needs to transfer it when someone buys it. How does the marketplace get permission?

**The Solution: Approvals**

ERC721 provides two approval methods:

### Method 1: `approve(address to, uint256 tokenId)`

Approves a specific address to transfer a specific token.

```solidity
// Approve marketplace to transfer token #5
myNFT.approve(marketplaceAddress, 5);
```

**Use case:** One-time approvals for single NFTs

### Method 2: `setApprovalForAll(address operator, bool approved)`

Approves an address to transfer ALL your NFTs (current and future).

```solidity
// Approve marketplace to transfer any of your NFTs
myNFT.setApprovalForAll(marketplaceAddress, true);
```

**Use case:** Marketplaces (approve once, list many NFTs)

**Which to Use?**

For marketplaces, **`setApprovalForAll`** is standard because:
-  Users approve once, list unlimited NFTs
-  Better UX (no approval needed for each listing)
-  Less gas over time

**Security Note:**

`setApprovalForAll` is safe when used with trusted contracts like verified marketplaces. Always verify contracts before approving!

---

## Checkpoint 1: <� Create NFTMarketplace Contract

> =� Let's build the marketplace smart contract!

### Create the Marketplace Contract

Create `packages/hardhat/contracts/NFTMarketplace.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @notice Simple escrowless NFT marketplace for MyNFT contract
 * @dev Sellers keep NFTs until sold, marketplace only needs approval
 */
contract NFTMarketplace is ReentrancyGuard {
    // Struct to store listing information
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // MyNFT contract address
    IERC721 public nftContract;

    // Mapping from token ID to listing
    mapping(uint256 => Listing) public listings;

    // Events
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event ItemCanceled(uint256 indexed tokenId, address indexed seller);

    /**
     * @notice Constructor sets the NFT contract address
     * @param _nftContract Address of the MyNFT contract
     */
    constructor(address _nftContract) {
        nftContract = IERC721(_nftContract);
    }

    /**
     * @notice List an NFT for sale
     * @param tokenId The ID of the NFT to list
     * @param price The price in wei (ETH)
     */
    function listItem(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nftContract.getApproved(tokenId) == address(this) ||
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        require(!listings[tokenId].isActive, "Already listed");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit ItemListed(tokenId, msg.sender, price);
    }

    /**
     * @notice Buy a listed NFT
     * @param tokenId The ID of the NFT to buy
     */
    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];

        require(listing.isActive, "Item not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(nftContract.ownerOf(tokenId) == listing.seller, "Seller no longer owns NFT");

        // Mark as sold before transfer (reentrancy protection)
        listings[tokenId].isActive = false;

        // Transfer NFT from seller to buyer
        nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer ETH to seller
        (bool success, ) = payable(listing.seller).call{value: listing.price}("");
        require(success, "Transfer failed");

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }

        emit ItemSold(tokenId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @notice Cancel a listing
     * @param tokenId The ID of the NFT to cancel
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];

        require(listing.isActive, "Item not listed");
        require(listing.seller == msg.sender, "Not the seller");

        listings[tokenId].isActive = false;

        emit ItemCanceled(tokenId, msg.sender);
    }

    /**
     * @notice Get listing information
     * @param tokenId The ID of the NFT
     * @return listing The listing struct
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    /**
     * @notice Check if an NFT is listed
     * @param tokenId The ID of the NFT
     * @return bool True if listed and active
     */
    function isListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].isActive;
    }
}
```

### >� Understanding the NFTMarketplace Contract

Let's break down the key components:

#### **Contract Structure**

```solidity
contract NFTMarketplace is ReentrancyGuard {
    IERC721 public nftContract;
    mapping(uint256 => Listing) public listings;
}
```

- **ReentrancyGuard**: Prevents reentrancy attacks (security best practice)
- **nftContract**: Reference to the MyNFT contract
- **listings**: Maps token ID to listing information

#### **Listing Struct**

```solidity
struct Listing {
    address seller;
    uint256 price;
    bool isActive;
}
```

Stores all information needed for a listing:
- **seller**: Who listed the NFT
- **price**: Price in wei (ETH)
- **isActive**: Whether listing is active

#### **listItem() Function**

```solidity
function listItem(uint256 tokenId, uint256 price) external {
    require(price > 0, "Price must be greater than 0");
    require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
    require(
        nftContract.getApproved(tokenId) == address(this) ||
        nftContract.isApprovedForAll(msg.sender, address(this)),
        "Marketplace not approved"
    );
    // ...
}
```

**Security checks:**
1. Price must be greater than 0
2. Caller must own the NFT
3. Marketplace must be approved (either specific or all)

**Why check approval?** Ensures marketplace can transfer NFT when sold!

#### **buyItem() Function**

```solidity
function buyItem(uint256 tokenId) external payable nonReentrant {
    // Validate listing
    require(listing.isActive, "Item not listed");
    require(msg.value >= listing.price, "Insufficient payment");

    // Mark sold BEFORE transfers (reentrancy protection)
    listings[tokenId].isActive = false;

    // Transfer NFT
    nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

    // Transfer ETH to seller
    (bool success, ) = payable(listing.seller).call{value: listing.price}("");
    require(success, "Transfer failed");
}
```

**Key patterns:**
- **nonReentrant**: Prevents reentrancy attacks
- **Checks-Effects-Interactions**: Mark as sold before transfers
- **safeTransferFrom**: Safe NFT transfer
- **Low-level call**: Send ETH to seller

#### **Events**

```solidity
event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
event ItemSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
event ItemCanceled(uint256 indexed tokenId, address indexed seller);
```

Events enable:
- Frontend to listen for marketplace activity
- Blockchain explorers to index data
- Real-time UI updates

### Create Deployment Script

Create `packages/hardhat/deploy/04_deploy_marketplace.ts`:

> ⚠️ **Note**: We use `04_deploy_marketplace.ts` (not `03_`) because Challenge 4 already uses `03_deploy_price_feed.ts`.

```typescript
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployNFTMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get the deployed MyNFT contract address
  const myNFT = await get("MyNFT");

  await deploy("NFTMarketplace", {
    from: deployer,
    args: [myNFT.address],
    log: true,
    autoMine: true,
  });
};

export default deployNFTMarketplace;
deployNFTMarketplace.tags = ["NFTMarketplace"];
```

> 📝 **Note**: This deployment script automatically finds your MyNFT contract address from previous deployments!

---

## Checkpoint 2: =� Deploy & Verify Marketplace

> =� Let's deploy the marketplace to Lisk Sepolia!

### Test Locally First

```sh
# Terminal 1: Start local chain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start frontend
yarn start
```

### Deploy to Lisk Sepolia

```sh
yarn deploy --network liskSepolia
```

You should see output like:

```
deploying "NFTMarketplace" (tx: 0x...)
NFTMarketplace deployed at 0x...
```

> =� **Save your NFTMarketplace contract address!** You'll need it for verification and submission.

### Verify on Blockscout

```sh
yarn hardhat-verify --network liskSepolia --contract contracts/NFTMarketplace.sol:NFTMarketplace YOUR_MARKETPLACE_ADDRESS
```

Replace `YOUR_MARKETPLACE_ADDRESS` with your deployed address.

>  **Success!** Your marketplace is now verified on [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com)!

---

## Checkpoint 3: <� Build Marketplace Frontend

> =� Create a beautiful marketplace interface!

### Step 1: Create Marketplace Page

Create `packages/nextjs/app/marketplace/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MarketplaceGrid } from "~~/components/example-ui/MarketplaceGrid";

const Marketplace: NextPage = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">NFT Marketplace</h2>
            <p>Please connect your wallet to browse the marketplace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4"><� NFT Marketplace</h1>
        <p className="text-center text-gray-600">
          Buy and sell NFTs with live USD price display powered by RedStone Oracle
        </p>
      </div>

      <MarketplaceGrid />
    </div>
  );
};

export default Marketplace;
```

### Step 2: Create MarketplaceGrid Component

Create `packages/nextjs/components/example-ui/MarketplaceGrid.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NFTCard } from "./NFTCard";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const MarketplaceGrid = () => {
  const { address: connectedAddress } = useAccount();
  const [nftIds, setNftIds] = useState<number[]>([]);

  // Get total supply of NFTs
  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "totalSupply",
  });

  // Generate array of token IDs
  useEffect(() => {
    if (totalSupply) {
      const supply = Number(totalSupply);
      const ids = Array.from({ length: supply }, (_, i) => i);
      setNftIds(ids);
    }
  }, [totalSupply]);

  if (!connectedAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Connect your wallet to view the marketplace</p>
      </div>
    );
  }

  if (nftIds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No NFTs minted yet!</p>
        <p className="text-sm text-gray-400">Go to the Home page to mint some NFTs first</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nftIds.map(tokenId => (
        <NFTCard key={tokenId} tokenId={tokenId} />
      ))}
    </div>
  );
};
```

### Step 3: Create NFTCard Component

Create `packages/nextjs/components/example-ui/NFTCard.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NFTCardProps {
  tokenId: number;
}

export const NFTCard = ({ tokenId }: NFTCardProps) => {
  const { address: connectedAddress } = useAccount();
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Get NFT owner
  const { data: owner } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  // Get listing info
  const { data: listing, refetch: refetchListing } = useScaffoldContractRead({
    contractName: "NFTMarketplace",
    functionName: "getListing",
    args: [BigInt(tokenId)],
  });

  // Get marketplace contract info (we need its address for approval)
  const { data: marketplaceContract } = useDeployedContractInfo("NFTMarketplace");
  const marketplaceAddress = marketplaceContract?.address;

  // Check if marketplace is approved
  const { data: approvedAddress, refetch: refetchApproved } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "getApproved",
    args: [BigInt(tokenId)],
  });

  const { data: isApprovedForAll, refetch: refetchApprovedForAll } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "isApprovedForAll",
    args: [owner as `0x${string}`, marketplaceAddress as `0x${string}`],
  });

  // Update approval status
  useEffect(() => {
    if (marketplaceAddress) {
      setIsApproved(
        approvedAddress?.toLowerCase() === (marketplaceAddress as string).toLowerCase() ||
          isApprovedForAll === true,
      );
    }
  }, [approvedAddress, isApprovedForAll, marketplaceAddress]);

  // Contract writes
  const { writeAsync: approveMarketplace } = useScaffoldContractWrite({
    contractName: "MyNFT",
    functionName: "setApprovalForAll",
    args: [marketplaceAddress as `0x${string}`, true],
    onBlockConfirmation: async (txnReceipt: any) => {
      console.log("Approval confirmed in block:", txnReceipt.blockNumber);
      // Refetch approval status after transaction is confirmed
      await refetchApproved();
      await refetchApprovedForAll();
      // Set approving state to false after refetch completes
      setIsApproving(false);
      notification.success("Marketplace approved! You can now list your NFT.");
    },
  });

  const { writeAsync: listItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "listItem",
    args: [BigInt(tokenId), parseEther(listPrice || "0")],
  });

  const { writeAsync: buyItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "buyItem",
    args: [BigInt(tokenId)],
    value: listing && listing.isActive ? listing.price : undefined,
  });

  const { writeAsync: cancelListing } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "cancelListing",
    args: [BigInt(tokenId)],
  });

  // Handle approval
  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveMarketplace();
      notification.success("Approval transaction sent! Waiting for confirmation...");
      // Note: onBlockConfirmation callback will handle success notification and reset isApproving
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
      setIsApproving(false);
    }
  };

  // Handle listing
  const handleList = async () => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      notification.error("Please enter a valid price");
      return;
    }

    try {
      await listItem();
      notification.success("NFT listed successfully!");
      setShowListModal(false);
      setListPrice("");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Listing failed:", error);
      notification.error("Listing failed");
    }
  };

  // Handle buy
  const handleBuy = async () => {
    try {
      await buyItem();
      notification.success("NFT purchased successfully!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Purchase failed:", error);
      notification.error("Purchase failed");
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    try {
      await cancelListing();
      notification.success("Listing canceled!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Cancel failed:", error);
      notification.error("Cancel failed");
    }
  };

  const isOwner = owner?.toLowerCase() === connectedAddress?.toLowerCase();
  const isListed = listing?.isActive === true;
  const priceInEth = listing?.price ? formatEther(listing.price) : "0";

  return (
    <>
      <div className="card bg-base-100 shadow-xl">
        <figure className="px-10 pt-10">
          <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-6xl font-bold text-white">#{tokenId}</span>
          </div>
        </figure>
        <div className="card-body">
          <h2 className="card-title">
            NFT #{tokenId}
            {isListed && <div className="badge badge-success">Listed</div>}
          </h2>

          <div className="text-sm">
            <p className="text-gray-600">Owner:</p>
            <Address address={owner} size="sm" />
          </div>

          {isListed && (
            <div className="stats shadow mt-2">
              <div className="stat p-4">
                <div className="stat-title text-xs">Price</div>
                <div className="stat-value text-lg">{parseFloat(priceInEth).toFixed(4)} ETH</div>
              </div>
            </div>
          )}

          <div className="card-actions justify-end mt-4">
            {!isOwner && isListed && (
              <button className="btn btn-primary btn-sm" onClick={handleBuy}>
                Buy Now
              </button>
            )}

            {isOwner && !isListed && !isApproved && !isApproving && (
              <button className="btn btn-secondary btn-sm" onClick={handleApprove}>
                Approve Marketplace
              </button>
            )}

            {isOwner && !isListed && isApproving && (
              <button className="btn btn-secondary btn-sm loading" disabled>
                Approving...
              </button>
            )}

            {isOwner && !isListed && isApproved && !isApproving && (
              <button className="btn btn-accent btn-sm" onClick={() => setShowListModal(true)}>
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <button className="btn btn-error btn-sm" onClick={handleCancel}>
                Cancel Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">List NFT #{tokenId}</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Price in ETH</span>
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.5"
                className="input input-bordered w-full"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
              />
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowListModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleList}>
                List NFT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

> ⚠️ **Important: Approval Flow & Loading State**
>
> After clicking "Approve Marketplace", **you'll see three UI states**:
> 1. **"Approve Marketplace" button** → Click to start approval
> 2. **"Approving..." button (disabled with spinner)** → Transaction is being confirmed on blockchain
> 3. **"List for Sale" button** → Approval confirmed! Safe to list your NFT
>
> **Why the loading state?** The component uses `isApproving` state to prevent you from trying to list
> before the blockchain has confirmed your approval. This eliminates the "Marketplace not approved" race condition.
>
> **How it works:**
> - When you click "Approve Marketplace", `setIsApproving(true)` is called
> - The "Approving..." loading button is shown while the transaction confirms (5-15 seconds on testnet)
> - The `onBlockConfirmation` callback fires when the blockchain confirms the transaction
> - The callback refetches approval status and calls `setIsApproving(false)`
> - Only then does the "List for Sale" button appear
>
> **You'll see TWO notifications:**
> 1. First: "Approval transaction sent! Waiting for confirmation..."
> 2. Second: "Marketplace approved! You can now list your NFT."
>
> **This ensures the marketplace contract can verify your approval when you try to list!**

### >� Understanding the NFTCard Component

This component handles all marketplace interactions for a single NFT:

#### **Key Features**

1. **Dynamic Button Display**: Shows different buttons based on state
   - Not owner + listed = "Buy Now"
   - Owner + not approved + not approving = "Approve Marketplace"
   - Owner + approving = "Approving..." (disabled, loading spinner)
   - Owner + approved + not listed + not approving = "List for Sale"
   - Owner + listed = "Cancel Listing"

2. **Approval Check**:
```tsx
const isApproved =
  approvedAddress?.toLowerCase() === marketplaceAddress?.toLowerCase() ||
  isApprovedForAll === true;
```
Checks both `approve()` and `isApprovedForAll()` methods!

> **💡 Important: Getting the Marketplace Address**
>
> We use `useDeployedContractInfo("NFTMarketplace")` to get the marketplace's **deployed address**, not `useScaffoldContractRead` to call `nftContract()`.
>
> **Why?** The `nftContract()` function returns the NFT contract address that the marketplace is configured to work with, NOT the marketplace's own address!
>
> ```tsx
> // ✅ CORRECT: Get the marketplace's deployed address
> const { data: marketplaceContract } = useDeployedContractInfo("NFTMarketplace");
> const marketplaceAddress = marketplaceContract?.address;
>
> // ❌ WRONG: This returns the NFT contract address, not the marketplace address!
> const { data: marketplaceData } = useScaffoldContractRead({
>   contractName: "NFTMarketplace",
>   functionName: "nftContract", // Returns MyNFT address, not marketplace!
> });
> ```
>
> This is a common mistake that causes the "Marketplace not approved" error because you end up approving the wrong contract!

3. **List Modal**: Clean UI for entering listing price

4. **Real-time Updates**: Uses `refetch()` to update data after transactions

#### **Transaction Flow**

**For Sellers:**
1. Click "Approve Marketplace" � `setApprovalForAll(marketplace, true)`
2. Click "List for Sale" � Enter price � `listItem(tokenId, price)`
3. NFT shows as "Listed" with price
4. Can click "Cancel Listing" anytime

**For Buyers:**
1. See listed NFT with price
2. Click "Buy Now" � `buyItem(tokenId)` with ETH value
3. NFT transferred, ETH sent to seller

### Step 4: Update Navigation

Edit `packages/nextjs/components/Header.tsx` to add the Marketplace link.

**Step 1**: Add `ShoppingCartIcon` to the imports:

```tsx
import {
  Bars3Icon,
  BugAntIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ShoppingCartIcon,  // Add this line
  SparklesIcon,
} from "@heroicons/react/24/outline";
```

**Step 2**: Add Marketplace entry to `menuLinks` array (after "Events"):

```tsx
export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    label: "Events",
    href: "/events",
    icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
  },
  {
    label: "Marketplace",  // Add this entire object
    href: "/marketplace",
    icon: <ShoppingCartIcon className="h-4 w-4" />,
  },
  // ... rest of your existing links (Oracle, Gasless, Debug Contracts)
];
```

---

## Checkpoint 4: =� Integrate Oracle for USD Display

> =� Show USD equivalent prices using the oracle from Challenge 4!

### Update NFTCard with Oracle Price Display

Edit `packages/nextjs/components/example-ui/NFTCard.tsx` to add USD price display:

```tsx
"use client";

import { useEffect, useState } from "react";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { getSignersForDataServiceId } from "@redstone-finance/sdk";
import { ethers } from "ethers";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NFTCardProps {
  tokenId: number;
}

export const NFTCard = ({ tokenId }: NFTCardProps) => {
  const { address: connectedAddress } = useAccount();
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Get PriceFeed contract info
  const { data: priceFeedContract } = useDeployedContractInfo("PriceFeed");

  // Get NFT owner
  const { data: owner } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  // Get listing info
  const { data: listing, refetch: refetchListing } = useScaffoldContractRead({
    contractName: "NFTMarketplace",
    functionName: "getListing",
    args: [BigInt(tokenId)],
  });

  // Get marketplace contract info (we need its address for approval)
  const { data: marketplaceContract } = useDeployedContractInfo("NFTMarketplace");
  const marketplaceAddress = marketplaceContract?.address;

  // Check if marketplace is approved
  const { data: approvedAddress, refetch: refetchApproved } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "getApproved",
    args: [BigInt(tokenId)],
  });

  const { data: isApprovedForAll, refetch: refetchApprovedForAll } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "isApprovedForAll",
    args: [owner as `0x${string}`, marketplaceAddress as `0x${string}`],
  });

  // Fetch ETH price from oracle
  const fetchEthPrice = async () => {
    if (!priceFeedContract || typeof window === "undefined" || !window.ethereum) {
      return;
    }

    try {
      setIsLoadingPrice(true);

      // Create ethers provider and contract
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(priceFeedContract.address, priceFeedContract.abi, provider);

      // Wrap contract with RedStone data
      const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
        dataPackagesIds: ["ETH"],
        authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),
      });

      // Get ETH price
      const priceData = await wrappedContract.getEthPrice();
      const formattedPrice = Number(priceData) / 1e8; // Convert from 8 decimals
      setEthPriceUSD(formattedPrice);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Fetch price on mount and every 30 seconds
  useEffect(() => {
    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 30000);
    return () => clearInterval(interval);
  }, [priceFeedContract]);

  // Update approval status
  useEffect(() => {
    if (marketplaceAddress) {
      setIsApproved(
        approvedAddress?.toLowerCase() === (marketplaceAddress as string).toLowerCase() ||
          isApprovedForAll === true,
      );
    }
  }, [approvedAddress, isApprovedForAll, marketplaceAddress]);

  // Contract writes
  const { writeAsync: approveMarketplace } = useScaffoldContractWrite({
    contractName: "MyNFT",
    functionName: "setApprovalForAll",
    args: [marketplaceAddress as `0x${string}`, true],
    onBlockConfirmation: async (txnReceipt: any) => {
      console.log("Approval confirmed in block:", txnReceipt.blockNumber);
      // Refetch approval status after transaction is confirmed
      await refetchApproved();
      await refetchApprovedForAll();
      // Set approving state to false after refetch completes
      setIsApproving(false);
      notification.success("Marketplace approved! You can now list your NFT.");
    },
  });

  const { writeAsync: listItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "listItem",
    args: [BigInt(tokenId), parseEther(listPrice || "0")],
  });

  const { writeAsync: buyItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "buyItem",
    args: [BigInt(tokenId)],
    value: listing && listing.isActive ? listing.price : undefined,
  });

  const { writeAsync: cancelListing } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "cancelListing",
    args: [BigInt(tokenId)],
  });

  // Handle approval
  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveMarketplace();
      notification.success("Approval transaction sent! Waiting for confirmation...");
      // Note: onBlockConfirmation callback will handle success notification and reset isApproving
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
      setIsApproving(false);
    }
  };

  // Handle listing
  const handleList = async () => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      notification.error("Please enter a valid price");
      return;
    }

    try {
      await listItem();
      notification.success("NFT listed successfully!");
      setShowListModal(false);
      setListPrice("");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Listing failed:", error);
      notification.error("Listing failed");
    }
  };

  // Handle buy
  const handleBuy = async () => {
    try {
      await buyItem();
      notification.success("NFT purchased successfully!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Purchase failed:", error);
      notification.error("Purchase failed");
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    try {
      await cancelListing();
      notification.success("Listing canceled!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Cancel failed:", error);
      notification.error("Cancel failed");
    }
  };

  const isOwner = owner?.toLowerCase() === connectedAddress?.toLowerCase();
  const isListed = listing?.isActive === true;
  const priceInEth = listing?.price ? formatEther(listing.price) : "0";
  const priceInUSD = ethPriceUSD > 0 ? (parseFloat(priceInEth) * ethPriceUSD).toFixed(2) : "0.00";

  return (
    <>
      <div className="card bg-base-100 shadow-xl">
        <figure className="px-10 pt-10">
          <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-6xl font-bold text-white">#{tokenId}</span>
          </div>
        </figure>
        <div className="card-body">
          <h2 className="card-title">
            NFT #{tokenId}
            {isListed && <div className="badge badge-success">Listed</div>}
          </h2>

          <div className="text-sm">
            <p className="text-gray-600">Owner:</p>
            <Address address={owner} size="sm" />
          </div>

          {isListed && (
            <div className="stats shadow mt-2">
              <div className="stat p-4">
                <div className="stat-title text-xs">Price</div>
                <div className="stat-value text-lg">{parseFloat(priceInEth).toFixed(4)} ETH</div>
                {ethPriceUSD > 0 && (
                  <div className="stat-desc">
                    ~${priceInUSD} USD
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card-actions justify-end mt-4">
            {!isOwner && isListed && (
              <button className="btn btn-primary btn-sm" onClick={handleBuy}>
                Buy Now
              </button>
            )}

            {isOwner && !isListed && !isApproved && !isApproving && (
              <button className="btn btn-secondary btn-sm" onClick={handleApprove}>
                Approve Marketplace
              </button>
            )}

            {isOwner && !isListed && isApproving && (
              <button className="btn btn-secondary btn-sm loading" disabled>
                Approving...
              </button>
            )}

            {isOwner && !isListed && isApproved && !isApproving && (
              <button className="btn btn-accent btn-sm" onClick={() => setShowListModal(true)}>
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <button className="btn btn-error btn-sm" onClick={handleCancel}>
                Cancel Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">List NFT #{tokenId}</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Price in ETH</span>
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.5"
                className="input input-bordered w-full"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
              />
              {listPrice && ethPriceUSD > 0 && (
                <label className="label">
                  <span className="label-text-alt">
                    ~${(parseFloat(listPrice) * ethPriceUSD).toFixed(2)} USD
                  </span>
                </label>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowListModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleList}>
                List NFT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

### >� Understanding Oracle Integration

#### **Price Fetching Pattern**

```tsx
// Fetch ETH price from oracle
const fetchEthPrice = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(address, abi, provider);

  const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
    dataPackagesIds: ["ETH"],
    authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),
  });

  const priceData = await wrappedContract.getEthPrice();
  setEthPriceUSD(Number(priceData) / 1e8);
};
```

This is the same pattern from Challenge 4!

#### **USD Calculation**

```tsx
const priceInUSD = ethPriceUSD > 0
  ? (parseFloat(priceInEth) * ethPriceUSD).toFixed(2)
  : "0.00";
```

- **priceInEth**: NFT price from listing (e.g., 0.5 ETH)
- **ethPriceUSD**: Current ETH price from oracle (e.g., $2,500)
- **priceInUSD**: Calculated USD value (0.5 � $2,500 = $1,250)

#### **Display Updates**

The oracle price updates every 30 seconds:
```tsx
useEffect(() => {
  fetchEthPrice();
  const interval = setInterval(fetchEthPrice, 30000);
  return () => clearInterval(interval);
}, [priceFeedContract]);
```

This keeps USD prices fresh without manual refreshes!

---

## Checkpoint 5: =� Test, Deploy & Submit

>  Let's test everything and deploy!

### Local Testing Checklist

1. **Start your development environment**:
   ```sh
   # Terminal 1
   yarn chain

   # Terminal 2
   yarn deploy

   # Terminal 3
   yarn start
   ```

2. **Test the complete flow**:
   -  Navigate to Home page
   -  Mint a few NFTs (at least 3-4)
   -  Go to Marketplace page
   -  See all your NFTs displayed
   -  Click "Approve Marketplace" on an NFT
   -  Click "List for Sale" and enter a price
   -  See NFT marked as "Listed" with price in ETH
   -  See USD equivalent displayed (from oracle)
   -  Try buying with a different account (use incognito window)
   -  Try canceling a listing

3. **Test oracle integration**:
   -  List an NFT and note the USD price
   -  Wait 30 seconds for price update
   -  USD price should update (ETH price fluctuates)

### Deploy to Lisk Sepolia

1. **Deploy marketplace contract**:
   ```sh
   yarn deploy --network liskSepolia
   ```

2. **Verify on Blockscout**:
   ```sh
   yarn hardhat-verify --network liskSepolia --contract contracts/NFTMarketplace.sol:NFTMarketplace YOUR_MARKETPLACE_ADDRESS
   ```

3. **Test on testnet**:
   - Connect wallet to Lisk Sepolia
   - Ensure you have testnet ETH
   - Mint NFTs from Home page
   - List NFTs on Marketplace
   - Test buying/selling with different accounts

### Deploy Frontend

```sh
yarn build
git add .
git commit -m "feat: add NFT marketplace with oracle price display"
git push origin main
```

> ℹ️ **Note**: If you see a TypeScript error about `ContractUI.tsx` during build, this is a pre-existing issue in Scaffold-Lisk's debug components and does NOT affect your marketplace. See the Troubleshooting section for details.

Deploy to Vercel:
- Add environment variables if needed
- Deploy and test live marketplace

### Update Navigation (if not done already)

Make sure `packages/nextjs/components/Header.tsx` includes the Marketplace link!

---

## =� Submit Your Challenge

<� Time to submit your completed Week 5 challenge!

Go to [Week 5 Submission](https://speedrunlisk.xyz/sea-campaign/week/5) and submit:

-  **Frontend URL**: Your deployed Vercel URL with `/marketplace` route
-  **Contract Addresses**:
  - NFTMarketplace contract address (new)
  - MyNFT contract address (from Week 1)
  - PriceFeed contract address (from Week 4)
-  **Verified Contracts**: Links to verified contracts on Blockscout
-  **GitHub Repository**: Link to your code repository
-  **Marketplace Transaction**: Link to a marketplace transaction (list/buy/cancel) on Blockscout

**Bonus Points:**

- Share a screenshot of your marketplace with NFTs listed!
- Tweet about building an NFT marketplace on Lisk with #LiskSEA
- Show the oracle USD price updates!

---

## =� What You Learned

 **NFT Marketplace Mechanics**: Escrowless design, listings, buying, selling

 **ERC721 Approvals**: Deep understanding of `approve()` vs `setApprovalForAll()`

 **Smart Contract Security**: ReentrancyGuard, checks-effects-interactions pattern

 **Oracle Integration**: Real-world price data for better UX

 **Event-Driven Architecture**: Using events for real-time updates

 **Production dApp Patterns**: Complete marketplace implementation

## =� Going Further

### Advanced Features to Add

**1. Offers/Bidding**:
```solidity
mapping(uint256 => mapping(address => uint256)) public offers;

function makeOffer(uint256 tokenId) external payable {
    offers[tokenId][msg.sender] = msg.value;
}

function acceptOffer(uint256 tokenId, address buyer) external {
    // Transfer NFT and ETH
}
```

**2. Auction System**:
- Time-based auctions
- Highest bidder wins
- Automatic refunds for outbid users

**3. Marketplace Fee**:
```solidity
uint256 public feePercent = 250; // 2.5%

function buyItem(uint256 tokenId) external payable {
    uint256 fee = (listing.price * feePercent) / 10000;
    uint256 sellerAmount = listing.price - fee;
    // Transfer fee to marketplace owner
}
```

**4. Multiple NFT Collections**:
- Support any ERC721 contract
- Collection management
- Featured collections

**5. Activity Feed**:
- Show recent sales
- Trending NFTs
- Price history charts

### Improvements

**Frontend Enhancements:**
- Add NFT images (IPFS metadata)
- Implement pagination for large collections
- Add search and filters
- Show sales history per NFT
- Add user profiles

**Smart Contract Optimizations:**
- Batch listing (list multiple NFTs at once)
- Dutch auctions (declining price over time)
- Royalties for creators (EIP-2981)

## <� Troubleshooting

### Contract Issues

**"Marketplace not approved" error when listing:**
- **This should not happen** if you're using the updated code with `isApproving` loading state!
- **The loading state prevents this error** by hiding the "List for Sale" button until approval is confirmed
- **If you still see this error**, it means the loading state isn't working correctly:
  1. Make sure you have the `isApproving` state defined in your component
  2. Check that `setIsApproving(true)` is called in `handleApprove`
  3. Verify `setIsApproving(false)` is called in the `onBlockConfirmation` callback
  4. Ensure button rendering checks `!isApproving` before showing "List for Sale"
- **You should see these UI states in order**:
  1. "Approve Marketplace" button (green/secondary)
  2. "Approving..." button (disabled, with spinner) ← **This prevents premature listing!**
  3. "List for Sale" button (only appears after blockchain confirmation)
- **On testnets**: The "Approving..." state lasts 5-15 seconds (much slower than localhost)
- **Verify on-chain**: Check your approval transaction on [Blockscout](https://sepolia-blockscout.lisk.com) has a green checkmark
- **Technical explanation**: The component uses `onBlockConfirmation` callback to wait for actual blockchain confirmation AND refetch approval status before resetting `isApproving` to false. This ensures the marketplace contract can verify your approval when you try to list.

**"Item not listed" error:**
- Ensure listing transaction was successful
- Check if listing was canceled
- Verify tokenId is correct

**"Insufficient payment" error:**
- Make sure you're sending enough ETH to cover the listing price
- Check your wallet balance

### Frontend Issues

**NFTs not showing:**
- Ensure NFTs are actually minted (check totalSupply)
- Verify MyNFT contract is deployed
- Check contract addresses in deployments

**Oracle price shows $0:**
- Ensure PriceFeed contract is deployed (from Week 4)
- Check that ethers.js v5 is installed: `yarn add ethers@^5.7.2`
- Verify wallet is connected (oracle needs window.ethereum)
- Check browser console for errors

**"Timestamp too far in future" oracle error:**
- Ensure your PriceFeed contract has the `validateTimestamp()` override from Week 4
- Redeploy PriceFeed if needed with the extended tolerance

**Approval status not updating:**
- Wait a few seconds after approval transaction
- Refresh the page
- Check that the transaction confirmed on-chain

**Buttons not showing correctly:**
- Clear browser cache
- Check that you're connected to the right network
- Verify you're using the correct wallet address

**Build error in ContractUI.tsx (TypeScript symbol conversion):**
- This is a pre-existing issue in Scaffold-Lisk's debug components
- Does NOT affect the marketplace functionality
- The error appears in `app/debug/_components/contract/ContractUI.tsx`
- Safe to ignore - marketplace pages work perfectly
- If you want to fix it, wrap `contractName` with `String(contractName)` in that file

### Common Questions

**Q: Can I list the same NFT twice?**
A: No, the contract prevents this with `require(!listings[tokenId].isActive, "Already listed")`

**Q: What happens if I transfer an NFT that's listed?**
A: The listing remains, but the buy will fail because you no longer own it. Buyer should check ownership before buying!

**Q: Can I change the price after listing?**
A: Not in this simple version! You'd need to cancel and relist. Advanced: Add `updateListing()` function.

**Q: Do I need to approve the marketplace for every NFT?**
A: No! Using `setApprovalForAll` once approves the marketplace for ALL your NFTs (current and future).

**Need help?** Join our [@LiskSEA Telegram](https://t.me/LiskSEA)! =�

---

## <� Congratulations!

You've built a fully functional NFT marketplace with:
-  List, buy, and sell functionality
-  ERC721 approval mechanisms
-  Oracle-powered USD price display
-  Real-time updates via events
-  Production-ready smart contracts
-  Beautiful, responsive UI

This marketplace demonstrates core Web3 concepts used by platforms like OpenSea, Blur, and LooksRare!

**What's Next?**
- Explore the "Going Further" section for advanced features
- Build on top of this marketplace
- Try integrating IPFS for NFT metadata and images
- Add social features (comments, likes, profiles)
- Create your own NFT collection!

---

> =� Problems, questions, comments on the stack? Post them to [@LiskSEA](https://t.me/LiskSEA)
