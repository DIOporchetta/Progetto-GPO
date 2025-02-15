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

        // Aggiungi un listener audio alla telecamera
        this.listener = new THREE.AudioListener();
        cameraInstance.add(this.listener);

        // Loader per caricare i file audio
        this.audioLoader = new THREE.AudioLoader();

        // Oggetto per memorizzare i suoni caricati
        this.sounds = {};
    }

    /**
     * Carica un file audio e lo memorizza nella proprietà sounds.
     * @param {string} name - Il nome identificativo del suono
     * @param {string} path - Il percorso del file audio
     * @param {Object} options - Opzioni per il suono (volume, loop, ecc.)
     * @returns {Promise<THREE.Audio>} Promessa che si risolve con l'oggetto audio
     */
    loadSound(name, path, options = { volume: 1, loop: false }) {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                path,
                buffer => {
                    const sound = new THREE.Audio(this.listener);
                    sound.setBuffer(buffer);
                    sound.setLoop(options.loop || false);
                    sound.setVolume(options.volume || 1);
                    this.sounds[name] = sound;
                    resolve(sound);
                },
                undefined,
                reject
            );
        });
    }

    /**
     * Riproduce il suono specificato.
     * @param {string} name - Nome del suono registrato
     */
    playSound(name) {
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not loaded!`);
            return;
        }

        if (sound.isPlaying) sound.stop(); // Ferma il suono se è già in riproduzione
        sound.play(); // Avvia la riproduzione
    }

    /**
     * Ferma la riproduzione del suono specificato.
     * @param {string} name - Nome del suono registrato
     */
    stopSound(name) {
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not loaded!`);
            return;
        }

        if (sound.isPlaying) sound.stop(); // Ferma il suono se è in riproduzione
    }

    /**
     * Imposta il volume del suono specificato.
     * @param {string} name - Nome del suono registrato
     * @param {number} volume - Volume (0.0 - 1.0)
     */
    setVolume(name, volume) {
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not loaded!`);
            return;
        }

        sound.setVolume(volume);
    }

    /**
     * Imposta se il suono deve essere ripetuto in loop.
     * @param {string} name - Nome del suono registrato
     * @param {boolean} loop - Se true, il suono viene ripetuto in loop
     */
    setLoop(name, loop) {
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not loaded!`);
            return;
        }

        sound.setLoop(loop);
    }

    /**
     * Restituisce lo stato di riproduzione del suono.
     * @param {string} name - Nome del suono registrato
     * @returns {boolean} True se il suono è in riproduzione, altrimenti false
     */
    isPlaying(name) {
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not loaded!`);
            return false;
        }

        return sound.isPlaying;
    }

    /**
     * Ferma tutti i suoni attualmente in riproduzione.
     */
    stopAllSounds() {
        for (const name in this.sounds) {
            if (this.sounds[name].isPlaying) {
                this.sounds[name].stop();
            }
        }
    }
}