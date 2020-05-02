pragma solidity 0.6.5;
pragma experimental ABIEncoderV2;

import "./StakingWithInterest.sol";
import "./Libraries/Random.sol";

contract OuterSpace is StakingWithInterest {
    using Random for bytes32;

    struct PlanetStats {
        int8 subX;
        int8 subY;
        uint256 maxStake;
        uint256 production;
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 natives;
    }
    struct Planet {
        // PlanetStats stats; // TODO generate on demand from hash
        address owner;
        uint256 lastOwnershipTime;
        uint256 numSpaceships;
        uint256 lastUpdated;
        uint256 productionRate; // computed on stake given
        uint256 stake;
        // uint256[] lastFleets; // TODO deal with front running
    }
    struct Fleet {
        uint256 launchTime;
        address owner;
        uint256 from;
        bytes32 toHash; // to is not revealed until needed // if same as from, then take a specific time (bluff)
        uint256 quantity; // we know how many but not where
    }

    event PlanetAcquired(address acquirer, uint256 location, uint256 stake);
    event FleetSent(address sender, uint256 fleet, uint256 from, uint256 quantity);
    // event SpaceshipRevealed(address owner, uint256 from, uint256 destination, uint256 quantity);
    event FleetArrived(address sender, uint256 fleet, uint256 location);
    event Attack(address sender, uint256 fleet, uint256 fleetLoss, uint256 location, uint256 toLoss, bool won);

    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function stake(uint256 location, uint256 stakeAmount) external {
        address sender = _getSender();
        require(stakeAmount >= 10**18, "minumum stake : 1");
        (Planet storage planet, PlanetStats memory stats) = _getPlanet(location);
        address owner = planet.owner;

        if (planet.owner == address(0)) {
            planet.owner = sender;
            planet.lastOwnershipTime = block.timestamp;
        } else {
            require(sender == owner, "already owned by someone else");
        }

        uint256 currentStake = planet.stake;
        
        if (planet.lastUpdated == 0) {
            (uint256 attackerLoss,) = _computeFight(3600, stats.natives, 10000, 10000); // attacker alwasy win as stats.native is restricted to 3500
            planet.numSpaceships = 3600 - attackerLoss;
        } else {
            uint256 currentnumSpaceships = _getCurrentNumSpaceships(
                planet.numSpaceships,
                planet.lastUpdated,
                planet.productionRate
            );
            planet.numSpaceships = currentnumSpaceships;
        }
        require(currentStake + stakeAmount <= (stats.maxStake * 10**18), "exceeds max stake");
        uint256 newStake = currentStake + stakeAmount;
        planet.stake = newStake;
        planet.productionRate = (stats.production * newStake) / (stats.maxStake * 10**18);
        planet.lastUpdated = block.timestamp;
    }

    function withdraw(uint256 location) external {
        // ensure delay hass passed
    }

    function resolveFleet(
        uint256 fleetId,
        uint256 to,
        uint256 distance,
        bytes32 secret
    ) external {
        _resolveFleetFor(_getSender(), fleetId, to, distance, secret);
    }

    function resolveFleetFor(
        address attacker,
        uint256 fleetId,
        uint256 to,
        uint256 distance,
        bytes32 secret
    ) external {
        address sender = _getSender();
        if (sender != attacker) {
            require(_operators[attacker][sender], "NOT_AUTHORIZED");
        }
        _resolveFleetFor(attacker, fleetId, to, distance, secret);
    }

    function send(
        uint256 from,
        uint256 quantity,
        bytes32 toHash
    ) external {
        _sendFor(_getSender(), from, quantity, toHash);
    }

    function sendFor(
        address owner,
        uint256 from,
        uint256 quantity,
        bytes32 toHash
    ) external {
        address sender = _getSender();
        if (sender != owner) {
            require(_operators[owner][sender], "NOT_AUTHORIZED");
        }
        _sendFor(_getSender(), from, quantity, toHash);
    }

    // ////////////// EIP721 /////////////////// // TODO ?

    // function transfer() // TODO EIP-721 ?

    function setApprovalForAll(address operator, bool approved) external {
        address sender = _getSender();
        _operators[sender][operator] = approved;
        emit ApprovalForAll(sender, operator, approved);
    }

    function getGeneisHash() external view returns (bytes32) {
        return _genesis;
    }

    // TODO remove /////////////////// used to test gas cost of computing stats from reading from storage
    // PlanetStats _test;
    // function getPlanetStats(uint256 location) external returns (PlanetStats memory stats) {
    //     // return _getPlanetStats(location);
    //     return _test;
    // }
    ///////////////////////////////////

    function getPlanet(uint256 location) external view returns (Planet memory state, PlanetStats memory stats) {
        return _getPlanet(location);
    }

    // /////////////////// DATA /////////////////////
    mapping(address => mapping(address => bool)) _operators;
    mapping(uint256 => Planet) _planets;
    mapping(uint256 => Fleet) _fleets;
    uint256 _lastFleetId;
    bytes32 immutable _genesis;

    constructor(address stakingToken, bytes32 genesis) public StakingWithInterest(stakingToken) {
        _genesis = genesis;
    }

    // ///////////////// INTERNALS ////////////////////

    function _sendFor(
        address owner,
        uint256 from,
        uint256 quantity,
        bytes32 toHash
    ) internal {
        (Planet storage planet, ) = _getPlanet(from);
        require(owner == planet.owner, "not owner of the planet");

        uint256 currentnumSpaceships = _getCurrentNumSpaceships(
            planet.numSpaceships,
            planet.lastUpdated,
            planet.productionRate
        );
        require(currentnumSpaceships >= quantity, "not enough spaceships");
        planet.numSpaceships = currentnumSpaceships - quantity;
        planet.lastUpdated = block.timestamp;

        uint256 fleetId = ++_lastFleetId;
        _fleets[fleetId] = Fleet({
            launchTime: block.timestamp,
            owner: owner,
            from: from,
            toHash: toHash,
            quantity: quantity
        });

        // require(planet.lastFleets.length < 10, "too many fleet send at around the same time");
        // uint256 numPastFleets = planet.lastFleets.length;
        // for (uint256 i = 0; i < num; i++) {
        //     if (planet.lastFleets[i].launchTime) {

        //     }
        // }
        // planet.lastFleets.push(fleetId);

        emit FleetSent(owner, fleetId, from, quantity);
    }

    function _resolveFleetFor(
        address attacker,
        uint256 fleetId,
        uint256 to,
        uint256 distance,
        bytes32 secret
    ) internal {
        Fleet storage fleet = _fleets[fleetId];
        require(attacker == fleet.owner, "not owner of fleet");
        require(keccak256(abi.encodePacked(secret, to)) == fleet.toHash, "invalid 'to' or 'secret'");

        uint256 from = fleet.from;
        (,PlanetStats memory fromStats) = _getPlanet(from);
        (Planet storage toPlanet, PlanetStats memory toStats) = _getPlanet(to);
        _checkDistance(distance, from, fromStats, to, toStats);
        _checkTime(distance, fromStats, fleet);
        
        if (toPlanet.owner == attacker) {
            toPlanet.numSpaceships += fleet.quantity;
            emit FleetArrived(attacker, fleetId, to);
        } else {
            _performAttack(attacker, fromStats, to, toStats, fleetId, fleet.quantity);
        }
    }

    function _checkDistance(uint256 distance, uint256 from, PlanetStats memory fromStats, uint256 to, PlanetStats memory toStats) internal pure {
        uint256 distanceSquared = uint256( // check input instead of compute sqrt
            ((int128(to & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) * 4 + toStats.subX) - (int128(from & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) * 4 + fromStats.subX)) ** 2 +
            ((int128(to >> 128) * 4 + toStats.subY) - (int128(from >> 128) * 4 + fromStats.subY)) ** 2);
        require(distance**2 <= distanceSquared && distanceSquared < (distance+1)**2, "wrong distance");
    }

    function _checkTime(uint256 distance, PlanetStats memory stats, Fleet memory fleet) internal view {
        uint256 speed = stats.speed;

        uint256 reachTime = fleet.launchTime + distance * ((1 hours * 10000) / speed);
        require(block.timestamp >= reachTime, "too early");
        require(block.timestamp < reachTime + 2 hours, "too late, your spaceships are lost in space");
    }

    function _getPlanet(uint256 location) internal view returns (Planet storage, PlanetStats memory) {
        return (_planets[location], _getPlanetStats(location));
    }

    function _getPlanetStats(uint256 location) internal view returns (PlanetStats memory) {
        // depending on random algorithm might be cheaper to always execute random
        // if we use uin16 for each field, it would be cheaper to read from storage
        // int120 gx = int120(gridLocation & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        // int120 gy = int120(gridLocation >> 128);

        bool hasPlanet = _genesis.r_u8(location, 1, 3) == 1;
        require(hasPlanet, "no planet in this location");
        
        return PlanetStats({
            subX: int8(1 - _genesis.r_u8(location, 2, 3)),
            subY: int8(1 - _genesis.r_u8(location, 3, 3)),
            maxStake: _genesis.r_normalFrom(location, 4, 0x0001000200030004000500070009000A000A000C000F00140019001E00320064), //_genesis.r_u256_minMax(location, 3, 10**18, 1000**18),
            production: _genesis.r_normalFrom(location, 5, 0x0708083409600a8c0bb80ce40e100e100e100e101068151819c81e7823282ee0), // per hour
            attack: 4000 + _genesis.r_normal(location, 6) * 400, // 1/10,000
            defense: 4000 + _genesis.r_normal(location, 7) * 400, // 1/10,000
            speed: 5010 + _genesis.r_normal(location, 8) * 334, // 1/10,000
            natives: 2000 + _genesis.r_normal(location, 8) * 100
            // maxCapacity ?
        });

        // Planet storage planet = _planets[location];
        // if (planet.exits) {
        //     return planet;
        // }
        // // require(kec)
        // // TODO check existence from hash
        // _planets[location] = Planet();
        // return _planets[location];
    }

    function _getSender() internal view returns (address) {
        return msg.sender; // TODO metatx
    }

    function _getCurrentNumSpaceships(
        uint256 numSpaceships,
        uint256 lastUpdated,
        uint256 productionRate
    ) internal view returns (uint256) {
        return numSpaceships + ((block.timestamp - lastUpdated) * productionRate) / 1 hours;
    }

    function _computeFight(uint256 numAttack, uint256 numDefense, uint256 attack, uint256 defense) internal pure returns (uint256 attackerLoss, uint256 defenderLoss) {
        uint256 attackPower = (numAttack * attack) / 10000;
        uint256 defensePower = (numDefense * defense) / 10000;

        uint256 numAttackRound = (numDefense * 10000) / attackPower;
        if (numAttackRound * attackPower < (numDefense * 10000)) {
            numAttackRound++;
        }
        uint256 numDefenseRound = (numAttack * 10000) / defensePower;
        if (numDefenseRound * defensePower < (numAttack * 10000)) {
            numDefenseRound++;
        }

        uint256 numRound = Math.min(numAttackRound, numDefenseRound);
        attackerLoss = Math.min((numRound * defensePower) / 10000, numAttack);
        defenderLoss = Math.min((numRound * attackPower)  / 10000, numDefense);
    }

    function _performAttack(
        address attacker,
        PlanetStats memory fromPlanetStats,
        uint256 to,
        PlanetStats memory toPlanetStats,
        uint256 fleetId,
        uint256 numAttack
    ) internal {
        uint256 numDefense = _getCurrentNumSpaceships(
            _planets[to].numSpaceships,
            _planets[to].lastUpdated,
            _planets[to].productionRate
        );
        
        (uint256 attackerLoss, uint256 defenderLoss) = _computeFight(numAttack, numDefense, fromPlanetStats.attack, toPlanetStats.defense);
        
        if (attackerLoss == numAttack) {
            _planets[to].numSpaceships = numDefense - defenderLoss;
            emit Attack(attacker, fleetId, attackerLoss, to, defenderLoss, false);
        } else if (defenderLoss == numDefense) {
            _planets[to].owner = attacker;
            _planets[to].lastOwnershipTime = block.timestamp;
            _planets[to].numSpaceships = numAttack - attackerLoss;
            emit Attack(attacker, fleetId, attackerLoss, to, defenderLoss, true);
        }
        _planets[to].lastUpdated = block.timestamp;
    }
}

// Bounties will be external
// event Bounty(
//     address from,
//     address token,
//     uint256 amount,
//     uint256 location,
//     uint256 deadline,
//     address target,
//     uint256 perLoss,
//     address hunter,
// );

// Bounty will be an external contract using the capability of _operators
// function attachBounty(
//     uint256 location,
//     address token,
//     // uint256 tokenType, // TODO : ERC20 / ERC777 / ERC1155 / ERC721
//     uint256 maxSpaceships,
//     uint256 amountPerSpaceships,
//     uint256 deadline,
//     address target, // can be zero for getting reward no matter who is owning the planet.
//     address hunter // can be zero for anybody
// ) external {
//     address sender = _getSender();
//     // require(target != sender, "please do not target yourself"); // TODO add this check ?
//     emit Bounty(sender, token, amountPerSpaceships * maxSpaceships, location, deadline, target, amountPerSpaceships, hunter);
// }

// function withdrawBounty(

// ) external {
//     // TODO
//     // check bounty deadline is over
//     // if bounty has been taken, allow winner to withdraw
//     // if bounty has not be taken, allow bounty offerer to withdraw
// }
