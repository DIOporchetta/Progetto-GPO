import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';

// Crea scena e renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Migliora la qualità su schermi ad alta risoluzione
document.body.appendChild(renderer.domElement);

// Imposta lo stile del canvas per full screen
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

// Luci
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Variabili
let model, floor, player;
const gravity = -0.01;
const bounceFactor = 0.7;
let velocityY = 0;
const floorHeight = -1.5;
let isFalling = true;
let isPlayerActive = false;
const moveSpeed = 0.1;
const keyState = {};

// Configurazione delle dimensioni
const sizes = {
    viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
    },
};

// Telecamera
let cameraInstance;

// Eventi tastiera
window.addEventListener('keydown', (event) => (keyState[event.key] = true));
window.addEventListener('keyup', (event) => (keyState[event.key] = false));

// Carica il pavimento
const loader = new GLTFLoader();
loader.load('/vite-project/src/Model/floor.glb', (gltf) => {
    floor = gltf.scene;
    floor.scale.set(1, 1, 1);
    floor.position.set(0, floorHeight - 1, 0);
    scene.add(floor);
});

// Carica il cubo
loader.load('/vite-project/src/Model/title.glb', (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 5, 0);
    scene.add(model);

    // Inizializza la telecamera
    cameraInstance = new Camera({ sizes, scene, model });
});

// Carica il giocatore
loader.load('/vite-project/src/Model/player.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1, 1, 1);
    player.position.set(0, 15, 0);
    scene.add(player);
    player.visible = false;
});

// Aggiorna la posizione del titolo
function updateBlockPosition() {
    if (model && !isPlayerActive) {
        if (isFalling) {
            velocityY += gravity;
            model.position.y += velocityY;

            if (model.position.y <= floorHeight) {
                model.position.y = floorHeight;
                velocityY = -velocityY * bounceFactor;

                if (Math.abs(velocityY) < 0.01) {
                    velocityY = 0;
                    isFalling = false;
                }
            }
        }
    }
}

// Aggiorna la posizione del giocatore
function updatePlayerPosition() {
    if (player && isPlayerActive) {
        if (keyState['w'] || keyState['ArrowUp']) player.position.z -= moveSpeed;
        if (keyState['s'] || keyState['ArrowDown']) player.position.z += moveSpeed;
        if (keyState['a'] || keyState['ArrowLeft']) player.position.x -= moveSpeed;
        if (keyState['d'] || keyState['ArrowRight']) player.position.x += moveSpeed;

        velocityY += gravity;
        player.position.y += velocityY;

        if (player.position.y <= floorHeight) {
            player.position.y = floorHeight;
            velocityY = -velocityY * bounceFactor;

            if (Math.abs(velocityY) < 0.01) {
                velocityY = 0;
                isFalling = false;
            }
        }
    }
}

// Attiva il personaggio
function activatePlayer() {
    if (!isPlayerActive && !isFalling) {
        isPlayerActive = true;
        model.visible = false;
        player.visible = true;
        player.position.set(0, 15, 0);
        velocityY = 0;
        cameraInstance.model = player;
        isFalling = true;
    }
}

// Aggiorna le dimensioni del renderer e della telecamera quando la finestra viene ridimensionata
window.addEventListener('resize', () => {
    sizes.viewport.width = window.innerWidth;
    sizes.viewport.height = window.innerHeight;

    renderer.setSize(sizes.viewport.width, sizes.viewport.height);
    renderer.setPixelRatio(window.devicePixelRatio);

    if (cameraInstance) {
        cameraInstance.updateAspectRatio();
    }
});

// Animazione
function animate() {
    if (cameraInstance) cameraInstance.update();
    if (!isPlayerActive) updateBlockPosition();
    if (isPlayerActive) updatePlayerPosition();
    renderer.render(scene, cameraInstance ? cameraInstance.instance : new THREE.PerspectiveCamera());
    requestAnimationFrame(animate);
}

// Attiva il personaggio con la barra spaziatrice
window.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Space') {
        activatePlayer();
    }
});

animate();