import * as THREE from 'three';

/**
 * La classe AudioManager gestisce il caricamento e la riproduzione dei suoni nel gioco.
 * Utilizza la libreria Three.js per caricare e riprodurre file audio, legandoli al listener audio della telecamera.
 */
class AudioManager {
    /**
     * Crea una nuova istanza di AudioManager.
     * @param {THREE.PerspectiveCamera} cameraInstance - L'istanza della telecamera a cui associare il listener audio.
     */
    constructor(cameraInstance) {
        this.listener = new THREE.AudioListener(); // Crea un nuovo listener per l'audio.
        cameraInstance.instance.add(this.listener); // Associa il listener alla telecamera.
        this.audioLoader = new THREE.AudioLoader(); // Caricatore per caricare i file audio.
        this.sounds = {}; // Oggetto per memorizzare i suoni caricati.
    }

    /**
     * Carica un file audio e lo memorizza nella proprietà sounds.
     * @param {string} name - Il nome identificativo del suono.
     * @param {string} path - Il percorso del file audio da caricare.
     * @returns {Promise} Una promessa che si risolve con l'oggetto audio una volta caricato.
     */
    loadSound(name, path) {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(path, (buffer) => {
                const sound = new THREE.Audio(this.listener); // Crea un nuovo oggetto audio.
                sound.setBuffer(buffer); // Imposta il buffer audio.
                sound.setLoop(false); // Imposta il loop su false (suono che non si ripete).
                sound.setVolume(1); // Imposta il volume al massimo.
                this.sounds[name] = sound; // Memorizza il suono con il nome fornito.
                resolve(sound); // Risolve la promessa con l'oggetto audio.
            }, undefined, reject); // In caso di errore, rifiuta la promessa.
        });
    }

    /**
     * Riproduce il suono identificato dal nome specificato.
     * Se il suono è già in riproduzione, viene interrotto e riprodotto di nuovo.
     * @param {string} name - Il nome del suono da riprodurre.
     */
    playSound(name) {
        const sound = this.sounds[name]; // Recupera il suono tramite il nome.
        if (sound) {
            if (sound.isPlaying) {
                sound.stop(); // Interrompe la riproduzione corrente.
            }
            sound.play(); // Riproduce il suono.
        } else {
            console.warn(`Il suono "${name}" non è stato caricato!`); // Avvisa se il suono non è stato caricato.
        }
    }
}

export default AudioManager;
