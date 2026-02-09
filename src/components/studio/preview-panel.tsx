"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AlertCircle, Play, RefreshCw } from "lucide-react";
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
  const is3D = useMemo(() => project.files.some(
    (f) =>
      f.content.includes("THREE") ||
      f.content.includes("three") ||
      f.path.includes("3d-exploration")
  ), [project.files]);

  // Find game files - look for scene files and config
  const sceneFile = useMemo(() => {
    return project.files.find(
      (f) => f.path.includes("MainScene.ts") || f.path.includes("MainScene.js") ||
             f.path.includes("main.ts") || f.path.includes("main.js") ||
             f.path.includes("game.ts") || f.path.includes("game.js") ||
             f.path.includes("Scene.ts") || f.path.includes("Scene.js")
    );
  }, [project.files]);

  const configFile = useMemo(() => {
    return project.files.find(
      (f) => f.path.includes("config.ts") || f.path.includes("config.js")
    );
  }, [project.files]);

  // Convert simple TypeScript to JavaScript (basic conversion)
  const transpileSimple = (code: string): string => {
    // Process line by line to avoid cross-line matching issues
    const lines = code.split('\n');
    const result: string[] = [];
    let skipUntilCloseBrace = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Skip interface/type declarations
      if (/^\s*(interface|type)\s+\w+/.test(line)) {
        if (line.includes('{')) {
          skipUntilCloseBrace = true;
          braceDepth = 1;
        }
        continue;
      }
      if (skipUntilCloseBrace) {
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        if (braceDepth <= 0) {
          skipUntilCloseBrace = false;
        }
        continue;
      }

      // Skip import statements
      if (/^\s*import\s+/.test(line)) {
        continue;
      }

      // Remove export keywords
      line = line.replace(/^(\s*)export\s+(default\s+)?/, '$1');

      // Remove access modifiers FIRST (before checking for class fields)
      line = line.replace(/\b(private|public|protected|readonly)\s+/g, '');

      // Remove non-null assertions FIRST (! not followed by =)
      line = line.replace(/!(?!=)/g, '');

      // Remove type annotations from variable declarations: const x: Type =
      line = line.replace(/\b(const|let|var)\s+(\w+)\s*:\s*[^=\n]+\s*=/g, '$1 $2 =');

      // Remove type annotations from class fields WITHOUT initializer
      // Now the line should be like: "  fieldName: SomeType;"
      if (/^\s+\w+\s*:/.test(line) && line.trim().endsWith(';') && !line.includes('=')) {
        const match = line.match(/^(\s+)(\w+)\s*:\s*(.+);\s*$/);
        if (match) {
          const [, indent, fieldName, typeOrValue] = match;
          const trimmedType = typeOrValue.trim();
          // It's a type if it starts with uppercase, { for object types
          if (/^[A-Z{]/.test(trimmedType) || /^[\w.]+</.test(trimmedType)) {
            line = `${indent}${fieldName};`;
          }
        }
      }

      // Remove type annotations from class fields WITH initializer: field: Type = value
      if (/^\s+\w+\s*:\s*[A-Z]/.test(line) && line.includes('=')) {
        line = line.replace(/^(\s+)(\w+)\s*:\s*[^=]+=/, '$1$2 =');
      }

      // Remove type annotations from function parameters
      line = line.replace(/(\(|,\s*)(\w+)\s*:\s*[\w.<>[\]|&\s]+(?=[,)])/g, '$1$2');

      // Remove function return type annotations: ): Type {
      line = line.replace(/\)\s*:\s*[\w.<>[\]|&\s]+\s*\{/, ') {');

      // Remove 'as Type' casts
      line = line.replace(/\s+as\s+\w+(\.\w+)*/g, '');

      result.push(line);
    }

    return result.join('\n').replace(/\n{3,}/g, '\n\n');
  };

  // Safely encode code for embedding in HTML
  const encodeForEmbed = (code: string): string => {
    return btoa(unescape(encodeURIComponent(code)));
  };

  useEffect(() => {
    if (!containerRef.current || !isRunning) return;

    const container = containerRef.current;
    container.innerHTML = "";
    setError(null);

    try {
      const iframe = document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";

      let gameCode = "";

      // Combine scene and config code - scene FIRST so classes are defined before config references them
      if (sceneFile) {
        console.log('[preview] Raw scene:', sceneFile.content.slice(0, 500));
        gameCode += transpileSimple(sceneFile.content) + "\n\n";
      }
      if (configFile) {
        console.log('[preview] Raw config:', configFile.content.slice(0, 500));
        gameCode += transpileSimple(configFile.content);
      }
      console.log('[preview] Transpiled result:', gameCode.slice(0, 500));

      // Encode code for safe embedding
      const encodedCode = (sceneFile || configFile) ? encodeForEmbed(gameCode) : "";

      if (is3D) {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; overflow: hidden; background: #1a1a2e; }
              #info { position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; font-size: 12px; z-index: 100; }
              #error-display { position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; padding: 12px; font-family: monospace; font-size: 12px; z-index: 9999; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
            </style>
          </head>
          <body>
            <div id="info">WASD to move, Mouse to look, Click to lock pointer</div>
            <script type="importmap">
              {"imports": {"three": "https://unpkg.com/three@0.170.0/build/three.module.js"}}
            </script>
            <script type="module">
              import * as THREE from 'three';

              // Make THREE available globally for user code
              window.THREE = THREE;

              function showError(msg) {
                let el = document.getElementById('error-display');
                if (!el) {
                  el = document.createElement('div');
                  el.id = 'error-display';
                  document.body.prepend(el);
                }
                el.textContent = msg;
              }

              ${(sceneFile || configFile) ? `
              // Decode and execute user's game code
              try {
                const encodedCode = '${encodedCode}';
                const gameCode = decodeURIComponent(escape(atob(encodedCode)));
                console.log('Transpiled code length:', gameCode.length);

                // Execute the code - need to use eval for ES6 modules context
                eval(gameCode);

                // Auto-instantiate 3D scene if MainScene class is defined
                if (typeof MainScene !== 'undefined' && MainScene.prototype) {
                  const container = document.body;
                  new MainScene(container);
                } else {
                  showError('MainScene class not found. Make sure your scene class is named MainScene.');
                }
              } catch(e) {
                console.error('Game code error:', e);
                showError('Error: ' + e.message);
              }
              ` : `
              // Default 3D scene
              const scene = new THREE.Scene();
              scene.background = new THREE.Color(0x87ceeb);

              const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
              camera.position.set(0, 5, 10);

              const renderer = new THREE.WebGLRenderer({ antialias: true });
              renderer.setSize(window.innerWidth, window.innerHeight);
              renderer.shadowMap.enabled = true;
              document.body.appendChild(renderer.domElement);

              const ambient = new THREE.AmbientLight(0x404040, 0.5);
              scene.add(ambient);
              const dirLight = new THREE.DirectionalLight(0xffffff, 1);
              dirLight.position.set(5, 10, 7.5);
              dirLight.castShadow = true;
              scene.add(dirLight);

              const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(50, 50),
                new THREE.MeshStandardMaterial({ color: 0x3b7d4f })
              );
              ground.rotation.x = -Math.PI / 2;
              ground.receiveShadow = true;
              scene.add(ground);

              const cube = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshStandardMaterial({ color: 0x6366f1 })
              );
              cube.position.y = 1;
              cube.castShadow = true;
              scene.add(cube);

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

              window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
              });

              function animate() {
                requestAnimationFrame(animate);
                const dir = new THREE.Vector3();
                if (keys['KeyW']) dir.z -= 1;
                if (keys['KeyS']) dir.z += 1;
                if (keys['KeyA']) dir.x -= 1;
                if (keys['KeyD']) dir.x += 1;
                dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
                camera.position.add(dir.multiplyScalar(0.15));
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
              }
              animate();
              `}
            </script>
          </body>
          </html>
        `;

        container.appendChild(iframe);
        iframe.srcdoc = html;
      } else {
        // 2D Phaser game
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; background: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              #error-display { position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; padding: 12px; font-family: monospace; font-size: 12px; z-index: 9999; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/phaser@3.86.0/dist/phaser.min.js"></script>
          </head>
          <body>
            <script>
              // Global error handler
              window.onerror = function(msg, url, line, col, error) {
                console.error('Runtime error:', msg, 'at line', line);
                showError('Runtime error at line ' + line + ': ' + msg);
                return false;
              };
              function showError(msg) {
                let el = document.getElementById('error-display');
                if (!el) {
                  el = document.createElement('div');
                  el.id = 'error-display';
                  document.body.prepend(el);
                }
                el.textContent = msg;
              }
              ${(sceneFile || configFile) ? `
              // Debug info
              console.log('Scene file found:', '${sceneFile?.path || 'none'}');
              console.log('Config file found:', '${configFile?.path || 'none'}');

              // Decode user's game code
              const encodedCode = '${encodedCode}';
              const gameCode = decodeURIComponent(escape(atob(encodedCode)));
              console.log('Transpiled code length:', gameCode.length);
              console.log('Transpiled code preview:', gameCode.slice(0, 500));

              // Create a script element to execute in global scope
              const script = document.createElement('script');
              script.textContent = gameCode + \`
                // Auto-instantiate the game after class is defined
                if (typeof MainScene !== 'undefined') {
                  console.log('MainScene found, creating game...');
                  const config = typeof gameConfig !== 'undefined' ? gameConfig : {
                    type: Phaser.AUTO,
                    width: 800,
                    height: 600,
                    physics: {
                      default: 'arcade',
                      arcade: { gravity: { y: 800 }, debug: false }
                    },
                    scene: [MainScene],
                    backgroundColor: '#87CEEB'
                  };
                  new Phaser.Game(config);
                } else {
                  document.body.innerHTML = '<div style="color:red;padding:20px;">MainScene class not found.</div>';
                }
              \`;
              document.body.appendChild(script);
              ` : `
              // Default 2D platformer
              class MainScene extends Phaser.Scene {
                constructor() { super({ key: 'MainScene' }); }

                create() {
                  this.platforms = this.physics.add.staticGroup();
                  const ground = this.add.rectangle(400, 580, 800, 40, 0x4a5568);
                  this.platforms.add(ground);

                  const plat1 = this.add.rectangle(600, 400, 200, 20, 0x4a5568);
                  const plat2 = this.add.rectangle(50, 250, 200, 20, 0x4a5568);
                  const plat3 = this.add.rectangle(750, 220, 200, 20, 0x4a5568);
                  this.platforms.add(plat1);
                  this.platforms.add(plat2);
                  this.platforms.add(plat3);

                  const playerGraphics = this.add.rectangle(100, 450, 32, 48, 0x6366f1);
                  this.player = this.physics.add.existing(playerGraphics);
                  this.player.body.setCollideWorldBounds(true);
                  this.player.body.setBounce(0.2, 0);

                  this.stars = this.physics.add.group();
                  for (let i = 0; i < 12; i++) {
                    const star = this.add.circle(70 + i * 60, 0, 8, 0xfbbf24);
                    this.stars.add(star);
                    star.body.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
                  }

                  this.physics.add.collider(this.player, this.platforms);
                  this.physics.add.collider(this.stars, this.platforms);
                  this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

                  this.cursors = this.input.keyboard.createCursorKeys();
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
              `}
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
  }, [project.files, isRunning, is3D, sceneFile, configFile]);

  const handleRefresh = () => {
    setIsRunning(false);
    setTimeout(() => setIsRunning(true), 100);
  };

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
    <div className="relative h-full overflow-hidden rounded-lg border border-zinc-800">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 z-10 bg-zinc-800/80 hover:bg-zinc-700"
        onClick={handleRefresh}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <div
        ref={containerRef}
        id="game-container"
        className="h-full w-full bg-zinc-950"
      />
    </div>
  );
}
