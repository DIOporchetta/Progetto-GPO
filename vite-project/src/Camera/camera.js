import * as THREE from 'three';

export default class Camera {
    constructor({ sizes, scene, model }) {
        // Crea la telecamera
        this.instance = new THREE.PerspectiveCamera(
            75,
            sizes.viewport.width / sizes.viewport.height,
            0.1,
            1000
        );

        this.instance.position.set(3, 10, 15); // Posizione iniziale della telecamera
        this.instance.lookAt(0, 0, 0); // Punto iniziale guardato

        this.model = model; // Riferimento al modello da seguire
        this.sizes = sizes;

        // Aggiunge la telecamera alla scena
        scene.add(this.instance);

        // Listener per aggiornare le dimensioni
        window.addEventListener('resize', () => this.updateAspectRatio());
    }

    updateAspectRatio() {
        // Aggiorna il rapporto d'aspetto e la matrice della proiezione
        this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height;
        this.instance.updateProjectionMatrix();
    }

    update() {
        if (this.model) {
            // Segui il modello
            this.instance.position.x = this.model.position.x + 5; // Offset laterale
            this.instance.position.y = this.model.position.y + 6; // Offset in alto
            this.instance.position.z = this.model.position.z + 12; // Offset dietro
            this.instance.lookAt(this.model.position); // La telecamera guarda il modello
        }
    }
}