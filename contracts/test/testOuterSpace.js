const {assert, should, expect} = require("local-chai");
const {expectRevert, increaseTime, getTime} = require("local-utils");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");
const {utils, Wallet} = require("ethers");
const {solidityKeccak256} = utils;

async function createPlayerAsContracts(player, contractNames) {
  const obj = {};
  for (const contractName of contractNames) {
    obj[contractName] = await ethers.getContract(contractName, player);
  }
  obj.address = player;
  return obj;
}

async function start() {
  const {players} = await getNamedAccounts();
  await deployments.fixture();
  const playersAsContracts = [];
  for (const player of players) {
    const playerObj = await createPlayerAsContracts(player, ["OuterSpace"]);
    playersAsContracts.push(playerObj);
  }
  return {
    players: playersAsContracts,
  };
}

async function sendInSecret(player, {from, quantity, to}) {
  const secret = Wallet.createRandom().privateKey;
  const toHash = solidityKeccak256(["bytes32", "uint256"], [secret, to]);
  const receipt = await player.OuterSpace.send(from, quantity, toHash).then((tx) => tx.wait());
  let event;
  for (const eventEmitted of receipt.events) {
    if (eventEmitted.event === "SquadSent") {
      event = eventEmitted;
      break;
    }
  }
  return {
    squadId: event.args[1],
    to,
    secret,
  };
}

describe("OuterSpace", function () {
  it("user can acquire virgin planet", async function () {
    const {players} = await start();
    await players[0].OuterSpace.stake(1, 1).then((tx) => tx.wait());
  });

  it("user cannot acquire planet already onwed by another player", async function () {
    const {players} = await start();
    await players[0].OuterSpace.stake(1, 1).then((tx) => tx.wait());
    await expectRevert(players[1].OuterSpace.stake(1, 1).then((tx) => tx.wait()));
  });

  it("user can attack other player's planet", async function () {
    const {players} = await start();
    await players[0].OuterSpace.stake(1, 1).then((tx) => tx.wait());
    await players[1].OuterSpace.stake(2, 1).then((tx) => tx.wait());

    const {squadId, secret, to} = await sendInSecret(players[1], {from: 2, quantity: 10, to: 1});
    await increaseTime(10000);
    await players[1].OuterSpace.resolveSquad(squadId, to, secret).then((tx) => tx.wait());
  });

  // it("user can setup bounty and reward user to attack a planet", async function () {
  //   const {players} = await start();
  //   await players[0].OuterSpace.stake(1, 1).then((tx) => tx.wait());
  //   await players[1].OuterSpace.stake(2, 1).then((tx) => tx.wait());
  //   const {squadId, secret, to} = await sendInSecret(players[1], {from: 2, quantity: 10, to: 1});
  //   // wait
  //   await players[1].OuterSpace.resolveSquad(squadId, to, secret).then((tx) => tx.wait());
  // });
});
