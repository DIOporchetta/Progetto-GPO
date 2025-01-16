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
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

// Luci
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Creazione oggetto collisione
const collisionManager = new Collision();

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
const loader = new GLTFLoader(); // Dichiarazione del loader

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
loader.load('/vite-project/src/Model/floor.glb', (gltf) => {
    floor = gltf.scene;
    floor.scale.set(1, 1, 1);
    floor.position.set(0, floorHeight, 0);

    floor.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0x9C31F9,
                metalness: 0.5,
                roughness: 0.3,
            });
        }
    });

    scene.add(floor);
    collisionManager.addObject('floor', floor); // Registra il pavimento nel collision manager
});

// Carica il cubo
loader.load('/vite-project/src/Model/title.glb', (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(-2, 5, 0);
    scene.add(model);
    model.rotation.y = 709;

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
    collisionManager.addObject('player', player); // Registra il giocatore nel collision manager
});

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

// Animazione
function animate() {
    if (cameraInstance) cameraInstance.update();

    collisionManager.updateBoundingBoxes(); // Aggiorna i bounding box degli oggetti

    if (collisionManager.checkCollision('player', 'floor')) {
        console.log('Il giocatore ha toccato il pavimento!');
    }

    renderer.render(scene, cameraInstance ? cameraInstance.instance : new THREE.PerspectiveCamera());
    requestAnimationFrame(animate);
}

animate();