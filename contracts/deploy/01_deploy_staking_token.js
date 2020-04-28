module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const contract = await deployIfDifferent(
    ["data"],
    "StakingToken",
    {from: deployer},
    "SimpleERC20TokenWithInitialBalance",
    "1000000000000000000000000000",
    "0x0000000000000000000000000000000000000000"
  );
  if (contract.newlyDeployed) {
    log(`Staking Token at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
