pragma solidity 0.6.5;

import "./StakingWithInterest.sol";


contract OuterSpace is StakingWithInterest {
    struct PlanetStats {
        uint256 maxStake;
        uint256 efficiency;
        uint256 attack;
        uint256 defense;
    }
    struct Planet {
        // PlanetStats stats; // TODO generate on demand from hash
        address owner;
        uint256 lastOwnershipTime;
        uint256 numSpaceships;
        uint256 lastUpdated;
        uint256 productionRate; // computed on stake given
        uint256 stake;
        // uint256[] lastSquads; // TODO deal with front running
    }
    struct Squad {
        uint256 launchTime;
        address owner;
        uint256 from;
        bytes32 toHash; // to is not revealed until needed // if same as from, then take a specific time (bluff)
        uint256 quantity; // we know how many but not where
    }

    event PlanetAcquired(address acquirer, uint256 location, uint256 stake);
    event SquadSent(address sender, uint256 squad, uint256 from, uint256 quantity);
    // event SpaceshipRevealed(address owner, uint256 from, uint256 destination, uint256 quantity);
    event Attack(address sender, uint256 squad, uint256 squadLoss, uint256 location, uint256 toLoss, bool won);

    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function stake(uint256 location, uint256 stakeAmount) external {
        address sender = _getSender();
        (Planet storage planet, PlanetStats memory stats) = _getPlanet(location);
        address owner = planet.owner;

        if (planet.owner == address(0)) {
            planet.owner = sender;
            planet.lastOwnershipTime = block.timestamp;
        } else {
            require(sender == owner, "already owned by someone else");
        }

        uint256 currentStake = planet.stake;
        require(currentStake + stakeAmount <= stats.maxStake, "exceeds max stake");
        uint256 newStake = currentStake + stakeAmount;
        planet.stake = newStake;

        planet.productionRate = stats.efficiency * (newStake / stats.maxStake); // TODO compute on demand every time ?

        planet.numSpaceships = 10; // TODO determine numbers
    }

    function withdraw(uint256 location) external {
        // ensure delay hass passed
    }

    function resolveSquad(
        uint256 squadId,
        uint256 to,
        bytes32 secret
    ) external {
        _resolveSquadFor(_getSender(), squadId, to, secret);
    }

    function resolveSquadFor(
        address attacker,
        uint256 squadId,
        uint256 to,
        bytes32 secret
    ) external {
        address sender = _getSender();
        if (sender != attacker) {
            require(_operators[attacker][sender], "NOT_AUTHORIZED");
        }
        _resolveSquadFor(attacker, squadId, to, secret);
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

    function getPlanet(uint256 location) external view returns (
        uint256 maxStake,
        uint256 efficiency,
        uint256 attack,
        uint256 defense,
        address owner,
        uint256 lastOwnershipTime,
        uint256 numSpaceships,
        uint256 lastUpdated,
        uint256 productionRate,
        uint256 currentStake
    ) {
        (Planet storage planet, PlanetStats memory stats) = _getPlanet(location);
        maxStake = stats.maxStake;
        efficiency = stats.efficiency;
        attack = stats.attack;
        owner = planet.owner;
        lastOwnershipTime = planet.lastOwnershipTime;
        numSpaceships = planet.numSpaceships; // TODO actualise here
        lastUpdated = planet.lastUpdated;
        productionRate = planet.productionRate;
        currentStake = planet.stake;
    }

    // /////////////////// DATA /////////////////////
    mapping(address => mapping(address => bool)) _operators;
    mapping(uint256 => Planet) _planets;
    mapping(uint256 => Squad) _squads;
    uint256 _lastSquadId;
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
        uint256 currentnumSpaceships = _getCurrentnumSpaceships(
            planet.numSpaceships,
            planet.lastUpdated,
            planet.productionRate
        );

        require(owner == planet.owner, "not owner of the planet");
        require(currentnumSpaceships >= quantity, "not enough spaceships");
        planet.numSpaceships = currentnumSpaceships - quantity;
        uint256 squadId = ++_lastSquadId;
        _squads[squadId] = Squad({
            launchTime: block.timestamp,
            owner: owner,
            from: from,
            toHash: toHash,
            quantity: quantity
        });

        // require(planet.lastSquads.length < 10, "too many squad send at around the same time");
        // uint256 numPastSquads = planet.lastSquads.length;
        // for (uint256 i = 0; i < num; i++) {
        //     if (planet.lastSquads[i].launchTime) {

        //     }
        // }
        // planet.lastSquads.push(squadId);

        emit SquadSent(owner, squadId, from, quantity);
    }

    function _resolveSquadFor(
        address attacker,
        uint256 squadId,
        uint256 to,
        bytes32 secret
    ) internal {
        Squad memory squad = _squads[squadId];
        require(attacker == squad.owner, "not owner of squad");
        require(keccak256(abi.encodePacked(secret, to)) == squad.toHash, "invalid secret");

        uint256 from = squad.from;
        (Planet storage planet, ) = _getPlanet(from);

        // TODO
        uint256 distance = 1000; // TODO based on distance from "from" to "to"
        uint256 speed = 1;
        uint256 timeWindow = 6 hours;

        uint256 reachTime = squad.launchTime + distance * speed; // TODO planet.speed  ?
        require(block.timestamp >= reachTime, "too early");
        require(block.timestamp < reachTime + timeWindow, "too late, your spaceships are lost in space");

        _performAttack(planet, attacker, squadId, to);
    }

    function _getPlanet(uint256 location) internal view returns (Planet storage, PlanetStats memory) {
        // depending on random algorithm might be cheaper to always execute random
        // TODO check existence from hash
        int240 gridLocation = int240(location >> 16);
        int120 gx = int120(gridLocation & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        int120 gy = int120(gridLocation >> 120);
        int16 subLocation = int16(location & 0xFFFF);
        int8 x = int8(subLocation & 0xFF);
        int8 y = int8(subLocation >> 8);

        bool hasPlanet = (uint256(keccak256(abi.encodePacked(gridLocation, _genesis, uint8(1)))) % 3) == 1;
        require(hasPlanet, "no planet in this location");
        int8 xy = int8(uint256(keccak256(abi.encodePacked(gridLocation, _genesis, uint8(2)))) % 9);
        require(x == (xy % 3) - 1, "planet does not exists at this location");
        require(y == (xy / 3) - 1, "planet does not exists at this location");

        //require(...)
        return (_planets[location], PlanetStats({maxStake: 100, efficiency: 90, attack: 50, defense: 50}));

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

    function _getCurrentnumSpaceships(
        uint256 numSpaceships,
        uint256 lastUpdated,
        uint256 productionRate
    ) internal view returns (uint256) {
        return numSpaceships + ((block.timestamp - lastUpdated) * productionRate) / 1 days;
    }

    function _performAttack(
        Planet storage planet,
        address sender,
        uint256 squadId,
        uint256 to
    ) internal {
        // perform attack
        // TODO
        uint256 squadLoss = 0;
        uint256 toLoss = 0;
        bool attackerWon = true;

        if (attackerWon) {
            planet.owner = sender;
            planet.lastOwnershipTime = block.timestamp;
        }
        emit Attack(sender, squadId, squadLoss, to, toLoss, attackerWon);
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
