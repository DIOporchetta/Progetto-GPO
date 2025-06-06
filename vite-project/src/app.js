import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import CannonDebugger from 'cannon-es-debugger';
import Camera from './Camera/camera.js';
import AudioManager from './AudioManager/audioManager.js';

let carModel, wheelModels = [], mapModel;
const loader = new GLTFLoader();
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
document.body.appendChild(renderer.domElement);

const cameraInstance = new Camera({
    sizes: { 
        viewport: { 
            width: window.innerWidth, 
            height: window.innerHeight 
        } 
    },
    scene,
    model: null,
    rendererDom: renderer.domElement
});

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const cannonDebugger = new CannonDebugger(scene, world);

const audioManager = new AudioManager(cameraInstance.instance);
audioManager.loadSound('clacson', 'vite-project/src/Sound/clacson.ogg', { volume: 1.0, loop: true })
    .then(() => console.log('Audio caricato!'))
    .catch((error) => console.error('Errore nel caricamento audio:', error));

audioManager.loadSound('gas', 'vite-project/src/Sound/gas.ogg', { volume: 1.0, loop: true })
    .then(() => console.log('Audio caricato!'))
    .catch((error) => console.error('Errore nel caricamento audio:', error));

// Dimensioni principali - MODIFICATE per maggiore stabilità
const CHASSIS_WIDTH = 3.52;
const CHASSIS_LENGTH = 1.8; // Aumentato da 1.5 per più stabilità longitudinale
const CHASSIS_HEIGHT = 0.3; // Ridotto da 0.5 per abbassare il centro di massa
const AXIS_WIDTH = 3.2; // Leggermente aumentato per carreggiata più larga

const suspensionStiffness = 800; // Aumentato da 500 per sospensioni più rigide
const suspensionDamping = 8000; // Aumentato da 5000 per più smorzamento
const suspensionCompression = 0.1; // Aggiunto per migliore compressione

loader.load('/vite-project/src/Model/carbody.glb', (gltf) => {
    carModel = gltf.scene;
    carModel.scale.set(1.5, 1.5, 1.5); 
    carModel.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    cameraInstance.model = carModel;
    scene.add(carModel);
});

loader.load('/vite-project/src/Model/wheel2.glb', (gltf) => {
    const wheel = gltf.scene;
    wheel.scale.set(1.6, 1.6, 1.6);
    for (let i = 0; i < 4; i++) {
        const wheelClone = wheel.clone();
        wheelModels.push(wheelClone);
        scene.add(wheelClone);
    }
});

loader.load('/vite-project/src/Model/map.glb', (gltf) => {
    mapModel = gltf.scene;
    mapModel.scale.set(1.5, 1.5, 1.5); 
    scene.add(mapModel);
});

const axesHelper = new THREE.AxesHelper(8);
scene.add(axesHelper);

// Illuminazione
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 2));

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(1, 1, 1).normalize();
scene.add(light1);

// Terreno
const groundMaterial = new CANNON.Material('ground');
const groundBody = new CANNON.Body({
    mass: 0,
    material: groundMaterial,
    shape: new CANNON.Box(new CANNON.Vec3(200, 0.1, 200)) 
});
groundBody.position.y = -0.05;  
world.addBody(groundBody);

// Veicolo - MODIFICATO per maggiore stabilità
const carBody = new CANNON.Body({
    mass: 2500, // Aumentato da 2000 per più stabilità
    position: new CANNON.Vec3(0, 10, 0),
    shape: new CANNON.Box(new CANNON.Vec3(CHASSIS_WIDTH, CHASSIS_HEIGHT, CHASSIS_LENGTH)),
    material: new CANNON.Material('chassis'), // Aggiunto materiale specifico
    suspensionStiffness: suspensionStiffness,
    suspensionDamping: suspensionDamping,
    suspensionCompression: suspensionCompression,
    maxSuspensionTravel: 0.2, // Ridotto da 0.3 per meno oscillazioni
    customSlidingRotationalSpeed: -0.05, // Ridotto da -0.1 per meno instabilità
    useCustomSlidingRotationalSpeed: true,
    angularDamping: 0.4, // Aggiunto smorzamento angolare per ridurre rotazioni
    linearDamping: 0.01 // Minimo smorzamento lineare per mantenere velocità
});

const vehicle = new CANNON.RigidVehicle({
    chassisBody: carBody
});

const testBoxBody = new CANNON.Body({ mass: 1 });
testBoxBody.addShape(new CANNON.Box(new CANNON.Vec3(1,1,1)));
testBoxBody.position.set(0, 10, 0);
world.addBody(testBoxBody);

// Configurazione ruote - MIGLIORATA
const wheelSettings = {
    axis: new CANNON.Vec3(0, 0, 1),
    mass: 150, // Ridotto da 200 per meno inerzia delle ruote
    shape: new CANNON.Cylinder(0.5, 0.5, 0.5, 100),
    material: new CANNON.Material('wheel'),
    down: new CANNON.Vec3(0, -1, 0),
    angularDamping: 0.6, // Ridotto da 0.8 per mantenere velocità
    suspension: {
        stiffness: suspensionStiffness,
        restLength: 0.8, // Ridotto da 0.9 per abbassare la macchina
        damping: 30, // Aumentato da 20 per più stabilità
        compression: suspensionCompression,
        maxForce: 15000 // Aumentato da 10000 per più controllo
    }
};

world.addContactMaterial(new CANNON.ContactMaterial(
    wheelSettings.material,
    groundMaterial,
    {
        friction: 25, // Ridotto leggermente da 30 ma ancora alto per grip
        restitution: 0.05 // Ridotto da 0.1 per meno rimbalzi
    }
));

// Aggiunto contact material per il telaio
world.addContactMaterial(new CANNON.ContactMaterial(
    carBody.material,
    groundMaterial,
    {
        friction: 0.3,
        restitution: 0.1
    }
));

// Posizioni ruote - MODIFICATE per carreggiata più larga
const wheelPositions = [
    [-2, AXIS_WIDTH / 2],  // Anteriore sinistra
    [-2, -AXIS_WIDTH / 2], // Posteriore sinistra
    [2, AXIS_WIDTH / 2],   // Anteriore destra
    [2, -AXIS_WIDTH / 2]   // Posteriore destra
];

wheelPositions.forEach(([x, z]) => {
    const wheelBody = new CANNON.Body({
        mass: wheelSettings.mass,
        material: wheelSettings.material,
    });
    const correctRotation = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    wheelBody.addShape(wheelSettings.shape, new CANNON.Vec3(0, 0, 0), correctRotation);
    wheelBody.angularDamping = wheelSettings.angularDamping;

    vehicle.addWheel({
        body: wheelBody,
        position: new CANNON.Vec3(x, -0.4, z), // Ridotto da -0.5 per abbassare
        axis: wheelSettings.axis,
        direction: wheelSettings.down,
        suspensionStiffness: wheelSettings.suspension.stiffness,
        suspensionRestLength: wheelSettings.suspension.restLength,
        suspensionDamping: wheelSettings.suspension.damping,
        maxSuspensionForce: wheelSettings.suspension.maxForce
    });
});

vehicle.addToWorld(world);

// Controlli - INVARIATI per mantenere la stessa velocità
document.addEventListener('keydown', (event) => {
    const maxSteerVal = Math.PI / 8;
    const maxForce = 8000; // Mantenuto uguale per stessa velocità

    switch (event.key) {
        case 'c':
            audioManager.playSound('clacson');
            break;
        case 'w':
        case 'ArrowUp':
            vehicle.setWheelForce(maxForce, 0);
            vehicle.setWheelForce(maxForce, 1);
            break;
        case 's':
        case 'ArrowDown':
            vehicle.setWheelForce(-maxForce / 2, 0);
            vehicle.setWheelForce(-maxForce / 2, 1);
            break;
        case 'a':
        case 'ArrowLeft':
            vehicle.setSteeringValue(maxSteerVal, 0);
            vehicle.setSteeringValue(maxSteerVal, 1);
            break;
        case 'd':
        case 'ArrowRight':
            vehicle.setSteeringValue(-maxSteerVal, 0);
            vehicle.setSteeringValue(-maxSteerVal, 1);
            break;
        case 'e': // Aggiunto tasto per interazione
            if (activeInteractionZones.size > 0) {
                activeInteractionZones.forEach(zoneId => {
                    const zone = interactionZones.find(z => z.id === zoneId);
                    if (zone) {
                        zone.action();
                    }
                });
            } else {
                console.log('Nessuna zona di interazione attiva.');
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'c':
            audioManager.stopSound('clacson');
            break;
        case 'w':
        case 'ArrowUp':
        case 's':
        case 'ArrowDown':
            vehicle.setWheelForce(0, 0);
            vehicle.setWheelForce(0, 1);
            break;
        case 'a':
        case 'ArrowLeft':
        case 'd':
        case 'ArrowRight':
            vehicle.setSteeringValue(0, 0);
            vehicle.setSteeringValue(0, 1);
            break;
        case 'e':
            // Nessuna azione 
            break;
    }
});

// Hitbox
const hitboxMaterial = new CANNON.Material('Material');
const hitboxes = [];
hitboxes.push(createHitbox('house', new CANNON.Vec3(-128, 0, -11), { x: 26, y: 50, z: 52 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(-25, 0, -1), { x: 8, y: 30, z: 7 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(23, 0, -65), { x: 3, y: 40, z: 3 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(-117, 0, -108), { x: 5, y: 20, z: 5 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(136, 0, -160), { x: 10, y: 40, z: 10 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(160, 0, -153), { x: 7, y: 20, z: 7 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('PORTFOLIO', new CANNON.Vec3(0, 0, -162), { x: 80, y: 40, z: 15 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(-165, 0, -163), { x: 5, y: 40, z: 5 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(-142, 0, -185), { x: 5, y: 40, z: 5 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('POINTER', new CANNON.Vec3(20, 0, 32), { x: 5, y: 40, z: 7 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('MULIN', new CANNON.Vec3(135, 0, 50), { x: 18, y: 60, z: 25 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(147, 0, 92), { x: 3, y: 40, z: 3 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(145, 0, 77), { x: 3, y: 10, z: 3 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('tree', new CANNON.Vec3(156, 0, 86), { x: 12, y: 10, z: 3 }, hitboxMaterial, world, scene));
hitboxes.push(createHitbox('house', new CANNON.Vec3(-179, 0, -53), { x: 24, y: 40, z: 69 }, hitboxMaterial, world, scene));

function createHitbox(name, position, dimensions, material, world, scene) {
    const hitboxShape = new CANNON.Box(new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2));
    const hitboxBody = new CANNON.Body({
        mass: 0,
        material: material,
        position: position
    });
    hitboxBody.addShape(hitboxShape);
    world.addBody(hitboxBody);

    const hitboxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z),
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    );
    hitboxMesh.position.copy(hitboxBody.position);
    scene.add(hitboxMesh);

    return {
        body: hitboxBody,
        mesh: hitboxMesh
    };
}

const zoneMessage = document.getElementById('zone-message');
// Zone di interazione
const activeInteractionZones = new Set();
const interactionZones = [
    {
        id: 'zone1',
        name: 'Zona 1',
        position: new CANNON.Vec3(10, 0, 10),
        dimensions: { x: 5, y: 5, z: 5 },
        action: () => {
            console.log('Interazione nella Zona 1!');
            audioManager.playSound('clacson');
        }
    },
    {
        id: 'zone2',
        name: 'Zona 2',
        position: new CANNON.Vec3(-10, 0, -10),
        dimensions: { x: 5, y: 5, z: 5 },
        action: () => {
          console.log('Interazione nella Zona 2!');
        }
      }
];

function createInteractionZone(id, name, position, dimensions, material, world, scene) {
    const hitboxShape = new CANNON.Box(new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2));
    const hitboxBody = new CANNON.Body({
        mass: 0,
        material: material,
        position: position,
        isTrigger: true
    });
    hitboxBody.addShape(hitboxShape);
    hitboxBody.zoneId = id;
    hitboxBody.zoneName = name;
    world.addBody(hitboxBody);

    const hitboxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }) // Verde per distinguerle
    );
    hitboxMesh.position.copy(hitboxBody.position);
    scene.add(hitboxMesh);

    return {
        body: hitboxBody,
        mesh: hitboxMesh
    };
}

const interactionZoneBodies = [];
interactionZones.forEach(zone => {
    const zoneObj = createInteractionZone(zone.id,zone.name,zone.position,zone.dimensions,hitboxMaterial,world,scene
    );
    interactionZoneBodies.push(zoneObj);
});

carBody.addEventListener('collide', (event) => {
    try {
        const otherBody = event.body;
        if (otherBody.zoneId) {
            activeInteractionZones.add(otherBody.zoneId);
            console.log(`Entrato nella zona: ${otherBody.zoneName}`);
        }
    } catch (error) {
        console.error('Errore nel listener collide:', error);
    }
});

world.addEventListener('postStep', () => {
    try {
        interactionZones.forEach(zone => {
            const zoneBody = interactionZoneBodies.find(z => z.body.zoneId === zone.id)?.body;
            if (!zoneBody) {
                console.warn(`Zona non trovata: ${zone.id}`);
                return;
            }
            const distance = carBody.position.distanceTo(zoneBody.position);
            const maxDistance = Math.max(zone.dimensions.x, zone.dimensions.y, zone.dimensions.z) / 2;
            const isColliding = distance <= maxDistance;

            if (!isColliding && activeInteractionZones.has(zone.id)) {
                // Uscita zona
                activeInteractionZones.delete(zone.id);
                console.log(`Uscito dalla zona: ${zone.name}`);

                // Nascondi messaggio solo se non ci sono altre zone attive
                if (activeInteractionZones.size === 0) {
                    zoneMessage.classList.add('hidden');
                }
            } else if (isColliding && !activeInteractionZones.has(zone.id)) {
                // Entrata zona
                activeInteractionZones.add(zone.id);
                console.log(`Entrato nella zona: ${zone.name}`);

                // Mostra messaggio aggiornato con nome zona
                zoneMessage.textContent = `Sei nella zona: ${zone.name}`;
                zoneMessage.classList.remove('hidden');
            }
        });
    } catch (error) {
        console.error('Errore nel listener postStep:', error);
    }
});

// Funzione flipcar MIGLIORATA - più conservativa
function flipcar() {
    const quaternion = carBody.quaternion;
    const upVector = new CANNON.Vec3(0, 1, 0);
    const worldUp = quaternion.vmult(upVector);
    const globalUp = new CANNON.Vec3(0, 1, 0);
    const dotProduct = worldUp.dot(globalUp);

    // Soglia più bassa per attivare il flip (era 0.2, ora 0.1)
    if (dotProduct < 0.1) {
        // Salva la direzione attuale della macchina prima del ribaltamento
        const currentForward = new CANNON.Vec3(1, 0, 0);
        const worldForward = carBody.quaternion.vmult(currentForward);
        worldForward.y = 0;
        worldForward.normalize();
        
        const yawAngle = Math.atan2(worldForward.z, worldForward.x);
        
        const yawQuaternion = new CANNON.Quaternion();
        yawQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), yawAngle);
        
        carBody.quaternion.copy(yawQuaternion);
        
        // Posizione leggermente più alta per evitare clip nel terreno
        carBody.position.y = 2.5;
        carBody.angularVelocity.set(0, 0, 0);
        carBody.velocity.set(0, 0, 0);

        vehicle.wheelBodies.forEach((wheel, index) => {
            vehicle.setWheelForce(0, index);
            wheel.angularVelocity.set(0, 0, 0);
            wheel.velocity.set(0, 0, 0);
            
            const wheelOffset = new CANNON.Vec3(wheelPositions[index][0], -wheelSettings.suspension.restLength, wheelPositions[index][1]);
            const worldWheelPos = carBody.quaternion.vmult(wheelOffset);
            wheel.position.copy(carBody.position.vadd(worldWheelPos));
            wheel.quaternion.copy(carBody.quaternion);
        });

        console.log("Ribaltamento corretto mantenendo l'orientamento originale");
    }
}

// Animazione
function animate() {
    world.step(1 / 60);
    world.gravity.set(0, -9.82, 0);
    world.defaultContactMaterial = new CANNON.ContactMaterial(
        new CANNON.Material('default'),
        new CANNON.Material('default'),
        {
            friction: 0.1,
            restitution: 0.7
        }
    );

    hitboxes.forEach(hitbox => {
        hitbox.mesh.position.copy(hitbox.body.position);
    });

    if (carModel) {
        carModel.position.copy(new CANNON.Vec3(carBody.position.x, carBody.position.y - 1, carBody.position.z));
        carModel.quaternion.copy(carBody.quaternion);
    }

    vehicle.wheelBodies.forEach((wheelBody, index) => {
        if (wheelModels[index]) {
            const wheelMesh = wheelModels[index];
            wheelMesh.position.copy(wheelBody.position);
            wheelMesh.quaternion.copy(wheelBody.quaternion);
            wheelMesh.rotateX(Math.PI / 2);
        }
    });

    flipcar();
    cannonDebugger.update();
    cameraInstance.update();
    renderer.render(scene, cameraInstance.instance);
    requestAnimationFrame(animate);
}

animate();