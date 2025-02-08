import * as THREE from 'three';

class CollisionManager {
    static checkCollision(object1, object2) {
        const box1 = new THREE.Box3().setFromObject(object1);
        const box2 = new THREE.Box3().setFromObject(object2);
        return box1.intersectsBox(box2);
    }

    static checkMovementCollisions(player, direction, objects, distanceThreshold = 0.5) {
        const raycaster = new THREE.Raycaster();
        const playerBox = new THREE.Box3().setFromObject(player);
        const playerSize = new THREE.Vector3();
        playerBox.getSize(playerSize);
        
        const detectionPoints = [
            new THREE.Vector3(playerSize.x/2, 0, 0),
            new THREE.Vector3(-playerSize.x/2, 0, 0),
            new THREE.Vector3(0, 0, playerSize.z/2),
            new THREE.Vector3(0, 0, -playerSize.z/2),
            new THREE.Vector3(playerSize.x/2, 0, playerSize.z/2),
            new THREE.Vector3(-playerSize.x/2, 0, playerSize.z/2),
            new THREE.Vector3(playerSize.x/2, 0, -playerSize.z/2),
            new THREE.Vector3(-playerSize.x/2, 0, -playerSize.z/2)
        ];

        for(const point of detectionPoints) {
            const globalPoint = point.clone().add(player.position);
            const rayDirection = direction.clone().normalize();
            
            raycaster.set(globalPoint, rayDirection);
            const intersects = raycaster.intersectObjects(objects);
            
            for(const intersect of intersects) {
                if(intersect.distance < distanceThreshold) {
                    return {
                        collided: true,
                        normal: intersect.face?.normal,
                        distance: intersect.distance
                    };
                }
            }
        }
        
        return { collided: false };
    }
}

export default CollisionManager;