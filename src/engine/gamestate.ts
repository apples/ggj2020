import { initializeAnimation, initializeControls, initializeHitBox, initializeHurtBox, initializeSprite, initializePosition, initializeVelocity, initializeTimer } from "./initializers";
import { positionSystem, collisionSystem, timerSystem, animationSystem, velocitySystem } from "./coresystems";
import { Scene, Camera, Color, WebGLRenderer, OrthographicCamera } from "three";
import { setHurtBoxGraphic, playAudio, setHitBoxGraphic } from "./helpers";
import { HurtBoxTypes, SequenceTypes } from "./enums";
import { controlSystem } from "./controlsystem";
import { Entity } from "./entity";
import { playerAnim } from "../../data/animations/player";
import { BaseState } from "../basestate";
import { Widget } from "../ui/widget";
import { createWidget } from "../ui/widget";
import { layoutWidget } from "../ui/layoutwidget";
import { renderGameUi, Root } from "./rootgameui";

/**
 * GameState that handles updating of all game-related systems.
 */

export class GameState extends BaseState {
    public gameScene: Scene;
    public gameCamera: Camera;
    public uiScene: Scene;
    public uiCamera: Camera;
    public rootWidget: Widget;
    constructor(stateStack: BaseState[]) {
        super(stateStack);
        // Set up game scene.
        this.gameScene = new Scene();
        this.gameScene.background = new Color("#FFFFFF");

        // Set up game camera.
        this.gameCamera = new OrthographicCamera(0, 1280, 720, 0, -1000, 1000);

        // Set up ui scene.
        this.uiScene = new Scene();

        // Set up ui camera.
        this.uiCamera = new OrthographicCamera(0, 1280, 0, -720, -1000, 1000);

        // Set up ui widget and instance.
        this.rootWidget = createWidget("root");

        this.uiScene.add(this.rootWidget);

        let rootComponent = renderGameUi(this.uiScene, this.rootWidget);

        // Register systems.
        this.registerSystem(controlSystem, "control");
        this.registerSystem(velocitySystem);
        this.registerSystem(collisionSystem);
        this.registerSystem(animationSystem);
        this.registerSystem(timerSystem);
        this.registerSystem(positionSystem);

        playAudio("./data/audio/Pale_Blue.mp3", 0.3, true);

        // Set up player entity.
        let player = new Entity();
        player.pos = initializePosition(150, 150, 5);
        player.sprite = initializeSprite("./data/textures/msknight.png", this.gameScene, 1);
        player.control = initializeControls();
        player.vel = initializeVelocity(1);
        player.vel.friction = 0.9;
        player.anim = initializeAnimation(SequenceTypes.walk, playerAnim);
        player.timer = initializeTimer(250, () => {
            // this.removeEntity(player);
            // Remove player sprite from scene.
            // this.gameScene.remove(player.sprite);
            // this.stateStack.pop();
        });
        player.hitBox = initializeHitBox(player.sprite, [HurtBoxTypes.test], 0, 0, 0, 0);
        setHitBoxGraphic(player.sprite, player.hitBox);
        player.hitBox.onHit = function() {
            rootComponent.addClick();
            // TODO // Make this decrease player health
        }
        this.registerEntity(player);

        // Set up space station entity.
        let station = new Entity();
        station.pos = initializePosition(640, 360, 4);
        station.sprite = initializeSprite("./data/textures/cottage.png", this.gameScene, 10);
        station.hitBox = initializeHitBox(station.sprite, [HurtBoxTypes.test], 0, 0, 0, 0);
        setHitBoxGraphic(station.sprite, station.hitBox);
        station.hitBox.onHit = function() {
            rootComponent.addClick();
            // TODO // Make this decrease base health + chip off a chunk of armor
        }
        this.registerEntity(station);

        // Set up asteroid entity.
        let asteroid = new Entity();
        asteroid.pos = initializePosition(120, 620, 4);
        asteroid.sprite = initializeSprite("./data/textures/cottage.png", this.gameScene, 4);
        asteroid.hurtBox = initializeHurtBox(asteroid.sprite, HurtBoxTypes.test, 0, 0, 0, 0);
        setHurtBoxGraphic(asteroid.sprite, asteroid.hurtBox);
        this.registerEntity(asteroid);

        // Set up background element
        let stars = new Entity();
        stars.pos = initializePosition(0, 0, 1);
        stars.sprite = initializeSprite("./data/textures/space4096Square.png", this.gameScene, 2);
        this.registerEntity(stars);
    }

    public update() : void {
        this.runSystems(this);
    }

    public render(renderer: WebGLRenderer) : void {
        renderer.clear();
        renderer.render(this.gameScene, this.gameCamera);
        renderer.clearDepth();
        renderer.render(this.uiScene, this.uiCamera);

        // Render UI updates.
        layoutWidget(this.rootWidget);
    }
}