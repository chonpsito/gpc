
// Variables globales que van siempre
var renderer, scene, camera;
var cameraControls;
var angulo = -0.01;

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

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 2000 );
  camera.position.set( 300, 300, 300 );

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 0, 0 );

  window.addEventListener('resize', updateAspectRatio );
}


function loadScene() {
    // Añadir un ayudante de ejes para visualizar el espacio 3D
    scene.add(new THREE.AxesHelper(15));

    let material = new THREE.MeshNormalMaterial();// new THREE.MeshBasicMaterial({ color: 0xff0fa0, wireframe: true });


    // Definimos el robot
    let robot = new THREE.Object3D();

    const default_faces = 50;

    const base_r = 50;
    const base_altura = 15;
    const base_geometria = new THREE.CylinderGeometry(base_r, base_r, base_altura, default_faces);
    let base = new THREE.Mesh(base_geometria, material);
    robot.add(base);

    let brazo = new THREE.Object3D();

    const eje_r = 20;
    const eje_altura = 18;
    const eje_geometria = new THREE.CylinderGeometry(eje_r, eje_r, eje_altura, default_faces);
    let eje = new THREE.Mesh(eje_geometria, material);
    eje.rotation.x = 1/2*Math.PI;
    brazo.add(eje);

    const esparrago_x = 18;
    const esparrago_y = 120;
    const esparrago_z = 12;
    const esparrago_geometria = new THREE.BoxGeometry(esparrago_x, esparrago_y, esparrago_z);
    let esparrago = new THREE.Mesh(esparrago_geometria, material);
    esparrago.position.y = esparrago_y / 2;
    brazo.add(esparrago);

    const rotula_r = 20;
    const rotula_geometria = new THREE.SphereGeometry(rotula_r);
    let rotula = new THREE.Mesh(rotula_geometria, material);
    rotula.position.y = esparrago_y;
    brazo.add(rotula);
    
    let antebrazo = new THREE.Object3D();

    const disco_r = 22;
    const disco_altura = 6;
    const disco_geometria = new THREE.CylinderGeometry(disco_r, disco_r, disco_altura, default_faces);
    let disco = new THREE.Mesh(disco_geometria, material);
    antebrazo.add(disco);

    const nervios_num = 4;
    const nervios_spacing = 6;
    const nervio_x = 4;
    const nervio_y = 80;
    const nervio_z = 4;
    const nervio_geometria = new THREE.BoxGeometry(nervio_x, nervio_y, nervio_z);
    for (let i = 0; i < nervios_num; i++) {
      let nervio = new THREE.Mesh(nervio_geometria, material);
      let x = nervios_spacing * (i === 0 || i === nervios_num - 1 ? 1 : -1);
      let z = nervios_spacing * (i < nervios_num / 2 ? 1 : -1);
      nervio.position.set(x, nervio_y/2, z);
      antebrazo.add(nervio);
    }

    let mano = new THREE.Object3D();
    let palma_r = 15;
    let palma_altura = 40;
    let palma_geometria = new THREE.CylinderGeometry(palma_r, palma_r, palma_altura, default_faces);
    let palma = new THREE.Mesh(palma_geometria, material);
    palma.rotation.x = 1/2*Math.PI;
    palma.position.y = nervio_y;
    mano.add(palma);

    let pinza1_x = 19;
    let pinza1_y = 20;
    let pinza1_z = 4;
    let pinza1_geometria = new THREE.BoxGeometry(pinza1_x, pinza1_y, pinza1_z);
    let pinza1 = new THREE.Mesh(pinza1_geometria, material);
    pinza1.position.y = pinza1_y / 2;

    let pinza_geometria2 = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      0, 0, 0,
      0, 20, 0,
      0, 20, -4,
      0, 0, -4,
      19, 4, 0,
      19, 16, 0,
      19, 16, -2,
      19, 4, -2
    ]);
    pinza_geometria2.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var indices = new Uint16Array([
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
    pinza_geometria2.setIndex(new THREE.BufferAttribute(indices, 1));
    let pinza2 = new THREE.Mesh(pinza_geometria2, material);
    pinza2.position.x = pinza1_x / 2;
    pinza2.position.z = pinza1_z / 2;

    
    let pinza = new THREE.Object3D();
    pinza.add(pinza1);
    pinza.add(pinza2);
    pinza.position.y = nervio_y - pinza1_y / 2;
    pinza.position.x = pinza1_x / 2;

    const pinza_spacing = 10;
    let pinzaIz = pinza.clone();
    pinzaIz.position.z = -(pinza1_z / 2 + pinza_spacing);
    mano.add(pinzaIz);

    let pinzaDe = pinza.clone();
    pinzaDe.position.z += pinza1_z / 2 + pinza_spacing;
    pinzaDe.rotation.x += Math.PI;
    pinzaDe.position.y += pinza1_y;
    mano.add(pinzaDe);
    antebrazo.add(mano);
    antebrazo.position.y = esparrago_y
    brazo.add(antebrazo);
    robot.add(brazo);

    scene.add(robot);

    // Añadir suelo 
    let geometriaSuelo = new THREE.PlaneGeometry(1000, 1000);
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
}

function render()
{
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}