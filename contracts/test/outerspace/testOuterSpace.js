const {assert, should, expect} = require("local-chai");
const {expectRevert, waitFor, objMap} = require("local-utils");
const {sendInSecret, setupOuterSpace, fetchPlanetState} = require("./utils");
const {BigNumber} = require("@ethersproject/bignumber");

const stableTokenUnit = BigNumber.from("1000000000000000000");
describe("OuterSpace", function () {
  it("user can acquire virgin planet", async function () {
    const {players, outerSpace} = await setupOuterSpace();
    const {location} = outerSpace.findNextPlanet();
    await waitFor(players[0].OuterSpace.stake(location.id, stableTokenUnit));
  });

  it("user cannot acquire planet already onwed by another player", async function () {
    const {players, outerSpace} = await setupOuterSpace();
    const {location} = outerSpace.findNextPlanet();
    await waitFor(players[0].OuterSpace.stake(location.id, stableTokenUnit));
    await expectRevert(players[1].OuterSpace.stake(location.id, stableTokenUnit));
  });

  // TODO cannot exceed maxStake at first
  // TODO cannot exceed maxSTake after adding more

  it("user can attack other player's planet", async function () {
    const {players, outerSpace, outerSpaceContract, increaseTime, getTime} = await setupOuterSpace();
    let planet0 = await fetchPlanetState(outerSpaceContract, outerSpace.findNextPlanet());
    let planet1 = await fetchPlanetState(outerSpaceContract, outerSpace.findNextPlanet(planet0.pointer));
    await waitFor(players[0].OuterSpace.stake(planet0.location.id, stableTokenUnit));
    await waitFor(players[1].OuterSpace.stake(planet1.location.id, stableTokenUnit));
    planet0 = await fetchPlanetState(outerSpaceContract, planet0);
    planet1 = await fetchPlanetState(outerSpaceContract, planet1);

    const {fleetId, secret, to, distance, timeRequired} = await sendInSecret(players[1], {
      from: planet1,
      quantity: planet1.getNumSpaceships(getTime()),
      to: planet0,
    });
    await increaseTime(timeRequired);
    await waitFor(players[1].OuterSpace.resolveFleet(fleetId, to, distance, secret));
  });

  it("planet production maches estimate", async function () {
    const {players, outerSpace, outerSpaceContract, increaseTime, getTime} = await setupOuterSpace();
    let planet = await fetchPlanetState(outerSpaceContract, outerSpace.findNextPlanet());
    await waitFor(players[0].OuterSpace.stake(planet.location.id, stableTokenUnit));
    planet = await fetchPlanetState(outerSpaceContract, planet);
    await sendInSecret(players[0], {
      from: planet,
      quantity: planet.getNumSpaceships(getTime()),
      to: planet,
    });
    await increaseTime(1000);
    let new_planet = await fetchPlanetState(outerSpaceContract, planet);
    await sendInSecret(players[0], {
      from: planet,
      quantity: new_planet.getNumSpaceships(getTime()),
      to: planet,
    });
    await expectRevert(
      sendInSecret(players[0], {
        from: planet,
        quantity: 1,
        to: planet,
      })
    );
  });
});
