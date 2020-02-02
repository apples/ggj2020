import { Entity } from "./entity";
import { GameState } from "./gamestate";
import { Rect, getHitbox, getManifold } from "./commontypes";
import { BeamComponent } from "./corecomponents";
import { HitBoxType } from "./enums";
import { BufferGeometry, BufferAttribute, MeshBasicMaterial, Mesh, PlaneGeometry } from "three";

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
        const targets = ents
            .filter(ent => ent.hitBox && [HitBoxType.ENFORCER, HitBoxType.STATION_PART].includes(ent.hitBox.collideType))
            .map(ent => ({ ent: ent, dist: ent.pos.loc.distanceTo(state.playerEntity.pos.loc) }))
            .filter(({ ent, dist }) => dist <= 400 && !ent.attachedToBase)
            .sort((a, b) => a.dist - b.dist)
            .map(x => x.ent);

        beam.beam.targetEntity = targets[0];
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

        switch (beam.beam.targetEntity.hitBox.collideType) {
            case HitBoxType.ENFORCER: {
                beam.beam.targetEntity.health.value += 10/60;
                break;
            }
            case HitBoxType.STATION_PART: {
                if (!beam.beam.targetEntity.attachedToBase) {
                    const p = state.playerEntity.pos.loc;
                    const t = beam.beam.targetEntity.pos.loc;

                    const pull = t.clone().sub(p).normalize().multiplyScalar(-0.5);

                    beam.beam.targetEntity.vel.positional.add(pull);
                }
                break;
            }
        }
    }
    else
    {
        var vertices = new Float32Array( [] );
        var geometry = new BufferGeometry();
        geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );
        beam.beam.mesh.geometry = geometry;
    }

}

export function healthHUDSystem(ents: readonly Entity[], state: GameState) {
    const enforcers = ents
        .filter(ent => (ent.hitBox && ent.hitBox.collideType === HitBoxType.ENFORCER))
        .sort((a, b) => a.health.value - b.health.value);

    if (enforcers.length) {
        const hurtMost = enforcers[0];

        if (hurtMost.health.value / hurtMost.health.maxValue < 0.5) {
            if (!state.playerEntity.ouchie.mesh) {
                const geom = new PlaneGeometry(10, 10);
                const mat = new MeshBasicMaterial({ color: '#ff0000' });
                state.playerEntity.ouchie.mesh = new Mesh(geom, mat);
                state.gameScene.add(state.playerEntity.ouchie.mesh);
            }

            state.playerEntity.ouchie.mesh.position.copy(
                hurtMost.pos.loc.clone().sub(state.playerEntity.pos.loc).normalize().multiplyScalar(100).add(state.playerEntity.pos.loc)
            );
            state.playerEntity.ouchie.mesh.position.z = 5;
        } else {
            if (state.playerEntity.ouchie.mesh) {
                state.gameScene.remove(state.playerEntity.ouchie.mesh);
                state.playerEntity.ouchie.mesh = undefined;
            }
        }
    } else {
        if (state.playerEntity.ouchie.mesh) {
            state.gameScene.remove(state.playerEntity.ouchie.mesh);
            state.playerEntity.ouchie.mesh = undefined;
        }
    }
}