import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';
import AudioManager from './AudioManager/audioManager.js';
import CannonDebugRenderer from './utils/cannonDebugRenderer.js';

// Inizializzazione base
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

// Mondo fisico
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.81, 0),
    broadphase: new CANNON.NaiveBroadphase(),
    solverIterations: 5
});

// Materiali fisici
const carMaterial = new CANNON.Material('carMaterial');
const groundMaterial = new CANNON.Material('groundMaterial');
const wheelMaterial = new CANNON.Material('wheelMaterial');
const carGroundContact = new CANNON.ContactMaterial(carMaterial, groundMaterial, { friction: 0.3, restitution: 0.1 });
const wheelGroundContact = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, { friction: 0.5, restitution: 0.2 });
world.addContactMaterial(carGroundContact);
world.addContactMaterial(wheelGroundContact);

// Variabili di gioco
let player = null;
let carBody = null;
let floorBody = null;
let vehicle = null;
let wheels = []; // Array per le ruote 3D
let isPlayerActive = false;
let engineForce = 0;
let targetSteering = 0;
const maxForce = 500;
const maxVelocity = 20;
const steeringSpeed = 0.05;
const keyState = {};
let debugEnabled = false;
let lastTime = 0;
const fixedTimeStep = 1 / 60;

// Debug fisico
const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

// Luci
const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(25, 50, 25);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
scene.add(directionalLight);
scene.add(new THREE.AmbientLight(0x404040, 10));

// Telecamera
const cameraInstance = new Camera({
    sizes: { viewport: { width: window.innerWidth, height: window.innerHeight } },
    scene,
    model: null,
    rendererDom: renderer.domElement
});

// Audio
const audioManager = new AudioManager(cameraInstance.instance);

// Caricamento modelli
const loader = new GLTFLoader();
async function loadModels() {
    const carPromise = new Promise((resolve, reject) => {
        loader.load('/vite-project/src/Model/carbody.glb', resolve, undefined, reject);
    });
    const floorPromise = new Promise((resolve, reject) => {
        loader.load('/vite-project/src/Model/map.glb', resolve, undefined, reject);
    });

    try {
        const [carGltf, floorGltf] = await Promise.all([carPromise, floorPromise]);

        // Macchina (corpo)
        player = carGltf.scene;
        player.scale.set(1.5, 1.5, 1.5);
        player.position.set(0, 0, 0); // Posizione iniziale più alta per appoggiare sulle ruote
        player.visible = false;
        player.castShadow = true;
        scene.add(player);
        cameraInstance.model = player;

        // Corpo fisico della macchina
        carBody = new CANNON.Body({
            mass: 10,
            position: new CANNON.Vec3(0, 0, 0), // Altezza iniziale sopra le ruote
            angularDamping: 0.5,
            linearDamping: 0.2,
            material: carMaterial
        });
        carBody.addShape(new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 3)), new CANNON.Vec3(0, 0, 0)); // Corpo più sottile
        world.addBody(carBody);
        vehicle = createVehicle();

        // Pavimento
        const floor = floorGltf.scene;
        floor.position.set(0, -1.5, 0);
        floor.receiveShadow = true;
        scene.add(floor);

        floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(150, 1, 150)),
            position: new CANNON.Vec3(0, -2, 0),
            material: groundMaterial
        });
        world.addBody(floorBody);

        console.log("Modelli caricati con successo!");
    } catch (error) {
        console.error("Errore nel caricamento:", error);
    }
}

// Creazione del veicolo con ruote visibili
function createVehicle() {
    const vehicle = new CANNON.RaycastVehicle({ chassisBody: carBody });
    const wheelOptions = {
        radius: 0.4,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        suspensionStiffness: 30,
        suspensionRestLength: 0.5,
        frictionSlip: 3,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 10000,
        rollInfluence: 0.01,
        axleLocal: new CANNON.Vec3(1, 0, 0),
        maxSuspensionTravel: 0.3,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true,
        material: wheelMaterial
    };

    const wheelPositions = [
        new CANNON.Vec3(-1.2, -0.5, 2),  // Anteriore sinistra
        new CANNON.Vec3(1.2, -0.5, 2),   // Anteriore destra
        new CANNON.Vec3(-1.2, -0.5, -2), // Posteriore sinistra
        new CANNON.Vec3(1.2, -0.5, -2)   // Posteriore destra
    ];

    // Materiale per le ruote
    const wheelGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const wheelMeshMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    wheelPositions.forEach((pos, index) => {
        wheelOptions.chassisConnectionPointLocal = pos.clone();
        vehicle.addWheel(wheelOptions);

        // Creazione della ruota visibile
        const wheel = new THREE.Mesh(wheelGeometry, wheelMeshMaterial);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        scene.add(wheel);
        wheels[index] = wheel;
    });

    vehicle.addToWorld(world);
    return vehicle;
}

// Attivazione del player
function spawnPlayer() {
    if (!isPlayerActive && player) {
        player.visible = true;
        isPlayerActive = true;
        console.log("Player attivato!");
    }
}

// Aggiornamento posizione
function updatePlayerPosition() {
    if (!player || !isPlayerActive || !carBody || !vehicle) return;

    const velocity = carBody.velocity.length();

    if (keyState['w'] || keyState['ArrowUp']) {
        if (velocity < maxVelocity) engineForce = Math.min(engineForce + 10, maxForce);
    } else if (keyState['s'] || keyState['ArrowDown']) {
        if (velocity < maxVelocity) engineForce = Math.max(engineForce - 10, -maxForce);
    } else if (keyState[' ']) {
        
        engineForce *= 0.8;
        carBody.velocity.scale(0.9, carBody.velocity);
    } else {
        engineForce *= 0.9;
    }
    vehicle.applyEngineForce(engineForce, 2);
    vehicle.applyEngineForce(engineForce, 3);

    if (keyState['a'] || keyState['ArrowLeft']) {
        targetSteering = Math.min(targetSteering + steeringSpeed, 0.5);
    } else if (keyState['d'] || keyState['ArrowRight']) {
        targetSteering = Math.max(targetSteering - steeringSpeed, -0.5);
    } else {
        targetSteering *= 0.9;
    }
    vehicle.setSteeringValue(targetSteering, 0);
    vehicle.setSteeringValue(targetSteering, 1);

    // Sincronizza corpo
    player.position.copy(carBody.position);
    player.quaternion.copy(carBody.quaternion);

    // Sincronizza ruote
    vehicle.wheelInfos.forEach((wheelInfo, index) => {
        const wheel = wheels[index];
        const worldPos = new CANNON.Vec3();
        wheelInfo.worldTransform.position.copy(worldPos);
        wheel.position.set(worldPos.x, worldPos.y, worldPos.z);

        const wheelQuat = new CANNON.Quaternion();
        wheelInfo.worldTransform.quaternion.copy(wheelQuat);
        wheel.quaternion.set(wheelQuat.x, wheelQuat.y, wheelQuat.z, wheelQuat.w);

        // Rotazione delle ruote basata sulla velocità
        const rotationSpeed = velocity / wheelInfo.radius;
        wheel.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotationSpeed * fixedTimeStep);
    });
}

// Eventi
window.addEventListener('keydown', (event) => {
    keyState[event.key] = true;
    if (event.key === ' ') spawnPlayer();
    if (event.key === 'c') audioManager.playSound('clacson');
    if (event.key === 'x') audioManager.playSound('down');
    if (event.key === 'd') debugEnabled = !debugEnabled;
});

window.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
});

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    cameraInstance.instance.aspect = width / height;
    cameraInstance.instance.updateProjectionMatrix();
});

// Animazione
function animate(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    cameraInstance.update();
    world.step(fixedTimeStep);
    if (debugEnabled) cannonDebugRenderer.update();
    if (isPlayerActive) updatePlayerPosition();
    renderer.render(scene, cameraInstance.instance);
    requestAnimationFrame(animate);
}

// Avvio
loadModels().then(() => requestAnimationFrame(animate));