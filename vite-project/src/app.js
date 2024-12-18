import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Configurazione della scena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Aggiungi una luce
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// Aggiungi luce ambientale per una migliore illuminazione
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Aggiungi il pavimento
const floorGeometry = new THREE.PlaneGeometry(10, 10); // Dimensioni del pavimento
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Colore verde
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Ruota il pavimento in orizzontale
floor.position.y = -1.5; // Posiziona il pavimento in basso
scene.add(floor);

// Variabile per il modello
let model;

// Variabili per il rimbalzo
let velocity = 0; // Velocità verticale iniziale
const gravity = -0.01; // Gravità che agisce sul blocco
const bounceFactor = 0.7; // Fattore di rimbalzo (riduzione velocità ad ogni rimbalzo)
let isFalling = false; // Controlla se il blocco sta cadendo

// Altezza del pavimento
const floorHeight = -1.5;

// Carica il modello GLB
const loader = new GLTFLoader();
loader.load(
    '/vite-project/src/Model/cube.glb', // Percorso al file GLB
    (gltf) => {
        model = gltf.scene;
        model.scale.set(1, 1, 1); // Regola le dimensioni del cubo
        model.position.y = 5; // Posizione iniziale in alto
        scene.add(model);

        // Attiva la caduta con la barra spaziatrice
        window.addEventListener('keydown', (event) => {
            if ((event.key === ' ' || event.code === 'Space') && !isFalling) {
                isFalling = true; // Inizia la caduta
                velocity = 0; // Imposta la velocità verticale iniziale
            }
        });
    },
    undefined,
    (error) => {
        console.error('Errore durante il caricamento del modello:', error);
    }
);

// Posizione iniziale della telecamera
camera.position.set(0, 3, 15); // Posiziona la telecamera in alto e indietro

// Funzione di animazione
function animate() {
    requestAnimationFrame(animate);

    // Animazione della caduta e rimbalzo
    if (model && isFalling) {
        velocity += gravity; // Aggiungi gravità alla velocità
        model.position.y += velocity; // Aggiorna la posizione verticale

        // Gestisci il rimbalzo quando il modello raggiunge il pavimento
        if (model.position.y <= floorHeight) {
            model.position.y = floorHeight; // Allinea il modello al pavimento
            velocity = -velocity * bounceFactor; // Inverti e riduci la velocità

            // Ferma i rimbalzi quando la velocità è molto bassa
            if (Math.abs(velocity) < 0.01) {
                velocity = 0;
                isFalling = false; // Ferma l'animazione
            }
        }
    }

    renderer.render(scene, camera);
}
animate();