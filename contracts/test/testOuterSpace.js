const {assert, should, expect} = require("local-chai");
const {expectRevert, increaseTime, getTime, waitFor} = require("local-utils");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");
const {utils, Wallet, BigNumber} = require("ethers");
const {hexConcat, hexZeroPad} = require("@ethersproject/bytes");
const {solidityKeccak256} = utils;

function Random(seed) {
  this.seed = seed;
}
Random.prototype.r_u8 = function (r, i, mod) {
  return BigNumber.from(solidityKeccak256(["uint256", "bytes32", "uint8"], [r, this.seed, i]))
    .mod(mod)
    .toNumber();
};
Random.prototype.r_normal = function (r, i) {
  const n_m7_5_sd3 = "0x01223334444555555666666677777777888888889999999AAAAAABBBBCCCDDEF";
  const index = this.r_u8(r, i, 64) + 2;
  return BigNumber.from("0x" + n_m7_5_sd3[index]).toNumber();
};
Random.prototype.r_normalFrom = function (r, i, selection) {
  const index = this.r_normal(r, i);
  return BigNumber.from(
    "0x" + selection[index * 4 + 2] + selection[index * 4 + 3] + selection[index * 4 + 4] + selection[index * 4 + 5]
  ).toNumber();
};

function objMap(obj, func, options) {
  const newObj = {};
  Object.keys(obj).map(function (key, index) {
    const keyAsNumber = parseInt(key, 10);
    if (isNaN(keyAsNumber) || keyAsNumber >= obj.length) {
      let item = obj[key];
      if (options && options.depth > 0 && typeof item === "object") {
        item = objMap(item, func, {depth: options.depth - 1});
      } else {
        item = func(item, index);
      }
      newObj[key] = item;
    }
  });
  return newObj;
}

function toByteString(from, width) {
  return hexZeroPad(BigNumber.from(from).toTwos(width).toHexString(), Math.floor(width / 8));
}
function OuterSpace(genesisHash) {
  this.genesisHash = genesisHash;
  this.genesis = new Random(genesisHash);
}
OuterSpace.prototype.getPlanetStats = function ({x, y, dx, dy, index}) {
  const _genesis = this.genesis;

  const xStr = toByteString(x, 128);
  const yStr = toByteString(y, 128);

  const location = hexConcat([yStr, xStr]);

  const hasPlanet = _genesis.r_u8(location, 1, 3) == 1;
  if (!hasPlanet) {
    return null;
  }

  const subX = 1 - _genesis.r_u8(location, 2, 3);
  const subY = 1 - _genesis.r_u8(location, 3, 3);

  const maxStake = _genesis.r_normalFrom(
    location,
    4,
    "0x0001000200030004000500070009000A000A000C000F00140019001E00320064"
  );
  const efficiency = 4000 + _genesis.r_normal(location, 5) * 400;
  const attack = 4000 + _genesis.r_normal(location, 6) * 400;
  const defense = 4000 + _genesis.r_normal(location, 7) * 400;
  const speed = 4000 + _genesis.r_normal(location, 8) * 400;

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
    maxStake,
    efficiency,
    attack,
    defense,
    speed,
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

describe("OuterSpace", function () {
  it("user can acquire virgin planet", async function () {
    const {players, outerSpace} = await start();
    const planetStats = outerSpace.findNextAvailablePlanet();
    const planet = await players[0].OuterSpace.callStatic.getPlanet(planetStats.location);
    console.log(objMap(planet, (o) => o.toString(), {depth: 1}));
    console.log({planetStats});
    await waitFor(players[0].OuterSpace.stake(planetStats.location, 1));
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
