import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Camera from './Camera/camera.js'; 


const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//luci
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Variabili per il modello
let model, floor;
const gravity = -0.01;
const bounceFactor = 0.7;
const moveSpeed = 0.1;
let isFalling = false;
let floorHeight = -1.5;
let velocityY = 0;
const keyState = {};

// Configurazione delle dimensioni
const sizes = {
    viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
    },
};

// Configura la telecamera
let cameraInstance; // Sarà inizializzato dopo il caricamento del modello

// Eventi tastiera
window.addEventListener('keydown', (event) => (keyState[event.key] = true));
window.addEventListener('keyup', (event) => (keyState[event.key] = false));

// Carica il pavimento
const loader = new GLTFLoader();
loader.load('/vite-project/src/Model/floor.glb', (gltf) => {
    floor = gltf.scene;
    floor.scale.set(1, 1, 1);
    floor.position.set(0, floorHeight-1, 0);
    scene.add(floor);
});

// Carica il modello 
loader.load('/vite-project/src/Model/cube.glb', (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 5, 0);
    scene.add(model);

    // Inizializza la telecamera dopo il caricamento del modello
    cameraInstance = new Camera({ sizes, scene, model });
});

//aggiornare il blocco
function updateBlockPosition() {
    if (model) {
        if (keyState['w'] || keyState['ArrowUp']) model.position.z -= moveSpeed;
        if (keyState['s'] || keyState['ArrowDown']) model.position.z += moveSpeed;
        if (keyState['a'] || keyState['ArrowLeft']) model.position.x -= moveSpeed;
        if (keyState['d'] || keyState['ArrowRight']) model.position.x += moveSpeed;

        if (isFalling) {
            velocityY += gravity;
            model.position.y += velocityY;

            if (model.position.y <= floorHeight) {
                model.position.y = floorHeight;
                velocityY = -velocityY * bounceFactor;

                if (Math.abs(velocityY) < 0.01) {
                    velocityY = 0;
                    isFalling = false;
                }
            }
        }

        if ((keyState[' '] || keyState['Space']) && !isFalling) {
            isFalling = true;
            velocityY = 0.2;
        }
    }
}

// Funzione di animazione
function animate() {
    if (cameraInstance) cameraInstance.update(); // Aggiorna la telecamera
    updateBlockPosition();
    renderer.render(scene, cameraInstance ? cameraInstance.instance : new THREE.PerspectiveCamera());
    requestAnimationFrame(animate);
}

animate();