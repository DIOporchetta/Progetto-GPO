import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js';
import AudioManager from './AudioManager/audioManager.js';
import CannonDebugRenderer from './utils/cannonDebugRenderer.js';

// Crea scena e renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; // Abilita le ombre
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Migliora la qualità delle ombre
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

// Inizializza il mondo fisico
const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Debug della fisica
const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

// Variabili di gioco
let player = null;
let carBody = null;
let floorBody = null;
let isPlayerActive = false;
let steeringAngle = 0;
const maxSpeed = 20; // Velocità massima
const moveSpeed = 250; // Velocità di accelerazione
const turnSpeed = 2500; // Velocità di sterzata
const keyState = {};

// Luci
const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(25, 50, 25); // Posizione della luce
light.castShadow = true; // Abilita le ombre
light.shadow.mapSize.width = 16384; // Risoluzione delle ombre
light.shadow.mapSize.height = 16384;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
light.shadow.camera.top = 100;
light.shadow.camera.bottom = -100;
light.shadow.camera.left = -100;
light.shadow.camera.right = 100;
scene.add(light);

// Aggiungi un helper per visualizzare la telecamera della luce
const lightHelper = new THREE.CameraHelper(light.shadow.camera);
scene.add(lightHelper);

// Aggiungi luce ambientale
scene.add(new THREE.AmbientLight(0x404040, 10));

// Configurazione telecamera
const cameraInstance = new Camera({
    sizes: { viewport: { width: window.innerWidth, height: window.innerHeight } },
    scene,
    model: null,
    rendererDom: renderer.domElement
});

// Inizializza AudioManager
const audioManager = new AudioManager(cameraInstance.instance);
const loader = new GLTFLoader();

// Funzione per caricare i modelli
function loadModel(path, onLoad, onError) {
    loader.load(path, onLoad, undefined, onError);
}

loadModel('/vite-project/src/Model/carbody.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(1.5, 1.5, 1.5);
    player.position.set(0, -2, 0); // Posizione iniziale
    player.visible = false; // Nascondi il modello inizialmente
    player.castShadow = true; // Attiva le ombre
    scene.add(player);
    cameraInstance.model = player;

    // Corpo fisico della macchina
    carBody = new CANNON.Body({
        mass: 10,
        position: new CANNON.Vec3(0, 0, 0),
        angularDamping: 0.5,
        linearDamping: 0.2,
        material: new CANNON.Material('carMaterial')
    });

    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 3)); // Forma del telaio
    carBody.addShape(chassisShape, new CANNON.Vec3(0, 3, 0)); 
    world.addBody(carBody);

    // Aggiungi ruote
    vehicle = addWheels(); // Crea veicolo con ruote

}, (error) => {
    console.error('Errore nel caricamento del modello della macchina:', error);
});

function addWheels() {
    const vehicle = new CANNON.RaycastVehicle({
        chassisBody: carBody
    });

    const wheelMaterial = new CANNON.Material("wheelMaterial");
    const options = {
        radius: 0.4, // Raggio delle ruote
        directionLocal: new CANNON.Vec3(0, -1, 0), // Direzione delle ruote (verso il basso)
        suspensionStiffness: 30,  // Rigidità delle sospensioni
        suspensionRestLength: 0.5, // Lunghezza della sospensione
        frictionSlip: 3,           // Attrito per evitare pattinamenti
        dampingRelaxation: 2.3,    // Smorzamento in rilascio
        dampingCompression: 4.4,   // Smorzamento in compressione
        maxSuspensionForce: 10000, // Massima forza delle sospensioni
        rollInfluence: 0.01,       // Riduce il ribaltamento
        axleLocal: new CANNON.Vec3(1, 0, 0),  // Asse delle ruote
        chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0), // Punto di connessione al telaio
        maxSuspensionTravel: 0.3,  // Massimo movimento delle sospensioni
        customSlidingRotationalSpeed: -30, // Velocità di rotazione durante lo slittamento
        useCustomSlidingRotationalSpeed: true
    };

    // Posizioni delle ruote rispetto alla carrozzeria
    const wheelPositions = [
        new CANNON.Vec3(-1.2, -0.8, 2),   // Anteriore sinistra
        new CANNON.Vec3(1.2, -0.8, 2),    // Anteriore destra
        new CANNON.Vec3(-1.2, -0.8, -2),  // Posteriore sinistra
        new CANNON.Vec3(1.2, -0.8, -2)    // Posteriore destra
    ];

    // Aggiungi le ruote al veicolo
    wheelPositions.forEach((pos) => {
        options.chassisConnectionPointLocal.set(pos.x, pos.y, pos.z);
        vehicle.addWheel(options);
    });
    

    

    // Aggiungi il veicolo al mondo fisico
    vehicle.addToWorld(world);

    // Restituisci il veicolo per poterlo controllare
    return vehicle;
}


// Carica il modello del pavimento
loadModel('/vite-project/src/Model/map.glb', (gltf) => {
    const floor = gltf.scene;
    floor.position.set(0, -1.5, 0);
    floor.receiveShadow = true; // Abilita le ombre per il pavimento
    scene.add(floor);

    // Crea il corpo fisico del pavimento
    floorBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(150, 1, 150)), // Dimensioni del pavimento
        position: new CANNON.Vec3(0, -2, 0),
        material: new CANNON.Material('groundMaterial')
    });
    world.addBody(floorBody);
}, (error) => {
    console.error('Errore nel caricamento del modello del pavimento:', error);
});


// Funzione per attivare il player
function spawnPlayer() {
    if (!isPlayerActive && player) {
        player.visible = true; // Mostra il modello
        isPlayerActive = true;
        console.log("Player attivato!");
    }
}

let vehicle = null; // Aggiungi questa variabile globale

// Modifica la funzione updatePlayerPosition
function updatePlayerPosition() {
    if (!player || !isPlayerActive || !carBody || !vehicle) return;

    // Accelerazione
    if (keyState['w'] || keyState['ArrowUp']) {
        vehicle.applyEngineForce(500, 2); // Ruota posteriore sinistra
        vehicle.applyEngineForce(500, 3); // Ruota posteriore destra
    } else if (keyState['s'] || keyState['ArrowDown']) {
        vehicle.applyEngineForce(-500, 2); // Ruota posteriore sinistra
        vehicle.applyEngineForce(-500, 3); // Ruota posteriore destra
    } else {
        vehicle.applyEngineForce(0, 2); // Ferma le ruote posteriori
        vehicle.applyEngineForce(0, 3);
    }

    // Sterzata
    if (keyState['a'] || keyState['ArrowLeft']) {
        vehicle.setSteeringValue(0.5, 0); // Ruota anteriore sinistra
        vehicle.setSteeringValue(0.5, 1); // Ruota anteriore destra
    } else if (keyState['d'] || keyState['ArrowRight']) {
        vehicle.setSteeringValue(-0.5, 0); // Ruota anteriore sinistra
        vehicle.setSteeringValue(-0.5, 1); // Ruota anteriore destra
    } else {
        vehicle.setSteeringValue(0, 0); // Torna alla posizione centrale
        vehicle.setSteeringValue(0, 1);
    }

    // Sincronizza la posizione e la rotazione del modello 3D
    player.position.copy(carBody.position);
    player.quaternion.copy(carBody.quaternion);
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

// Gestione del ridimensionamento della finestra
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    cameraInstance.instance.aspect = width / height;
    cameraInstance.instance.updateProjectionMatrix();
});

function animate() {
    world.step(1 / 60);
    cannonDebugRenderer.update(); // Aggiorna il debug della fisica
    if (isPlayerActive) updatePlayerPosition();
    cameraInstance.update();
    renderer.render(scene, cameraInstance.instance);
    requestAnimationFrame(animate);
}

// Avvia l'animazione
animate();