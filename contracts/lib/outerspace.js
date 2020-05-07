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

function toByteString(from, width) {
  return hexZeroPad(BigNumber.from(from).toTwos(width).toHexString(), Math.floor(width / 8));
}
function OuterSpace(genesisHash) {
  this.genesisHash = genesisHash;
  this.genesis = new Random(genesisHash);
  this.cache = {};
}
OuterSpace.prototype.getPlanetStats = function ({x, y}) {
  const id = "" + x + "," + y;
  const inCache = this.cache[id];
  if (typeof inCache !== "undefined") {
    return inCache;
  }
  const _genesis = this.genesis;

  const xStr = toByteString(x, 128);
  const yStr = toByteString(y, 128);

  const location = hexConcat([yStr, xStr]);

  const hasPlanet = _genesis.r_u8(location, 1, 3) == 1;
  if (!hasPlanet) {
    this.cache[id] = null;
    return null;
  }

  const subX = 1 - _genesis.r_u8(location, 2, 3);
  const subY = 1 - _genesis.r_u8(location, 3, 3);

  const maxStake = _genesis.r_normalFrom(
    location,
    4,
    "0x0001000200030004000500070009000A000A000C000F00140019001E00320064"
  );
  const production = _genesis.r_normalFrom(
    location,
    5,
    "0x0708083409600a8c0bb80ce40e100e100e100e101068151819c81e7823282ee0"
  );
  const attack = 4000 + _genesis.r_normal(location, 6) * 400;
  const defense = 4000 + _genesis.r_normal(location, 7) * 400;
  const speed = 5010 + _genesis.r_normal(location, 8) * 334;
  const natives = 2000 + _genesis.r_normal(location, 8) * 100;

  const type = _genesis.r_u8(location, 255, 7);

  const data = {
    location: {
      id: location,
      x,
      y,
      subX,
      subY,
      globalX: x * 4 + subX,
      globalY: y * 4 + subY,
    },
    type,
    stats: {
      subX,
      subY,
      maxStake,
      production,
      attack,
      defense,
      speed,
      natives,
    },
  };
  this.cache[id] = data;
  return data;
};

// let path = [];
function nextInSpiral(pointer) {
  if (!pointer) {
    // path = [{x: 0, y: 0, dx: 0, dy: -1}];
    return {x: 0, y: 0, dx: 0, dy: -1, index: 0};
  }

  let dx = pointer.dx;
  let dy = pointer.dy;
  const x = pointer.x + dx;
  const y = pointer.y + dy;

  if ((x == 0 && y == -1) || x == y || (x < 0 && x == -y) || (x > 0 && -x - 1 == y)) {
    const tmp = dy;
    dy = -dx;
    dx = tmp;
  }

  // path.push({x, y, dx, dy});

  return {
    index: pointer.index + 1,
    x,
    y,
    dx,
    dy,
  };
}

OuterSpace.prototype.findNextPlanet = function (pointer) {
  let planet;
  while (!planet) {
    pointer = nextInSpiral(pointer);
    planet = this.getPlanetStats(pointer);
  }
  return {stats: planet.stats, location: planet.location, pointer};
};

module.exports = {
  OuterSpace,
  Random,
};
