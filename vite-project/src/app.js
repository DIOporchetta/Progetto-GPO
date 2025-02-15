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
let player = null, floor = null, test = null;
let carHB = null, floorHB = null, testHB = null;
let carHBHelper = null, floorHBHelper = null, testHBHelper = null;
let carHBGeometry = null, floorHBGeometry = null, testHBGeometry = null;
let carHBMaterial = null, floorHBMaterial = null, testHBMaterial = null;
let floorSize = null, carSize = null, testSize = null;
const gravity = -0.01;
const bounceFactor = 0.3;
const floorHeight = -1.5;
let velocityY = 0.2;
let isFalling = true;
let isPlayerActive = false;
let moveSpeed = 0.5;
const keyState = {};
let currentSpeed = 0;
const rotationSpeed = 0.08;
const speedLerpFactor = 0.08;
let targetSpeed = 0;
let collidableObjects = [];
const collisionThreshold = 0.3;
let deceleration = 0.9; // Aggiungi questa costante per lo slittamento
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
// Carica il suono del clacson
audioManager.loadSound('clacson', 'vite-project/src/Sound/clacson.ogg', { volume: 1.0, loop: true })
    .then(() => console.log('Audio caricato!'))
    .catch((error) => console.error('Errore nel caricamento audio:', error));

// Carica il suono del gas
audioManager.loadSound('gas', 'vite-project/src/Sound/gas.ogg', { volume: 1.0, loop: true })
    .then(() => console.log('Audio caricato!'))
    .catch((error) => console.error('Errore nel caricamento audio:', error));


// Carica la macchina
loader.load('/vite-project/src/Model/car.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1.5, 1.5, 1.5);
    player.position.set(0, 50, 0);
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

//test
/*loader.load('/vite-project/src/Model/title.glb', (gltf) => {
    test = gltf.scene;
    test.scale.set(1.5, 1.5, 1.5);
    test.position.set(50, 0, 50);
    scene.add(test);

    const testBox = new THREE.Box3().setFromObject(test);
    testSize = new THREE.Vector3();
    testBox.getSize(testSize);

    const testBoxCenter = testBox.getCenter(test.position);

    testHBGeometry = new THREE.BoxGeometry(testSize.x, testSize.y, testSize.z);
    testHBMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    testHB = new THREE.Mesh(testHBGeometry, testHBMaterial);

    testHB.position.copy(testBoxCenter);
    testHB.rotation.copy(player.rotation);
    scene.add(testHB);


    testHBHelper = new THREE.BoxHelper(testHB, 0x00ff00);
    scene.add(testHBHelper);
});*/


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
            player.position.y = floorHB.position.y + carSize.y + 0.1;
        }
    }

    if (carHB && testHB) {
        if (CollisionManager.checkCollision(carHB, testHB) && !(keyState['s'] || keyState['ArrowDown'])) {
            test.position.y = floorHB.position.y + testSize.y + 0.1;
            console.log("collisione");

            // Ferma completamente la macchina
            currentSpeed = 0;
            targetSpeed = 0;
            moveSpeed = 0;
            deceleration = 0;
        } else {
            moveSpeed = 1.2;
            deceleration = 0.9;
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

    const playerForward = new THREE.Vector3();
    player.getWorldDirection(playerForward);

    // 1. Determinazione della velocità target
    let targetSpeed = 0;
    if (keyState['w'] || keyState['ArrowUp']) targetSpeed = moveSpeed;
    if (keyState['s'] || keyState['ArrowDown']) targetSpeed = -moveSpeed;

    // 2. Gestione rotazione solo durante il movimento
    if (targetSpeed !== 0) {
        if (keyState['a'] || keyState['ArrowLeft']) player.rotation.y += rotationSpeed;
        if (keyState['d'] || keyState['ArrowRight']) player.rotation.y -= rotationSpeed;
    }

    // 3. Accelerazione/decelerazione con slittamento
    if (targetSpeed !== 0) {
        currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, speedLerpFactor);
    } else {
        currentSpeed *= deceleration;
        if (Math.abs(currentSpeed) < 0.01) currentSpeed = 0;
    }

    // 4. Calcolo direzione movimento (mantiene lo slittamento)
    const slidingDirection = new THREE.Vector3(
        Math.sin(player.rotation.y),
        0,
        Math.cos(player.rotation.y)
    ).normalize();

    // 5. Applica movimento con controllo collisioni
    const movement = slidingDirection.clone().multiplyScalar(currentSpeed);
    const collisionResult = CollisionManager.checkMovementCollisions(
        carHB,
        movement,
        collidableObjects,
        collisionThreshold
    );

    if (!collisionResult.collided) {
        player.position.add(movement);
    } else {
        currentSpeed *= collisionResult.slideFactor || 0.5;
    }

    // 6. Gestione gravità e collisioni verticali
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
    if (event.key === 'g') {
        if (currentSpeed != 0) {
            moveSpeed = 1;
            audioManager.playSound('gas');
        }
    }
});
window.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
    if (event.key === 'c') audioManager.stopSound('clacson');
    event.preventDefault();
    if (event.key === 'g') {
        moveSpeed = 0.5;
        audioManager.stopSound('gas');
    }
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
