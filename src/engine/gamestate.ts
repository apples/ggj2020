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
import { worldEdgeSystem } from "./gamesystems";

/**
 * GameState that handles updating of all game-related systems.
 */

export class GameState extends BaseState {
    public readonly viewWidth = 1280;
    public readonly viewHeight = 720;

    public readonly worldWidth = 1280 * 4;
    public readonly worldHeight = 720 * 4;

    public gameScene: Scene;
    public gameCamera: Camera;
    public uiScene: Scene;
    public uiCamera: Camera;
    public rootWidget: Widget;
    public playerEntity: Entity;

    public ticks = 0;
    public lasteroid = 0;
    public asteroidDelay = 60;

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
        this.registerSystem(worldEdgeSystem);

        playAudio("./data/audio/Pale_Blue.mp3", 0.3, true);

        // Set up player entity.
        let player = new Entity();
        this.playerEntity = player;
        player.pos = initializePosition(225, 225, 5);
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
        player.hitBox.onHit = function(player, other) {

            rootComponent.addClick();
            player.vel.positional.copy(other.vel.positional.clone().multiplyScalar(11));
        }
        this.registerEntity(player);

        // Set up space station central hub entity.
        let station = new Entity();
        station.pos = initializePosition(0, 0, 4);
        station.sprite = initializeSprite("./data/textures/base3MiddleLarge.png", this.gameScene, 5.25);
        station.hitBox = initializeHitBox(station.sprite, HitBoxType.STATION, [HitBoxType.ASTEROID], 130, 130, 0, 0);
        //setHitBoxGraphic(station.sprite, station.hitBox);
        station.hitBox.onHit = function() {
            rootComponent.addClick();
            // TODO // Make this decrease base health + chip off a chunk of armor
        }
        this.registerEntity(station);

        let offset = 126;
        let ringEntities = [
            // {x: 440, y: 160, sprite: "base3Corner.png", rotation: new Vector3(-1,0,0)},
            // {x: 440, y: 360, sprite: "base3Side.png", rotation: new Vector3(-1,0,0)},
            // {x: 440, y: 560, sprite: "base3Corner.png", rotation: new Vector3(0,1,0)},
            // {x: 640, y: 160, sprite: "base3Side.png", rotation: new Vector3(0,-1,0)},
            // {x: 640, y: 560, sprite: "base3Side.png", rotation: new Vector3(0,1,0)},
            // {x: 840, y: 160, sprite: "base3Corner.png", rotation: new Vector3(0,-1,0)},
            // {x: 840, y: 360, sprite: "base3Side.png", rotation: new Vector3(1,0,0)},
            // {x: 840, y: 560, sprite: "base3Corner.png", rotation: new Vector3(1,0,0)},

            {x: -offset, y: -offset, sprite: "base3Corner.png", rotation: new Vector3(-1,0,0)},
            {x: -offset, y: 0, sprite: "base3Side.png", rotation: new Vector3(-1,0,0)},
            {x: -offset, y: offset, sprite: "base3Corner.png", rotation: new Vector3(0,1,0)},
            {x: 0, y: -offset, sprite: "base3Side.png", rotation: new Vector3(0,-1,0)},
            {x: 0, y: offset, sprite: "base3Side.png", rotation: new Vector3(0,1,0)},
            {x: offset, y: -offset, sprite: "base3Corner.png", rotation: new Vector3(0,-1,0)},
            {x: offset, y: 0, sprite: "base3Side.png", rotation: new Vector3(1,0,0)},
            {x: offset, y: offset, sprite: "base3Corner.png", rotation: new Vector3(1,0,0)},
        ]

        // Set up station ring piece entities.
        ringEntities.forEach((entity) => {
            let ring = new Entity();
            ring.pos = initializePosition(entity.x, entity.y, 4, entity.rotation);
            ring.sprite = initializeSprite("./data/textures/"+entity.sprite, this.gameScene, 5.25);
            ring.hitBox = initializeHitBox(ring.sprite, HitBoxType.STATION_PART, [HitBoxType.ASTEROID]); // TODO make center smaller than sprite
            //setHitBoxGraphic(ring.sprite, ring.hitBox);
            ring.hitBox.onHit = function() {
                rootComponent.addClick();
                // TODO // Make this decrease base health + chip off a chunk of armor
            }
            this.registerEntity(ring);
        });

        // Set up background element
        let stars = new Entity();
        stars.pos = initializePosition(0, 0, 1);
        stars.sprite = initializeSprite("./data/textures/space4096Square.png", this.gameScene, 2);
        this.registerEntity(stars);
    }

    public update() : void {
        ++this.ticks;
        this.runSystems(this);

        if (this.ticks - this.lasteroid >= this.asteroidDelay) {
            this.lasteroid = this.ticks;
            this.spawnRandomAsteroid();
        }
    }

    public render(renderer: WebGLRenderer) : void {
        let cx = this.playerEntity.pos.loc.x;
        let cy = this.playerEntity.pos.loc.y;

        cx = Math.max(cx, -this.worldWidth/2 + this.viewWidth/2);
        cx = Math.min(cx, this.worldWidth/2 - this.viewWidth/2);

        cy = Math.max(cy, -this.worldHeight/2 + this.viewHeight/2);
        cy = Math.min(cy, this.worldHeight/2 - this.viewHeight/2);

        this.gameCamera.position.x = cx - this.viewWidth/2;
        this.gameCamera.position.y = cy - this.viewHeight/2;

        renderer.clear();
        renderer.render(this.gameScene, this.gameCamera);
        renderer.clearDepth();
        renderer.render(this.uiScene, this.uiCamera);

        // Render UI updates.
        layoutWidget(this.rootWidget);
    }

    public spawnRandomAsteroid() {
        const angleFromBase = Math.random() * Math.PI * 2;

        const dx = Math.cos(angleFromBase);
        const dy = Math.sin(angleFromBase);

        const solutions = [
            -this.worldWidth/2/dx,
            this.worldWidth/2/dx,
            -this.worldHeight/2/dy,
            this.worldHeight/2/dy,
        ];

        const t = solutions.filter(t => t > 0).sort((a, b) => a - b)[0];

        const x = dx * t;
        const y = dy * t;

        const trajectory = Math.random() * Math.PI * 2;

        // Set up asteroid entity.
        let asteroid = new Entity();
        asteroid.pos = initializePosition(x, y, 4, new Vector3(1, 0, 0), true);
        asteroid.vel = initializeVelocity(1, new Vector3(5, 0, 0).applyEuler(new Euler(0, 0, trajectory)), new Euler(0, 0, 0.125));
        asteroid.sprite = initializeSprite("./data/textures/asteroidCircular.png", this.gameScene, 4);
        asteroid.hitBox = initializeHitBox(asteroid.sprite, HitBoxType.ASTEROID, [HitBoxType.PLAYER, HitBoxType.STATION, HitBoxType.STATION_PART], 0, 0, 0, 0);
        //setHitBoxGraphic(asteroid.sprite, asteroid.hitBox);
        this.registerEntity(asteroid);
    }
}