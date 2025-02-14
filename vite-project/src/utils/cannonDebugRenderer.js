// ./utils/cannonDebugRenderer.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class CannonDebugRenderer {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.meshes = [];
    }

    update() {
        // Rimuovi le mesh precedenti
        this.meshes.forEach((mesh) => this.scene.remove(mesh));
        this.meshes.length = 0;

        // Aggiungi nuove mesh per ogni corpo fisico
        this.world.bodies.forEach((body) => {
            body.shapes.forEach((shape) => {
                const mesh = this.createMesh(shape);
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
                this.scene.add(mesh);
                this.meshes.push(mesh);
            });
        });
    }

    createMesh(shape) {
        if (shape instanceof CANNON.Sphere) {
            return new THREE.Mesh(
                new THREE.SphereGeometry(shape.radius),
                new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
            );
        } else if (shape instanceof CANNON.Box) {
            return new THREE.Mesh(
                new THREE.BoxGeometry(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
            );
        } else if (shape instanceof CANNON.Cylinder) {
            return new THREE.Mesh(
                new THREE.CylinderGeometry(shape.radiusTop, shape.radiusBottom, shape.height, shape.numSegments),
                new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
            );
        }
        return null;
    }
}