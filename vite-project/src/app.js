import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Configurazione della scena, telecamera e renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Migliora la qualità grafica
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controlli orbitali per la telecamera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Rende i movimenti più fluidi
controls.dampingFactor = 0.05; // Intensità dello smorzamento
controls.minDistance = 5; // Distanza minima di zoom
controls.maxDistance = 20; // Distanza massima di zoom
controls.target.set(0, 0, 0); // Punto verso cui la telecamera guarda

// Aggiungi luci alla scena
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 1); // Luce ambientale
scene.add(ambientLight);

// Variabili per il pavimento e il modello rimbalzante
let model; // Oggetto che rimbalza
let floor; // Pavimento caricato da Blender
let velocity = 0; // Velocità verticale iniziale
const gravity = -0.01; // Gravità
const bounceFactor = 0.7; // Fattore di rimbalzo
let isFalling = false; // Controlla se il blocco sta cadendo
let floorHeight = -1.5; // Altezza del pavimento

// Velocità per i movimenti manuali della telecamera
const moveSpeed = 0.1;
const rotationSpeed = 0.05;

// Stato dei tasti
const keyState = {};

// Listener per rilevare i tasti premuti e rilasciati
window.addEventListener('keydown', (event) => {
    keyState[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
});

// Carica il modello del pavimento
const loader = new GLTFLoader();
loader.load(
    '/vite-project/src/Model/floor.glb', // Percorso al file GLB
    (gltf) => {
        floor = gltf.scene;
        floor.scale.set(1, 1, 1);
        floor.position.set(0, -1.5, 0);
        scene.add(floor);

        floor.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x00fa01,
                    roughness: 0.5,
                    metalness: 0.1,
                });
            }
        });

        floorHeight = floor.position.y + 0.1;
    },
    undefined,
    (error) => console.error('Errore durante il caricamento del pavimento:', error)
);

// Carica il modello rimbalzante
loader.load(
    '/vite-project/src/Model/cube.glb', // Percorso al file GLB
    (gltf) => {
        model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.y = 5; // Posizione iniziale
        scene.add(model);

        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            }
        });

        window.addEventListener('keydown', (event) => {
            if ((event.key === ' ' || event.code === 'Space') && !isFalling) {
                isFalling = true;
                velocity = 0;
            }
        });
    },
    undefined,
    (error) => console.error('Errore durante il caricamento del modello:', error)
);

// Posizione iniziale della telecamera
camera.position.set(0, 3, 15);

// Adatta il rendering al ridimensionamento della finestra
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Funzione per gestire i movimenti della telecamera con tastiera
function updateCameraPosition() {
    if (keyState['ArrowUp'] || keyState['w']) {
        camera.position.z -= moveSpeed; // Avanza
    }
    if (keyState['ArrowDown'] || keyState['s']) {
        camera.position.z += moveSpeed; // Indietreggia
    }
    if (keyState['ArrowLeft'] || keyState['a']) {
        camera.position.x -= moveSpeed; // Sposta a sinistra
    }
    if (keyState['ArrowRight'] || keyState['d']) {
        camera.position.x += moveSpeed; // Sposta a destra
    }

    // Rotazioni con tasti Q e E
    if (keyState['q']) {
        camera.rotation.y += rotationSpeed; // Ruota a sinistra
    }
    if (keyState['e']) {
        camera.rotation.y -= rotationSpeed; // Ruota a destra
    }
}

// Funzione di animazione
function animate() {
    requestAnimationFrame(animate);

    // Aggiorna la posizione del modello
    if (model && isFalling) {
        velocity += gravity; // Gravità
        model.position.y += velocity;

        // Rimbalzo
        if (model.position.y <= floorHeight) {
            model.position.y = floorHeight;
            velocity = -velocity * bounceFactor;

            if (Math.abs(velocity) < 0.01) {
                velocity = 0;
                isFalling = false;
            }
        }
    }

    // Aggiorna i controlli orbitali
    controls.update();

    // Aggiorna i movimenti manuali della telecamera
    updateCameraPosition();

    // Renderizza la scena
    renderer.render(scene, camera);
}

// Avvia l'animazione
animate();