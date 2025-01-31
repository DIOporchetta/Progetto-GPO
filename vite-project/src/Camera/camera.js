import * as THREE from 'three';

export default class Camera {
    constructor({ sizes, scene, model, rendererDom }) {
        if (!rendererDom) {
            throw new Error("rendererDom è obbligatorio per la creazione della Camera");
        }

        this.model = model;
        this.sizes = sizes;
        this.rendererDom = rendererDom;

        // Inizializza la telecamera
        this.instance = new THREE.PerspectiveCamera(
            75,
            sizes.viewport.width / sizes.viewport.height,
            0.1,
            1000
        );

        // Inizializza lo stato
        this.cameraDistance = 20;  // Posizione più alta per la visione dall'alto
        this.targetCameraDistance = 20;
        this.cameraAngleX = 0;
        this.cameraAngleY = -Math.PI / 1.5;  // Inclinata di più verso il basso
        this.isLockedMode = false;
        this.isPointerLocked = false;
        this.isDragging = false;

        // Configurazioni
        this.MOUSE_SENSITIVITY = 0.005;
        this.ZOOM_SPEED = 1.5;
        this.MIN_ZOOM = 3;
        this.MAX_ZOOM = 40;  // Più ampio per una visione dall'alto
        this.ZOOM_SMOOTH_FACTOR = 0.1;
        this.MAX_VERTICAL_ANGLE = Math.PI / 4;

        // Setup eventi
        this.setupEventListeners();
        scene.add(this.instance);
    }

    setupEventListeners() {
        this.rendererDom.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.rendererDom.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.rendererDom.addEventListener('mouseup', () => this.handleMouseUp());
        this.rendererDom.addEventListener('wheel', (e) => this.handleMouseWheel(e));
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        window.addEventListener('resize', () => this.updateAspectRatio());
    }



    handleKeyDown(event) {
        if (event.key === 'Shift') {
            event.preventDefault();
            if (!this.isLockedMode) {
                this.rendererDom.requestPointerLock();
                this.isLockedMode = true;
            } else {
                document.exitPointerLock();
                this.isLockedMode = false;
            }
        }
    }

    handlePointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.rendererDom;
        document.body.style.cursor = this.isPointerLocked ? 'none' : 'default';
    }

    update() {
        if (!this.model) return;

        // Aggiorna zoom
        this.cameraDistance = THREE.MathUtils.lerp(
            this.cameraDistance,
            this.targetCameraDistance,
            this.ZOOM_SMOOTH_FACTOR
        );

        // Calcola la posizione della telecamera
        const quaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(this.cameraAngleY, this.cameraAngleX, 0, 'YXZ'));

        // Calcola l'offset della telecamera
        const offset = new THREE.Vector3(0, 20, this.cameraDistance) // Posizione sopra la scena
            .applyQuaternion(quaternion);

        // Posiziona la telecamera
        this.instance.position.copy(this.model.position).add(offset);
        this.instance.lookAt(this.model.position); // La telecamera guarda sempre verso il modello
        this.instance.up.set(0, 0, 1); // Imposta l'orientamento corretto della telecamera (su Z)
    }

    updateAspectRatio() {
        this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height;
        this.instance.updateProjectionMatrix();
    }
}