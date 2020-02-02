import { initializeAnimation, initializeControls, initializeHitBox, initializeSprite, initializePosition, initializeVelocity, initializeTimer } from "./initializers";
import { positionSystem, collisionSystem, timerSystem, animationSystem, velocitySystem } from "./coresystems";
import { Scene, Camera, Color, WebGLRenderer, OrthographicCamera, Vector3, Euler } from "three";
import { playAudio, setHitBoxGraphic } from "./helpers";
import { SequenceTypes, HitBoxType } from "./enums";
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
    public readonly viewWidth = 1280;
    public readonly viewHeight = 720;

    public gameScene: Scene;
    public gameCamera: Camera;
    public uiScene: Scene;
    public uiCamera: Camera;
    public rootWidget: Widget;
    public playerEntity: Entity;
    constructor(stateStack: BaseState[]) {
        super(stateStack);
        // Set up game scene.
        this.gameScene = new Scene();
        this.gameScene.background = new Color("#FFFFFF");

        // Set up game camera.
        this.gameCamera = new OrthographicCamera(0, this.viewWidth, this.viewHeight, 0, -1000, 1000);

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
        this.playerEntity = player;
        player.pos = initializePosition(150, 150, 5);
        player.sprite = initializeSprite("./data/textures/ship2.png", this.gameScene, 3.5);
        player.control = initializeControls();
        player.vel = initializeVelocity(0.4);
        player.vel.friction = 0.98;
        player.anim = initializeAnimation(SequenceTypes.walk, playerAnim);
        player.timer = initializeTimer(250, () => {
            // this.removeEntity(player);
            // Remove player sprite from scene.
            // this.gameScene.remove(player.sprite);
            // this.stateStack.pop();
        });
        player.hitBox = initializeHitBox(player.sprite, HitBoxType.PLAYER, [HitBoxType.ASTEROID], 0, 0, 0, 0);
        //setHitBoxGraphic(player.sprite, player.hitBox);
        player.hitBox.onHit = function() {
            rootComponent.addClick();
            // TODO // Make this decrease player health
        }
        this.registerEntity(player);

        // Set up space station central hub entity.
        let station = new Entity();
        station.pos = initializePosition(640, 360, 4);
        station.sprite = initializeSprite("./data/textures/base3MiddleLarge.png", this.gameScene, 3.5);
        station.hitBox = initializeHitBox(station.sprite, HitBoxType.STATION, [HitBoxType.ASTEROID], 130, 130, 0, 0);
        //setHitBoxGraphic(station.sprite, station.hitBox);
        station.hitBox.onHit = function() {
            rootComponent.addClick();
            // TODO // Make this decrease base health + chip off a chunk of armor
        }
        this.registerEntity(station);

        let offset = 116;
        let ringEntities = [
            // {x: 440, y: 160, sprite: "base3Corner.png", rotation: new Vector3(-1,0,0)},
            // {x: 440, y: 360, sprite: "base3Side.png", rotation: new Vector3(-1,0,0)},
            // {x: 440, y: 560, sprite: "base3Corner.png", rotation: new Vector3(0,1,0)},
            // {x: 640, y: 160, sprite: "base3Side.png", rotation: new Vector3(0,-1,0)},
            // {x: 640, y: 560, sprite: "base3Side.png", rotation: new Vector3(0,1,0)},
            // {x: 840, y: 160, sprite: "base3Corner.png", rotation: new Vector3(0,-1,0)},
            // {x: 840, y: 360, sprite: "base3Side.png", rotation: new Vector3(1,0,0)},
            // {x: 840, y: 560, sprite: "base3Corner.png", rotation: new Vector3(1,0,0)},

            {x: 440+offset, y: 160+offset, sprite: "base3Corner.png", rotation: new Vector3(-1,0,0)},
            {x: 440+offset, y: 360, sprite: "base3Side.png", rotation: new Vector3(-1,0,0)},
            {x: 440+offset, y: 560-offset, sprite: "base3Corner.png", rotation: new Vector3(0,1,0)},
            {x: 640, y: 160+offset, sprite: "base3Side.png", rotation: new Vector3(0,-1,0)},
            {x: 640, y: 560-offset, sprite: "base3Side.png", rotation: new Vector3(0,1,0)},
            {x: 840-offset, y: 160+offset, sprite: "base3Corner.png", rotation: new Vector3(0,-1,0)},
            {x: 840-offset, y: 360, sprite: "base3Side.png", rotation: new Vector3(1,0,0)},
            {x: 840-offset, y: 560-offset, sprite: "base3Corner.png", rotation: new Vector3(1,0,0)},
        ]

        // Set up station ring piece entities.
        ringEntities.forEach((entity) => {
            let ring = new Entity();
            ring.pos = initializePosition(entity.x, entity.y, 4, entity.rotation);
            ring.sprite = initializeSprite("./data/textures/"+entity.sprite, this.gameScene, 3.5);
            ring.hitBox = initializeHitBox(ring.sprite, HitBoxType.STATION_PART, [HitBoxType.ASTEROID]); // TODO make center smaller than sprite
            //setHitBoxGraphic(ring.sprite, ring.hitBox);
            ring.hitBox.onHit = function() {
                rootComponent.addClick();
                // TODO // Make this decrease base health + chip off a chunk of armor
            }
            this.registerEntity(ring);
        });
        

        // Set up asteroid entity.
        let asteroid = new Entity();
        asteroid.pos = initializePosition(120, 620, 4);
        asteroid.sprite = initializeSprite("./data/textures/cottage.png", this.gameScene, 4);
        asteroid.hitBox = initializeHitBox(asteroid.sprite, HitBoxType.ASTEROID, [HitBoxType.PLAYER, HitBoxType.STATION, HitBoxType.STATION_PART], 0, 0, 0, 0);
        setHitBoxGraphic(asteroid.sprite, asteroid.hitBox);
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
        this.gameCamera.position.copy(this.playerEntity.pos.loc);
        this.gameCamera.position.x -= this.viewWidth/2;
        this.gameCamera.position.y -= this.viewHeight/2;

        renderer.clear();
        renderer.render(this.gameScene, this.gameCamera);
        renderer.clearDepth();
        renderer.render(this.uiScene, this.uiCamera);

        // Render UI updates.
        layoutWidget(this.rootWidget);
    }
}