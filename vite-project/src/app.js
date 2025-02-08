import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';
import AudioManager from './AudioManager/audioManager.js';
import CollisionManager from './Collision/collisions.js';

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

// Variabili di gioco
let player = null;
let floor = null;
let carHB = null;
let carHBHelper = null;
let floorHB = null;
let floorHBHelper = null;
let carHBGeometry = null;
let carHBMaterial = null;
let floorHBGeometry = null;
let floorHBMaterial = null;
let floorSize = null;
let carSize = null;
const gravity = -0.01;
const bounceFactor = 0.3;
const floorHeight = -1.5;
let velocityY = 0.2;
let isFalling = true;
let isPlayerActive = false;
const moveSpeed = 1.2;
const keyState = {};
let currentSpeed = 0;
const rotationSpeed = 0.08;
const speedLerpFactor = 0.08;
let targetSpeed = 0;
let collidableObjects = [];
const collisionThreshold = 0.3;
const playerRadius = 0.5;
const deceleration = 0.9; // Aggiungi questa costante per lo slittamento
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

// Carica la macchina
loader.load('/vite-project/src/Model/car.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1.5, 1.5, 1.5);
    player.position.set(10, 50, 10);
    player.visible = false;
    cameraInstance.model = player;
    scene.add(player);

    const carBox = new THREE.Box3().setFromObject(player);
    carSize = new THREE.Vector3();
    carBox.getSize(carSize);

    const carBoxCenter = carBox.getCenter(new THREE.Vector3());
    const carHBOffset = carBoxCenter.sub(player.position);

    carHBGeometry = new THREE.BoxGeometry(carSize.x, carSize.y, carSize.z);
    carHBMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    carHB = new THREE.Mesh(carHBGeometry, carHBMaterial);

    carHB.position.copy(carBoxCenter);
    carHB.rotation.copy(player.rotation);
    scene.add(carHB);

    player.userData.hitboxOffset = carHBOffset;

    carHBHelper = new THREE.BoxHelper(carHB, 0x00ff00);
    scene.add(carHBHelper);
});

// Carica il pavimento
loader.load('/vite-project/src/Model/map.glb', (gltf) => {
    floor = gltf.scene;
    floor.position.set(0, floorHeight, 0);
    scene.add(floor);
    collidableObjects.push(floor);

    const floorBox = new THREE.Box3().setFromObject(floor);
    floorSize = new THREE.Vector3();
    floorBox.getSize(floorSize);
    floorSize.y = floorSize.y * 0.15;

    const hitboxHeight = floorSize.y;
    floorHBGeometry = new THREE.BoxGeometry(floorSize.x, hitboxHeight, floorSize.z);
    floorHBMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    floorHB = new THREE.Mesh(floorHBGeometry, floorHBMaterial);

    const floorBoxCenter = floorBox.getCenter(new THREE.Vector3());
    floorHB.position.set(
        floorBoxCenter.x,
        floorBox.min.y + (hitboxHeight / 2),
        floorBoxCenter.z
    );
    
    scene.add(floorHB);

    floorHBHelper = new THREE.BoxHelper(floorHB, 0x00ff00);
    scene.add(floorHBHelper);
});

// Funzione per aggiornare la hitbox della macchina
function updateCarHitbox() {
    if (player && carHB) {
        const offset = player.userData.hitboxOffset.clone()
            .applyQuaternion(player.quaternion);
        
        carHB.position.copy(player.position.clone().add(offset));
        carHB.rotation.copy(player.rotation);
        carHB.scale.set(1, 1, 1);
        carHBHelper.update();
    }
}

// Controllo collisioni
function checkCollisions() {
    if (carHB && floorHB) {
        if (CollisionManager.checkCollision(carHB, floorHB)) {
            velocityY = Math.max(velocityY, 0);
            player.position.y = floorHB.position.y + carSize.y+0.1;
        }
    }
}

// Funzione per far comparire il player
function spawnPlayer() {
    if (!isPlayerActive && player) {
        player.visible = true;
        isPlayerActive = true;
    }
}

// Aggiornamento della posizione del player
function updatePlayerPosition() {
    if (!player || !isPlayerActive) return;

    const moveDirection = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();

    cameraInstance.instance.getWorldDirection(cameraForward);
    cameraRight.crossVectors(cameraInstance.instance.up, cameraForward).normalize();

    // Controllo input
    let hasInput = false;
    if (keyState['w'] || keyState['ArrowUp']) { moveDirection.add(cameraForward); hasInput = true; }
    if (keyState['s'] || keyState['ArrowDown']) { moveDirection.sub(cameraForward); hasInput = true; }
    if (keyState['a'] || keyState['ArrowLeft']) { moveDirection.add(cameraRight); hasInput = true; }
    if (keyState['d'] || keyState['ArrowRight']) { moveDirection.sub(cameraRight); hasInput = true; }

    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        targetSpeed = moveSpeed;
        
        const collisionResult = CollisionManager.checkMovementCollisions(
            carHB, 
            moveDirection.clone().multiplyScalar(moveSpeed),
            collidableObjects,
            collisionThreshold
        );

        if (!collisionResult.collided) {
            currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, speedLerpFactor);
            
            // Aggiorna rotazione solo se c'è input
            const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
            let deltaRotation = targetRotation - player.rotation.y;
            deltaRotation = ((deltaRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
            player.rotation.y += deltaRotation * rotationSpeed;
        } else {
            currentSpeed *= 0.5; // Riduci la velocità in caso di collisione
        }
    } else {
        targetSpeed = 0;
        // Applica decelerazione solo se non c'è input
        currentSpeed *= deceleration;
        if (Math.abs(currentSpeed) < 0.01) currentSpeed = 0;
    }

    // Applica il movimento anche senza input (per lo slittamento)
    if (currentSpeed > 0) {
        const slidingDirection = new THREE.Vector3(
            Math.sin(player.rotation.y),
            0,
            Math.cos(player.rotation.y)
        ).normalize();
        
        player.position.add(slidingDirection.multiplyScalar(currentSpeed));
    }

    // Gestione gravità
    velocityY += gravity;
    player.position.y += velocityY;
    checkCollisions();
    updateCarHitbox();
}

// Eventi tastiera
window.addEventListener('keydown', (event) => {
    keyState[event.key] = true;
    if (event.key === ' ') spawnPlayer();
    if (event.key === 'c') audioManager.playSound('clacson');
    if (event.key === 'x') audioManager.playSound('down');
});

window.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
});

// Animazione principale
function animate() {
    if (isFalling) {
        velocityY += gravity;
        if (player && player.position.y <= floorHeight) {
            isFalling = false;
            spawnPlayer();
        }
    }

    if (isPlayerActive) {
        updatePlayerPosition();
    }

    cameraInstance.update();
    renderer.render(scene, cameraInstance.instance);
    requestAnimationFrame(animate);
}

// Avvia l'animazione
animate();