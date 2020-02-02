import { Entity } from "./entity";
import { changeSequence } from "./helpers";
import { SequenceTypes } from "./enums";
import { Vector3 } from "three";

/**
 * Control system: Movement left, right, up, down
 * Attacking, getting attacked
 */

/**
 * Control system.
 * @param ents Ents from the controllableEntities registry.
 */
export function controlSystem(ents: ReadonlyArray<Entity>){
    let movementDirection = new Vector3(0,0,0);

    ents.forEach(ent => {
        if (ent.control && ent.vel && ent.pos) {
            // Left
            if (ent.control.left) {
                ent.pos.dir.setX(0);
                ent.pos.dir.setY(1);
                movementDirection.setX(-1);
                movementDirection.setY(0);
                ent.vel.positional.add(movementDirection.multiplyScalar(ent.vel.acceleration));
            }

            // Right
            if (ent.control.right) {
                ent.pos.dir.setX(0);
                ent.pos.dir.setY(-1);
                movementDirection.setX(1);
                movementDirection.setY(0);
                ent.vel.positional.add(movementDirection.multiplyScalar(ent.vel.acceleration));
            }

            // Up
            if (ent.control.up) {
                ent.pos.dir.setX(1);
                ent.pos.dir.setY(0);
                movementDirection.setX(0);
                movementDirection.setY(1);
                ent.vel.positional.add(movementDirection.multiplyScalar(ent.vel.acceleration));
            }

            // Down
            if (ent.control.down) {
                ent.pos.dir.setX(-1);
                ent.pos.dir.setY(0);
                movementDirection.setX(0);
                movementDirection.setY(-1);
                ent.vel.positional.add(movementDirection.multiplyScalar(ent.vel.acceleration));
            }

            // Space
            if (ent.control.attack && !ent.control.attacked) {
                // test change seq
                ent.anim = changeSequence(SequenceTypes.attack, ent.anim);
                //ent.control.attacked = true;
                //let attack = new Entity();
                // attack.timer = { ticks: 15 };
                //attack.pos.loc = ent.pos.loc;//x: ent.pos.x + 100, y: ent.pos.y + 50, z: 5};
                // attack.graphic = setHitBoxGraphic(stage, 50, 50);
                // attack.hitBox = {
                //     collidesWith: [HurtBoxTypes.test],
                //     height: 50,
                //     width: 50,
                //     onHit: function() { console.log("hit")
                // }};
                //ents.push(attack);
            } else {
                ent.anim = changeSequence(SequenceTypes.walk, ent.anim);
            }

            if (ent.control.attacked) {
                ent.control.attackTimer++;
            }

            if (ent.control.attackTimer > 75) {
                ent.control.attacked = false;
                ent.control.attackTimer = 0;
            }
        }
    });
}