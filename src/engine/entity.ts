import { PositionComponent, VelocityComponent, AnimationComponent, HitBoxComponent, TimerComponent, BehaviorComponent } from "./corecomponents";
import { ControlComponent } from "./controlcomponent";
import { Mesh } from "three";

/**
 * Class to represent an entity in the game. No constructor as an entity can
 * comprise of as many or as little of the properties listed here. Each component
 * should have a corresponding system that handles the game logic needed to update
 * the properties within the component.
 */
export class Entity {
     public dead: boolean | undefined;
     public pos: PositionComponent;
     public vel: VelocityComponent;
     public sprite: Mesh;
     public anim: AnimationComponent;
     public control: ControlComponent;
     public hitBox: HitBoxComponent;
     public timer: TimerComponent;
     public behavior: BehaviorComponent;
}