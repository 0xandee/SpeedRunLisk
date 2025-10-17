# Build a Simple DEX (Decentralized Exchange)

🏃 This tutorial teaches you to build a decentralized exchange (DEX) from scratch! You'll create an Automated Market Maker (AMM) where users can swap tokens and provide liquidity.

🎯 You'll learn core DeFi concepts: liquidity pools, constant product formula, token swaps, and liquidity provision - the same mechanics used by Uniswap, PancakeSwap, and other major DEXs!

📦 The final deliverable is a working DEX deployed to Lisk Sepolia with a functional frontend where users can swap tokens and add/remove liquidity.

---

## Challenge Overview

Build a simplified decentralized exchange with core AMM functionality.

## Key Requirements

- Create SimpleUSDC stablecoin (ERC20 token)
- Create SimpleDEX contract with AMM logic
- Implement add/remove liquidity functions
- Implement token swap function
- Build swap interface frontend
- Build liquidity management frontend
- Deploy to Lisk Sepolia testnet

## Learning Objectives

- Understand Automated Market Makers (AMMs)
- Learn constant product formula (x * y = k)
- Build liquidity pools
- Implement token swaps with dynamic pricing
- Manage liquidity provider shares
- Create DeFi user interfaces

💬 Meet other builders working on this challenge and get help in the [@LiskSEA Telegram](https://t.me/LiskSEA)!

---

## Understanding Decentralized Exchanges 🧠

Before we build, let's understand what we're creating!

### What is a DEX?

A Decentralized Exchange (DEX) is a platform where users can trade tokens without a central authority.

**Centralized Exchange (CEX) vs Decentralized Exchange (DEX):**

```
CEX (Coinbase, Binance):
  User → Deposits funds → Exchange holds funds → Places order → Exchange matches orders
  ❌ Trust required: Exchange controls your funds
  ❌ Single point of failure
  ✅ Fast execution
  ✅ Order books

DEX (Uniswap, PancakeSwap):
  User → Keeps funds in wallet → Interacts with smart contract → Instant swap
  ✅ Non-custodial: You control your funds
  ✅ Permissionless: Anyone can trade
  ✅ Transparent: All code is open source
  ❌ Gas fees
```

### What is an Automated Market Maker (AMM)?

Traditional exchanges use **order books** (buy/sell orders). DEXs use **Automated Market Makers** instead!

**How AMMs Work:**

```
Traditional Order Book:
  Buyer: "I'll buy 1 ETH for $2,000"
  Seller: "I'll sell 1 ETH for $2,005"
  → Orders must match → Requires many traders

AMM (Liquidity Pool):
  Pool contains: 100 ETH + 200,000 USDC
  Anyone can trade instantly against the pool
  Price is automatic based on pool ratio
  → No order matching needed → Always available
```

### Liquidity Pools

A liquidity pool is a smart contract holding two tokens (e.g., ETH and USDC).

**Example Pool:**
```
Pool contains:
  - 100 ETH (Token A)
  - 200,000 USDC (Token B)

Current price:
  1 ETH = 200,000 / 100 = 2,000 USDC
```

**Who provides the tokens?**

Liquidity Providers (LPs) deposit tokens into the pool and earn trading fees!

```
Liquidity Provider:
  1. Deposits 10 ETH + 20,000 USDC into pool
  2. Receives LP (Liquidity Provider) tokens representing their share
  3. Earns fees from every trade
  4. Can withdraw anytime by burning LP tokens
```

### The Constant Product Formula

The magic of AMMs: **x * y = k**

```
x = Amount of Token A in pool
y = Amount of Token B in pool
k = Constant (doesn't change)

Example:
  Pool: 100 ETH × 200,000 USDC = 20,000,000 (k)

When someone swaps:
  - They add tokens to one side
  - They remove tokens from the other side
  - k stays constant (approximately)
  - Price changes based on the new ratio
```

**Example Swap:**

```
Before swap:
  Pool: 100 ETH × 200,000 USDC = 20,000,000 (k)
  Price: 1 ETH = 2,000 USDC

User swaps 10 ETH for USDC:
  New ETH in pool: 100 + 10 = 110 ETH
  New USDC must satisfy: 110 × y = 20,000,000
  y = 20,000,000 / 110 = 181,818 USDC

  USDC out: 200,000 - 181,818 = 18,182 USDC
  Actual price paid: 18,182 / 10 = 1,818 USDC per ETH

After swap:
  Pool: 110 ETH × 181,818 USDC = 20,000,000 (k) ✅
  New price: 1 ETH = 1,653 USDC (price moved!)
```

**Key insight:** Big trades move the price more! This is called **price impact**.

### Why Provide Liquidity?

Liquidity Providers earn trading fees!

```
Trading Fee: 0.3% per swap
- User swaps 1,000 USDC for ETH
- Fee: 1,000 × 0.003 = 3 USDC
- Fee stays in pool (increases value for LPs)
- All LPs earn proportionally to their share
```

**LP Share Calculation:**

```
Your LP tokens / Total LP tokens = Your share %

Example:
  - Total LP tokens: 1,000
  - You own: 100 LP tokens
  - Your share: 100 / 1,000 = 10%
  - You own 10% of all fees earned!
```

---

## Checkpoint 0: 📦 Prerequisites 📚

Before you begin, you need:

- ✅ **Node.js** (>= v18.17)
- ✅ **Yarn** (v1 or v2+)
- ✅ **Git**
- ✅ **Basic understanding of ERC20 tokens** (from Challenge 1)
- ✅ **Scaffold-Lisk environment** set up

> This tutorial is **standalone** - you don't need to complete previous challenges, but familiarity with Challenge 1 (ERC20 tokens) is helpful!

### Setup

Clone and install:

```sh
git clone https://github.com/LiskHQ/scaffold-lisk.git ch6-mini-dex
cd ch6-mini-dex
yarn install
```

Test your setup:

```sh
# Terminal 1: Start local chain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start frontend
yarn start
```

📱 Open [http://localhost:3000](http://localhost:3000) to verify everything works.

---

## Checkpoint 1: 💵 Create Stablecoin Contract

> 🪙 First, let's create a simple stablecoin to trade against!

### Why Do We Need a Stablecoin?

Our DEX will trade two tokens:
- **Token A:** MyToken (we'll create this, or reuse from Challenge 1)
- **Token B:** SimpleUSDC (stablecoin we're about to create)

Having a stablecoin makes prices easy to understand (e.g., "1 MyToken = 2 USDC" is clearer than "1 MyToken = 0.0005 ETH").

### Create SimpleUSDC Contract

Create `packages/hardhat/contracts/SimpleUSDC.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleUSDC
 * @notice A simple ERC20 stablecoin for testing and DEX trading
 * @dev Mimics USDC but with public minting for easy testing
 */
contract SimpleUSDC is ERC20 {
    /**
     * @notice Constructor mints initial supply to deployer
     */
    constructor() ERC20("Simple USDC", "sUSDC") {
        // Mint 1,000,000 USDC to deployer (for initial liquidity and testing)
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @notice Public minting function for testing
     * @dev In production, this would be restricted!
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Override decimals to match USDC (6 decimals)
     * @return uint8 Number of decimals (6)
     */
    function decimals() public pure override returns (uint8) {
        return 6; // USDC uses 6 decimals, not 18
    }
}
```

### 🧠 Understanding SimpleUSDC

**Key Features:**

1. **ERC20 Standard**: Inherits from OpenZeppelin's ERC20
2. **Initial Supply**: Mints 1,000,000 sUSDC to deployer
3. **Public Minting**: Anyone can mint (for testing only!)
4. **6 Decimals**: Matches real USDC (not 18 like most tokens)

**Why 6 Decimals?**

```
18 decimals (most tokens): 1.0 token = 1000000000000000000 wei
6 decimals (USDC):         1.0 token = 1000000 wei

Real USDC uses 6 decimals, so we match it for realism!
```

**Security Note:**

> ⚠️ The `mint()` function is public for easy testing. In production, this would be restricted to admin/minter roles!

### Create MyToken Contract (if you don't have it)

If you didn't complete Challenge 1, create `packages/hardhat/contracts/MyToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MyToken
 * @notice A simple ERC20 token for DEX trading
 */
contract MyToken is ERC20 {
    constructor() ERC20("My Token", "MTK") {
        // Mint 1,000,000 tokens to deployer
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @notice Public minting function for testing
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

### Create Deployment Script

Create `packages/hardhat/deploy/00_deploy_your_contract.ts`:

```typescript
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy MyToken
  await deploy("MyToken", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy SimpleUSDC
  await deploy("SimpleUSDC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployContracts;
deployContracts.tags = ["MyToken", "SimpleUSDC"];
```

### Deploy Locally

Test your contracts:

```sh
yarn deploy
```

You should see:

```
deploying "MyToken"...
✅ MyToken deployed at: 0x...

deploying "SimpleUSDC"...
✅ SimpleUSDC deployed at: 0x...
```

### Deploy to Lisk Sepolia

```sh
yarn deploy --network liskSepolia
```

### Verify on Blockscout

```sh
yarn hardhat-verify --network liskSepolia --contract contracts/MyToken.sol:MyToken YOUR_MYTOKEN_ADDRESS
yarn hardhat-verify --network liskSepolia --contract contracts/SimpleUSDC.sol:SimpleUSDC YOUR_USDC_ADDRESS
```

> 📝 **Save your contract addresses!** You'll need them for the DEX deployment.

---

## Checkpoint 2: 🏦 Create DEX Contract

> 🚀 Now for the main event - the DEX smart contract!

### Understanding SimpleDEX Architecture

Our DEX will be a single contract managing:
- **Token reserves** (how many tokens are in the pool)
- **Liquidity shares** (tracking who owns what % of the pool)
- **Swaps** (trading one token for another)
- **Add/Remove liquidity** (depositing/withdrawing tokens)

**Contract Structure:**

```
SimpleDEX
├── State Variables
│   ├── tokenA (MyToken)
│   ├── tokenB (SimpleUSDC)
│   ├── reserveA (amount of Token A in pool)
│   ├── reserveB (amount of Token B in pool)
│   ├── totalLiquidity (total LP shares)
│   └── liquidity[address] (LP shares per user)
│
├── Functions
│   ├── addLiquidity() - Deposit tokens, get LP shares
│   ├── removeLiquidity() - Burn LP shares, get tokens back
│   ├── swap() - Trade token A for B (or vice versa)
│   └── getSwapAmount() - Calculate swap output (view function)
```

### Create SimpleDEX Contract

Create `packages/hardhat/contracts/SimpleDEX.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleDEX
 * @notice A simplified decentralized exchange using constant product AMM (x * y = k)
 * @dev Supports a single token pair with add/remove liquidity and swap functions
 */
contract SimpleDEX is ReentrancyGuard {
    // Token addresses
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    // Pool reserves
    uint256 public reserveA;
    uint256 public reserveB;

    // Liquidity tracking
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    // Fee (0.3% = 3/1000)
    uint256 public constant FEE_NUMERATOR = 3;
    uint256 public constant FEE_DENOMINATOR = 1000;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityMinted
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityBurned
    );
    event Swap(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * @notice Constructor sets the token pair
     * @param _tokenA Address of first token
     * @param _tokenB Address of second token
     */
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Tokens must be different");

        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /**
     * @notice Add liquidity to the pool
     * @param amountA Amount of token A to add
     * @param amountB Amount of token B to add
     * @return liquidityMinted Amount of liquidity shares minted
     */
    function addLiquidity(uint256 amountA, uint256 amountB)
        external
        nonReentrant
        returns (uint256 liquidityMinted)
    {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        // Transfer tokens from user to contract
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        // Calculate liquidity to mint
        if (totalLiquidity == 0) {
            // First liquidity provider: liquidity = sqrt(amountA * amountB)
            // We use a simple formula: liquidity = amountA (for simplicity)
            liquidityMinted = amountA;
        } else {
            // Subsequent liquidity: maintain pool ratio
            // liquidityMinted = (amountA / reserveA) * totalLiquidity
            // We take the minimum to prevent manipulation
            uint256 liquidityA = (amountA * totalLiquidity) / reserveA;
            uint256 liquidityB = (amountB * totalLiquidity) / reserveB;
            liquidityMinted = liquidityA < liquidityB ? liquidityA : liquidityB;
        }

        require(liquidityMinted > 0, "Insufficient liquidity minted");

        // Update state
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;
        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidityMinted);
    }

    /**
     * @notice Remove liquidity from the pool
     * @param liquidityAmount Amount of liquidity shares to burn
     * @return amountA Amount of token A returned
     * @return amountB Amount of token B returned
     */
    function removeLiquidity(uint256 liquidityAmount)
        external
        nonReentrant
        returns (uint256 amountA, uint256 amountB)
    {
        require(liquidityAmount > 0, "Amount must be greater than 0");
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");

        // Calculate amounts to return (proportional to share)
        amountA = (liquidityAmount * reserveA) / totalLiquidity;
        amountB = (liquidityAmount * reserveB) / totalLiquidity;

        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        // Update state
        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;
        reserveA -= amountA;
        reserveB -= amountB;

        // Transfer tokens back to user
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidityAmount);
    }

    /**
     * @notice Swap one token for another
     * @param tokenIn Address of token to swap in
     * @param amountIn Amount of token to swap in
     * @return amountOut Amount of token received
     */
    function swap(address tokenIn, uint256 amountIn)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Amount must be greater than 0");
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid token"
        );

        // Determine input/output tokens and reserves
        bool isTokenA = tokenIn == address(tokenA);
        (IERC20 tokenInContract, IERC20 tokenOutContract) = isTokenA
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (reserveA, reserveB)
            : (reserveB, reserveA);

        // Transfer input token from user
        tokenInContract.transferFrom(msg.sender, address(this), amountIn);

        // Calculate output amount with fee
        // Formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        // With 0.3% fee: amountIn = amountIn * (1 - 0.003) = amountIn * 997/1000
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;

        require(amountOut > 0, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");

        // Update reserves
        if (isTokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        // Transfer output token to user
        tokenOutContract.transfer(msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    /**
     * @notice Calculate swap output amount (view function)
     * @param tokenIn Address of token to swap in
     * @param amountIn Amount of token to swap in
     * @return amountOut Estimated amount of token to receive
     */
    function getSwapAmount(address tokenIn, uint256 amountIn)
        external
        view
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Amount must be greater than 0");
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid token"
        );

        // Determine reserves
        bool isTokenA = tokenIn == address(tokenA);
        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (reserveA, reserveB)
            : (reserveB, reserveA);

        // Calculate output with fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Get current pool state
     * @return _reserveA Reserve of token A
     * @return _reserveB Reserve of token B
     * @return _totalLiquidity Total liquidity shares
     */
    function getReserves()
        external
        view
        returns (uint256 _reserveA, uint256 _reserveB, uint256 _totalLiquidity)
    {
        return (reserveA, reserveB, totalLiquidity);
    }

    /**
     * @notice Get user's liquidity position
     * @param user Address to check
     * @return liquidityAmount User's liquidity shares
     * @return sharePercentage User's percentage of pool (in basis points, e.g., 1000 = 10%)
     */
    function getUserLiquidity(address user)
        external
        view
        returns (uint256 liquidityAmount, uint256 sharePercentage)
    {
        liquidityAmount = liquidity[user];
        sharePercentage = totalLiquidity > 0
            ? (liquidityAmount * 10000) / totalLiquidity
            : 0;
    }
}
```

### 🧠 Understanding the SimpleDEX Contract

Let's break down the key functions:

#### **1. addLiquidity() Function**

```solidity
function addLiquidity(uint256 amountA, uint256 amountB)
    external
    returns (uint256 liquidityMinted)
```

**What it does:**
1. Takes tokens from user (requires approval first!)
2. Calculates how many LP shares to mint
3. Updates reserves and liquidity
4. Gives user LP shares

**LP Share Calculation:**

```
First deposit (pool is empty):
  liquidityMinted = amountA
  (We use a simple formula for the first deposit)

Subsequent deposits:
  liquidityMinted = (amountA / reserveA) * totalLiquidity
  (Must match pool ratio to prevent manipulation)
```

**Example:**

```
Pool state: 100 MTK, 200 sUSDC, 100 LP tokens

User adds: 10 MTK, 20 sUSDC
Calculation: (10 / 100) * 100 = 10 LP tokens

New state: 110 MTK, 220 sUSDC, 110 LP tokens
User now owns: 10 / 110 = 9.09% of pool
```

#### **2. removeLiquidity() Function**

```solidity
function removeLiquidity(uint256 liquidityAmount)
    external
    returns (uint256 amountA, uint256 amountB)
```

**What it does:**
1. Burns user's LP shares
2. Calculates proportional token amounts
3. Updates reserves and liquidity
4. Returns tokens to user

**Withdrawal Calculation:**

```
amountA = (liquidityAmount / totalLiquidity) * reserveA
amountB = (liquidityAmount / totalLiquidity) * reserveB
```

**Example:**

```
Pool state: 110 MTK, 220 sUSDC, 110 LP tokens
User owns: 10 LP tokens (9.09% share)

User withdraws 10 LP tokens:
  amountA = (10 / 110) * 110 = 10 MTK
  amountB = (10 / 110) * 220 = 20 sUSDC

New state: 100 MTK, 200 sUSDC, 100 LP tokens
```

#### **3. swap() Function**

```solidity
function swap(address tokenIn, uint256 amountIn)
    external
    returns (uint256 amountOut)
```

**What it does:**
1. Takes input token from user
2. Calculates output using constant product formula
3. Applies 0.3% fee
4. Updates reserves
5. Sends output token to user

**Swap Calculation (with fee):**

```
Constant product: (reserveIn + amountIn) × (reserveOut - amountOut) = k

With 0.3% fee:
  effectiveAmountIn = amountIn × 0.997 (99.7% after fee)
  amountOut = (effectiveAmountIn × reserveOut) / (reserveIn + effectiveAmountIn)
```

**Example:**

```
Pool: 100 MTK × 200 sUSDC = 20,000 (k)

User swaps 10 MTK for sUSDC:
  effectiveAmountIn = 10 × 0.997 = 9.97 MTK
  amountOut = (9.97 × 200) / (100 + 9.97) = 18.13 sUSDC

New pool: 110 MTK × 181.87 sUSDC = 20,005 (k increased due to fee!)
```

**Why does k increase?** The 0.3% fee stays in the pool, increasing value for all LPs!

#### **4. getSwapAmount() Function**

```solidity
function getSwapAmount(address tokenIn, uint256 amountIn)
    external
    view
    returns (uint256 amountOut)
```

**What it does:**
- Calculates swap output WITHOUT executing the swap
- Used by frontend to show price quotes
- Pure view function (doesn't modify state)

### Security Features

**1. ReentrancyGuard:**
```solidity
contract SimpleDEX is ReentrancyGuard {
    function swap(...) external nonReentrant { ... }
}
```
Prevents reentrancy attacks during token transfers.

**2. Checks Before Transfers:**
```solidity
require(amountOut > 0, "Insufficient output amount");
require(amountOut < reserveOut, "Insufficient liquidity");
```
Validates calculations before transferring tokens.

**3. Immutable Tokens:**
```solidity
IERC20 public immutable tokenA;
IERC20 public immutable tokenB;
```
Token addresses can't be changed after deployment.

### Create DEX Deployment Script

Create `packages/hardhat/deploy/01_deploy_dex.ts`:

```typescript
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySimpleDEX: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get deployed token addresses
  const myToken = await get("MyToken");
  const simpleUSDC = await get("SimpleUSDC");

  console.log("Deploying SimpleDEX with:");
  console.log("  Token A (MyToken):", myToken.address);
  console.log("  Token B (SimpleUSDC):", simpleUSDC.address);

  await deploy("SimpleDEX", {
    from: deployer,
    args: [myToken.address, simpleUSDC.address],
    log: true,
    autoMine: true,
  });
};

export default deploySimpleDEX;
deploySimpleDEX.tags = ["SimpleDEX"];
deploySimpleDEX.dependencies = ["MyToken", "SimpleUSDC"]; // Deploy tokens first
```

> 💡 **Note:** The `dependencies` array ensures tokens are deployed before the DEX!

### Deploy Locally

```sh
yarn deploy
```

You should see:

```
deploying "MyToken"...
✅ MyToken deployed at: 0x...

deploying "SimpleUSDC"...
✅ SimpleUSDC deployed at: 0x...

Deploying SimpleDEX with:
  Token A (MyToken): 0x...
  Token B (SimpleUSDC): 0x...

deploying "SimpleDEX"...
✅ SimpleDEX deployed at: 0x...
```

### Deploy to Lisk Sepolia

```sh
yarn deploy --network liskSepolia
```

### Verify on Blockscout

```sh
yarn hardhat-verify --network liskSepolia --contract contracts/SimpleDEX.sol:SimpleDEX YOUR_DEX_ADDRESS
```

> 📝 **Save your SimpleDEX address!** You'll need it for the frontend.

---

## Checkpoint 3: 💱 Build Swap Interface

> 🎨 Let's create a beautiful swap interface!

### Create DEX Page

Create `packages/nextjs/app/dex/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { LiquidityPanel } from "~~/components/example-ui/LiquidityPanel";
import { SwapPanel } from "~~/components/example-ui/SwapPanel";

const DEX: NextPage = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"swap" | "liquidity">("swap");

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Simple DEX</h2>
            <p>Please connect your wallet to use the DEX</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">💱 Simple DEX</h1>
        <p className="text-center text-gray-600">
          Swap tokens and provide liquidity using automated market maker (AMM)
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex justify-center mb-6">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeTab === "swap" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("swap")}
          >
            💱 Swap
          </button>
          <button
            className={`tab ${activeTab === "liquidity" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("liquidity")}
          >
            💧 Liquidity
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex justify-center">
        {activeTab === "swap" ? <SwapPanel /> : <LiquidityPanel />}
      </div>
    </div>
  );
};

export default DEX;
```

### Create SwapPanel Component

Create `packages/nextjs/components/example-ui/SwapPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const SwapPanel = () => {
  const { address: connectedAddress } = useAccount();
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isTokenAInput, setIsTokenAInput] = useState(true); // true = MTK->sUSDC, false = sUSDC->MTK
  const [isApprovedA, setIsApprovedA] = useState(false);
  const [isApprovedB, setIsApprovedB] = useState(false);

  // Get token addresses from DEX contract
  const { data: tokenAAddress } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenA",
  });

  const { data: tokenBAddress } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenB",
  });

  // Get token balances
  const { data: balanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: balanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Get token symbols
  const { data: symbolA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: symbolB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "symbol",
  });

  // Check approvals
  const { data: allowanceA, refetch: refetchAllowanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "allowance",
    args: [connectedAddress, tokenAAddress],
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "allowance",
    args: [connectedAddress, tokenBAddress],
  });

  // Update approval status
  useEffect(() => {
    if (inputAmount && allowanceA && allowanceB) {
      const inputAmountBN = parseUnits(inputAmount, isTokenAInput ? 18 : 6);
      setIsApprovedA(allowanceA >= inputAmountBN);
      setIsApprovedB(allowanceB >= inputAmountBN);
    }
  }, [inputAmount, allowanceA, allowanceB, isTokenAInput]);

  // Get swap quote
  const { data: swapQuote } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getSwapAmount",
    args: [
      isTokenAInput ? tokenAAddress : tokenBAddress,
      inputAmount ? parseUnits(inputAmount, isTokenAInput ? 18 : 6) : 0n,
    ],
  });

  // Update output amount when quote changes
  useEffect(() => {
    if (swapQuote) {
      const formatted = formatUnits(swapQuote, isTokenAInput ? 6 : 18);
      setOutputAmount(parseFloat(formatted).toFixed(6));
    } else {
      setOutputAmount("");
    }
  }, [swapQuote, isTokenAInput]);

  // Approve functions
  const { writeAsync: approveTokenA } = useScaffoldContractWrite({
    contractName: "MyToken",
    functionName: "approve",
    args: [tokenAAddress, parseUnits("1000000", 18)], // Approve large amount
  });

  const { writeAsync: approveTokenB } = useScaffoldContractWrite({
    contractName: "SimpleUSDC",
    functionName: "approve",
    args: [tokenBAddress, parseUnits("1000000", 6)], // Approve large amount
  });

  // Swap function
  const { writeAsync: executeSwap } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "swap",
    args: [
      isTokenAInput ? tokenAAddress : tokenBAddress,
      inputAmount ? parseUnits(inputAmount, isTokenAInput ? 18 : 6) : 0n,
    ],
  });

  const handleApprove = async () => {
    try {
      if (isTokenAInput) {
        await approveTokenA();
        notification.success("Token A approved!");
        setTimeout(() => refetchAllowanceA(), 2000);
      } else {
        await approveTokenB();
        notification.success("Token B approved!");
        setTimeout(() => refetchAllowanceB(), 2000);
      }
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
    }
  };

  const handleSwap = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      notification.error("Enter a valid amount");
      return;
    }

    try {
      await executeSwap();
      notification.success("Swap successful!");
      setInputAmount("");
      setOutputAmount("");
    } catch (error) {
      console.error("Swap failed:", error);
      notification.error("Swap failed");
    }
  };

  const handleFlipTokens = () => {
    setIsTokenAInput(!isTokenAInput);
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
  };

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0.0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(4);
  };

  const needsApproval = isTokenAInput ? !isApprovedA : !isApprovedB;

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title justify-center">Swap Tokens</h2>

        {/* Input Token */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">From</span>
            <span className="label-text-alt">
              Balance: {formatBalance(isTokenAInput ? balanceA : balanceB, isTokenAInput ? 18 : 6)}{" "}
              {isTokenAInput ? symbolA : symbolB}
            </span>
          </label>
          <div className="input-group">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered w-full"
              value={inputAmount}
              onChange={e => setInputAmount(e.target.value)}
            />
            <span className="btn btn-ghost">{isTokenAInput ? symbolA : symbolB}</span>
          </div>
        </div>

        {/* Flip Button */}
        <div className="flex justify-center">
          <button className="btn btn-circle btn-sm" onClick={handleFlipTokens}>
            ⇅
          </button>
        </div>

        {/* Output Token */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">To</span>
            <span className="label-text-alt">
              Balance: {formatBalance(isTokenAInput ? balanceB : balanceA, isTokenAInput ? 6 : 18)}{" "}
              {isTokenAInput ? symbolB : symbolA}
            </span>
          </label>
          <div className="input-group">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered w-full"
              value={outputAmount}
              readOnly
            />
            <span className="btn btn-ghost">{isTokenAInput ? symbolB : symbolA}</span>
          </div>
        </div>

        {/* Exchange Rate */}
        {inputAmount && outputAmount && (
          <div className="alert alert-info">
            <span className="text-sm">
              Rate: 1 {isTokenAInput ? symbolA : symbolB} ≈{" "}
              {(parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(6)}{" "}
              {isTokenAInput ? symbolB : symbolA}
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="card-actions justify-end mt-4">
          {needsApproval ? (
            <button className="btn btn-primary btn-block" onClick={handleApprove}>
              Approve {isTokenAInput ? symbolA : symbolB}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-block"
              onClick={handleSwap}
              disabled={!inputAmount || parseFloat(inputAmount) <= 0}
            >
              Swap
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the SwapPanel Component

**Key Features:**

1. **Token Direction Toggle:**
```tsx
const [isTokenAInput, setIsTokenAInput] = useState(true);
// true = Swap MTK -> sUSDC
// false = Swap sUSDC -> MTK
```

2. **Real-time Price Quotes:**
```tsx
const { data: swapQuote } = useScaffoldContractRead({
  contractName: "SimpleDEX",
  functionName: "getSwapAmount",
  args: [tokenIn, amountIn],
});
```
Calls `getSwapAmount()` view function to show output before swapping!

3. **Approval Handling:**
```tsx
const needsApproval = isTokenAInput ? !isApprovedA : !isApprovedB;
```
Checks if DEX is approved to spend tokens, shows approve button if needed.

4. **Decimal Handling:**
- MyToken: 18 decimals
- SimpleUSDC: 6 decimals
- Must use correct decimals for each token!

---

## Checkpoint 4: 💧 Build Liquidity Interface

> 🏊 Let's add liquidity management functionality!

### Create LiquidityPanel Component

Create `packages/nextjs/components/example-ui/LiquidityPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const LiquidityPanel = () => {
  const { address: connectedAddress } = useAccount();
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [isApprovedA, setIsApprovedA] = useState(false);
  const [isApprovedB, setIsApprovedB] = useState(false);

  // Get token addresses
  const { data: tokenAAddress } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenA",
  });

  const { data: tokenBAddress } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenB",
  });

  // Get reserves
  const { data: reserves } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getReserves",
  });

  const reserveA = reserves?.[0] || 0n;
  const reserveB = reserves?.[1] || 0n;
  const totalLiquidity = reserves?.[2] || 0n;

  // Get user liquidity
  const { data: userLiquidityData, refetch: refetchUserLiquidity } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getUserLiquidity",
    args: [connectedAddress],
  });

  const userLiquidity = userLiquidityData?.[0] || 0n;
  const userShareBasisPoints = userLiquidityData?.[1] || 0n;
  const userSharePercent = Number(userShareBasisPoints) / 100; // Convert basis points to percent

  // Get token balances
  const { data: balanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: balanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Get token symbols
  const { data: symbolA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: symbolB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "symbol",
  });

  // Check approvals
  const { data: allowanceA, refetch: refetchAllowanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "allowance",
    args: [connectedAddress, tokenAAddress],
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "allowance",
    args: [connectedAddress, tokenBAddress],
  });

  // Update approval status
  useEffect(() => {
    if (amountA && amountB && allowanceA && allowanceB) {
      const amountABN = parseUnits(amountA, 18);
      const amountBBN = parseUnits(amountB, 6);
      setIsApprovedA(allowanceA >= amountABN);
      setIsApprovedB(allowanceB >= amountBBN);
    }
  }, [amountA, amountB, allowanceA, allowanceB]);

  // Approve functions
  const { writeAsync: approveTokenA } = useScaffoldContractWrite({
    contractName: "MyToken",
    functionName: "approve",
    args: [tokenAAddress, parseUnits("1000000", 18)],
  });

  const { writeAsync: approveTokenB } = useScaffoldContractWrite({
    contractName: "SimpleUSDC",
    functionName: "approve",
    args: [tokenBAddress, parseUnits("1000000", 6)],
  });

  // Add liquidity
  const { writeAsync: addLiquidity } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "addLiquidity",
    args: [amountA ? parseUnits(amountA, 18) : 0n, amountB ? parseUnits(amountB, 6) : 0n],
  });

  // Remove liquidity
  const { writeAsync: removeLiquidity } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "removeLiquidity",
    args: [removeAmount ? parseUnits(removeAmount, 18) : 0n],
  });

  const handleApproveA = async () => {
    try {
      await approveTokenA();
      notification.success("Token A approved!");
      setTimeout(() => refetchAllowanceA(), 2000);
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
    }
  };

  const handleApproveB = async () => {
    try {
      await approveTokenB();
      notification.success("Token B approved!");
      setTimeout(() => refetchAllowanceB(), 2000);
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
    }
  };

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      notification.error("Enter valid amounts");
      return;
    }

    try {
      await addLiquidity();
      notification.success("Liquidity added!");
      setAmountA("");
      setAmountB("");
      setTimeout(() => refetchUserLiquidity(), 2000);
    } catch (error) {
      console.error("Add liquidity failed:", error);
      notification.error("Add liquidity failed");
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeAmount || parseFloat(removeAmount) <= 0) {
      notification.error("Enter valid amount");
      return;
    }

    try {
      await removeLiquidity();
      notification.success("Liquidity removed!");
      setRemoveAmount("");
      setTimeout(() => refetchUserLiquidity(), 2000);
    } catch (error) {
      console.error("Remove liquidity failed:", error);
      notification.error("Remove liquidity failed");
    }
  };

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0.0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(4);
  };

  // Calculate expected output for removing liquidity
  const expectedA =
    removeAmount && totalLiquidity > 0n
      ? (parseUnits(removeAmount, 18) * reserveA) / totalLiquidity
      : 0n;
  const expectedB =
    removeAmount && totalLiquidity > 0n
      ? (parseUnits(removeAmount, 18) * reserveB) / totalLiquidity
      : 0n;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* Pool Stats */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Pool Statistics</h2>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Reserve {symbolA}</div>
              <div className="stat-value text-primary text-2xl">{formatBalance(reserveA, 18)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Reserve {symbolB}</div>
              <div className="stat-value text-secondary text-2xl">{formatBalance(reserveB, 6)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Your Share</div>
              <div className="stat-value text-accent text-2xl">{userSharePercent.toFixed(2)}%</div>
              <div className="stat-desc">{formatBalance(userLiquidity, 18)} LP tokens</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Liquidity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Add Liquidity</h2>

            {/* Token A Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{symbolA} Amount</span>
                <span className="label-text-alt">Balance: {formatBalance(balanceA, 18)}</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered"
                value={amountA}
                onChange={e => setAmountA(e.target.value)}
              />
            </div>

            {/* Token B Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{symbolB} Amount</span>
                <span className="label-text-alt">Balance: {formatBalance(balanceB, 6)}</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered"
                value={amountB}
                onChange={e => setAmountB(e.target.value)}
              />
            </div>

            {/* Pool Ratio Info */}
            {reserveA > 0n && reserveB > 0n && (
              <div className="alert alert-info">
                <span className="text-xs">
                  Current pool ratio: 1 {symbolA} ={" "}
                  {(Number(formatUnits(reserveB, 6)) / Number(formatUnits(reserveA, 18))).toFixed(4)} {symbolB}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="card-actions justify-end mt-4">
              {!isApprovedA && (
                <button className="btn btn-secondary btn-sm" onClick={handleApproveA}>
                  Approve {symbolA}
                </button>
              )}
              {!isApprovedB && (
                <button className="btn btn-secondary btn-sm" onClick={handleApproveB}>
                  Approve {symbolB}
                </button>
              )}
              {isApprovedA && isApprovedB && (
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleAddLiquidity}
                  disabled={!amountA || !amountB}
                >
                  Add Liquidity
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Remove Liquidity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Remove Liquidity</h2>

            {/* LP Token Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">LP Token Amount</span>
                <span className="label-text-alt">Available: {formatBalance(userLiquidity, 18)}</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered"
                value={removeAmount}
                onChange={e => setRemoveAmount(e.target.value)}
              />
            </div>

            {/* Expected Output */}
            {removeAmount && (
              <div className="alert alert-info">
                <div className="text-xs">
                  <p>You will receive:</p>
                  <p>
                    • {formatBalance(expectedA, 18)} {symbolA}
                  </p>
                  <p>
                    • {formatBalance(expectedB, 6)} {symbolB}
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-error btn-block"
                onClick={handleRemoveLiquidity}
                disabled={!removeAmount || parseFloat(removeAmount) <= 0}
              >
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 🧠 Understanding the LiquidityPanel Component

**Key Features:**

1. **Pool Statistics:**
```tsx
<div className="stats stats-vertical lg:stats-horizontal shadow">
  <div className="stat">Reserve A</div>
  <div className="stat">Reserve B</div>
  <div className="stat">Your Share</div>
</div>
```
Shows total pool liquidity and user's share.

2. **Add Liquidity:**
- Dual token inputs (both tokens required)
- Shows current pool ratio
- Requires approval for both tokens
- Calculates LP tokens to receive (handled by contract)

3. **Remove Liquidity:**
- Input LP token amount to burn
- Shows expected token outputs
- Proportional withdrawal based on share

4. **Real-time Calculations:**
```tsx
const expectedA = (removeAmount * reserveA) / totalLiquidity;
const expectedB = (removeAmount * reserveB) / totalLiquidity;
```
Shows exactly what tokens you'll receive before removing liquidity!

### Update Navigation

Edit `packages/nextjs/components/Header.tsx` to add DEX link:

```tsx
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    label: "DEX",
    href: "/dex",
    icon: <ArrowsRightLeftIcon className="h-4 w-4" />,
  },
  // ... other links
];
```

---

## Checkpoint 5: ✅ Test, Deploy & Submit

> 🚀 Let's test everything and deploy!

### Local Testing Checklist

1. **Start development environment:**
```sh
# Terminal 1
yarn chain

# Terminal 2
yarn deploy

# Terminal 3
yarn start
```

2. **Test the complete flow:**

   **A. Get Test Tokens:**
   - Navigate to Debug Contracts page (http://localhost:3000/debug)
   - Find MyToken contract, call `mint()` with your address and amount: `1000000000000000000000` (1000 tokens)
   - Find SimpleUSDC contract, call `mint()` with your address and amount: `1000000000` (1000 sUSDC, remember 6 decimals!)

   **B. Add Initial Liquidity:**
   - Go to DEX page (http://localhost:3000/dex)
   - Click "Liquidity" tab
   - Enter amounts (e.g., 100 MTK and 200 sUSDC)
   - Click "Approve MTK" → approve transaction
   - Click "Approve sUSDC" → approve transaction
   - Click "Add Liquidity" → confirm transaction
   - ✅ Verify your LP tokens and share % appear!

   **C. Test Swap:**
   - Click "Swap" tab
   - Enter amount to swap (e.g., 10 MTK)
   - ✅ Verify output amount appears automatically
   - ✅ Verify exchange rate is shown
   - Click "Approve MTK" if needed
   - Click "Swap" → confirm transaction
   - ✅ Verify your token balances changed!

   **D. Test Remove Liquidity:**
   - Go back to "Liquidity" tab
   - In "Remove Liquidity" section, enter LP token amount
   - ✅ Verify expected token outputs are shown
   - Click "Remove Liquidity" → confirm transaction
   - ✅ Verify you received both tokens back!

3. **Test with Second Account (Important!):**
   - Open incognito window → new burner wallet
   - Send some ETH from faucet for gas
   - Mint tokens for this account
   - Try adding liquidity → verify share % for both accounts
   - Try swapping → verify reserves update correctly

4. **Test Edge Cases:**
   - ⚠️ Try swapping more than you have (should fail)
   - ⚠️ Try removing more liquidity than you own (should fail)
   - ⚠️ Try swapping with no liquidity in pool (should fail)
   - ⚠️ Try adding liquidity without approval (should show approve button)

### Deploy to Lisk Sepolia

1. **Setup testnet wallet:**
```sh
yarn generate  # Generate deployer address
yarn account   # Check balance
```

2. **Get testnet ETH:**
- Use [Lisk Sepolia Faucet](https://docs.lisk.com/lisk-tools/faucets)
- Send ETH to your deployer address

3. **Deploy contracts:**
```sh
yarn deploy --network liskSepolia
```

Save your deployed addresses:
- MyToken: `0x...`
- SimpleUSDC: `0x...`
- SimpleDEX: `0x...`

4. **Verify contracts:**
```sh
yarn hardhat-verify --network liskSepolia --contract contracts/MyToken.sol:MyToken YOUR_MYTOKEN_ADDRESS
yarn hardhat-verify --network liskSepolia --contract contracts/SimpleUSDC.sol:SimpleUSDC YOUR_USDC_ADDRESS
yarn hardhat-verify --network liskSepolia --contract contracts/SimpleDEX.sol:SimpleDEX YOUR_DEX_ADDRESS
```

5. **Add initial liquidity on testnet:**
- Go to your deployed DEX frontend
- Mint test tokens
- Add liquidity (suggested: 100 MTK + 200 sUSDC)
- This makes the pool usable for others!

### Deploy Frontend

```sh
yarn build
git add .
git commit -m "feat: add SimpleDEX with swap and liquidity features"
git push origin main
```

Deploy to Vercel:
- Connect your GitHub repository
- Deploy automatically
- Test your live DEX!

---

## 📝 Submit Your Challenge

🎯 Time to submit your completed Week 6 challenge!

Go to [Week 6 Submission](https://speedrunlisk.xyz/sea-campaign/week/6) and submit:

- ✅ **Frontend URL**: Your deployed Vercel URL with `/dex` route
- ✅ **Contract Addresses**:
  - MyToken contract address
  - SimpleUSDC contract address
  - SimpleDEX contract address
- ✅ **Verified Contracts**: Links to verified contracts on [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com)
- ✅ **GitHub Repository**: Link to your code repository
- ✅ **Transaction Links**:
  - Add liquidity transaction
  - Swap transaction
  - Remove liquidity transaction

**Bonus Points:**

- Share a screenshot of your DEX with pool stats!
- Tweet about building a DEX on Lisk with #LiskSEA
- Add liquidity to help others test swaps!

---

## 🎓 What You Learned

✅ **Automated Market Makers (AMMs)**: How DEXs work without order books

✅ **Constant Product Formula**: The math behind token pricing (x * y = k)

✅ **Liquidity Pools**: How liquidity providers earn fees

✅ **Token Swaps**: Dynamic pricing based on pool reserves

✅ **LP Shares**: Tracking liquidity provider ownership

✅ **DeFi Smart Contracts**: Building production-ready DEX contracts

✅ **DeFi UX Patterns**: Swap interfaces, liquidity management, approvals

---

## 🚀 Going Further

### Advanced Features to Add

**1. Multiple Token Pairs:**

Create a Factory contract to deploy multiple DEX pairs:

```solidity
contract DEXFactory {
    mapping(address => mapping(address => address)) public getPair;

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        // Deploy new SimpleDEX for token pair
        pair = address(new SimpleDEX(tokenA, tokenB));
        getPair[tokenA][tokenB] = pair;
    }
}
```

**2. ERC20 LP Tokens:**

Make LP shares transferable by implementing ERC20:

```solidity
contract SimpleDEX is ERC20, ReentrancyGuard {
    constructor(address _tokenA, address _tokenB)
        ERC20("SimpleDEX LP", "SLP-LP")
    {
        // ...
    }

    function addLiquidity(...) external returns (uint256 liquidityMinted) {
        // Mint ERC20 LP tokens instead of updating mapping
        _mint(msg.sender, liquidityMinted);
    }
}
```

Benefits:
- LP tokens can be transferred
- LP tokens can be used as collateral in other DeFi protocols
- Standard ERC20 compatibility

**3. Fee Distribution:**

Track fees separately and allow LPs to claim them:

```solidity
uint256 public accumulatedFeesA;
uint256 public accumulatedFeesB;

function claimFees() external {
    uint256 userShare = (liquidity[msg.sender] * 10000) / totalLiquidity;
    uint256 feeA = (accumulatedFeesA * userShare) / 10000;
    uint256 feeB = (accumulatedFeesB * userShare) / 10000;
    // Transfer fees to user
}
```

**4. Price Impact Warning:**

Show how much the swap will move the price:

```tsx
const priceImpact = ((outputAmount * reserveIn) / (inputAmount * reserveOut) - 1) * 100;

{priceImpact > 5 && (
  <div className="alert alert-warning">
    ⚠️ High price impact: {priceImpact.toFixed(2)}%
  </div>
)}
```

**5. Slippage Protection:**

Let users set maximum slippage tolerance:

```solidity
function swap(
    address tokenIn,
    uint256 amountIn,
    uint256 minAmountOut  // Minimum output amount
) external returns (uint256 amountOut) {
    amountOut = calculateSwapAmount(tokenIn, amountIn);
    require(amountOut >= minAmountOut, "Slippage exceeded");
    // Execute swap
}
```

**6. Router Contract:**

Enable multi-hop swaps (swap through multiple pairs):

```solidity
contract DEXRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 minAmountOut,
        address[] calldata path,  // [TokenA, TokenB, TokenC]
        address to
    ) external returns (uint256[] memory amounts) {
        // Swap TokenA -> TokenB, then TokenB -> TokenC
    }
}
```

Example: Swap MTK → USDC → ETH in one transaction!

**7. Time-Weighted Average Price (TWAP):**

Track price history for oracle use:

```solidity
struct Observation {
    uint256 timestamp;
    uint256 priceACumulative;
    uint256 priceBCumulative;
}

Observation[] public observations;

function updatePrice() internal {
    uint256 timeElapsed = block.timestamp - observations[observations.length - 1].timestamp;
    uint256 priceA = (reserveB * 1e18) / reserveA;

    observations.push(Observation({
        timestamp: block.timestamp,
        priceACumulative: observations[observations.length - 1].priceACumulative + (priceA * timeElapsed),
        priceBCumulative: // ...
    }));
}
```

**8. Governance Token:**

Create a governance token for DEX parameters:

```solidity
contract DEXGovernance {
    function voteFeeChange(uint256 newFee) external {
        // Vote on changing fee from 0.3% to newFee
    }
}
```

**9. Concentrated Liquidity (Advanced):**

Like Uniswap V3, let LPs provide liquidity in specific price ranges:

```solidity
struct Position {
    uint256 liquidity;
    uint256 lowerPrice;
    uint256 upperPrice;
}
```

Benefits:
- More capital efficient
- Higher fees for active ranges
- More complex to implement

**10. Flash Swaps:**

Allow users to borrow tokens, use them, and repay in one transaction:

```solidity
function flashSwap(
    address tokenOut,
    uint256 amountOut,
    bytes calldata data
) external {
    // Send tokens first
    IERC20(tokenOut).transfer(msg.sender, amountOut);

    // Call user's contract
    IFlashSwapReceiver(msg.sender).onFlashSwap(data);

    // Verify repayment
    require(balance increased, "Flash swap not repaid");
}
```

Use cases: Arbitrage, liquidations, collateral swaps!

---

## 🔧 Troubleshooting

### Contract Issues

**"Insufficient liquidity" error when swapping:**
- Check that pool has liquidity (call `getReserves()`)
- Ensure you're not trying to drain entire pool
- Try swapping a smaller amount

**"Insufficient liquidity minted" error:**
- Amounts might be too small (try larger amounts)
- Check token decimals are correct (18 for MTK, 6 for sUSDC)

**Swap output is 0:**
- Pool might be empty (add liquidity first!)
- Input amount might be 0
- Check you're using correct token addresses

**LP tokens not appearing:**
- Check `getUserLiquidity()` function returns correct amount
- Verify transaction succeeded on Blockscout
- Refresh page and refetch data

### Frontend Issues

**Token balances show as 0:**
- Ensure you minted test tokens
- Check you're connected to correct network
- Verify contract addresses are correct

**"Approve" button not working:**
- Wait for transaction confirmation
- Check Blockscout for transaction status
- Ensure you have enough ETH for gas

**Output amount not updating:**
- Check `getSwapAmount()` is being called
- Verify input amount is valid
- Check pool has liquidity

**Decimals are wrong (amounts look weird):**
- MyToken uses 18 decimals: `parseUnits(amount, 18)`
- SimpleUSDC uses 6 decimals: `parseUnits(amount, 6)`
- LP tokens use 18 decimals: `parseUnits(amount, 18)`
- Always use correct decimals for each token!

**"Transaction will fail" warning:**
- Not enough liquidity in pool
- Insufficient token balance
- Approval not completed
- Wrong decimal precision

### Math Issues

**Understanding price calculation:**
```
Current price = reserveOut / reserveIn

Example:
  Pool: 100 MTK, 200 sUSDC
  Price of MTK = 200 / 100 = 2 sUSDC per MTK
  Price of sUSDC = 100 / 200 = 0.5 MTK per sUSDC
```

**Understanding price impact:**
```
Swap 10 MTK:
  Before: 100 MTK, 200 sUSDC (1 MTK = 2 sUSDC)
  After: 110 MTK, 181.8 sUSDC (1 MTK = 1.65 sUSDC)
  Price impact: (2 - 1.65) / 2 = 17.5%

Big swaps = big price impact!
```

**Understanding LP shares:**
```
First deposit:
  Add 100 MTK + 200 sUSDC
  LP tokens = 100 (simplified)
  Your share = 100%

Second deposit:
  Pool has: 100 MTK, 200 sUSDC, 100 LP tokens
  Add: 10 MTK + 20 sUSDC (same 1:2 ratio)
  LP tokens minted = (10 / 100) * 100 = 10
  Your share = 10 / 110 = 9.09%
```

### Common Questions

**Q: Why do I need to provide both tokens?**
A: You must maintain the pool's ratio. If pool is 1:2 (MTK:sUSDC), you must add 1:2 ratio.

**Q: Can I provide unbalanced liquidity?**
A: No! The contract enforces ratio to prevent price manipulation. You must match the existing pool ratio.

**Q: What happens to the 0.3% fee?**
A: It stays in the pool, increasing the value of all LP tokens! Every swap makes LPs slightly richer.

**Q: How do I calculate my profit as an LP?**
A: Compare token values when you remove liquidity vs when you added. Profit = (value out - value in) = fees earned!

**Q: What is impermanent loss?**
A: If prices change significantly, you might have less value than just holding tokens. It's "impermanent" because it only becomes permanent when you withdraw. Trading fees often compensate for this!

**Q: Why is the swap rate worse than the pool price?**
A: Price impact! Your swap changes the pool ratio. Larger swaps = bigger price impact.

**Q: Can I lose money as an LP?**
A: Yes, through impermanent loss if token prices diverge. However, trading fees often compensate. LPs profit when trading volume is high!

**Need help?** Join our [@LiskSEA Telegram](https://t.me/LiskSEA)! 💬

---

## 🎉 Congratulations!

You've built a fully functional DEX with:
- ✅ Automated Market Maker (constant product formula)
- ✅ Add and remove liquidity
- ✅ Token swaps with dynamic pricing
- ✅ LP share tracking
- ✅ Trading fees
- ✅ Beautiful, intuitive UI

This DEX demonstrates the core mechanics used by Uniswap, PancakeSwap, SushiSwap, and other major DeFi protocols!

### What Makes This Special

**You've learned:**
- How DEXs work without centralized order matching
- The math behind automated market makers
- Why liquidity providers are essential to DeFi
- How to build production-ready DeFi smart contracts
- Modern DeFi user experience patterns

**Real-world impact:**
- Uniswap V2 uses the same constant product formula
- Over $100B in liquidity locked across AMM protocols
- Millions of users trade on DEXs daily
- Core infrastructure of decentralized finance

### Next Steps

- Explore the "Going Further" section for advanced features
- Try building with multiple token pairs
- Implement ERC20 LP tokens
- Add price impact warnings and slippage protection
- Deploy your own production DEX on Lisk mainnet!

**Keep building! 🚀**

---

> 💬 Problems, questions, comments on the stack? Post them to [@LiskSEA](https://t.me/LiskSEA)
