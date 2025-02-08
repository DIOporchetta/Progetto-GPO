import * as THREE from 'three';

export default class Camera {
    constructor({ sizes, scene, model, rendererDom }) {
        // Verifica obbligatoria del rendererDom
        if (!rendererDom) {
            throw new Error("rendererDom è obbligatorio per la creazione della Camera");
        }
        this.model = model;
        this.sizes = sizes;
        this.rendererDom = rendererDom;  // Ora garantito che esista

        // Inizializza la telecamera
        this.instance = new THREE.PerspectiveCamera(
            75,
            sizes.viewport.width / sizes.viewport.height,
            0.1,
            2000
        );

        // Inizializza lo stato
        this.cameraDistance = 50;
        this.targetCameraDistance = 30;

        // Configurazioni
        this.ZOOM_SPEED = 1.5;
        this.MIN_ZOOM = 1;
        this.MAX_ZOOM = 30;
        this.ZOOM_SMOOTH_FACTOR = 0.1;

        // Setup eventi
        this.setupEventListeners();
        scene.add(this.instance);
    }

    setupEventListeners() {
        // Ascolta l'evento di zoom tramite scroll del mouse
        this.rendererDom.addEventListener('wheel', (e) => this.handleMouseWheel(e));

        // Ascolta l'evento di ridimensionamento della finestra
        window.addEventListener('resize', () => this.updateAspectRatio());
    }

    // Gestione dello zoom tramite la rotella del mouse
    handleMouseWheel(event) {
        event.preventDefault();
        this.targetCameraDistance += Math.sign(event.deltaY) * this.ZOOM_SPEED;
        this.targetCameraDistance = THREE.MathUtils.clamp(
            this.targetCameraDistance,
            this.MIN_ZOOM,
            this.MAX_ZOOM
        );
    }

    // Aggiorna la posizione della telecamera
    update() {
        if (!this.model) return;
    
        // Aggiorna lo zoom in modo fluido
        this.cameraDistance = THREE.MathUtils.lerp(
            this.cameraDistance,
            this.targetCameraDistance,
            this.ZOOM_SMOOTH_FACTOR
        );
    
        // Calcola la posizione della telecamera con un offset verticale
        const offset = new THREE.Vector3(
            0, 
            this.cameraDistance * 0.5, // Aggiunge un'altezza proporzionale alla distanza
            this.cameraDistance
        );
        
        this.instance.position.copy(this.model.position).add(offset);
        this.instance.lookAt(this.model.position);
        this.instance.up.set(0, 1, 0);
    }

    // Aggiorna il rapporto di aspetto della telecamera al ridimensionamento della finestra
    updateAspectRatio() {
        this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height;
        this.instance.updateProjectionMatrix();
    }
}
