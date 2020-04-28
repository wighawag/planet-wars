const {assert, should, expect} = require("local-chai");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");

async function start() {
  const {players} = await getNamedAccounts();
  await deployments.fixture();
  return {
    players,
    outerSpaceAsPlayer0: await ethers.getContract("OuterSpace", players[0]),
  };
}

describe("OuterSpace", function () {
  it("user can acquire virgin planet", async function () {
    const {players, outerSpaceAsPlayer0} = await start();
    await outerSpaceAsPlayer0.stake(1, 1);
  });
});
