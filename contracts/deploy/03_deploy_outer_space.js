// const {Wallet} = require("@ethersproject/wallet");
module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const stakingToken = await deployments.get("StakingToken");

  const genesisHash = "0xe0c3fa9ae97fc9b60baae605896b5e3e7cecb6baaaa4708162d1ec51e8d65a69"; // Wallet.createRandom().privateKey; // "0x65be7a7bf414b6901742efbc6b946d730511e460cc16812c1c0aacc6f1bd9980"; // Wallet.createRandom().privateKey;
  console.log({genesisHash});
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
