const {assert, should, expect} = require("local-chai");
const {objMap} = require("local-utils");
const {sendInSecret, setupOuterSpace} = require("./utils");

describe("JS <-> Solidity equivalence", function () {
  it("planet stats computed from js equal stats from the contract", async function () {
    const {players, outerSpace} = await setupOuterSpace();
    const {location, stats} = outerSpace.findNextPlanet();
    const planet = await players[0].OuterSpace.callStatic.getPlanet(location.id);
    const statsFromContract = objMap(planet.stats, (o) => {
      if (typeof o === "number") {
        return o;
      }
      if (typeof o === "string") {
        return o;
      }
      if (o._isBigNumber) {
        return o.toNumber();
      }
      return o.toString();
    });
    // console.log({stats});
    // console.log({statsFromContract});
    expect(statsFromContract).to.eql(stats);
  });
});
