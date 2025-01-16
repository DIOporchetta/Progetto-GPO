import * as THREE from 'three';

export default class Collision {
    constructor() {
        this.objects = {}; // Oggetti per la gestione delle collisioni
    }

    /**
     * Aggiunge un oggetto alla gestione delle collisioni.
     * @param {string} name - Nome identificativo dell'oggetto.
     * @param {THREE.Object3D} object - Oggetto Three.js.
     */
    addObject(name, object) {
        if (object) {
            this.objects[name] = new THREE.Box3().setFromObject(object); // Crea e salva il bounding box
        }
    }

    /**
     * Verifica se due oggetti stanno collidendo.
     * @param {string} nameA - Nome del primo oggetto.
     * @param {string} nameB - Nome del secondo oggetto.
     * @returns {boolean} True se c'è una collisione, altrimenti False.
     */
    checkCollision(nameA, nameB) {
        const boxA = this.objects[nameA];
        const boxB = this.objects[nameB];

        if (!boxA || !boxB) return false; // Se uno degli oggetti non è trovato, non c'è collisione

        return boxA.intersectsBox(boxB); // Verifica se le bounding box si sovrappongono
    }

    /**
     * Aggiorna il bounding box di un oggetto.
     * @param {string} name - Nome dell'oggetto.
     */
    updateBoundingBox(name, object) {
        if (this.objects[name]) {
            this.objects[name].setFromObject(object); // Aggiorna la bounding box
        }
    }
}