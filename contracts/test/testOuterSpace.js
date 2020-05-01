const {assert, should, expect} = require("local-chai");
const {expectRevert, increaseTime, getTime, waitFor} = require("local-utils");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");
const {utils, Wallet, BigNumber} = require("ethers");
const {hexConcat, hexZeroPad} = require("@ethersproject/bytes");
const {solidityKeccak256} = utils;

function objMap(obj, func) {
  const newObj = {};
  Object.keys(obj).map(function (key, index) {
    const keyAsNumber = parseInt(key, 10);
    if (isNaN(keyAsNumber) || keyAsNumber >= obj.length) {
      newObj[key] = func(obj[key], index);
    }
  });
  return newObj;
}

function toByteString(from, width) {
  return hexZeroPad(BigNumber.from(from).toTwos(width).toHexString(), Math.floor(width / 8));
}
function OuterSpace(genesisHash) {
  this.genesisHash = genesisHash;
}
OuterSpace.prototype.getPlanetStats = function ({x, y, dx, dy, index}) {
  const gridY = toByteString(y, 120);
  const gridX = toByteString(x, 120);
  const gridLocation = hexConcat([gridY, gridX]);

  const hasPlanet = BigNumber.from(
    solidityKeccak256(["int240", "bytes32", "uint8"], [gridLocation, this.genesisHash, 1])
  )
    .mod(3)
    .eq(1);
  if (!hasPlanet) {
    return null;
  }
  const xy = BigNumber.from(solidityKeccak256(["int240", "bytes32", "uint8"], [gridLocation, this.genesisHash, 2]))
    .mod(9)
    .toNumber();

  const subX = (xy % 3) - 1;
  const subY = Math.floor(xy / 3) - 1;

  const xyPart = hexConcat([toByteString(subY, 8), toByteString(subX, 8)]);
  const location = hexConcat([gridLocation, xyPart]);

  return {
    genesisHash: this.genesisHash,
    location,
    x,
    y,
    dx,
    dy,
    index,
    subX,
    subY,
  };
};

// let path = [];
function nextInSpiral(current) {
  if (!current) {
    // path = [{x: 0, y: 0, dx: 0, dy: -1}];
    return {x: 0, y: 0, dx: 0, dy: -1, index: 0};
  }

  let dx = current.dx;
  let dy = current.dy;
  const x = current.x + dx;
  const y = current.y + dy;

  if ((x == 0 && y == -1) || x == y || (x < 0 && x == -y) || (x > 0 && -x - 1 == y)) {
    const tmp = dy;
    dy = -dx;
    dx = tmp;
  }

  // path.push({x, y, dx, dy});

  return {
    index: current.index + 1,
    x,
    y,
    dx,
    dy,
  };
}

OuterSpace.prototype.findNextAvailablePlanet = function (current) {
  let planetStats;
  while (!planetStats) {
    current = nextInSpiral(current);
    planetStats = this.getPlanetStats(current);
  }
  return planetStats;
};

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

function Random(seed) {
  this.seed = seed;
}
Random.prototype.r_u8 = function () {}; // TODO

describe("OuterSpace", function () {
  it("user can acquire virgin planet", async function () {
    const {players, outerSpace} = await start();
    const planet = outerSpace.findNextAvailablePlanet();
    const ctPlanet = await players[0].OuterSpace.callStatic.getPlanet(planet.location);
    console.log({ctPlanet: objMap(ctPlanet, (o) => o.toString())});
    await waitFor(players[0].OuterSpace.stake(planet.location, 1));
  });

  it("user cannot acquire planet already onwed by another player", async function () {
    const {players, outerSpace} = await start();
    const planet = outerSpace.findNextAvailablePlanet();
    await waitFor(players[0].OuterSpace.stake(planet.location, 1));
    await expectRevert(players[1].OuterSpace.stake(planet.location, 1));
  });

  it("user can attack other player's planet", async function () {
    const {players, outerSpace} = await start();
    const planet0 = outerSpace.findNextAvailablePlanet();
    const planet1 = outerSpace.findNextAvailablePlanet(planet0);
    await waitFor(players[0].OuterSpace.stake(planet0.location, 1));
    await waitFor(players[1].OuterSpace.stake(planet1.location, 1));

    const {squadId, secret, to} = await sendInSecret(players[1], {
      from: planet1.location,
      quantity: 10,
      to: planet0.location,
    });
    await increaseTime(10000);
    await waitFor(players[1].OuterSpace.resolveSquad(squadId, to, secret));
  });

  // it("user can setup bounty and reward user to attack a planet", async function () {
  //   const {players} = await start();
  //   await waitFor(players[0].OuterSpace.stake(1, 1));
  //   await waitFor(players[1].OuterSpace.stake(2, 1));
  //   const {squadId, secret, to} = await sendInSecret(players[1], {from: 2, quantity: 10, to: 1});
  //   // wait
  //   await waitFor(players[1].OuterSpace.resolveSquad(squadId, to, secret));
  // });
});
