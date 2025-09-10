# Week 1: Deploy & Verify Your First Contracts

## Challenge Overview
Deploy an ERC20 token and ERC721 NFT contract to Lisk Sepolia, then verify them on the block explorer.

## Step-by-Step Guide

### 1. Create Your Token Contract
```solidity
// contracts/MyToken.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("My SEA Token", "MSEA") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
```

### 2. Create Your NFT Contract
```solidity
// contracts/MyNFT.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("SEA Builder Badge", "SBB") {}

    function mint(address to) public {
        _mint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }
}
```

### 3. Deploy Your Contracts
```bash
# Deploy to Lisk Sepolia
yarn hardhat:deploy --network liskSepolia

# Note the contract addresses from the output
```

### 4. Verify on Block Explorer

Visit [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com):
1. Paste your contract address
2. Go to "Contract" tab
3. Click "Verify & Publish"
4. Upload your contract source code
5. Confirm verification

### 5. Submit Your Challenge

Go to [Week 1 Submission](/sea-campaign/week/1) and provide:
- ✅ GitHub repository URL
- ✅ Token contract address 
- ✅ NFT contract address
- ✅ Deploy transaction hash
- ✅ Social media post URL
- ✅ Your country
- ✅ Telegram handle

### Success Criteria
- Both contracts deployed successfully
- Both contracts verified on block explorer
- Social media post with #SpeedrunLiskSEA #W1 @LiskSEA
- All submission fields completed

## Tips for Success
- Test locally first with `yarn hardhat:chain`
- Keep your private key secure
- Double-check contract addresses before submitting
- Include a screenshot in your social post

**Need help?** Join our Telegram support group! 💬