import { store, Address, Bytes, BigInt, BigDecimal } from '@graphprotocol/graph-ts';
import {OuterSpaceContract, PlanetAcquired, FleetSent, FleetArrived, Attack} from '../generated/OuterSpace/OuterSpaceContract';
import {NamedEntity} from '../generated/schema'
import { log } from '@graphprotocol/graph-ts';

let zeroAddress = '0x0000000000000000000000000000000000000000';

export function handlePlanetAcquired(event: PlanetAcquired): void {
    let id = event.params.location.toHex();
    let entity = NamedEntity.load(id);
    if (!entity) {
        entity = new NamedEntity(id);
    }
    entity.name = event.params.acquirer.toHex();
    entity.save();   
}

export function handleFleetSent(event: FleetSent): void {
    let id = event.params.from.toHex();
    let entity = NamedEntity.load(id);
    if (!entity) {
        entity = new NamedEntity(id);
    }
    entity.name = event.params.sender.toHex();
    entity.save();   
}

export function handleFleetArrived(event: FleetArrived): void {
    let id = event.params.location.toHex();
    let entity = NamedEntity.load(id);
    if (!entity) {
        entity = new NamedEntity(id);
    }
    entity.name = event.params.sender.toHex();
    entity.save();   
}


export function handleAttack(event: Attack): void {
    let id = event.params.location.toHex();
    let entity = NamedEntity.load(id);
    if (!entity) {
        entity = new NamedEntity(id);
    }
    entity.name = event.params.sender.toHex();
    entity.save();   
}
