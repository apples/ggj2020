import { Behavior, BehaviorResult } from "../engine/behavior";
import { HitBoxType } from "../engine/enums";
import { Entity } from "../engine/entity";
import { Euler } from "three";
import { GameState } from "../engine/gamestate";
import { initializePosition, initializeSprite, initializeVelocity, initializeHitBox, initializeTimer } from "../engine/initializers";

function moveToTarget(self: Entity, target: Entity) {
    const targetVec = target.pos.loc.clone().sub(self.pos.loc);

    let angle = self.pos.dir.angleTo(targetVec);

    angle = Math.min(angle, Math.PI / 60);

    if (self.pos.dir.clone().cross(targetVec).z < 0) {
        angle = -angle;
    }

    self.pos.dir.applyEuler(new Euler(0, 0, angle));

    const dist = self.pos.loc.distanceTo(target.pos.loc);

    if (dist > 500) {
        const forwardVel = self.vel.positional.clone().dot(targetVec.clone().normalize());
        if (forwardVel < 50) {
            self.vel.positional.add(self.pos.dir.clone());
        }
        self.vel.friction = 0.95;
    } else {
        self.vel.friction = 0.25;
    }
}

function shootAtTarget(self: Entity, target: Entity, state: GameState) {
    const targetVec = target.pos.loc.clone().sub(self.pos.loc).normalize();

    const bullet = new Entity();
    bullet.pos = initializePosition(self.pos.loc.x, self.pos.loc.y, self.pos.loc.z-0.1, undefined, true);
    bullet.sprite = initializeSprite("./data/textures/fireball.png", state.gameScene, 3.5);
    bullet.vel = initializeVelocity(0, targetVec.multiplyScalar(30));
    bullet.hitBox = initializeHitBox(bullet.sprite, HitBoxType.BULLET, [HitBoxType.ASTEROID]);
    bullet.hitBox.onHit = (self, other, _manifold) => {
        state.removeEntity(self);
        state.removeEntity(other);
    };
    bullet.timer = initializeTimer(60, () => state.removeEntity(bullet));
    state.registerEntity(bullet);
}

export function* enforcer(): Behavior {
    let target: Entity = undefined;

    while (!target) {
        const ents: Entity[] = (yield).ents;

        const asteroids = ents.filter(e => e.hitBox && e.hitBox.collideType === HitBoxType.ASTEROID);

        if (asteroids.length) {
            target = asteroids[Math.floor(Math.random() * asteroids.length)];
        }
    }

    let ticks = 0;

    while (!target.dead) {
        const { self, state } = yield;

        moveToTarget(self, target);

        ++ticks;
        if (ticks > 60) {
            ticks = 0;
            shootAtTarget(self, target, state);
        }
    }

    return BehaviorResult.SUCCESS;
}