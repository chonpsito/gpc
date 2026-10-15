
// Variables globales que van siempre
var renderer, scene, camera;
var cameraControls;
var cameraTop;
var angulo = -0.01;
var robot, brazo, antebrazo, mano, pinzaIz, pinzaDe;
var normalMaterial, wireframeMaterial;
var animationActive = false;
var animationTime = 0;
var previousWireframeState = false;
var clock = new THREE.Clock();
const robot_move_speed = 100;


// Constantes de las medidas del robot
const default_faces = 50;
const base_r = 50;
const base_altura = 15;

const eje_r = 20;
const eje_altura = 18;

const esparrago_x = 18;
const esparrago_y = 120;
const esparrago_z = 12;

const rotula_r = 20;
const disco_r = 22;
const disco_altura = 6;
const nervios_num = 4;
const nervios_spacing = 6;
const nervio_x = 4;
const nervio_y = 80;
const nervio_z = 4;
const palma_r = 15;
const palma_altura = 40;
const pinza1_x = 19;
const pinza1_y = 20;
const pinza1_z = 4;

const vertices = new Float32Array([
  0, 0, 0,
  0, 20, 0,
  0, 20, -4,
  0, 0, -4,
  19, 4, 0,
  19, 16, 0,
  19, 16, -2,
  19, 4, -2
]);

const indices = new Uint16Array([
  // Cara detrás YZ
  0, 1, 2,
  0, 2, 3, 
  // Cara arriba XZ
  2, 1, 5,
  2, 5, 6,
  // Cara delante XY
  1, 4, 5,
  1, 0, 4,
  // Cara debajo XZ
  0, 3, 4,
  4, 3, 7,
  // Cara detrás XY
  3, 2, 7,
  7, 2, 6,
  // Cara delante YZ
  4, 6, 5,
  4, 7, 6
]);
const init_pinza_spacing = 10;

const suelo_ancho = 1000;
const suelo_largo = 1000;

var controls = {
  giro_base: 0,
  giro_brazo: 0,
  giro_antebrazo_y: 0,
  giro_antebrazo_z: 0,
  giro_pinza: 0,
  separacion_pinza: init_pinza_spacing, 
  alambres: false,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  anima: function () {
    animationActive = !animationActive;
  },
};

// Event listeners para controles
document.addEventListener('keydown', (event) => {
    if (event.code.startsWith('Arrow')) {
        event.preventDefault();
    }

    switch (event.code) {
        case 'ArrowUp':
            controls.moveRight = true;
            break;
        case 'ArrowDown':
            controls.moveLeft = true;
            break;
        case 'ArrowLeft':
            controls.moveForward = true;
            break;
        case 'ArrowRight':
            controls.moveBackward = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code.startsWith('Arrow')) {
        event.preventDefault();
    }

    switch (event.code) {
        case 'ArrowUp':
            controls.moveRight = false;
            break;
        case 'ArrowDown':
            controls.moveLeft = false;
            break;
        case 'ArrowLeft':
            controls.moveForward = false;
            break;
        case 'ArrowRight':
            controls.moveBackward = false;
            break;
    }
});

window.addEventListener('blur', () => {
    controls.moveForward = false;
    controls.moveBackward = false;
    controls.moveLeft = false;
    controls.moveRight = false;
});



// 1-inicializa 
init();
// 2-Crea una escena
loadScene();
// 3-renderiza
render();

function init()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  // Cámara principal
  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 2000 );
  camera.position.set( 300, 300, 300 );

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 0, 0 );

  // Cámara en planta
  const minimap_size = base_r * 1.2;
  cameraTop = new THREE.OrthographicCamera( -minimap_size, minimap_size, minimap_size, -minimap_size, 1, 1000 );
  cameraTop.position.set(0,500,0);
  cameraTop.lookAt( 1, 0, 0 );
  cameraTop.up.set( 0, 0, 1 );
  cameraTop.updateProjectionMatrix();  

  // interface de usuario
  var gui = new dat.GUI();

  var gui_robot = gui.addFolder('Control Robot');
  gui_robot.add(controls, 'giro_base', -180, 180).name("Giro Base");
  gui_robot.add(controls, 'giro_brazo', -45, 45).name("Giro Brazo");
  gui_robot.add(controls, 'giro_antebrazo_y', -180, 180).name("Giro Antebrazo Y");
  gui_robot.add(controls, 'giro_antebrazo_z', -90, 90).name("Giro Antebrazo Z");
  gui_robot.add(controls, 'giro_pinza', -40, 220).name("Giro Pinza");
  gui_robot.add(controls, 'separacion_pinza', 0, 15).name("Separacion Pinza");
  gui_robot.add(controls, 'alambres').name("Alambres");
  gui_robot.add(controls, 'anima').name("Anima");
  gui_robot.open();

  window.addEventListener('resize', updateAspectRatio );
}


function loadScene() {
    // Añadir un ayudante de ejes para visualizar el espacio 3D
    scene.add(new THREE.AxesHelper(15));

    normalMaterial = new THREE.MeshNormalMaterial();
    wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0fa0, wireframe: true });
    previousWireframeState = controls.alambres;
    var material = controls.alambres ? wireframeMaterial : normalMaterial;


    // Definimos el robot
    robot = new THREE.Object3D();

    const base_geometria = new THREE.CylinderGeometry(base_r, base_r, base_altura, default_faces);
    let base = new THREE.Mesh(base_geometria, material);
    robot.add(base);

    brazo = new THREE.Object3D();

    const eje_geometria = new THREE.CylinderGeometry(eje_r, eje_r, eje_altura, default_faces);
    let eje = new THREE.Mesh(eje_geometria, material);
    eje.rotation.x = 1/2*Math.PI;
    brazo.add(eje);

    const esparrago_geometria = new THREE.BoxGeometry(esparrago_x, esparrago_y, esparrago_z);
    let esparrago = new THREE.Mesh(esparrago_geometria, material);
    esparrago.position.y = esparrago_y / 2;
    brazo.add(esparrago);

    const rotula_geometria = new THREE.SphereGeometry(rotula_r);
    let rotula = new THREE.Mesh(rotula_geometria, material);
    rotula.position.y = esparrago_y;
    brazo.add(rotula);
    
    antebrazo = new THREE.Object3D();

    const disco_geometria = new THREE.CylinderGeometry(disco_r, disco_r, disco_altura, default_faces);
    let disco = new THREE.Mesh(disco_geometria, material);
    antebrazo.add(disco);

    const nervio_geometria = new THREE.BoxGeometry(nervio_x, nervio_y, nervio_z);
    for (let i = 0; i < nervios_num; i++) {
      let nervio = new THREE.Mesh(nervio_geometria, material);
      let x = nervios_spacing * (i === 0 || i === nervios_num - 1 ? 1 : -1);
      let z = nervios_spacing * (i < nervios_num / 2 ? 1 : -1);
      nervio.position.set(x, nervio_y/2, z);
      antebrazo.add(nervio);
    }

    mano = new THREE.Object3D();
    
    let palma_geometria = new THREE.CylinderGeometry(palma_r, palma_r, palma_altura, default_faces);
    let palma = new THREE.Mesh(palma_geometria, material);
    palma.rotation.x = 1/2*Math.PI;
    palma.position.y = nervio_y;
    mano.add(palma);

    let pinza1_geometria = new THREE.BoxGeometry(pinza1_x, pinza1_y, pinza1_z);
    let pinza1 = new THREE.Mesh(pinza1_geometria, material);
    pinza1.position.y = pinza1_y / 2;

    let pinza_geometria2 = new THREE.BufferGeometry();
    
    pinza_geometria2.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    pinza_geometria2.setIndex(new THREE.BufferAttribute(indices, 1));
    // Cálculo de normales
    pinza_geometria2.computeVertexNormals();
    let pinza2 = new THREE.Mesh(pinza_geometria2, material);
    pinza2.position.x = pinza1_x / 2;
    pinza2.position.z = pinza1_z / 2;

    
    let pinza = new THREE.Object3D();
    pinza.add(pinza1);
    pinza.add(pinza2);
    pinza.position.y = nervio_y - pinza1_y / 2;
    pinza.position.x = pinza1_x / 2;

    pinzaIz = pinza.clone();
    pinzaIz.position.z = -(pinza1_z / 2 + init_pinza_spacing);
    mano.add(pinzaIz);

    pinzaDe = pinza.clone();
    pinzaDe.position.z += pinza1_z / 2 + init_pinza_spacing;
    pinzaDe.rotation.x += Math.PI;
    pinzaDe.position.y += pinza1_y;
    mano.add(pinzaDe);
    antebrazo.add(mano);
    antebrazo.position.y = esparrago_y
    brazo.add(antebrazo);
    robot.add(brazo);

    scene.add(robot);

    // Añadir suelo 
    let geometriaSuelo = new THREE.PlaneGeometry(suelo_ancho, suelo_largo);
    let suelo = new THREE.Mesh(geometriaSuelo, material);
    suelo.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    scene.add(suelo);
}


function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update()
{
  // Cambios para actualizar la camara segun mvto del raton
  cameraControls.update();
  var delta = Math.min(clock.getDelta(), 0.05);
  
  if (controls.alambres !== previousWireframeState) {
    var material = controls.alambres ? wireframeMaterial : normalMaterial;
    scene.traverse(function (object) {
      if (object.isMesh) {
        object.material = material;
      }
    });
    previousWireframeState = controls.alambres;
  }

  var baseRotation = controls.giro_base;
  var armRotation = controls.giro_brazo;
  var forearmRotationY = controls.giro_antebrazo_y;
  var forearmRotationZ = controls.giro_antebrazo_z;
  var gripperRotation = controls.giro_pinza;

  if (animationActive) {
    animationTime += delta;
    baseRotation = Math.sin(animationTime * 0.7) * 180;
    armRotation = Math.sin(animationTime) * 30;
    forearmRotationY = Math.sin(animationTime * 1.2) * 90;
    forearmRotationZ = Math.sin(animationTime * 0.8) * 45;
    gripperRotation = 90 + Math.sin(animationTime * 1.4) * 90;
  } else {
    animationTime = 0;
  }

  var degreesToRadians = Math.PI / 180;
  robot.rotation.y = baseRotation * degreesToRadians;
  brazo.rotation.z = armRotation * degreesToRadians;
  antebrazo.rotation.y = forearmRotationY * degreesToRadians;
  antebrazo.rotation.z = forearmRotationZ * degreesToRadians;
  mano.rotation.y = gripperRotation * degreesToRadians;

  pinzaIz.position.z = -(pinza1_z / 2 + controls.separacion_pinza);
  pinzaDe.position.z = pinza1_z / 2 + controls.separacion_pinza;

  var moveX = Number(controls.moveRight) - Number(controls.moveLeft);
  var moveZ = Number(controls.moveBackward) - Number(controls.moveForward);
  var moveLength = Math.hypot(moveX, moveZ);
  if (moveLength > 0) {
    robot.position.x += moveX / moveLength * robot_move_speed * delta;
    robot.position.z += moveZ / moveLength * robot_move_speed * delta;
  }

}

function render()
{
	requestAnimationFrame( render );
	update();


	// renderer.render( scene, camera );

  // vista 3d perspectiva
  renderer.autoClear = false;
  renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
	renderer.setClearColor( new THREE.Color(0xffffff) );
	renderer.clear();
	renderer.render( scene, camera );

  // vista de arriba
  var ds = Math.min(window.innerHeight , window.innerWidth)/4;
  var y = window.innerHeight - ds;
  renderer.setViewport(0, y,ds,ds);
	renderer.setScissor (0, y, ds, ds);
	renderer.setScissorTest (true);
	renderer.setClearColor( new THREE.Color(0xfffff) );
	renderer.clear();	
	renderer.setScissorTest (false);
  renderer.render(scene, cameraTop);
}