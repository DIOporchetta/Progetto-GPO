import * as THREE from 'three';
import * as CANNON from 'cannon-es'; // Importa Cannon.js

class CollisionManager {
    constructor(world) {
        this.world = world; // Il mondo fisico di Cannon.js
    }
    

    /**
     * Verifica se due corpi di Cannon.js stanno collidendo
     */
    static checkCollision(body1, body2) {
        if (!body1 || !body2) return false; // Controllo se i corpi esistono
        body1.updateAABB(); // Aggiorna la AABB
        body2.updateAABB();
    
        const aabb1 = body1.aabb;
        const aabb2 = body2.aabb;
    
        if (!aabb1 || !aabb2) return false; // Controlla se le AABB esistono
    
        return aabb1.intersects(aabb2); // Usa il metodo corretto per il confronto
    }

    /**
     * Verifica se il giocatore si sta muovendo verso un ostacolo
     */
    checkMovementCollisions(playerBody, direction, objects, distanceThreshold = 0.5) {
        const futurePosition = playerBody.position.vadd(direction.scale(distanceThreshold)); // Simula la futura posizione
        const playerAABB = new CANNON.AABB(); // Bounding box del player
        playerBody.shape.calculateWorldAABB(futurePosition, new CANNON.Vec3(), playerAABB);

        for (const obj of objects) {
            if (obj.body) { // Se l'oggetto ha un corpo fisico
                if (playerAABB.overlaps(obj.body.aabb)) {
                    return {
                        collided: true,
                        normal: obj.body.position.vsub(playerBody.position).unit(), // Normale della collisione
                        distance: playerBody.position.distanceTo(obj.body.position)
                    };
                }
            }
        }

        return { collided: false };
    }
}

export default CollisionManager;

