
// Variables globales que van siempre
var renderer, scene, camera;
var mixer = null;
var clock = new THREE.Clock();
var cameraMap;
var catRoot, catActions = {};
var currentCatAction = null;
var keysDown = {};
var catSpeed = 90;
var sprintMultiplier = 1.8;
var isJumping = false;
var isFalling = false;
var jumpAnimationActive = false;
var verticalSpeed = 0;
var jumpGravity = -220;
var jumpHeight = 50;
var fallThresholdHeight = 12;
var jumpAnimationStartTime = 0.2 ;
var cameraPosition = new THREE.Vector3();
var cameraTarget = new THREE.Vector3();
var cameraReady = false;
var angle = 0;
var turnSpeed = 2.5;
var largoCasa = 1000;
var anchoCasa = 1200;
var altoExterior = 300;
var altoInterior = 10;
var collisionObjects = [];
var walkableSurfaces = [];
var movementRaycaster = new THREE.Raycaster();
var movementDirection = new THREE.Vector3();
var rayOrigin = new THREE.Vector3();
var groundRaycaster = new THREE.Raycaster();
var groundRayOrigin = new THREE.Vector3();
var groundRayDirection = new THREE.Vector3(0, -1, 0);
var jumpStartHeight = 0;
var catClearance = 14;
var stepHeight = 4;
var anchoPuerta = 20;

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
    catRoot = new THREE.Group();
    catRoot.name = 'Cat';
    catRoot.scale.setScalar(30 / size.y);
    var modelOrientation = new THREE.Group();
    modelOrientation.rotation.y = Math.PI;
    modelOrientation.add(model);
    catRoot.add(modelOrientation);
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
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'].indexOf(event.code) !== -1) {
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

  var turn = (keysDown.KeyA ? 1 : 0) - (keysDown.KeyD ? 1 : 0);
  var direction = (keysDown.KeyW ? 1 : 0) - (keysDown.KeyS ? 1 : 0);

  if (turn !== 0) {
    angle += turn * turnSpeed * delta;
    catRoot.rotation.y = angle;
  }

  if (direction !== 0) {
    movementDirection.set(-Math.sin(angle) * direction, 0, -Math.cos(angle) * direction);
    var sprinting = keysDown.ShiftLeft || keysDown.ShiftRight;
    var stepDistance = catSpeed * (sprinting ? sprintMultiplier : 1) * delta;
    if (canCatMove(stepDistance)) {
      catRoot.position.addScaledVector(movementDirection, stepDistance);
    } else {
      direction = 0;
    }
  }
  var moving = direction !== 0;

  catRoot.position.x = THREE.MathUtils.clamp(
    catRoot.position.x,
    -largoCasa / 2 + catClearance + 2.5,
    largoCasa / 2 - catClearance - 2.5
  );
  catRoot.position.z = THREE.MathUtils.clamp(
    catRoot.position.z,
    -anchoCasa / 2 + catClearance + 2.5,
    anchoCasa / 2 - catClearance - 2.5
  );

  updateCatHeight(delta);

  playCatAnimation(moving);
  updateThirdPersonCamera(delta);
}

function detectGroundSurface(position, maxAbove) {
  if (walkableSurfaces.length === 0) {
    return null;
  }

  groundRayOrigin.copy(position);
  groundRayOrigin.y += jumpHeight + stepHeight + 5;
  groundRaycaster.far = groundRayOrigin.y + 5;
  groundRaycaster.set(groundRayOrigin, groundRayDirection);
  var impacts = groundRaycaster.intersectObjects(walkableSurfaces, true);

  for (var i = 0; i < impacts.length; i += 1) {
    if (impacts[i].point.y <= position.y + maxAbove) {
      return impacts[i].point.y;
    }
  }
  return null;
}

function updateCatHeight(delta) {
  var fallingDistance = Math.max(0, -verticalSpeed * delta);
  var surface = detectGroundSurface(
    catRoot.position,
    isJumping ? fallingDistance + 0.5 : stepHeight
  );

  if (!isJumping && surface !== null &&
      surface >= catRoot.position.y - stepHeight &&
      surface <= catRoot.position.y + stepHeight) {
    catRoot.position.y = surface;
    verticalSpeed = 0;
    isFalling = false;
    return;
  }

  if (!isJumping) {
    isJumping = true;
    jumpStartHeight = catRoot.position.y;
  }

  verticalSpeed += jumpGravity * delta;
  catRoot.position.y += verticalSpeed * delta;
  var floorHeight = detectGroundSurface(catRoot.position, Number.MAX_VALUE);
  var heightAboveGround = floorHeight === null
    ? catRoot.position.y
    : catRoot.position.y - floorHeight;
  isFalling = verticalSpeed < 0 &&
    heightAboveGround >= fallThresholdHeight;

  if (
    verticalSpeed <= 0 &&
    surface !== null &&
    surface <= jumpStartHeight + jumpHeight &&
    catRoot.position.y <= surface &&
    catRoot.position.y + fallingDistance >= surface
  ) {
    catRoot.position.y = surface;
    verticalSpeed = 0;
    isJumping = false;
    isFalling = false;
    jumpAnimationActive = false;
    if (currentCatAction === 'jump') {
      catActions.jump.stop();
      currentCatAction = null;
    }
  }
}

function canCatMove(stepDistance) {
  if (collisionObjects.length === 0) {
    return true;
  }

  var rayOffsets = [-catClearance * 0.7, 0, catClearance * 0.7];
  movementRaycaster.far = stepDistance + catClearance;

  for (var i = 0; i < rayOffsets.length; i += 1) {
    rayOrigin.set(
      catRoot.position.x + Math.cos(angle) * rayOffsets[i],
      catRoot.position.y + 12,
      catRoot.position.z - Math.sin(angle) * rayOffsets[i]
    );
    movementRaycaster.set(rayOrigin, movementDirection);
    var hits = movementRaycaster.intersectObjects(collisionObjects, true);

    if (hits.length === 0) {
      continue;
    }

    var obstacleBounds = new THREE.Box3().setFromObject(hits[0].object);
    if (isJumping && catRoot.position.y >= obstacleBounds.max.y) {
      continue;
    }
    return false;
  }
  return true;
}

function playCatAnimation(moving) {
  var names = Object.keys(catActions);
  if (names.length === 0) {
    return;
  }

  var sneaking = keysDown.ControlLeft || keysDown.ControlRight;
  var sprinting = keysDown.ShiftLeft || keysDown.ShiftRight;
  var wanted = isFalling
    ? names.find(function (name) { return /fall/.test(name); })
    : isJumping && jumpAnimationActive
      ? names.find(function (name) { return /jump/.test(name); })
      : moving && sneaking
        ? names.find(function (name) { return /sneak/.test(name); })
        : moving && sprinting
          ? names.find(function (name) { return /run|sprint/.test(name); })
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
  if (/fall/.test(wanted)) {
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.timeScale = 1;
  } else if (/jump/.test(wanted)) {
    var jumpDuration = 2 * Math.sqrt(2 * jumpHeight / -jumpGravity);
    action.time = jumpAnimationStartTime;
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = (action.getClip().duration - jumpAnimationStartTime) / jumpDuration;
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
  isFalling = false;
  jumpAnimationActive = true;
  jumpStartHeight = catRoot.position.y;
  verticalSpeed = Math.sqrt(2 * -jumpGravity * jumpHeight);
  playCatAnimation(false);
}

function updateThirdPersonCamera(delta) {
  var distanceBehind = 180;
  var cameraHeight = 100;
  var lookHeight = 18;
  var forwardX = -Math.sin(catRoot.rotation.y);
  var forwardZ = -Math.cos(catRoot.rotation.y);

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
    scene.add(new THREE.AxesHelper(200));

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

    let casa = new THREE.Object3D();
    let paredExteriorIz = crearPared(largoCasa, altoExterior, false);
    paredExteriorIz.position.z = - anchoCasa / 2;
    casa.add(paredExteriorIz);

    let paredExteriorDer = crearPared(largoCasa, altoExterior, false);
    paredExteriorDer.position.z = anchoCasa / 2;
    casa.add(paredExteriorDer)

    let paredExteriorArr = crearPared(anchoCasa, altoExterior, true);
    paredExteriorArr.position.x = - largoCasa / 2;
    casa.add(paredExteriorArr);

    let paredExteriorAb = crearPared(anchoCasa, altoExterior, true);
    paredExteriorAb.position.x = largoCasa / 2;
    casa.add(paredExteriorAb);


    let armario_altura = 24;
    let armario_anchura = 30;
    let armario_profundidad = 30;
    let armario_geometria = new THREE.BoxGeometry(armario_anchura, armario_altura, armario_profundidad);
    let armairo_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    let armario = new THREE.Mesh(armario_geometria, armairo_material);
    armario.position.set(70, armario_altura / 2, -80);
    scene.add(armario);
    collisionObjects.push(armario);
    walkableSurfaces.push(armario);
    armario.updateMatrixWorld(true);


    // Baño
    let baño = new THREE.Object3D();
    let largoBaño = 300;
    let anchoBaño = 500 - anchoPuerta;
    let puertaUbicacion = 0.2;
    let paredBañoIzq = crearPared(largoBaño, altoInterior, false);
    paredBañoIzq.position.z = -anchoBaño / 2;
    baño.add(paredBañoIzq);
    // let paredBañoDer = crearPared(largoBaño, altoInterior, false);
    // paredBañoIzq.position.z = anchoBaño / 2;
    // baño.add(paredBañoDer);
    // let paredBañoArr = crearPared(anchoBaño, altoInterior, true);
    // paredBañoIzq.position.x = -largoBaño / 2;
    // baño.add(paredBañoArr);
    // let paredBañoAb1 = crearPared(anchoBaño * puertaUbicacion, altoInterior, true);
    // paredBañoIzq.position.x = largoBaño / 2;
    // baño.add(paredBañoAb1);
    // let paredBañoAb2 = crearPared(anchoBaño * (1 - puertaUbicacion), altoInterior, true);
    // paredBañoIzq.position.x =  - largoBaño / 2;
    // baño.add(paredBañoAb2);

    casa.add(baño);





    
    scene.add(casa);
    collisionObjects.push(casa);
    // Añadir suelo 
    let materialSuelo = new THREE.MeshBasicMaterial({ color: 0x999999 });
    let geometriaSuelo = new THREE.PlaneGeometry(largoCasa, anchoCasa);
    let suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
    suelo.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    scene.add(suelo);
    walkableSurfaces.push(suelo);

    suelo.updateMatrixWorld(true);

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