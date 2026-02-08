"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/store/project-store";

interface PreviewPanelProps {
  project: Project;
}

export function PreviewPanel({ project }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Determine if this is a 2D (Phaser) or 3D (Three.js) project
  const is3D = project.files.some(
    (f) =>
      f.content.includes("THREE") ||
      f.content.includes("three") ||
      f.path.includes("3d-exploration")
  );

  useEffect(() => {
    if (!containerRef.current || !isRunning) return;

    const container = containerRef.current;
    container.innerHTML = "";
    setError(null);

    // Find the game config file
    const configFile = project.files.find(
      (f) => f.path.includes("config.ts") || f.path.includes("config.js")
    );

    if (!configFile) {
      setError("No game config file found. Create src/game/config.ts to start.");
      return;
    }

    try {
      if (is3D) {
        // Create a simple Three.js preview
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; overflow: hidden; background: #1a1a2e; }
              #info { position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; font-size: 12px; }
            </style>
          </head>
          <body>
            <div id="info">WASD to move, Mouse to look, Click to lock pointer</div>
            <script type="importmap">
              {"imports": {"three": "https://unpkg.com/three@0.170.0/build/three.module.js"}}
            </script>
            <script type="module">
              import * as THREE from 'three';

              const scene = new THREE.Scene();
              scene.background = new THREE.Color(0x87ceeb);

              const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
              camera.position.set(0, 5, 10);

              const renderer = new THREE.WebGLRenderer({ antialias: true });
              renderer.setSize(window.innerWidth, window.innerHeight);
              renderer.shadowMap.enabled = true;
              document.body.appendChild(renderer.domElement);

              // Lighting
              const ambient = new THREE.AmbientLight(0x404040, 0.5);
              scene.add(ambient);
              const dirLight = new THREE.DirectionalLight(0xffffff, 1);
              dirLight.position.set(5, 10, 7.5);
              dirLight.castShadow = true;
              scene.add(dirLight);

              // Ground
              const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(50, 50),
                new THREE.MeshStandardMaterial({ color: 0x3b7d4f })
              );
              ground.rotation.x = -Math.PI / 2;
              ground.receiveShadow = true;
              scene.add(ground);

              // Objects
              const cubes = [];
              const colors = [0x6366f1, 0xef4444, 0x22c55e, 0xfbbf24];
              for (let i = 0; i < 10; i++) {
                const cube = new THREE.Mesh(
                  new THREE.BoxGeometry(1, 1, 1),
                  new THREE.MeshStandardMaterial({ color: colors[i % 4] })
                );
                cube.position.set((Math.random() - 0.5) * 30, 0.5, (Math.random() - 0.5) * 30);
                cube.castShadow = true;
                scene.add(cube);
                cubes.push(cube);
              }

              // Sphere
              const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(2, 32, 32),
                new THREE.MeshStandardMaterial({ color: 0x818cf8 })
              );
              sphere.position.set(0, 2, -10);
              sphere.castShadow = true;
              scene.add(sphere);

              // Controls
              const keys = {};
              document.addEventListener('keydown', e => keys[e.code] = true);
              document.addEventListener('keyup', e => keys[e.code] = false);

              document.addEventListener('mousemove', e => {
                if (document.pointerLockElement) {
                  camera.rotation.y -= e.movementX * 0.002;
                  camera.rotation.x -= e.movementY * 0.002;
                  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
                }
              });

              renderer.domElement.addEventListener('click', () => {
                renderer.domElement.requestPointerLock();
              });

              // Resize
              window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
              });

              // Animation
              function animate() {
                requestAnimationFrame(animate);

                const dir = new THREE.Vector3();
                if (keys['KeyW']) dir.z -= 1;
                if (keys['KeyS']) dir.z += 1;
                if (keys['KeyA']) dir.x -= 1;
                if (keys['KeyD']) dir.x += 1;
                dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
                camera.position.add(dir.multiplyScalar(0.15));

                cubes.forEach((cube, i) => {
                  cube.rotation.y += 0.01;
                  cube.position.y = 0.5 + Math.sin(Date.now() * 0.002 + i) * 0.2;
                });

                renderer.render(scene, camera);
              }
              animate();
            </script>
          </body>
          </html>
        `;

        container.appendChild(iframe);
        iframe.srcdoc = html;
      } else {
        // Create Phaser preview
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>body { margin: 0; background: #87CEEB; }</style>
            <script src="https://cdn.jsdelivr.net/npm/phaser@3.86.0/dist/phaser.min.js"></script>
          </head>
          <body>
            <script>
              class MainScene extends Phaser.Scene {
                constructor() { super({ key: 'MainScene' }); }

                create() {
                  // Platforms
                  this.platforms = this.physics.add.staticGroup();

                  const ground = this.add.rectangle(400, 580, 800, 40, 0x4a5568);
                  this.platforms.add(ground);

                  const plat1 = this.add.rectangle(600, 400, 200, 20, 0x4a5568);
                  const plat2 = this.add.rectangle(50, 250, 200, 20, 0x4a5568);
                  const plat3 = this.add.rectangle(750, 220, 200, 20, 0x4a5568);
                  this.platforms.add(plat1);
                  this.platforms.add(plat2);
                  this.platforms.add(plat3);

                  // Player
                  const playerGraphics = this.add.rectangle(100, 450, 32, 48, 0x6366f1);
                  this.player = this.physics.add.existing(playerGraphics);
                  this.player.body.setCollideWorldBounds(true);
                  this.player.body.setBounce(0.2, 0);

                  // Stars
                  this.stars = this.physics.add.group();
                  for (let i = 0; i < 12; i++) {
                    const star = this.add.circle(70 + i * 60, 0, 8, 0xfbbf24);
                    this.stars.add(star);
                    star.body.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
                  }

                  // Collisions
                  this.physics.add.collider(this.player, this.platforms);
                  this.physics.add.collider(this.stars, this.platforms);
                  this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

                  // Input
                  this.cursors = this.input.keyboard.createCursorKeys();

                  // Score
                  this.score = 0;
                  this.scoreText = this.add.text(16, 16, 'Score: 0', {
                    fontSize: '24px', color: '#fff', fontFamily: 'Arial'
                  });
                }

                update() {
                  if (this.cursors.left.isDown) {
                    this.player.body.setVelocityX(-200);
                  } else if (this.cursors.right.isDown) {
                    this.player.body.setVelocityX(200);
                  } else {
                    this.player.body.setVelocityX(0);
                  }

                  if (this.cursors.up.isDown && this.player.body.touching.down) {
                    this.player.body.setVelocityY(-500);
                  }
                }

                collectStar(player, star) {
                  star.destroy();
                  this.score += 10;
                  this.scoreText.setText('Score: ' + this.score);

                  if (this.stars.countActive(true) === 0) {
                    this.stars.children.iterate(child => {
                      child.enableBody(true, child.x, 0, true, true);
                    });
                  }
                }
              }

              new Phaser.Game({
                type: Phaser.AUTO,
                width: 800,
                height: 600,
                physics: {
                  default: 'arcade',
                  arcade: { gravity: { y: 800 }, debug: false }
                },
                scene: [MainScene],
                backgroundColor: '#87CEEB'
              });
            </script>
          </body>
          </html>
        `;

        container.appendChild(iframe);
        iframe.srcdoc = html;
      }
    } catch (err) {
      console.error("Preview error:", err);
      setError("Failed to render preview. Check your code for errors.");
    }
  }, [project, isRunning, is3D]);

  if (!isRunning) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
        <Play className="mb-4 h-12 w-12 text-zinc-600" />
        <p className="mb-4 text-sm text-zinc-500">Preview your game</p>
        <Button onClick={() => setIsRunning(true)}>
          <Play className="mr-2 h-4 w-4" />
          Run Preview
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="text-sm text-red-400">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setIsRunning(false)}
        >
          Close Preview
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-lg border border-zinc-800">
      <div
        ref={containerRef}
        id="game-container"
        className="h-full w-full bg-zinc-950"
      />
    </div>
  );
}
