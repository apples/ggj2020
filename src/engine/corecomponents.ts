import {
    Vector3,
    Euler,
} from "three";
import { Entity } from "./entity";
import { AnimationSchema } from "./engineinterfaces";
import { HitBoxType, SequenceTypes } from "./enums";
import { Manifold } from "./commontypes";

/**
 * Position component
 * Velocity component
 * Hitbox component
 * Hurtbox component
 * Animation component
 * Timeout timer
 */

/**
 * Position component.
 */
export interface PositionComponent {
    /** Location vector. */
    loc: Vector3;
    /** Direction vector. */
    dir: Vector3;
    /** Wraparound behavior. */
    wrap: boolean;
}

/**
 * Velocity component.
 */
export interface VelocityComponent {
    acceleration: number;
    positional: Vector3;
    rotational: Euler;
    friction?: number;
}

/**
 * HitBox Component that represents the area that when colliding with
 * any of the "collidesWith" enum entries, entity will "hit" them.
 */
export interface HitBoxComponent {
    collideType: HitBoxType;
    collidesWith: HitBoxType[];
    height: number;
    width: number;
    offsetX: number;
    offsetY: number;
    onHit?: (self: Entity, other: Entity, manifold: Manifold) => void;
}

/**
 * Animation Component.
 */
export interface AnimationComponent {
    sequence: SequenceTypes;
    blob: AnimationSchema;
    ticks: number;
    frame: number;
}

/**
 * Timer to call events after time expires.
 */
export interface TimerComponent {
    ticks: number;
    ontimeout: () => void;
}

/**
 * Beam things I dunno
 */
export interface BeamComponent {

    //basePos: Vector3;
    baseEntity: Entity;
    targetEntity: Entity;
    firing: boolean;
    type: number;
}