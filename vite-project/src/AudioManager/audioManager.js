import * as THREE from 'three';

export default class AudioManager {
    /**
     * Crea una nuova istanza di AudioManager.
     * @param {THREE.PerspectiveCamera} cameraInstance - L'istanza della telecamera THREE.js
     */
    constructor(cameraInstance) {
        if (!(cameraInstance instanceof THREE.Camera)) {
            throw new Error("Devi passare un'istanza valida di THREE.Camera");
        }

        this.listener = new THREE.AudioListener();
        cameraInstance.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();
        this.sounds = {};
    }

    /**
     * Carica un file audio e lo memorizza nella proprietà sounds.
     * @param {string} name - Il nome identificativo del suono
     * @param {string} path - Il percorso del file audio
     * @returns {Promise<THREE.Audio>} Promessa che si risolve con l'oggetto audio
     */
    loadSound(name, path) {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                path,
                buffer => {
                    const sound = new THREE.Audio(this.listener);
                    sound.setBuffer(buffer);
                    sound.setLoop(false);
                    sound.setVolume(1);
                    this.sounds[name] = sound;
                    resolve(sound);
                },
                undefined,
                reject
            );
        });
    }

    /**
     * Riproduce il suono specificato
     * @param {string} name - Nome del suono registrato
     */
    playSound(name) {
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not loaded!`);
            return;
        }

        if (sound.isPlaying) sound.stop();
        sound.play();
    }
}