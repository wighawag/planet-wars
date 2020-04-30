const {Wallet} = require("ethers");
module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const stakingToken = await deployments.get("StakingToken");

  const genesisHash = Wallet.createRandom().privateKey; // "0x65be7a7bf414b6901742efbc6b946d730511e460cc16812c1c0aacc6f1bd9980"; // Wallet.createRandom().privateKey;
  const contract = await deployIfDifferent(
    ["data"],
    "OuterSpace",
    {from: deployer, linkedData: genesisHash},
    "OuterSpace",
    stakingToken.address,
    genesisHash
  );
  if (contract.newlyDeployed) {
    log(`OuterSpacedeployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
