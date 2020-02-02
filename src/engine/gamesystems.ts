import { Entity } from "./entity";
import { GameState } from "./gamestate";
import { Rect, getHitbox, getManifold } from "./commontypes";
import { BeamComponent } from "./corecomponents";
import { BufferGeometry, BufferAttribute, MeshBasicMaterial, Mesh } from "three";
import { HitBoxType } from "./enums";

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

    if(beam && beam.beam.firing){
        for (const ent of ents) {
            if(ent.pos && ent.hitBox && ent.hitBox.collideType === HitBoxType.ASTEROID)//filter types?
            {
                var distance = ent.pos.loc.distanceTo(state.playerEntity.control.mousePos);
                if(distance < closestValue){
                    closestValue = distance;
                    closest = ent;
                }
            }
            
        }

        beam.beam.targetEntity = closest;
    }

    if(beam.beam.targetEntity && beam.beam.firing) {
        var geometry = new BufferGeometry();

        var vertices = new Float32Array( [
            beam.beam.targetEntity.pos.loc.x + 3, beam.beam.targetEntity.pos.loc.y + 3,  4.9,
            state.playerEntity.pos.loc.x - 3, state.playerEntity.pos.loc.y - 3,  4.9,
            state.playerEntity.pos.loc.x + 3,  state.playerEntity.pos.loc.y + 3,  4.9,
    
            state.playerEntity.pos.loc.x - 3,  state.playerEntity.pos.loc.y - 3,  4.9,
            beam.beam.targetEntity.pos.loc.x + 3, beam.beam.targetEntity.pos.loc.y + 3,  4.9,
            beam.beam.targetEntity.pos.loc.x - 3, beam.beam.targetEntity.pos.loc.y - 3,  4.9,

            beam.beam.targetEntity.pos.loc.x + 3, beam.beam.targetEntity.pos.loc.y + 3,  4.9,
            state.playerEntity.pos.loc.x + 3,  state.playerEntity.pos.loc.y + 3,  4.9,
            state.playerEntity.pos.loc.x - 3, state.playerEntity.pos.loc.y - 3,  4.9,
    
            state.playerEntity.pos.loc.x - 3,  state.playerEntity.pos.loc.y - 3,  4.9,
            beam.beam.targetEntity.pos.loc.x - 3, beam.beam.targetEntity.pos.loc.y - 3,  4.9,
            beam.beam.targetEntity.pos.loc.x + 3, beam.beam.targetEntity.pos.loc.y + 3,  4.9
        ] );
    
        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );
        var material = new MeshBasicMaterial( { color: 0x5fcde4 } );
    
        beam.beam.mesh.geometry = geometry;
        beam.beam.mesh.material = material;
    }
    else
    {
        var vertices = new Float32Array( [] );
        var geometry = new BufferGeometry();
        geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );
        beam.beam.mesh.geometry = geometry;
    }
    
}