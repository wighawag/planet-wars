const {assert, should, expect} = require("local-chai");
const {expectRevert, increaseTime, getTime, waitFor, objMap} = require("local-utils");
const {sendInSecret, setupOuterSpace} = require("./utils");
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
    const {pointer, location: planet0} = outerSpace.findNextPlanet();
    const {location: planet1} = outerSpace.findNextPlanet(pointer);
    await waitFor(players[0].OuterSpace.stake(planet0.id, 1));
    await waitFor(players[1].OuterSpace.stake(planet1.id, 1));

    const {fleetId, secret, to} = await sendInSecret(players[1], {
      from: planet1.id,
      quantity: 10,
      to: planet0.id,
    });
    await increaseTime(10000);
    console.log({planet0, planet1});
    const distanceSquared =
      Math.pow(planet0.globalX - planet1.globalX, 2) + Math.pow(planet0.globalY - planet1.globalY, 2);
    const distance = Math.floor(Math.sqrt(distanceSquared));
    console.log({distance, distanceSquared});
    await waitFor(players[1].OuterSpace.resolveFleet(fleetId, to, distance, secret));
  });
});
