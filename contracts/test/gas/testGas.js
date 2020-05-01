const {assert, should, expect} = require("local-chai");
const {expectRevert, increaseTime, getTime, waitFor, objMap} = require("local-utils");
const {sendInSecret, setupOuterSpace} = require("../outerspace/utils");

describe("GAS: OuterSpace", function () {
  // it("get next available virgin planet", async function () {
  //   const {players, outerSpace} = await setupOuterSpace();
  //   const planetStats = outerSpace.findNextAvailablePlanet();
  //   const receipt = await waitFor(players[0].OuterSpace.functions.getPlanetStats(planetStats.location));
  //   console.log({gasUsed: receipt.gasUsed.toString()});
  // });
});
