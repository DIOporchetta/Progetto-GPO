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
const collisionManager = new Collision(scene);

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

let playerBoundingBoxHelper, floorBoundingBoxHelper, titleBoundingBoxHelper;

// Variabili per il titolo che cade
let titleVelocityY = 0; // Velocità verticale del titolo
let isTitleFalling = true; // Flag per determinare se il titolo sta cadendo

// Carica il giocatore
loader.load('/vite-project/src/Model/player.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1, 1, 1);
    player.position.set(0, 15, 0);
    scene.add(player);
    player.visible = false;

    // Crea BoxHelper per il giocatore e aggiungilo alla scena
    playerBoundingBoxHelper = new THREE.BoxHelper(player, 0xff0000);  // Colore rosso
    scene.add(playerBoundingBoxHelper);

    // Registra il giocatore nel collision manager
    collisionManager.addObject('player', player);
});

// Carica il pavimento
loader.load('/vite-project/src/Model/floor.glb', (gltf) => {
    floor = gltf.scene;
    floor.scale.set(1, 1, 1);
    floor.position.set(0, floorHeight-1, 0);
    scene.add(floor);

    // Crea BoxHelper per il pavimento e aggiungilo alla scena
    floorBoundingBoxHelper = new THREE.BoxHelper(floor, 0x00ff00);  // Colore verde
    scene.add(floorBoundingBoxHelper);

    // Registra il pavimento nel collision manager
    collisionManager.addObject('floor', floor);
});

// Carica il modello title
loader.load('/vite-project/src/Model/title.glb', (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(-2, 5, 0);
    scene.add(model);
    model.rotation.y = 709;

    // Crea BoxHelper per il modello title e aggiungilo alla scena
    titleBoundingBoxHelper = new THREE.BoxHelper(model, 0x0000ff);  // Colore blu
    scene.add(titleBoundingBoxHelper);

    // Registra il modello title nel collision manager
    collisionManager.addObject('title', model);

    // Inizializza la telecamera
    cameraInstance = new Camera({ sizes, scene, model });
});

// Funzione per la caduta e rimbalzo del titolo
function updateTitlePosition() {
    if (model) {
        // Aggiorna la velocità per la caduta
        titleVelocityY += gravity;

        // Muovi il titolo
        model.position.y += titleVelocityY;

        // Se il titolo tocca il pavimento, inverte la velocità per farlo rimbalzare
        if (model.position.y <= floorHeight) {
            model.position.y = floorHeight;
            titleVelocityY = -titleVelocityY * bounceFactor;

            // Se la velocità verticale è molto bassa, fermiamo la caduta
            if (Math.abs(titleVelocityY) < 0.01) {
                titleVelocityY = 0;
                isTitleFalling = false;
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

        // Aggiorna il bounding box del giocatore
        collisionManager.objects['player'].setFromObject(player);
    }
}

// Funzione per far apparire il personaggio
function spawnPlayer() {
    if (!isPlayerActive && !isTitleFalling) {
        player.visible = true;
        isPlayerActive = true;
    }
}

// Animazione
function animate() {
    if (cameraInstance) cameraInstance.update();

    // Aggiorna la posizione del titolo
    updateTitlePosition();

    // Aggiorna la posizione del giocatore
    updatePlayerPosition();

    // Aggiorna la posizione della bounding box
    if (playerBoundingBoxHelper) playerBoundingBoxHelper.update();
    if (floorBoundingBoxHelper) floorBoundingBoxHelper.update();
    if (titleBoundingBoxHelper) titleBoundingBoxHelper.update();

    // Rendi visibili le bounding box
    collisionManager.updateBoundingBox('player', player);
    collisionManager.updateBoundingBox('floor', floor);

    renderer.render(scene, cameraInstance ? cameraInstance.instance : new THREE.PerspectiveCamera());
    requestAnimationFrame(animate);
}

animate();

// Gestisci la pressione della barra spaziatrice per far apparire il giocatore
window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        spawnPlayer();
    }
});