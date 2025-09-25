# Development Setup Guide

## Install Scaffold-Lisk

### 1. Clone the Template

```bash
git clone https://github.com/LiskHQ/scaffold-lisk.git my-lisk-project
cd my-lisk-project
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure for Lisk Sepolia

Create `packages/hardhat/.env`:

```
DEPLOYER_PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key (optional)
```

Update `packages/hardhat/hardhat.config.ts`:

```typescript
liskSepolia: {
  url: "https://rpc.sepolia-api.lisk.com",
  accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  chainId: 4202,
},
```

### 4. Test Your Setup

Start the frontend:

```bash
yarn start
```

Your app should load at `http://localhost:3000`

Deploy a test contract:

```bash
yarn hardhat:deploy --network liskSepolia
```

If everything works, you're ready for Week 1! 🎉

## Troubleshooting

### Common Issues

1. **"Network not found"** - Double-check your RPC URL and chain ID
2. **"Insufficient funds"** - Get more test ETH from the faucet
3. **"Deploy failed"** - Check your private key has ETH balance

### Getting Help

- Telegram support group: [Link]
- Office hours: Wednesdays 8pm SGT
- GitHub issues: Create detailed bug reports
