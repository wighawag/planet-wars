const {assert, should, expect} = require("local-chai");
const {expectRevert, increaseTime, getTime, waitFor, objMap} = require("local-utils");
const {sendInSecret, setupOuterSpace, fetchPlanetState} = require("./utils");
const {BigNumber} = require("ethers");

describe("OuterSpace", function () {
  it("user can acquire virgin planet", async function () {
    const {players, outerSpace} = await setupOuterSpace();
    const {location} = outerSpace.findNextPlanet();
    await waitFor(players[0].OuterSpace.stake(location.id, 1));
  });

  it("user cannot acquire planet already onwed by another player", async function () {
    const {players, outerSpace} = await setupOuterSpace();
    const {location} = outerSpace.findNextPlanet();
    await waitFor(players[0].OuterSpace.stake(location.id, 1));
    await expectRevert(players[1].OuterSpace.stake(location.id, 1));
  });

  // TODO cannot exceed maxStake at first
  // TODO cannot exceed maxSTake after adding more

  it("user can attack other player's planet", async function () {
    const {players, outerSpace} = await setupOuterSpace();
    let planet0 = await fetchPlanetState(players[0].OuterSpace, outerSpace.findNextPlanet());
    let planet1 = await fetchPlanetState(players[0].OuterSpace, outerSpace.findNextPlanet(planet0.pointer));
    await waitFor(players[0].OuterSpace.stake(planet0.location.id, 1));
    await waitFor(players[1].OuterSpace.stake(planet1.location.id, 1));
    planet0 = await fetchPlanetState(players[0].OuterSpace, planet0);
    planet1 = await fetchPlanetState(players[0].OuterSpace, planet1);

    const {fleetId, secret, to, distance, timeRequired} = await sendInSecret(players[1], {
      from: planet1,
      quantity: 10,
      to: planet0,
    });
    await increaseTime(timeRequired);
    await waitFor(players[1].OuterSpace.resolveFleet(fleetId, to, distance, secret));
    const new_planet0 = await fetchPlanetState(players[0].OuterSpace, planet0);
    const new_planet1 = await fetchPlanetState(players[0].OuterSpace, planet1);
    const result = {new_planet0, new_planet1, planet0, planet1};
    console.log(result);
    const time = getTime();
    console.log(objMap(result, (o) => o.getNumSpaceships(time)));
  });
});
