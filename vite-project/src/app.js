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
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Luce ambientale
scene.add(ambientLight);

// Variabile per il modello
let model; 

// Carica il modello GLB
const loader = new GLTFLoader();
loader.load(
    'src/Model/cube.glb', // Percorso al file GLB
    (gltf) => {
        model = gltf.scene;
        model.scale.set(1, 1, 1); // Regola le dimensioni del cubo
        scene.add(model);

        // Movimento con tastiera
        const speed = 0.1;
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') model.position.z -= speed;
            if (event.key === 'ArrowDown') model.position.z += speed;
            if (event.key === 'ArrowLeft') model.position.x -= speed;
            if (event.key === 'ArrowRight') model.position.x += speed;
        });
    },
    undefined,
    (error) => {
        console.error('Errore durante il caricamento del modello:', error);
    }
);

// Posizione iniziale della telecamera
camera.position.z = 5;

// Funzione di animazione
function animate() {
    requestAnimationFrame(animate);

    // Ruotiamo il modello solo se è stato caricato
    if (model) {
        model.rotation.x += 0.01;
        model.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}
animate();