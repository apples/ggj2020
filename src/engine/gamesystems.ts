import { Entity } from "./entity";
import { GameState } from "./gamestate";
import { Rect, getHitbox, getManifold } from "./commontypes";
import { BeamComponent } from "./corecomponents";

export function worldEdgeSystem(ents: readonly Entity[], state: GameState) {
    for (const ent of ents) {
        if (ent.pos) {
            const hitbox: Rect =
                ent.hitBox ? getHitbox(ent) :
                { left: ent.pos.loc.x, right: ent.pos.loc.x, bottom: ent.pos.loc.y, top: ent.pos.loc.y };

            const worldBox: Rect = { left: -state.worldWidth/2, right: state.worldWidth/2, bottom: -state.worldHeight/2, top: state.worldHeight/2 };

            const manifold = getManifold(hitbox, worldBox);

            if (ent.pos.wrap) {
                if (manifold.right < worldBox.left) {
                    ent.pos.loc.x += worldBox.right - hitbox.left;
                }
                if (manifold.left > worldBox.right) {
                    ent.pos.loc.x -= hitbox.right - worldBox.left;
                }
                if (manifold.top < worldBox.bottom) {
                    ent.pos.loc.y += worldBox.top - hitbox.bottom;
                }
                if (manifold.bottom > worldBox.top) {
                    ent.pos.loc.y -= hitbox.top - worldBox.bottom;
                }
            } else {
                if (hitbox.left < worldBox.left) {
                    ent.pos.loc.x += worldBox.left - hitbox.left;
                }
                if (hitbox.right > worldBox.right) {
                    ent.pos.loc.x += worldBox.right - hitbox.right;
                }
                if (hitbox.bottom < worldBox.bottom) {
                    ent.pos.loc.y += worldBox.bottom - hitbox.bottom;
                }
                if (hitbox.top > worldBox.top) {
                    ent.pos.loc.y += worldBox.top - hitbox.top;
                }
            }
        }
    }
}

export function beamSystem(ents: readonly Entity[], state: GameState) {
    var beam: Entity = ents.find(x => x.beam);
    var closest: Entity;
    var closestValue: number = Number.MAX_VALUE;

    if(beam){
        for (const ent of ents) {
            if(ent.pos)//filter types?
            {
                var distance = ent.pos.loc.distanceTo(beam.beam.baseEntity.pos.loc);
                if(distance < closestValue){
                    closestValue = distance;
                    closest = ent;
                }
            }
            
        }

        beam.beam.targetEntity = closest;
    }
}