import * as THREE from 'three';

export default class Collision {
    constructor() {
        this.objects = {}; // Oggetti registrati per la gestione delle collisioni
    }

    /**
     * Aggiunge un oggetto alla gestione delle collisioni.
     * @param {string} name - Nome identificativo dell'oggetto.
     * @param {THREE.Object3D} object - Oggetto Three.js.
     */
    addObject(name, object) {
        if (!object || !(object instanceof THREE.Object3D)) {
            console.warn(`Oggetto ${name} non valido.`);
            return;
        }

        const boundingBox = new THREE.Box3().setFromObject(object);
        this.objects[name] = { object, boundingBox };
    }

    /**
     * Aggiorna i bounding box di tutti gli oggetti.
     * Questa funzione è utile per oggetti in movimento o con modifiche dinamiche.
     */
    updateBoundingBoxes() {
        for (const key in this.objects) {
            const entry = this.objects[key];
            if (entry.object) {
                entry.boundingBox.setFromObject(entry.object);
            }
        }
    }

    /**
     * Verifica se due oggetti stanno collidendo.
     * @param {string} nameA - Nome del primo oggetto.
     * @param {string} nameB - Nome del secondo oggetto.
     * @returns {boolean} True se c'è una collisione, altrimenti False.
     */
    checkCollision(nameA, nameB) {
        const objA = this.objects[nameA];
        const objB = this.objects[nameB];

        if (!objA || !objB) {
            console.warn(`Uno o entrambi gli oggetti (${nameA}, ${nameB}) non sono registrati.`);
            return false;
        }

        return objA.boundingBox.intersectsBox(objB.boundingBox);
    }

    /**
     * Rimuove un oggetto dalla gestione delle collisioni.
     * @param {string} name - Nome dell'oggetto da rimuovere.
     */
    removeObject(name) {
        if (this.objects[name]) {
            delete this.objects[name];
            console.log(`Oggetto ${name} rimosso.`);
        } else {
            console.warn(`Oggetto ${name} non trovato.`);
        }
    }
}