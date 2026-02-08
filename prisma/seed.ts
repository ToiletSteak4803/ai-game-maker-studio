import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  {
    name: "2D Platformer",
    description:
      "A classic side-scrolling platformer with player movement, jumping, and collectibles.",
    type: "2d-platformer",
    thumbnail: "/templates/platformer-thumb.png",
    files: JSON.stringify([
      {
        path: "src/game/config.ts",
        content: `import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false
    }
  },
  scene: [MainScene],
  parent: 'game-container',
  backgroundColor: '#87CEEB'
};
`,
      },
      {
        path: "src/game/scenes/MainScene.ts",
        content: `import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private stars!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create simple colored rectangles as sprites
    this.load.image('sky', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  create() {
    // Create platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.add.rectangle(400, 580, 800, 40, 0x4a5568);
    this.platforms.add(ground);

    // Floating platforms
    const plat1 = this.add.rectangle(600, 400, 200, 20, 0x4a5568);
    const plat2 = this.add.rectangle(50, 250, 200, 20, 0x4a5568);
    const plat3 = this.add.rectangle(750, 220, 200, 20, 0x4a5568);
    this.platforms.add(plat1);
    this.platforms.add(plat2);
    this.platforms.add(plat3);

    // Create player
    const playerGraphics = this.add.rectangle(100, 450, 32, 48, 0x6366f1);
    this.player = this.physics.add.existing(playerGraphics) as unknown as Phaser.Physics.Arcade.Sprite;
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setBounce(0.2, 0);

    // Create stars
    this.stars = this.physics.add.group();
    for (let i = 0; i < 12; i++) {
      const star = this.add.circle(70 + i * 60, 0, 8, 0xfbbf24);
      this.stars.add(star);
      (star.body as Phaser.Physics.Arcade.Body).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    }

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'Arial'
    });
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (this.cursors.left.isDown) {
      body.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(200);
    } else {
      body.setVelocityX(0);
    }

    if (this.cursors.up.isDown && body.touching.down) {
      body.setVelocityY(-500);
    }
  }

  private collectStar(player: Phaser.GameObjects.GameObject, star: Phaser.GameObjects.GameObject) {
    (star as Phaser.GameObjects.Arc).destroy();
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    if (this.stars.countActive(true) === 0) {
      // Respawn stars
      this.stars.children.iterate((child) => {
        const c = child as Phaser.Physics.Arcade.Image;
        c.enableBody(true, c.x, 0, true, true);
        return true;
      });
    }
  }
}
`,
      },
      {
        path: "src/game/index.ts",
        content: `export { gameConfig } from './config';
export { MainScene } from './scenes/MainScene';
`,
      },
    ]),
  },
  {
    name: "Top-Down Shooter",
    description:
      "A top-down action game with WASD movement, mouse aiming, and shooting mechanics.",
    type: "top-down-shooter",
    thumbnail: "/templates/shooter-thumb.png",
    files: JSON.stringify([
      {
        path: "src/game/config.ts",
        content: `import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [MainScene],
  parent: 'game-container',
  backgroundColor: '#1a1a2e'
};
`,
      },
      {
        path: "src/game/scenes/MainScene.ts",
        content: `import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private lastFired = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Create player
    this.player = this.add.rectangle(400, 300, 30, 30, 0x6366f1);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // Create groups
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 20
    });

    this.enemies = this.physics.add.group();

    // Spawn enemies periodically
    this.time.addEvent({
      delay: 1500,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    // WASD input
    this.wasd = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D')
    };

    // Mouse click to shoot
    this.input.on('pointerdown', () => this.shoot());

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.gameOver, undefined, this);

    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'Arial'
    });
  }

  update(time: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 250;

    // Movement
    body.setVelocity(0);
    if (this.wasd.A.isDown) body.setVelocityX(-speed);
    if (this.wasd.D.isDown) body.setVelocityX(speed);
    if (this.wasd.W.isDown) body.setVelocityY(-speed);
    if (this.wasd.S.isDown) body.setVelocityY(speed);

    // Auto-fire when holding mouse
    if (this.input.activePointer.isDown && time > this.lastFired + 150) {
      this.shoot();
      this.lastFired = time;
    }

    // Rotate player to face mouse
    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      this.input.activePointer.worldX, this.input.activePointer.worldY
    );
    this.player.setRotation(angle);

    // Remove off-screen bullets
    this.bullets.children.each((bullet) => {
      const b = bullet as Phaser.GameObjects.Rectangle;
      if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {
        b.destroy();
      }
      return true;
    });
  }

  private shoot() {
    const bullet = this.add.rectangle(this.player.x, this.player.y, 8, 8, 0xfbbf24);
    this.bullets.add(bullet);
    this.physics.add.existing(bullet);

    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      this.input.activePointer.worldX, this.input.activePointer.worldY
    );

    const velocity = this.physics.velocityFromRotation(angle, 500);
    (bullet.body as Phaser.Physics.Arcade.Body).setVelocity(velocity.x, velocity.y);
  }

  private spawnEnemy() {
    const side = Phaser.Math.Between(0, 3);
    let x = 0, y = 0;

    switch (side) {
      case 0: x = Phaser.Math.Between(0, 800); y = -20; break;
      case 1: x = 820; y = Phaser.Math.Between(0, 600); break;
      case 2: x = Phaser.Math.Between(0, 800); y = 620; break;
      case 3: x = -20; y = Phaser.Math.Between(0, 600); break;
    }

    const enemy = this.add.rectangle(x, y, 25, 25, 0xef4444);
    this.enemies.add(enemy);
    this.physics.add.existing(enemy);

    this.physics.moveToObject(enemy, this.player, 100);
  }

  private hitEnemy(bullet: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    bullet.destroy();
    enemy.destroy();
    this.score += 100;
    this.scoreText.setText('Score: ' + this.score);
  }

  private gameOver() {
    this.scene.pause();
    this.add.text(400, 300, 'GAME OVER', {
      fontSize: '48px',
      color: '#ef4444',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(400, 360, 'Click to restart', {
      fontSize: '20px',
      color: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.score = 0;
      this.scene.restart();
    });
  }
}
`,
      },
      {
        path: "src/game/index.ts",
        content: `export { gameConfig } from './config';
export { MainScene } from './scenes/MainScene';
`,
      },
    ]),
  },
  {
    name: "3D Exploration",
    description:
      "A first-person 3D exploration scene with terrain, lighting, and object placement using Three.js.",
    type: "3d-exploration",
    thumbnail: "/templates/exploration-thumb.png",
    files: JSON.stringify([
      {
        path: "src/game/config.ts",
        content: `// 3D Scene Configuration
export const sceneConfig = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 5, z: 10 }
  },
  lighting: {
    ambient: { color: 0x404040, intensity: 0.5 },
    directional: { color: 0xffffff, intensity: 1, position: { x: 5, y: 10, z: 7.5 } }
  },
  terrain: {
    size: 50,
    color: 0x3b7d4f
  },
  skyColor: 0x87ceeb
};
`,
      },
      {
        path: "src/game/scenes/MainScene.ts",
        content: `import * as THREE from 'three';
import { sceneConfig } from '../config';

export class MainScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private keys: { [key: string]: boolean } = {};
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private objects: THREE.Object3D[] = [];

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(sceneConfig.skyColor);

    // Camera
    const { fov, near, far, position } = sceneConfig.camera;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      container.clientWidth / container.clientHeight,
      near,
      far
    );
    this.camera.position.set(position.x, position.y, position.z);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lighting
    const { ambient, directional } = sceneConfig.lighting;
    const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(directional.color, directional.intensity);
    dirLight.position.set(directional.position.x, directional.position.y, directional.position.z);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(sceneConfig.terrain.size, sceneConfig.terrain.size);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: sceneConfig.terrain.color });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add some objects
    this.addDecorations();

    // Controls
    this.setupControls();

    // Handle resize
    window.addEventListener('resize', () => this.onResize(container));

    // Start animation
    this.animate();
  }

  private addDecorations() {
    // Add some cubes as decorations
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const colors = [0x6366f1, 0xef4444, 0x22c55e, 0xfbbf24];

    for (let i = 0; i < 10; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length]
      });
      const cube = new THREE.Mesh(cubeGeometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 30,
        0.5,
        (Math.random() - 0.5) * 30
      );
      cube.castShadow = true;
      cube.receiveShadow = true;
      this.scene.add(cube);
      this.objects.push(cube);
    }

    // Add a sphere
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x818cf8 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 2, -10);
    sphere.castShadow = true;
    this.scene.add(sphere);
  }

  private setupControls() {
    document.addEventListener('keydown', (e) => this.keys[e.code] = true);
    document.addEventListener('keyup', (e) => this.keys[e.code] = false);

    // Mouse look
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.renderer.domElement) {
        this.camera.rotation.y -= e.movementX * 0.002;
        this.camera.rotation.x -= e.movementY * 0.002;
        this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
      }
    });

    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock();
    });
  }

  private onResize(container: HTMLElement) {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Movement
    this.direction.set(0, 0, 0);
    if (this.keys['KeyW']) this.direction.z -= 1;
    if (this.keys['KeyS']) this.direction.z += 1;
    if (this.keys['KeyA']) this.direction.x -= 1;
    if (this.keys['KeyD']) this.direction.x += 1;

    this.direction.normalize();
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);

    const speed = 0.15;
    this.camera.position.add(this.direction.multiplyScalar(speed));

    // Animate objects
    this.objects.forEach((obj, i) => {
      obj.rotation.y += 0.01;
      obj.position.y = 0.5 + Math.sin(Date.now() * 0.002 + i) * 0.2;
    });

    this.renderer.render(this.scene, this.camera);
  };

  public addGLBModel(url: string, position: { x: number; y: number; z: number }) {
    // This would use GLTFLoader in production
    console.log('Adding GLB model:', url, 'at', position);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
`,
      },
      {
        path: "src/game/index.ts",
        content: `export { sceneConfig } from './config';
export { MainScene } from './scenes/MainScene';
`,
      },
    ]),
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing templates
  await prisma.template.deleteMany();

  // Create templates
  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
    console.log(`Created template: ${template.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
