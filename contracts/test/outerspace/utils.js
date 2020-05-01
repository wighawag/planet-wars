const {expectRevert, increaseTime, getTime, waitFor, objMap} = require("local-utils");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");
const {utils, Wallet, BigNumber} = require("ethers");
const {solidityKeccak256} = utils;
const {OuterSpace} = require("../../lib/outerspace");

async function createPlayerAsContracts(player, contractNames) {
  const obj = {};
  for (const contractName of contractNames) {
    obj[contractName] = await ethers.getContract(contractName, player);
  }
  obj.address = player;
  return obj;
}

async function setupOuterSpace() {
  const {players} = await getNamedAccounts();
  await deployments.fixture();
  const playersAsContracts = [];
  for (const player of players) {
    const playerObj = await createPlayerAsContracts(player, ["OuterSpace"]);
    playersAsContracts.push(playerObj);
  }
  const OuterSpaceDeployment = await deployments.get("OuterSpace");
  return {
    outerSpace: new OuterSpace(OuterSpaceDeployment.linkedData),
    players: playersAsContracts,
  };
}

async function sendInSecret(player, {from, quantity, to}) {
  const secret = Wallet.createRandom().privateKey;
  const toHash = solidityKeccak256(["bytes32", "uint256"], [secret, to]);
  const receipt = await waitFor(player.OuterSpace.send(from, quantity, toHash));
  let event;
  for (const eventEmitted of receipt.events) {
    if (eventEmitted.event === "FleetSent") {
      event = eventEmitted;
      break;
    }
  }
  return {
    fleetId: event.args[1],
    to,
    secret,
  };
}

module.exports = {
  setupOuterSpace,
  sendInSecret,
};
