
// Variables globales que van siempre
var renderer, scene, camera;
var mixer = null;
var clock = new THREE.Clock();
var cameraMap;
var catRoot, catActions = {};
var currentCatAction = null;
var keysDown = {};
var catSpeed = 90;
var isJumping = false;
var verticalSpeed = 0;
var jumpGravity = -220;
var jumpHeight = 28;
var cameraPosition = new THREE.Vector3();
var cameraTarget = new THREE.Vector3();
var cameraReady = false;

// 1-inicializa 
init();
// 2-Crea una escena
loadScene();
// 3-renderiza
render();

function init()
{
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();
  
  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 2000 );
  camera.position.set(0, 65, 110);

  cameraMap = new THREE.OrthographicCamera(-185, 185, 185, -185, 1, 1200);
  cameraMap.up.set(0, 0, -1);
  cameraMap.position.set(0, 600, 0);
  cameraMap.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 0.8));
  var light = new THREE.DirectionalLight(0xffffff, 0.7);
  light.position.set(100, 200, 100);
  scene.add(light);

  window.addEventListener('resize', updateAspectRatio );
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);
}

function loadCatModel()
{
  if (!THREE.GLTFLoader) {
    console.error('GLTFLoader did not load. Check personal-project.html.');
    return;
  }

  var loader = new THREE.GLTFLoader();
  loader.load('models/cat.glb', function (gltf) {
    var model = gltf.scene;
    var bounds = new THREE.Box3().setFromObject(model);
    var size = bounds.getSize(new THREE.Vector3());
    var hasMesh = false;
    model.traverse(function (part) {
      if (part.isMesh) {
        hasMesh = true;
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });

    if (size.y <= 0 || !hasMesh) {
      console.error('models/cat.glb has no visible mesh geometry.');
      return;
    }

    var center = bounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -bounds.min.y, -center.z);
    model.rotation.y = Math.PI;
    catRoot = new THREE.Group();
    catRoot.name = 'Cat';
    catRoot.scale.setScalar(30 / size.y);
    catRoot.add(model);
    scene.add(catRoot);

    mixer = new THREE.AnimationMixer(model);
    loadCatAnimations(loader);
  }, undefined, function (error) {
    console.error('Could not load models/cat.glb. Run the page through a local web server.', error);
  });
}

function loadCatAnimations(loader) {
  loader.load('models/fox-animations.glb', function (gltf) {
    gltf.animations.forEach(function (clip) {
      var catClip = clip.clone();
      catClip.tracks = catClip.tracks.filter(function (track) {
        return !/^root\.(position|quaternion|scale)$/i.test(track.name);
      });
      catActions[clip.name.toLowerCase()] = mixer.clipAction(catClip);
    });
    playCatAnimation(false);
  }, undefined, function (error) {
    console.error('Could not load models/fox-animations.glb.', error);
  });
}

function onKeyDown(event) {
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].indexOf(event.code) !== -1) {
    event.preventDefault();
    keysDown[event.code] = true;
    if (event.code === 'Space' && !event.repeat) {
      jumpCat();
    }
  }
}

function onKeyUp(event) {
  keysDown[event.code] = false;
}

function clearKeys() {
  keysDown = {};
}

function moveCat(delta) {
  if (!catRoot) {
    return;
  }

  var x = (keysDown.KeyD ? 1 : 0) - (keysDown.KeyA ? 1 : 0);
  var z = (keysDown.KeyS ? 1 : 0) - (keysDown.KeyW ? 1 : 0);
  var moving = x !== 0 || z !== 0;

  if (moving) {
    var length = Math.sqrt(x * x + z * z);
    x /= length;
    z /= length;
    catRoot.position.x += x * catSpeed * delta;
    catRoot.position.z += z * catSpeed * delta;
    catRoot.rotation.y = Math.atan2(x, z);
  }

  // Keep the cat inside the four outer walls.
  catRoot.position.x = THREE.MathUtils.clamp(catRoot.position.x, -95, 95);
  catRoot.position.z = THREE.MathUtils.clamp(catRoot.position.z, -145, 145);

  if (isJumping) {
    verticalSpeed += jumpGravity * delta;
    catRoot.position.y += verticalSpeed * delta;
    if (catRoot.position.y <= 0) {
      catRoot.position.y = 0;
      verticalSpeed = 0;
      isJumping = false;
      if (currentCatAction === 'jump') {
        catActions.jump.stop();
        currentCatAction = null;
      }
    }
  }

  playCatAnimation(moving);
  updateThirdPersonCamera(delta);
}

function playCatAnimation(moving) {
  var names = Object.keys(catActions);
  if (names.length === 0) {
    return;
  }

  var wanted = isJumping
    ? names.find(function (name) { return /jump/.test(name); })
    : moving
      ? names.find(function (name) { return /walk/.test(name); })
        || names.find(function (name) { return /run|move/.test(name); })
      : names.find(function (name) { return /idle|stand|rest/.test(name); });
  wanted = wanted || names[0];

  if (currentCatAction === wanted && (wanted === 'jump' || catActions[wanted].isRunning())) {
    return;
  }
  if (currentCatAction && catActions[currentCatAction].isRunning()) {
    catActions[currentCatAction].fadeOut(0.2);
  }
  var action = catActions[wanted];
  action.reset().fadeIn(0.2);
  if (wanted === 'jump') {
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = 2.2;
  } else {
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.timeScale = 1;
  }
  action.play();
  currentCatAction = wanted;
}

function jumpCat() {
  if (!catRoot || isJumping || !catActions.jump) {
    return;
  }
  isJumping = true;
  verticalSpeed = Math.sqrt(2 * -jumpGravity * jumpHeight);
  playCatAnimation(false);
}

function updateThirdPersonCamera(delta) {
  var distanceBehind = 180;
  var cameraHeight = 100;
  var lookHeight = 18;
  var forwardX = Math.sin(catRoot.rotation.y);
  var forwardZ = Math.cos(catRoot.rotation.y);

  cameraPosition.set(
    catRoot.position.x - forwardX * distanceBehind,
    catRoot.position.y + cameraHeight,
    catRoot.position.z - forwardZ * distanceBehind
  );
  cameraTarget.set(
    catRoot.position.x,
    catRoot.position.y + lookHeight,
    catRoot.position.z
  );

  if (!cameraReady) {
    camera.position.copy(cameraPosition);
    cameraReady = true;
  } else {
    var smoothing = 1 - Math.exp(-6 * delta);
    camera.position.lerp(cameraPosition, smoothing);
  }
  camera.lookAt(cameraTarget);
}


function loadScene() {
    loadCatModel();

    // Largo pared
    function crearPared(length, height, rotated) {
      const materialPared = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
      const grosorPared = 5;
      var pared = new THREE.Mesh(
        new THREE.BoxGeometry(length, height, grosorPared),
        materialPared
      );
      pared.position.y = height/2;
      if (rotated) {
        pared.rotation.y = Math.PI / 2;
      }
      return pared;
    }

    var largoCasa = 200;
    var anchoCasa = 300;
    var altoExterior = 50;
    var altoInterior = 15;

    let paredExteriorIz = crearPared(largoCasa, altoExterior, false);
    paredExteriorIz.position.z = - anchoCasa / 2;
    scene.add(paredExteriorIz);

    let paredExteriorDer = crearPared(largoCasa, altoExterior, false);
    paredExteriorDer.position.z = anchoCasa / 2;
    scene.add(paredExteriorDer)

    let paredExteriorArr = crearPared(anchoCasa, altoExterior, true);
    paredExteriorArr.position.x = - largoCasa / 2;
    scene.add(paredExteriorArr);

    let paredExteriorAb = crearPared(anchoCasa, altoExterior, true);
    paredExteriorAb.position.x = largoCasa / 2;
    scene.add(paredExteriorAb)


    // Añadir suelo 
    let materialSuelo = new THREE.MeshBasicMaterial({ color: 0x999999 });
    let geometriaSuelo = new THREE.PlaneGeometry(1000, 1000);
    let suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
    suelo.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    scene.add(suelo);

    // loadModel()
}


function updateAspectRatio()
{
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update()
{
  var delta = Math.min(clock.getDelta(), 0.05);
  moveCat(delta);
  if (mixer) {
    mixer.update(delta);
  }
}

function render()
{
	requestAnimationFrame( render );
	update();
  var width = window.innerWidth;
  var height = window.innerHeight;

  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, width, height);
	renderer.render( scene, camera );

  var mapSize = 180;
  var mapMargin = 16;
  renderer.clearDepth();
  renderer.setViewport(mapMargin, mapMargin, mapSize, mapSize);
  renderer.setScissor(mapMargin, mapMargin, mapSize, mapSize);
  renderer.setScissorTest(true);
  renderer.clear(true, true, true);
  renderer.render(scene, cameraMap);
  renderer.setScissorTest(false);
}