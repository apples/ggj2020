import { initializeAnimation, initializeControls, initializeHitBox, initializeSprite, initializePosition, initializeVelocity, initializeTimer, initializeBeam, initializeBehavior } from "./initializers";
import { Scene, Camera, Color, WebGLRenderer, OrthographicCamera, Vector3, Euler, BufferGeometry, BufferAttribute, MeshBasicMaterial, Mesh, PlaneGeometry } from "three";
import { positionSystem, collisionSystem, timerSystem, animationSystem, velocitySystem, behaviorSystem, healthSystem } from "./coresystems";
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
import { worldEdgeSystem, healthHUDSystem } from "./gamesystems";
import { beamSystem } from "./gamesystems";
import { enforcer } from "../behaviors/enforcer";

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
    public BeamEntity: Entity;

    public ticks = 0;
    public lasteroid = 0;
    public asteroidDelay = 6;
    public asteroidsCount = 0;

    public turnOnHitboxes = false;

    public rootComponent: Root;

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

        this.rootComponent = renderGameUi(this.uiScene, this.rootWidget);

        // Register systems.
        this.registerSystem(controlSystem, "control");
        this.registerSystem(velocitySystem);
        this.registerSystem(collisionSystem);
        this.registerSystem(animationSystem);
        this.registerSystem(timerSystem);
        this.registerSystem(positionSystem);
        this.registerSystem(worldEdgeSystem);
        this.registerSystem(beamSystem);
        this.registerSystem(behaviorSystem);
        this.registerSystem(healthSystem);
        this.registerSystem(healthHUDSystem);

        playAudio("./data/audio/Pale_Blue.mp3", 0.3, true);

        // Set up player entity.
        let player = new Entity();
        player.hitboxType = HitBoxType.PLAYER;
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
        player.hitBox = initializeHitBox(player.sprite, HitBoxType.PLAYER, [HitBoxType.ASTEROID, HitBoxType.STATION_PART, HitBoxType.STATION], 0, 0, 0, 0);
        if (this.turnOnHitboxes) setHitBoxGraphic(player.sprite, player.hitBox);
        player.hitBox.onHit = function(player, other) {
            if (other.hitboxType == HitBoxType.ASTEROID) {
                 // player gets yeeted by an asteroid
                //player.vel.positional.copy(other.vel.positional.clone().multiplyScalar(11));
            }
            if (other.hitboxType == HitBoxType.STATION || other.hitboxType == HitBoxType.STATION_PART){
                // player bounces off the base
                if (player.pos.loc.x > 0) player.vel.positional.setX(Math.abs(player.vel.positional.x));
                else player.vel.positional.setX(Math.abs(player.vel.positional.x) * -1);

                if (player.pos.loc.y > 0) player.vel.positional.setY(Math.abs(player.vel.positional.y));
                else player.vel.positional.setY(Math.abs(player.vel.positional.y) * -1);
            }
        }
        player.ouchie = { mesh: undefined };
        this.registerEntity(player);

        // Set up space station central hub entity.
        let station = new Entity();
        station.hitboxType = HitBoxType.STATION;
        station.pos = initializePosition(0, 0, 4);
        station.sprite = initializeSprite("./data/textures/base3MiddleLarge.png", this.gameScene, 5.25);
        station.hitBox = initializeHitBox(station.sprite, HitBoxType.STATION, [HitBoxType.ASTEROID], 130, 130, 0, 0);
        if (this.turnOnHitboxes) setHitBoxGraphic(station.sprite, station.hitBox);
        station.hitBox.onHit = function(self, other) {
            // TODO // If this gets hit by an asteroid, you lose.
        }
        this.registerEntity(station);

        //set up beam entity
        let beam = new Entity();
        beam.beam = initializeBeam(this.playerEntity);

        var geometry = new BufferGeometry();
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        var vertices = new Float32Array( [
            -1000.0, -10.0,  4.9,
            1000.0, -10.0,  4.9,
            1000.0,  10.0,  4.9,

            1000.0,  10.0,  4.9,
            -1000.0,  10.0,  4.9,
            -1000.0, -10.0,  4.9
        ] );

        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );
        var material = new MeshBasicMaterial( { color: 0xff0000 } );
        var mesh = new Mesh( geometry, material );
        this.gameScene.add(mesh);

        this.registerEntity(beam);
        this.BeamEntity = beam;

        let offset = 126;
        let ringEntities = [
            {x: -offset, y: -offset, sprite: "base3Corner.png", rotation: new Vector3(-1,0,0)},
            {x: -offset, y: 0, sprite: "base3Side.png", rotation: new Vector3(-1,0,0)},
            {x: -offset, y: offset, sprite: "base3Corner.png", rotation: new Vector3(0,1,0)},
            {x: 0, y: -offset, sprite: "base3Side.png", rotation: new Vector3(0,-1,0), flipHitbox: true},
            {x: 0, y: offset, sprite: "base3Side.png", rotation: new Vector3(0,1,0), flipHitbox: true},
            {x: offset, y: -offset, sprite: "base3Corner.png", rotation: new Vector3(0,-1,0)},
            {x: offset, y: 0, sprite: "base3Side.png", rotation: new Vector3(1,0,0)},
            {x: offset, y: offset, sprite: "base3Corner.png", rotation: new Vector3(1,0,0)},
        ]

        // Set up station ring piece entities.
        ringEntities.forEach((entity) => {
            let that=this;
            let ring = new Entity();
            ring.hitboxType = HitBoxType.STATION_PART;
            ring.pos = initializePosition(entity.x, entity.y, 4, entity.rotation);
            ring.sprite = initializeSprite("./data/textures/"+entity.sprite, this.gameScene, 5.25);
            ring.hitBox = initializeHitBox(ring.sprite, HitBoxType.STATION_PART, [HitBoxType.ASTEROID, HitBoxType.PLAYER]); // TODO make center smaller than sprite
            ring.vel = initializeVelocity(1, new Vector3(0, 0, 0));

            if (entity.flipHitbox) {
                let newHeight = ring.hitBox.width;
                let newWidth = ring.hitBox.height;
                ring.hitBox.width = newWidth;
                ring.hitBox.height = newHeight;
            }

            if (this.turnOnHitboxes) setHitBoxGraphic(ring.sprite, ring.hitBox);
            ring.hitBox.onHit = function(self, other) {
                // Asteroid knocks the station ring loose.
                if (other.hitboxType == HitBoxType.ASTEROID) {
                    if (other.pos.loc.x > 0) other.vel.positional.setX(Math.abs(other.vel.positional.x));
                    else other.vel.positional.setX(Math.abs(other.vel.positional.x) * -1);

                    if (other.pos.loc.y > 0) other.vel.positional.setY(Math.abs(other.vel.positional.y));
                    else other.vel.positional.setY(Math.abs(other.vel.positional.y) * -1);

                    self.vel.positional.copy(other.vel.positional.clone().multiplyScalar(0.133));
                }
            }
            this.registerEntity(ring);
        });

        // Set up background element
        let stars = new Entity();
        stars.pos = initializePosition(0, 0, 1);
        stars.sprite = initializeSprite("./data/textures/space4096Square.png", this.gameScene, 2);
        this.registerEntity(stars);


        this.spawnEnforcerShip();
        this.spawnEnforcerShip();
    }

    public removeEntity(ent: Entity) {
        super.removeEntity(ent);
        if (ent.sprite) {
            this.gameScene.remove(ent.sprite);
        }
        if (ent.health && ent.health.mesh) {
            this.gameScene.remove(ent.health.mesh);
        }
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
        asteroid.hitboxType = HitBoxType.ASTEROID;
        asteroid.pos = initializePosition(x, y, 4, new Vector3(1, 0, 0), true);
        asteroid.vel = initializeVelocity(1, new Vector3(5, 0, 0).applyEuler(new Euler(0, 0, trajectory)), new Euler(0, 0, 0.125));
        asteroid.sprite = initializeSprite("./data/textures/asteroidCircular.png", this.gameScene, 4);
        asteroid.hitBox = initializeHitBox(asteroid.sprite, HitBoxType.ASTEROID, [HitBoxType.PLAYER, HitBoxType.STATION, HitBoxType.STATION_PART], 0, 0, 0, 0);
        if (this.turnOnHitboxes) setHitBoxGraphic(asteroid.sprite, asteroid.hitBox);
        this.registerEntity(asteroid);
        this.asteroidsCount++;
    }

    public spawnEnforcerShip() {
        const ship = new Entity();
        ship.pos = initializePosition(0, 0, 5, new Vector3(0, 1, 0));
        ship.sprite = initializeSprite("./data/textures/ally1.png", this.gameScene, 3.5);
        ship.sprite.rotateZ(-Math.PI/2);
        ship.vel = initializeVelocity(0.4);
        ship.vel.friction = 0.98;
        ship.hitBox = initializeHitBox(ship.sprite, HitBoxType.ENFORCER, [HitBoxType.ASTEROID], 0, 0, 0, 0);
        ship.hitBox.onHit = (self, other, _manifold) => {
            --self.health.value;
            this.removeEntity(other);
        };
        ship.behavior = initializeBehavior(enforcer);
        const healthBarGeometry = new PlaneGeometry(200, 20);
        const healthBarMaterial = new MeshBasicMaterial({ color: '#00ff00' });
        const healthBarMesh = new Mesh(healthBarGeometry, healthBarMaterial);
        ship.health = {
            value: 10,
            maxValue: 10,
            mesh: healthBarMesh,
            onDeath: (self) => this.removeEntity(self),
        };
        this.gameScene.add(healthBarMesh);
        this.registerEntity(ship);
    }
}
