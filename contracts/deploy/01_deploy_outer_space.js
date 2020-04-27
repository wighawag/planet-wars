module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const outerSpaceDeployResult = await deployIfDifferent(
    ["data"],
    "OuterSpace",
    {from: deployer},
    "OuterSpace"
  );
  if (outerSpaceDeployResult.newlyDeployed) {
    const outerSpaceContract = outerSpaceDeployResult.contract;
    log(
      `OuterSpacedeployed at ${outerSpaceContract.address} for ${outerSpaceDeployResult.receipt.gasUsed} gas`
    );
  }
};
