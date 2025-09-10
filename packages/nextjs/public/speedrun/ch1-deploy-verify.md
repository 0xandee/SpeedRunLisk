# 🚩 Challenge: 🚀 Deploy & Verify Your First Contracts

📚 This tutorial is meant for developers that already understand the [ 🖍️ basics ](https://www.youtube.com/watch?v=MlJPjJQZtC8).

🧑‍🏫 If you would like a more gentle introduction for developers, watch our 15 video [🎥 Web2 to Web3](https://www.youtube.com/playlist?list=PLJz1HruEnenAf80uOfDwBPqaliJkjKg69) series.

---

🚀 Deploy and verify your first smart contracts on Lisk:

👷‍♀️ You'll compile and deploy both an ERC20 token and ERC721 NFT contract using modern Solidity best practices. Then, you'll use a template NextJS app full of important Lisk components and hooks. Finally, you'll deploy your contracts to Lisk Sepolia testnet and verify them on Lisk Blockscout! 🌟

🌟 The final deliverable is verified smart contracts on Lisk Sepolia testnet with a functional frontend that interacts with your contracts. Deploy your contracts to the testnet, then build and upload your app to a public web server. Submit the urls on [SpeedRunLisk.com](https://speedrunlisk.com)!

💬 Meet other builders working on this challenge and get help in the [Challenge Telegram](https://t.me/+Y2vqXZZ_pEFhMGMx)!

🤖 If you have any questions during your Challenge, you can try out the [Challenge AI assistant](https://scaffold-eth-assistant.streamlit.app/) for Scaffold-ETH related questions, though note that some answers may need to be adapted for Lisk. For Lisk-specific help, please reach us in Telegram!

## Checkpoint 0: 📦 Environment 📚

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

Then download the challenge to your computer and install dependencies by running:

```sh
git clone https://github.com/LiskHQ/scaffold-lisk.git ch1-deploy-verify
cd ch1-deploy-verify
yarn install
```

> in the same terminal, start your local network (a blockchain emulator in your computer):

```sh
yarn chain
```

> in a second terminal window, 🛰 deploy your contract (locally):

```sh
cd ch1-deploy-verify
yarn deploy
```

> in a third terminal window, start your 📱 frontend:

```sh
cd ch1-deploy-verify
yarn start
```

📱 Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Checkpoint 1: ⛽️ Gas & Wallets 👛

> ⛽️ You'll need to get some funds from the faucet for gas.

> 🦊 At first, **don't** connect MetaMask. If you are already connected, click **Disconnect**.

> 🔥 We'll use burner wallets on localhost.

> 👛 Explore how burner wallets work in 🏗 Scaffold-ETH 2 by opening a new incognito window and navigate to http://localhost:3000. You'll notice it has a new wallet address in the top right. Copy the incognito browser's address and send localhost test funds to it from your first browser (using the **Faucet** button in the bottom left).

> 👨🏻‍🚒 When you close the incognito window, the account is gone forever. Burner wallets are great for local development but you'll move to more permanent wallets when you interact with public networks.

---

## Checkpoint 2: 📝 Create Your Smart Contracts

> ✏️ Now let's create the smart contracts we'll deploy and verify!

### Create Your ERC20 Token Contract

Navigate to `packages/hardhat/contracts/` and create a new file called `MyToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("Lisk SEA Token", "LSEA") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
```

### Create Your ERC721 NFT Contract

In the same directory, create `MyNFT.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("Lisk Builder Badge", "LBB") {}

    function mint(address to) public {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
```

### Update Your Deploy Script

Edit `packages/hardhat/deploy/00_deploy_your_contract.ts` to deploy both contracts:

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy ERC20 Token
  await deploy("MyToken", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy ERC721 NFT
  await deploy("MyNFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployContracts;
deployContracts.tags = ["MyToken", "MyNFT"];
```

> 🏗 Test your contracts locally by running `yarn deploy` in your terminal. You should see both contracts deploy successfully!

---

## Checkpoint 3: 💾 Deploy to Lisk Sepolia! 🛰

🛰 Ready to deploy to Lisk Sepolia testnet?!?

> Change the defaultNetwork in `packages/hardhat/hardhat.config.ts` to `liskSepolia`.

> Make sure your hardhat.config.ts includes the Lisk Sepolia network configuration:

```typescript
liskSepolia: {
  url: "https://rpc.sepolia-api.lisk.com",
  accounts: [deployerPrivateKey],
  verify: {
    etherscan: {
      apiUrl: "https://sepolia-blockscout.lisk.com/api",
    },
  },
},
```

> **Note**: The screenshot above shows Scaffold-ETH, but the process is identical for Lisk. Just ensure you select `liskSepolia` as your network.

🔐 Generate a deployer address with `yarn generate`. This creates a unique deployer address and saves the mnemonic locally.

> This local account will deploy your contracts, allowing you to avoid entering a personal private key.

> **Note**: This screenshot is from Scaffold-ETH, but the command output will be identical for Scaffold-Lisk.

👩‍🚀 Use `yarn account` to view your deployer account balances.

> **Note**: This screenshot is from Scaffold-ETH, but the account display will be identical for Scaffold-Lisk.

⛽️ You will need to send ETH to your deployer address with your wallet, or get it from a public faucet.

> **Lisk Sepolia Faucets:**
> - [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/) - Official Lisk faucet
> - [Alchemy Faucet](https://sepoliafaucet.com/) - Alternative faucet
> - [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) - Another option

> ⚔️ Side Quest: Keep a 🧑‍🎤 [punkwallet.io](https://punkwallet.io) on your phone's home screen and keep it loaded with testnet eth. 🧙‍♂️ You'll look like a wizard when you can fund your deployer address from your phone in seconds.

🚀 Deploy your smart contracts with `yarn deploy`.

> 💬 Hint: You can set the `defaultNetwork` in `hardhat.config.ts` to `liskSepolia` **OR** you can `yarn deploy --network liskSepolia`.

> 🔧 For better reliability and to avoid rate limiting, consider setting up your own API keys in `packages/hardhat/.env`:

```bash
ALCHEMY_API_KEY="your_alchemy_api_key"
ETHERSCAN_API_KEY="your_blockscout_api_key"
```

> 📝 **Save your contract addresses!** You'll need them for verification and submission.

---

## Checkpoint 4: 🚢 Ship your frontend! 🚁

> ✏️ Edit your frontend config in `packages/nextjs/scaffold.config.ts` to change the `targetNetwork` to `chains.liskSepolia` :

> **Note**: In your Scaffold-Lisk config, you'll set `targetNetwork: chains.liskSepolia` instead of the network shown in this screenshot.

> You should see the correct network in the frontend (http://localhost:3000):

> 🦊 Since we have deployed to a public testnet, you will now need to connect using a wallet you own or use a burner wallet. By default 🔥 `burner wallets` are only available on `hardhat` . You can enable them on every chain by setting `onlyLocalBurnerWallet: false` in your frontend config (`scaffold.config.ts` in `packages/nextjs/`)

🧪 Test your contracts on the frontend:
- Connect your wallet
- Try minting an NFT using your deployed contract
- Check your token balance

🚀 Deploy your NextJS App

```shell
yarn vercel
```

> You might need to log in to Vercel first by running `yarn vercel:login`. Once you log in (email, GitHub, etc), the default options should work.

> If you want to redeploy to the same production URL you can run `yarn vercel --prod`. If you omit the `--prod` flag it will deploy it to a preview/test URL.

> Follow the steps to deploy to Vercel. It'll give you a public URL.

⚠️ Run the automated testing function to make sure your app passes

```shell
yarn test
```

> This will run the Hardhat tests in `packages/hardhat/test/` to ensure your contracts work correctly. All tests should pass before submitting your challenge.

#### Configuration of Third-Party Services for Production-Grade Apps.

By default, 🏗 Scaffold-ETH 2 provides predefined API keys for popular services such as Alchemy and Etherscan. This allows you to begin developing and testing your applications more easily, avoiding the need to register for these services.
This is great to complete your **SpeedRunLisk**.

For production-grade applications, it's recommended to obtain your own API keys (to prevent rate limiting issues). You can configure these at:

- 🔷`ALCHEMY_API_KEY` variable in `packages/hardhat/.env` and `packages/nextjs/.env.local`. You can create API keys from the [Alchemy dashboard](https://dashboard.alchemy.com/).

- 📃`ETHERSCAN_API_KEY` variable in `packages/hardhat/.env` with your generated API key. You can get your key [here](https://etherscan.io/myapikey).

> 💬 Hint: It's recommended to store env's for nextjs in Vercel/system env config for live apps and use .env.local for local testing.

---

## Checkpoint 5: 📜 Contract Verification 🔍

🔍 Now for the main event - verifying your smart contracts on Lisk Blockscout!

### Method 1: Automated Verification (Recommended)

You can verify your smart contracts automatically using Hardhat:

```shell
yarn verify --network liskSepolia
```

> ✅ This command will automatically verify all deployed contracts using the deployment artifacts.

> ⚠️ **Note**: If automated verification fails, it's often due to the Blockscout API configuration. Make sure your hardhat.config.ts includes the correct verify configuration for Lisk Sepolia (see the network configuration section above).

### Method 2: Manual Verification via Blockscout

If automated verification doesn't work, you can manually verify on [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com):

1. **Navigate to your contract**:
   - Go to [sepolia-blockscout.lisk.com](https://sepolia-blockscout.lisk.com)
   - Paste your contract address in the search bar
   - Click on the contract address

2. **Start verification**:
   - Click the "Contract" tab
   - Click "Verify & Publish" button
   - Select "Via Solidity file"

3. **Upload contract details**:
   - Contract Address: (your deployed address)
   - Contract Name: `MyToken` or `MyNFT`
   - Compiler Version: `v0.8.17+commit.8df45f5f` (or the exact version from your hardhat.config.ts)
   - Open Source License: MIT
   - Optimization: Enabled (runs: 200)

4. **Upload source code**:
   - Copy and paste your complete contract source code
   - Include all import statements (OpenZeppelin imports will be automatically resolved)
   - Make sure the pragma version matches exactly: `^0.8.0`
   - For the ERC20 contract, use the complete code including the OpenZeppelin import
   - For the ERC721 contract, use the updated version without Counters

5. **Constructor Arguments** (if any):
   - For these contracts, leave blank as they have no constructor arguments

6. **Submit for verification**:
   - Click "Verify & Publish"
   - Wait for the verification to complete

### Verification Troubleshooting

If verification fails:

- ✅ Check that the compiler version matches exactly
- ✅ Ensure all OpenZeppelin imports are included
- ✅ Verify the contract name matches exactly
- ✅ Make sure there are no extra spaces or characters

> 🎯 **Success!** Once verified, you'll see a green checkmark and "Contract Source Code Verified" message.

### Verify Both Contracts

Make sure to verify both:
- 🪙 **MyToken** (ERC20) contract
- 🎨 **MyNFT** (ERC721) contract

> 📝 **Save the verification URLs!** You'll need them for submission.

---

## Checkpoint 6: 📋 Submit Your Challenge

🎯 Time to submit your completed challenge to the SEA Campaign!

Go to [Week 1 Submission](https://speedrunlisk.com/sea-campaign/week/1) and provide:

### Required Submission Fields:
- ✅ **GitHub repository URL** - Your forked scaffold-lisk repo
- ✅ **ERC20 Token contract address** - Your MyToken address on Lisk Sepolia  
- ✅ **ERC721 NFT contract address** - Your MyNFT address on Lisk Sepolia
- ✅ **Deploy transaction hash** - Hash of your deployment tx
- ✅ **Vercel deployment URL** - Your live frontend app
- ✅ **Social media post URL** - Your Twitter/X post
- ✅ **Your country** - Required for SEA Campaign
- ✅ **Telegram handle** - For support and community

### Social Media Requirements:

Create a post on Twitter/X with:
- 📸 Screenshot of your verified contracts on Lisk Blockscout
- 🔗 Link to your live Vercel app
- 📝 Brief description of what you built
- 🏷️ **Required hashtags**: `#SpeedrunLiskSEA #W1 @LiskSEA`

### Success Criteria Checklist:

- [ ] Both ERC20 and ERC721 contracts deployed to Lisk Sepolia
- [ ] Both contracts verified on Lisk Blockscout (green checkmark visible)
- [ ] Frontend deployed to Vercel and functional
- [ ] Social media post with required hashtags published
- [ ] All submission fields completed on SpeedRunLisk.com
- [ ] Contracts interact correctly with frontend (mint NFT, check token balance)

---

## ⚔️ Side Quests

### 🌊 OpenSea Integration

> 🎨 Want to see your NFTs on OpenSea? Head to [Testnets OpenSea](https://testnets.opensea.io/)

> 🎫 Make sure you have minted some NFTs on your Vercel app, then connect to OpenSea using that same wallet.

> 🔍 Search for your contract address or navigate directly to see your collection!

### 🔧 Advanced Contract Features

Try enhancing your contracts:

- Add access controls (Ownable)
- Implement token URI for metadata
- Add batch minting functionality
- Create a token sale contract

### 🎯 Challenge Extensions

- Create a frontend component that displays both your ERC20 balance and NFT collection
- Add a transfer function to send tokens/NFTs to other addresses
- Implement a simple marketplace for your NFTs

---

## 💡 Tips for Success

- **Test locally first**: Always test with `yarn chain` and `yarn deploy` before deploying to testnet
- **Keep private keys secure**: Never commit mnemonics or private keys to Git repositories
- **Double-check addresses**: Verify contract addresses before submitting - copy them carefully
- **Save everything**: Keep a record of all addresses, transaction hashes, and URLs for submission
- **Gas fees**: Lisk Sepolia has very low gas fees, but still ensure you have enough ETH
- **Ask for help**: Join our Telegram if you get stuck - the community is very helpful!

## 🆘 Troubleshooting

### Common Issues:

**Deployment fails**: 
- Check you have enough ETH for gas fees on Lisk Sepolia
- Verify network configuration in hardhat.config.ts includes `liskSepolia`
- Ensure you're using `yarn deploy --network liskSepolia` or set defaultNetwork

**Verification fails**:
- Ensure compiler version matches exactly (0.8.17)
- Check all imports are included in the source code
- Verify contract name spelling (case-sensitive)
- Make sure optimization settings match (enabled: true, runs: 200)

**Frontend not connecting**:
- Check scaffold.config.ts has `targetNetwork: chains.liskSepolia`
- Ensure wallet is connected to Lisk Sepolia network
- Verify contract addresses match your deployed contracts
- Clear browser cache and reconnect wallet if needed

**Need help?** Join our [Telegram support group](https://t.me/+Y2vqXZZ_pEFhMGMx)! 💬

---

> 🏃 Head to your next challenge [here](https://speedrunlisk.com/speedrun).

> 💬 Problems, questions, comments on the stack? Post them to the [🏗 scaffold-eth developers chat](https://t.me/joinchat/F7nCRK3kI93PoCOk)