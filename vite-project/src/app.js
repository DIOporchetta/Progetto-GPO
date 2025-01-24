import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';
import Collision from './Collision/Collision.js';

// Crea scena e renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Imposta lo stile del canvas per full screen
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

// Luci
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Creazione oggetto collisione
const collisionManager = new Collision(scene);

// Variabili
let model, floor, player;
const gravity = -0.01;
const bounceFactor = 0.3;
let velocityY = 0;
const floorHeight = -1.5;
let isFalling = true;
let isPlayerActive = false;
const moveSpeed = 0.1;
const keyState = {};
const loader = new GLTFLoader();

// Configurazione delle dimensioni
const sizes = {
    viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
    },
};

// Creazione telecamera
const cameraInstance = new Camera({
    sizes,
    scene,
    model: null,
});

// Eventi tastiera
window.addEventListener('keydown', (event) => (keyState[event.key] = true));
window.addEventListener('keyup', (event) => (keyState[event.key] = false));

// Variabili telecamera
let cameraTarget = null;

// Carica il giocatore
loader.load('/vite-project/src/Model/player.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1, 1, 1);
    player.position.set(0, 15, 0);
    scene.add(player);
    player.visible = false;

    collisionManager.addObject('player', player);

    // Associa il modello alla telecamera
    cameraInstance.model = player;
});

// Carica il pavimento
loader.load('/vite-project/src/Model/floor.glb', (gltf) => {
    floor = gltf.scene;
    floor.scale.set(1, 1, 1);
    floor.position.set(0, floorHeight - 1, 0);
    scene.add(floor);

    collisionManager.addObject('floor', floor);
});

// Aggiorna la posizione del giocatore
function updatePlayerPosition() {
    if (player && isPlayerActive) {
        const prevPosition = player.position.clone();

        // Movimento del giocatore
        if (keyState['w'] || keyState['ArrowUp']) player.position.z -= moveSpeed;
        if (keyState['s'] || keyState['ArrowDown']) player.position.z += moveSpeed;
        if (keyState['a'] || keyState['ArrowLeft']) player.position.x -= moveSpeed;
        if (keyState['d'] || keyState['ArrowRight']) player.position.x += moveSpeed;

        // Controllo collisioni
        collisionManager.updateBoundingBox('player', player);

        // Gravità
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

// Mostra il giocatore e collega la telecamera
function spawnPlayer() {
    if (!isPlayerActive) {
        player.visible = true;
        isPlayerActive = true;
        cameraTarget = player;
    }
}

// Animazione
function animate() {
    // Gestione del rimbalzo del titolo
    if (isFalling) {
        velocityY += gravity;
        if (model) {
            model.position.y += velocityY;
            if (model.position.y <= floorHeight) {
                model.position.y = floorHeight;
                velocityY = -velocityY * bounceFactor;

                if (Math.abs(velocityY) < 0.01) {
                    velocityY = 0;
                    isFalling = false;
                    console.log('Rimbalzo del titolo terminato.');
                    spawnPlayer();
                }
            }
        }
    }

    if (isPlayerActive) updatePlayerPosition();

    // Aggiorna la posizione della telecamera
    if (cameraTarget) {
        cameraInstance.update();
    }

    renderer.render(scene, cameraInstance.instance);
    requestAnimationFrame(animate);
}

// Avvio animazione
animate();

window.addEventListener('keydown', (event) => {
    if (event.key === ' ') spawnPlayer();
});