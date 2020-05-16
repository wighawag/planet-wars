const {getNamedAccounts, ethers, deployments} = require("@nomiclabs/buidler");
const {BigNumber} = require("ethers");
const {OuterSpace} = require("../lib/outerspace");

const waitFor = (p) => p.then((tx) => tx.wait());

async function main() {
  const {players} = await getNamedAccounts();

  const OuterSpaceDeployment = await deployments.get("OuterSpace");
  const outerSpace = new OuterSpace(OuterSpaceDeployment.linkedData);

  let planet;
  let stableTokenUnit = BigNumber.from("1000000000000000000");
  for (let i = 0; i < 4; i++) {
    const outerSpaceContract = await ethers.getContract("OuterSpace", players[i]);
    planet = outerSpace.findNextPlanet(planet ? planet.pointer : undefined);
    await waitFor(outerSpaceContract.stake(players[i], planet.location.id, stableTokenUnit));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
