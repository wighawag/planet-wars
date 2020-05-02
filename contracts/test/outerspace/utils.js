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
  let deltaTime = 0;
  return {
    getTime() {
      return Math.floor(Date.now() / 1000) + deltaTime;
    },
    async increaseTime(t) {
      await increaseTime(t);
      deltaTime += t;
    },
    outerSpaceContract: await ethers.getContract("OuterSpace"),
    outerSpace: new OuterSpace(OuterSpaceDeployment.linkedData),
    players: playersAsContracts,
  };
}

async function sendInSecret(player, {from, quantity, to}) {
  const secret = Wallet.createRandom().privateKey;
  const toHash = solidityKeccak256(["bytes32", "uint256"], [secret, to.location.id]);
  const receipt = await waitFor(player.OuterSpace.send(from.location.id, quantity, toHash));
  let event;
  for (const eventEmitted of receipt.events) {
    if (eventEmitted.event === "FleetSent") {
      event = eventEmitted;
      break;
    }
  }
  const distanceSquared =
    Math.pow(to.location.globalX - from.location.globalX, 2) + Math.pow(to.location.globalY - from.location.globalY, 2);
  const distance = Math.floor(Math.sqrt(distanceSquared));
  const timeRequired = BigNumber.from(distance)
    .mul(1 * 3600 * 10000)
    .div(from.stats.speed)
    .toNumber();
  return {
    timeRequired,
    distance,
    fleetId: event.args[1],
    to: to.location.id,
    secret,
  };
}

function convertPlanetCallData(o) {
  if (typeof o === "number") {
    return o;
  }
  if (typeof o === "string") {
    return o;
  }
  if (o._isBigNumber && o.lte(2147483647) && o.gte(-2147483647)) {
    return o.toNumber();
  }
  return o.toString();
}

async function fetchPlanetState(contract, planet) {
  const planetData = await contract.callStatic.getPlanet(planet.location.id);
  const statsFromContract = objMap(planet.stats, convertPlanetCallData);
  // check as validty assetion:
  for (const key of Object.keys(statsFromContract)) {
    const value = statsFromContract[key];
    if (value !== planet.stats[key]) {
      throw new Error(`${key}: ${planet.stats[key]} not equal to contract stats : ${value} `);
    }
  }
  const state = objMap(planetData.state, convertPlanetCallData);
  return {
    ...planet,
    state,
    getNumSpaceships(time) {
      return state.numSpaceships + Math.floor(((time - state.lastUpdated) * state.productionRate) / 3600);
    },
  };
}

module.exports = {
  setupOuterSpace,
  sendInSecret,
  fetchPlanetState,
  convertPlanetCallData,
};
