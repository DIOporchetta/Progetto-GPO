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
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 2));

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
let player, frontWheel, rearWheel, floor;
const gravity = -0.01;
const bounceFactor = 0.3;
const floorHeight = -1.5;
let velocityY = 0.2;
let isFalling = true;
let isPlayerActive = false;
const moveSpeed = 1;
const keyState = {};

// Raggio ruote per il calcolo della rotazione
const wheelRadius = 0.4;

// Carica la carrozzeria della macchina
loader.load('/vite-project/src/Model/car.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(2, 2, 2);
    player.position.set(0, 15, 0);
    player.visible = false;
    scene.add(player);
    cameraInstance.model = player;
});
/*
// Carica le ruote della macchina
loader.load('/vite-project/src/Model/carbody.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(2, 2, 2);
    player.position.set(0, 15, 0);
    player.visible = false;
    scene.add(player);
    cameraInstance.model = player;
});

loader.load('/vite-project/src/Model/wheels.glb', (gltf) => {
    const wheels = gltf.scene;

    // Trova le due ruote nel modello
    frontWheel = wheels.getObjectByName('frontWheel'); // Assicurati che il nome sia corretto
    rearWheel = wheels.getObjectByName('rearWheel');

    if (frontWheel && rearWheel) {
        frontWheel.position.set(0.8, 15, 1.2); // Regola posizione rispetto alla carrozzeria
        rearWheel.position.set(0.8, 15, -1.2);

        scene.add(frontWheel);
        scene.add(rearWheel);
    }
});*/

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

    // Ottieni la direzione della telecamera
    cameraInstance.instance.getWorldDirection(cameraForward);
    cameraRight.crossVectors(cameraInstance.instance.up, cameraForward).normalize();

    // Movimento in base ai tasti premuti
    if (keyState['w'] || keyState['ArrowUp']) moveDirection.add(cameraForward);
    if (keyState['s'] || keyState['ArrowDown']) moveDirection.sub(cameraForward);
    if (keyState['a'] || keyState['ArrowLeft']) moveDirection.add(cameraRight);
    if (keyState['d'] || keyState['ArrowRight']) moveDirection.sub(cameraRight);

    if (moveDirection.length() > 0) {
        moveDirection.normalize();

        // Interpolazione della velocità
        targetSpeed = moveSpeed;  // Velocità target in base alla direzione
        currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, speedLerpFactor);  // Interpolazione della velocità

        // Aggiorna la posizione del giocatore
        player.position.add(moveDirection.multiplyScalar(currentSpeed));

        // Calcola la rotazione desiderata in base alla direzione del movimento
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        let deltaRotation = targetRotation - player.rotation.y;
        deltaRotation = ((deltaRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;

        // Interpolazione della rotazione per un cambiamento più fluido
        player.rotation.y += deltaRotation * rotationSpeed;
    }

    // Gestione della gravità
    velocityY += gravity;
    player.position.y += velocityY;
    if (player.position.y <= floorHeight) {
        player.position.y = floorHeight;
        velocityY = -velocityY * bounceFactor;
        if (Math.abs(velocityY) < 0.01) velocityY = 0;
    }
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
