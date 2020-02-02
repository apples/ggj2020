import { Behavior, BehaviorResult } from "../engine/behavior";
import { HitBoxType } from "../engine/enums";
import { Entity } from "../engine/entity";
import { Euler } from "three";

export function* enforcer(): Behavior {
    let target: Entity = undefined;

    while (!target) {
        const { ents } = yield;

        target = ents.find(e => e.hitBox && e.hitBox.collideType === HitBoxType.ASTEROID);
    }

    let self: Entity = (yield).self;

    while (!target.dead) {
        const targetVec = target.pos.loc.clone().sub(self.pos.loc);

        let angle = self.pos.dir.angleTo(targetVec);

        angle = Math.min(angle, Math.PI/60);

        if (self.pos.dir.clone().cross(targetVec).z < 0) {
            angle = -angle;
        }

        self.pos.dir.applyEuler(new Euler(0, 0, angle));

        const dist = self.pos.loc.distanceTo(target.pos.loc);

        if (dist > 500) {
            if (self.vel.positional.length() < 100) {
                self.vel.positional.add(self.pos.dir.clone());
            }
        }

        self = (yield).self;
    }

    return BehaviorResult.SUCCESS;
}