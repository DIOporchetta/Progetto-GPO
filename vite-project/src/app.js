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
const audioManager = new AudioManager(cameraInstance);

//serve per la rotazione ma onesto non so come funziona
const targetRotations = {
    w: Math.PI,
    s: 0,
    a: -Math.PI / 2,
    d: Math.PI / 2,
};

// Carica il suono del clacson
audioManager.loadSound('clacson', '/vite-project/src/Sound/clacson.ogg')
    .then(() => console.log('Audio caricato!'))
    .catch((error) => console.error('Errore nel caricamento audio:', error));

//carica il suono di andreotta
audioManager.loadSound('down', '/vite-project/src/Sound/down.ogg')
    .then(() => console.log('Audio caricato!'))
    .catch((error) => console.error('Errore nel caricamento audio:', error));

// Eventi tastiera
window.addEventListener('keydown', (event) => (keyState[event.key] = true));
window.addEventListener('keyup', (event) => (keyState[event.key] = false));

// Variabili telecamera
let cameraTarget = null;


// Carica il giocatore
loader.load('/vite-project/src/Model/car.glb', (gltf) => {
    //loader.load('/vite-project/src/Model/car.glb', (gltf) => {
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
        let moveDirection = new THREE.Vector3(0, 0, 0); // Vettore per direzione di movimento

        // Controlla quali tasti sono premuti e aggiorna la direzione del movimento
        if (keyState['w'] || keyState['ArrowUp']) moveDirection.z -= 1;
        if (keyState['s'] || keyState['ArrowDown']) moveDirection.z += 1;
        if (keyState['a'] || keyState['ArrowLeft']) moveDirection.x -= 1;
        if (keyState['d'] || keyState['ArrowRight']) moveDirection.x += 1;

        moveDirection.normalize(); // Normalizza per mantenere velocità costante in diagonale

        // Applica il movimento
        player.position.x += moveDirection.x * moveSpeed;
        player.position.z += moveDirection.z * moveSpeed;


        //CODICE PER CALCOLARE LA ROTAZIONE DELLA MACCHINA, unico problema è che qualche volta(quanddo schiaccio da A a W o viceversa) la macchina si gira di 180 gradi
        if (moveDirection.length() > 0) {
    
            // Calcola l'angolo della rotazione rispetto alla direzione del movimento
            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);

            // Calcola la differenza angolare per la rotazione incrementale
            let deltaRotation = targetAngle - player.rotation.y;

            // Normalizza la differenza angolare per mantenere il valore nell'intervallo [-PI, PI]
            if (deltaRotation > Math.PI) {
                deltaRotation -= Math.PI * 2; // Ruota in senso antiorario
            } else if (deltaRotation < -Math.PI) {
                deltaRotation += Math.PI * 2; // Ruota in senso orario
            }

            // La rotazione del personaggio deve essere sempre nel verso più corto
            player.rotation.y += deltaRotation * 0.1; // Moltiplica per un valore di interpolazione per rendere la rotazione fluida
        }

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

function checkClacsonSuonato() {
    if (keyState['c']) {
        audioManager.playSound('clacson');
    }
}

function checkDownSuonato() {
    if (keyState['x']) {
        audioManager.playSound('down');
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

    if (isPlayerActive) {
        updatePlayerPosition();
        checkClacsonSuonato();
        checkDownSuonato()
    }

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