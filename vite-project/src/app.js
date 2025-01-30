import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';
import Collision from './Collision/Collision.js';
import AudioManager from './AudioManager/audioManager.js';

// Crea scena e renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Imposta stile canvas
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

// Luci
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 1));

// Configurazione telecamera
const cameraInstance = new Camera({
    sizes: {
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    },
    scene,
    model: null,
    rendererDom: renderer.domElement // Deve essere il canvas del renderer
});

// Inizializza sistemi
const collisionManager = new Collision(scene);
const audioManager = new AudioManager(cameraInstance.instance);
const loader = new GLTFLoader();



// Variabili gioco
let player, floor;
const gravity = -0.01;
const bounceFactor = 0.3;
const floorHeight = -1.5;
let velocityY = 0;
let isFalling = true;
let isPlayerActive = false;
const moveSpeed = 0.1;
const keyState = {};

// Carica modelli
loader.load('/vite-project/src/Model/car.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1, 1, 1);
    player.position.set(0, 15, 0);
    player.visible = false;
    scene.add(player);
    collisionManager.addObject('player', player);
    cameraInstance.model = player;
});

loader.load('/vite-project/src/Model/floor.glb', (gltf) => {
    floor = gltf.scene;
    floor.position.set(0, floorHeight, 0);
    scene.add(floor);
    collisionManager.addObject('floor', floor);
});

// Carica audio
audioManager.loadSound('clacson', '/vite-project/src/Sound/clacson.ogg');
audioManager.loadSound('down', '/vite-project/src/Sound/down.ogg');

// Gestione input
window.addEventListener('keydown', (event) => {
    keyState[event.key] = true;
    if (event.key === ' ') spawnPlayer();
    if (event.key === 'c') audioManager.playSound('clacson');
    if (event.key === 'x') audioManager.playSound('down');
});

window.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
});

// Logica giocatore
function spawnPlayer() {
    if (!isPlayerActive && player) {
        player.visible = true;
        isPlayerActive = true;
    }
}

function updatePlayerPosition() {
    if (!player || !isPlayerActive) return;

    const moveDirection = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();

    cameraInstance.instance.getWorldDirection(cameraForward);
    cameraRight.crossVectors(cameraInstance.instance.up, cameraForward).normalize();

    if (keyState['w'] || keyState['ArrowUp']) moveDirection.add(cameraForward);
    if (keyState['s'] || keyState['ArrowDown']) moveDirection.sub(cameraForward);
    if (keyState['a'] || keyState['ArrowLeft']) moveDirection.add(cameraRight);
    if (keyState['d'] || keyState['ArrowRight']) moveDirection.sub(cameraRight);

    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        player.position.add(moveDirection.multiplyScalar(moveSpeed));

        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        let deltaRotation = targetRotation - player.rotation.y;
        deltaRotation = ((deltaRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
        player.rotation.y += deltaRotation * 0.15;
    }

    // Gravità
    velocityY += gravity;
    player.position.y += velocityY;
    if (player.position.y <= floorHeight) {
        player.position.y = floorHeight;
        velocityY = -velocityY * bounceFactor;
        if (Math.abs(velocityY) < 0.01) velocityY = 0;
    }
    collisionManager.updateBoundingBox('player', player);
}

// Animazione
function animate() {
    if (isFalling) {
        velocityY += gravity;
        if (player && player.position.y <= floorHeight) {
            isFalling = false;
            spawnPlayer();
        }
    }

    if (isPlayerActive) updatePlayerPosition();
    cameraInstance.update();
    renderer.render(scene, cameraInstance.instance);
    requestAnimationFrame(animate);
}

animate();