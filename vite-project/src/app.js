import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';
import AudioManager from './AudioManager/audioManager.js';

// Crea scena e renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

let currentSpeed = 0;  
const rotationSpeed = 0.08; 
const speedLerpFactor = 0.1; 
let targetSpeed = 0; 

// Imposta stile canvas
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

// Luci
const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 10));

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(1, 1, 1).normalize();
scene.add(light1);

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
    rendererDom: renderer.domElement
});

// Inizializza AudioManager
const audioManager = new AudioManager(cameraInstance.instance);
const loader = new GLTFLoader();

// Variabili gioco
let player, wheels, floor;
const gravity = -0.01;
const bounceFactor = 0.3;
const floorHeight = -1.5;
let velocityY = 0.1;
let isFalling = true;
let isPlayerActive = false;
const moveSpeed = 0.6;
const keyState = {};

// Carica la carrozzeria della macchina
loader.load('/vite-project/src/Model/carbody.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1.5, 1.5, 1.5);
    player.position.set(0, 15, 0);
    player.visible = false;
    cameraInstance.model = player;
    scene.add(player);
});

// Carica le ruote
loader.load('/vite-project/src/Model/wheels.glb', (gltf) => {
    wheels = gltf.scene;
    wheels.scale.set(1, 1, 1);
    wheels.position.set(0, 0, 1);
    wheels.visible = true;
    player?.add(wheels);  // Collega le ruote all'auto
});

// Carica il pavimento
loader.load('/vite-project/src/Model/map.glb', (gltf) => {
    floor = gltf.scene;
    floor.position.set(0, floorHeight, 0);
    scene.add(floor);
});

audioManager.loadSound('clacson', '/vite-project/src/Sound/clacson.ogg');
audioManager.loadSound('down', '/vite-project/src/Sound/down.ogg');

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
        targetSpeed = moveSpeed;
        currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, speedLerpFactor);
        player.position.add(moveDirection.multiplyScalar(currentSpeed));

        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        let deltaRotation = targetRotation - player.rotation.y;
        deltaRotation = ((deltaRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
        player.rotation.y += deltaRotation * rotationSpeed;

        if (wheels) {
            const wheelRotationSpeed = currentSpeed * 0.1;  // Ridotta la velocità di rotazione delle ruote
            wheels.rotation.x -= wheelRotationSpeed;
            wheels.position.set(0, -0.3, 1);  // Regolato il punto di rotazione per evitare rotazioni eccessive
        }

        if (keyState['a'] || keyState['ArrowLeft']) {
            wheels.rotation.y = THREE.MathUtils.lerp(wheels.rotation.y, Math.PI / 12, 0.05);
        } else if (keyState['d'] || keyState['ArrowRight']) {
            wheels.rotation.y = THREE.MathUtils.lerp(wheels.rotation.y, -Math.PI / 12, 0.05);
        } else {
            wheels.rotation.y = THREE.MathUtils.lerp(wheels.rotation.y, 0, 0.2);
        }
    }

    velocityY += gravity;
    player.position.y += velocityY;
    if (player.position.y <= floorHeight + 5) {
        player.position.y = floorHeight;
        velocityY = -velocityY * bounceFactor;
        if (Math.abs(velocityY) < 0.01) velocityY = 0;
    }
}

function animate() {
    if (isFalling) {
        velocityY += gravity;
        if (player && player.position.y <= floorHeight + 5) {
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
