import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySeaCampaignRewards: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying SeaCampaignRewards contract...");

  const seaCampaignRewards = await deploy("SeaCampaignRewards", {
    from: deployer,
    args: [], // Constructor takes no arguments
    log: true,
    autoMine: true,
  });

  console.log(`SeaCampaignRewards deployed at: ${seaCampaignRewards.address}`);

  // Verify the contract on Etherscan if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: seaCampaignRewards.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }

  // Fund the contract with initial budget if on testnet
  if (hre.network.name === "liskSepolia" || hre.network.name === "sepolia") {
    console.log("Funding contract with initial budget...");
    const signer = await hre.ethers.getSigner(deployer);
    const contract = await hre.ethers.getContractAt("SeaCampaignRewards", seaCampaignRewards.address, signer);
    
    // Fund with 0.1 ETH as initial budget for testing
    const fundAmount = hre.ethers.utils.parseEther("0.1");
    const fundTx = await contract.fundContract({ value: fundAmount });
    await fundTx.wait();
    
    console.log(`Contract funded with ${hre.ethers.utils.formatEther(fundAmount)} ETH`);
  }
};

export default deploySeaCampaignRewards;
deploySeaCampaignRewards.tags = ["SeaCampaignRewards"];
deploySeaCampaignRewards.dependencies = [];