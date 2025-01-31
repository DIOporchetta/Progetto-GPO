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
            1000
        );

        // Inizializza lo stato
        this.cameraDistance = 10;
        this.targetCameraDistance = 10;
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
        this.isLockedMode = false;
        this.isPointerLocked = false;
        this.isDragging = false;

        // Configurazioni
        this.MOUSE_SENSITIVITY = 0.005;
        this.ZOOM_SPEED = 1.5;
        this.MIN_ZOOM = 3;
        this.MAX_ZOOM = 15;
        this.ZOOM_SMOOTH_FACTOR = 0.1;
        this.MAX_VERTICAL_ANGLE = Math.PI/4;

        // Setup eventi
        this.setupEventListeners();
        scene.add(this.instance);
    }

    setupEventListeners() {
        // Usa il riferimento salvato al rendererDom
        this.rendererDom.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.rendererDom.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.rendererDom.addEventListener('mouseup', () => this.handleMouseUp());
        this.rendererDom.addEventListener('wheel', (e) => this.handleMouseWheel(e));
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        window.addEventListener('resize', () => this.updateAspectRatio());
    }

    handleMouseMove(event) {
        if (this.isPointerLocked) {
            this.updateCameraRotation(event.movementX, event.movementY);
        } 
        else if (this.isDragging) {
            const deltaX = event.clientX - this.previousMouseX;
            const deltaY = event.clientY - this.previousMouseY;
            this.updateCameraRotation(deltaX, deltaY);
            this.previousMouseX = event.clientX;
            this.previousMouseY = event.clientY;
        }
    }

    handleMouseDown(event) {
        if (!this.isPointerLocked) {
            this.isDragging = true;
            this.previousMouseX = event.clientX;
            this.previousMouseY = event.clientY;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleMouseWheel(event) {
        event.preventDefault();
        this.targetCameraDistance += Math.sign(event.deltaY) * this.ZOOM_SPEED;
        this.targetCameraDistance = THREE.MathUtils.clamp(
            this.targetCameraDistance,
            this.MIN_ZOOM,
            this.MAX_ZOOM
        );
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

    updateCameraRotation(deltaX, deltaY) {
        this.cameraAngleX -= deltaX * this.MOUSE_SENSITIVITY;
        this.cameraAngleY = THREE.MathUtils.clamp(
            this.cameraAngleY - (deltaY * this.MOUSE_SENSITIVITY),
            -this.MAX_VERTICAL_ANGLE,
            this.MAX_VERTICAL_ANGLE
        );
    }

    update() {
        if (!this.model) return;

        // Aggiorna zoom
        this.cameraDistance = THREE.MathUtils.lerp(
            this.cameraDistance,
            this.targetCameraDistance,
            this.ZOOM_SMOOTH_FACTOR
        );

        // Calcola posizione
        const quaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(this.cameraAngleY, this.cameraAngleX, 0, 'YXZ'));

        const offset = new THREE.Vector3(0, 0, this.cameraDistance)
            .applyQuaternion(quaternion);

        this.instance.position.copy(this.model.position).add(offset);
        this.instance.lookAt(this.model.position);
        this.instance.up.set(0, 1, 0);
    }

    updateAspectRatio() {
        this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height;
        this.instance.updateProjectionMatrix();
    }
}