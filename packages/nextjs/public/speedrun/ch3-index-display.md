# Display Contract Events & Transaction History

📚 This tutorial builds upon [Challenge 1](/speedrun/ch1-deploy-verify.md) and [Challenge 2](/speedrun/ch2-frontend-connect.md) where you deployed smart contracts and created a basic frontend interface.

🌟 You'll now create a simple events page that shows your contract activity and transaction history!

🚀 The final deliverable is a clean interface that displays contract events with basic filtering - perfect for understanding blockchain data indexing.

---

## Challenge Overview

Create a simple events and transaction history page for your deployed contracts.

## Key Requirements

- Display contract events (token transfers, NFT mints)
- Show transaction history with pagination
- Add basic search and filtering
- Create a clean, user-friendly interface

## Learning Objectives

- Reading blockchain events
- Basic data filtering and display
- Pagination techniques
- Simple UI components

💬 Meet other builders working on this challenge and get help in the [@LiskSEA Telegram](https://t.me/LiskSEA)!

---

## Checkpoint 0: 📦 Prerequisites 📚

**⚠️ Important: You must complete [Challenge 1](/speedrun/ch1-deploy-verify.md) and [Challenge 2](/speedrun/ch2-frontend-connect.md) first!**

Before you begin, ensure you have:

- ✅ **Completed Challenge 1**: Deployed and verified MyToken and MyNFT contracts on Lisk Sepolia
- ✅ **Completed Challenge 2**: Built frontend with TokenBalance, TokenTransfer, and NFTCollection components
- ✅ **Working dApp**: Frontend connected to your deployed contracts with wallet integration

> Navigate to your Scaffold-Lisk project directory and start the development server:

```sh
yarn start
```

📱 Open [http://localhost:3000](http://localhost:3000) to see your existing app from Challenge 2.

---

## Understanding Blockchain Events 🧠

Smart contracts emit events when things happen. For example:

```solidity
// When someone transfers tokens, this event is emitted:
event Transfer(address from, address to, uint256 value);
```

**Why are events useful?**
- 📜 **See transaction history**: What happened in your contracts
- 🔍 **Filter data**: Only show events you care about
- ⚡ **Better performance**: More efficient than checking contract state repeatedly

---

## Checkpoint 1: 📃 Create Events Page

Let's create a simple page to display contract events. We'll build this step by step using a wrapper component approach.

### Step 1: Create the Complete Wrapper Structure

First, create `packages/nextjs/app/events/page.tsx` with the complete structure and placeholder comments:

```tsx
"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { formatEther } from "viem";

const Events: NextPage = () => {
  // TODO: Step 2 - Add state variables for managing the page

  // TODO: Step 3 - Add event fetching logic

  // TODO: Step 4 - Add wallet connection check

  return (
    <div className="container mx-auto px-4 py-8">
      {/* TODO: Step 5 - Add page header */}

      {/* TODO: Step 6 - Add event type tabs */}

      {/* TODO: Step 7 - Add events table */}
    </div>
  );
};

export default Events;
```

Now let's fill in each section step by step:

### Step 2: Add State Variables

Replace the `TODO: Step 2` comment with our state variables:

```tsx
  // State for managing the page
  const { isConnected } = useAccount();
  const [eventType, setEventType] = useState<"token" | "nft">("token");
```

### Step 3: Add Event Fetching Logic

Replace the `TODO: Step 3` comment with event fetching:

```tsx
  // Get token transfer events
  const { data: tokenEvents, isLoading: tokenLoading } = useScaffoldEventHistory({
    contractName: "MyToken",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: true,
  });

  // Get NFT transfer events
  const { data: nftEvents, isLoading: nftLoading } = useScaffoldEventHistory({
    contractName: "MyNFT",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: true,
  });

  // Determine which events to show based on selected tab
  const currentEvents = eventType === "token" ? tokenEvents || [] : nftEvents || [];
  const isLoading = eventType === "token" ? tokenLoading : nftLoading;
```

### Step 4: Add Wallet Connection Check

Replace the `TODO: Step 4` comment with the wallet check (place this before the return statement):

```tsx
  // Show connection prompt if wallet not connected
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Contract Events</h2>
            <p>Please connect your wallet to view events</p>
          </div>
        </div>
      </div>
    );
  }
```

### Step 5: Add Page Header

Replace the `TODO: Step 5` comment with the page header:

```tsx
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">📜 Contract Events</h1>
        <p className="text-center text-gray-600">
          View transaction history for your contracts
        </p>
      </div>
```

### Step 6: Add Event Type Tabs

Replace the `TODO: Step 6` comment with the tab selector:

```tsx
      <div className="flex justify-center mb-6">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${eventType === "token" ? "tab-active" : ""}`}
            onClick={() => setEventType("token")}
          >
            Token Transfers ({tokenEvents?.length || 0})
          </button>
          <button
            className={`tab ${eventType === "nft" ? "tab-active" : ""}`}
            onClick={() => setEventType("nft")}
          >
            NFT Activity ({nftEvents?.length || 0})
          </button>
        </div>
      </div>
```

### Step 7: Add Events Table

Replace the `TODO: Step 7` comment with the complete events table:

```tsx
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            {eventType === "token" ? "🪙 Token Events" : "🎨 NFT Events"}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : currentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No events found</p>
              <p className="text-sm">
                {eventType === "token"
                  ? "Transfer some tokens to see events here"
                  : "Mint some NFTs to see events here"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>{eventType === "token" ? "Amount" : "Token ID"}</th>
                    <th>Block</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents.slice(0, 20).map((event, index) => (
                    <tr key={`${event.log.transactionHash}-${index}`}>
                      <td>
                        <Address address={event.args.from} size="sm" />
                      </td>
                      <td>
                        <Address address={event.args.to} size="sm" />
                      </td>
                      <td>
                        {eventType === "token" ? (
                          <span className="font-mono">
                            {Number(formatEther(event.args[2] || 0n)).toFixed(4)} LSEA
                          </span>
                        ) : (
                          <span className="badge badge-primary">
                            #{event.args[2]?.toString()}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm">{event.log.blockNumber.toString()}</span>
                      </td>
                      <td>
                        <a
                          href={`https://sepolia-blockscout.lisk.com/tx/${event.log.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-outline"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
```

> **⚠️ Technical Note**: The `useScaffoldEventHistory` hook returns events with a nested structure where:
> - Transaction details are in `event.log` (not directly on `event`)
> - Event arguments can be accessed by name (`event.args.from`) or by index (`event.args[2]`)
> - For the Transfer event, the third argument (index 2) contains either the token amount or NFT ID
> - This is why we use `event.log.transactionHash` instead of `event.transactionHash` and `event.args[2]` instead of `event.args.value`

🎉 **Great!** You now have a basic events page that displays contract events!

### Update Navigation

Add the events page to your navigation. Edit `packages/nextjs/components/Header.tsx`:

```tsx
// Find the navigation section and add the Events link:
<div className="navbar-center hidden lg:flex">
  <ul className="menu menu-horizontal px-1">
    <li><Link href="/">Home</Link></li>
    <li><Link href="/events">Events</Link></li>
    <li><Link href="/debug">Debug Contracts</Link></li>
    <li><Link href="/blockexplorer">Block Explorer</Link></li>
  </ul>
</div>
```

---

## Checkpoint 2: 🚀 Test & Deploy

Now let's test your events page and deploy it!

### Test Your Events Page

1. **Start your development server**:
   ```sh
   yarn start
   ```

2. **Navigate to your events page**:
   - Visit http://localhost:3000/events
   - Connect your wallet
   - Try switching between Token and NFT tabs

3. **Test the functionality**:
   - Make some token transfers to generate events
   - Mint some NFTs to see NFT activity
   - Check that events appear in real-time

### Deploy Your dApp

1. **Build your app**:
   ```sh
   yarn build
   ```

2. **Deploy to Vercel**:
   - Push your changes to GitHub:
   ```sh
   git add .
   git commit -m "feat: add events page with search and pagination"
   git push origin main
   ```
   - Deploy via Vercel dashboard
   - Test your live events page

---

## 🎯 Submit Your Challenge

Go to [Week 3 Submission](https://speedrunlisk.xyz/sea-campaign/week/3) and submit:

- ✅ **Frontend URL**: Your deployed Vercel URL with `/events` route
- ✅ **Events Page**: Screenshots showing your events page working
- ✅ **Contract Addresses**: Your MyToken and MyNFT contract addresses from Week 1
- ✅ **GitHub Repository**: Link to your updated code repository

---

## 💡 What You Learned

✅ **Blockchain Events**: How to read and display contract events
✅ **Event Listening**: Using `useScaffoldEventHistory` to fetch contract data
✅ **Real-time Updates**: Events automatically update when new transactions occur
✅ **Component Structure**: Building React components step-by-step with placeholder comments
✅ **Web3 Integration**: Connecting smart contract events to your frontend interface

## 🚀 Next Steps

- Add search functionality to filter events
- Implement pagination for large event lists
- Create charts to visualize event data over time
- Add more event types from your contracts

**Need help?** Join our [@LiskSEA Telegram](https://t.me/LiskSEA)! 💬

---

> 💬 Problems, questions, comments on the stack? Post them to [@LiskSEA](https://t.me/LiskSEA)
