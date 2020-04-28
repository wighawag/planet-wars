module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const stakingToken = await deployments.get("StakingToken");

  const contract = await deployIfDifferent(
    ["data"],
    "OuterSpace",
    {from: deployer},
    "OuterSpace",
    stakingToken.address
  );
  if (contract.newlyDeployed) {
    log(`OuterSpacedeployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
