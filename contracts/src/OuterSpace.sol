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
    event SpaceshipSent(address sender, uint256 squad, uint256 from, uint256 quantity);
    // event SpaceshipRevealed(address owner, uint256 from, uint256 destination, uint256 quantity);
    event Attack(address sender, uint256 squad, uint256 squadLoss, uint256 location, uint256 toLoss, bool won);
    event Bounty(address from, address token, uint256 amount, uint256 location, uint256 perLoss, address hunter);

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

        // TODO give initial spaceship count
    }

    function withdraw(uint256 location) external {
        // ensure delay hass passed
    }

    // function transfer() // TODO EIP-721 ?

    function attack(
        uint256 squadId,
        uint256 to,
        bytes32 secret
    ) external {
        address sender = _getSender();
        Squad memory squad = _squads[squadId];
        require(sender == squad.owner, "not owner of squad");
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

        _performAttack(planet, sender, squadId, to);
    }

    function attachBounty(
        uint256 location,
        address token,
        // uint256 tokenType, // TODO : ERC20 / ERC777 / ERC1155 / ERC721
        uint256 maxSpaceships,
        uint256 amountPerSpaceships,
        address hunter
    ) external {
        address sender = _getSender();
        emit Bounty(sender, token, amountPerSpaceships * maxSpaceships, location, amountPerSpaceships, hunter);
    }

    function send(
        uint256 from,
        uint256 quantity,
        bytes32 toHash
    ) external {
        address sender = _getSender();
        (Planet storage planet, ) = _getPlanet(from);
        uint256 currentnumSpaceships = _getCurrentnumSpaceships(
            planet.numSpaceships,
            planet.lastUpdated,
            planet.productionRate
        );

        require(sender == planet.owner, "not owner of the planet");
        require(currentnumSpaceships >= quantity, "not enough spaceships");
        planet.numSpaceships = currentnumSpaceships - quantity;
        uint256 squadId = ++_lastSquadId;
        _squads[squadId] = Squad({
            launchTime: block.timestamp,
            owner: sender,
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
    }

    // /////////////////// DATA /////////////////////
    mapping(uint256 => Planet) _planets;
    mapping(uint256 => Squad) _squads;
    uint256 _lastSquadId;

    constructor(address stakingToken) public StakingWithInterest(stakingToken) {}

    // ///////////////// INTERNALS ////////////////////

    function _getPlanet(uint256 location) internal view returns (Planet storage, PlanetStats memory) {
        // depending on random algorithm might be cheaper to always execute random
        // TODO check existence from hash
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
        return ((block.timestamp - lastUpdated) * productionRate) / 1 days;
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
