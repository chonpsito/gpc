// Map dimensions use Three.js units. A cat is roughly 30 units tall.
var MAP = {
  wallHeight: 100,
  wallThickness: 12,
  roomWidth: 360,
  roomDepth: 280,
  doorwayWidth: 100,
  floorHeight: 2
};

var renderer, scene, camera, cameraControls;
var materials = {};

init();
createHouse();
render();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xc5cbd0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('container').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc5cbd0);
  scene.fog = new THREE.Fog(0xc5cbd0, 2200, 4000);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(1250, 1400, 1550);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(140, 0, -140);
  cameraControls.enableDamping = true;
  cameraControls.dampingFactor = 0.06;
  cameraControls.maxPolarAngle = Math.PI / 2.05;
  cameraControls.minDistance = 400;
  cameraControls.maxDistance = 2600;

  window.addEventListener('resize', updateAspectRatio);
}

function createHouse() {
  createMaterials();
  createLighting();
  createGround();
  createRoomFloors();
  createOuterWalls();
  createRoomWalls();

  // Move or remove furniture by editing only the matching room function.
  createLivingRoom();
  createDiningRoom();
  createKitchen();
  createBedroom();
  createBathroom();
  createStudy();
}

function createMaterials() {
  // House and furniture use subdued colors; only throwable targets stand out.
  materials.wall = new THREE.MeshPhongMaterial({ color: 0xb9b3a7 });
  materials.floor = new THREE.MeshPhongMaterial({ color: 0x77766c });
  materials.wood = new THREE.MeshPhongMaterial({ color: 0x655344 });
  materials.paleWood = new THREE.MeshPhongMaterial({ color: 0x82705b });
  materials.fabric = new THREE.MeshPhongMaterial({ color: 0x596b70 });
  materials.mattress = new THREE.MeshPhongMaterial({ color: 0xb8b4aa });
  materials.white = new THREE.MeshPhongMaterial({ color: 0xbab8af });
  materials.dark = new THREE.MeshPhongMaterial({ color: 0x454a49 });

  // Bright colors are reserved for objects that can be knocked over.
  materials.targetRed = new THREE.MeshPhongMaterial({ color: 0xe65b45 });
  materials.targetYellow = new THREE.MeshPhongMaterial({ color: 0xf0bd38 });
  materials.targetBlue = new THREE.MeshPhongMaterial({ color: 0x39b8c8 });
  materials.targetGreen = new THREE.MeshPhongMaterial({ color: 0x71c552 });
}

function createLighting() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x77736b, 0.55));

  var sunlight = new THREE.DirectionalLight(0xfff5df, 0.65);
  sunlight.position.set(-500, 1000, 650);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -850;
  sunlight.shadow.camera.right = 850;
  sunlight.shadow.camera.top = 850;
  sunlight.shadow.camera.bottom = -850;
  scene.add(sunlight);
}

function createGround() {
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2000),
    new THREE.MeshPhongMaterial({ color: 0x85877b })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(100, -3, -130);
  ground.receiveShadow = true;
  scene.add(ground);
}

function createRoomFloors() {
  // Four rooms form the main block. The bathroom and study make a long, offset wing.
  addRoomFloor('Living room floor', -180, -140, 0);
  addRoomFloor('Dining room floor', 180, -140, 1);
  addRoomFloor('Kitchen floor', -180, 140, 2);
  addRoomFloor('Bedroom floor', 180, 140, 3);
  addRoomFloor('Bathroom floor', 510, -140, 4);
  addRoomFloor('Study floor', 510, -420, 5);
}

function addRoomFloor(name, x, z, materialIndex) {
  addBox(
    name,
    MAP.roomWidth,
    MAP.floorHeight,
    MAP.roomDepth,
    x,
    0,
    z,
    materials.floor
  );
}

function createOuterWalls() {
  var halfRoomW = MAP.roomWidth / 2;
  var mainLeft = -MAP.roomWidth;
  var mainRight = MAP.roomWidth;
  var mainTop = -MAP.roomDepth;
  var mainBottom = MAP.roomDepth;
  var wingLeft = mainRight;
  var wingRight = wingLeft + MAP.roomWidth;
  var wingTop = -2 * MAP.roomDepth;

  // The wing makes a stepped footprint: the house is deliberately not square.
  createWall(MAP.roomDepth * 2, mainLeft, 0, true);
  createWall(MAP.roomWidth * 2, 0, mainBottom, false, true);
  createWall(MAP.roomDepth, mainRight, MAP.roomDepth / 2, true);
  createWall(MAP.roomDepth, wingLeft, -MAP.roomDepth * 1.5, true);
  createWall(MAP.roomWidth, wingLeft + halfRoomW, wingTop);
  createWall(MAP.roomDepth * 2, wingRight, -MAP.roomDepth, true);
  createWall(MAP.roomWidth, wingLeft + halfRoomW, 0, false, true);
  createWall(MAP.roomWidth * 2, 0, mainTop);
}

function createRoomWalls() {
  // Main block dividers, each with doors left open for movement.
  addVerticalWallWithDoor(0, -MAP.roomDepth, 0, -MAP.roomDepth / 2);
  addVerticalWallWithDoor(0, 0, MAP.roomDepth, MAP.roomDepth / 2);
  addHorizontalWallWithDoors(-MAP.roomWidth, MAP.roomWidth, 0, [-MAP.roomWidth / 2, MAP.roomWidth / 2]);

  // Connect dining room to bathroom, then bathroom to study.
  addVerticalWallWithDoor(MAP.roomWidth, -MAP.roomDepth, 0, -MAP.roomDepth / 2);
  addHorizontalWallWithDoors(MAP.roomWidth, MAP.roomWidth * 2, -MAP.roomDepth, [MAP.roomWidth * 1.5]);
}

function addHorizontalWallWithDoors(startX, endX, z, doorCenters) {
  var currentX = startX;
  doorCenters.sort(function (a, b) { return a - b; }).forEach(function (center) {
    var doorStart = center - MAP.doorwayWidth / 2;
    createWall(doorStart - currentX, currentX + (doorStart - currentX) / 2, z);
    currentX = center + MAP.doorwayWidth / 2;
  });
  createWall(endX - currentX, currentX + (endX - currentX) / 2, z);
}


function createWall(length, height, rotated) {
  var wall = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, MAP.wallThickness),
    materials.wall
  );
  wall.position.y = height/2;
  if (rotated) {
    wall.rotation.y = Math.PI / 2;
  }
  return wall;
}

function createLivingRoom() {
  var x = -180;
  var z = -140;

  // Low seating plus a tall shelf lets the cat explore different heights.
  addBox('Sofa', 190, 42, 80, x - 65, 0, z + 45, materials.fabric);
  addBox('TV stand', 150, 38, 45, x + 115, 0, z - 75, materials.wood);
  addBox('Tall bookcase', 75, 175, 35, x + 110, 0, z + 88, materials.wood);
  addTable('Coffee table', x - 15, 32, z - 45, 115, 32, 65, materials.paleWood);
  addObjective('Vase', createCylinder('Vase', 15, 20, x - 15, 32, z - 45, materials.targetRed, 25), 'living room');
  addObjective('Toy ball', createSphere('Toy ball', 13, x - 95, 45, z + 20, materials.targetYellow), 'living room');
}

function createDiningRoom() {
  var x = 180;
  var z = -140;

  addTable('Dining table', x, 58, z, 170, 58, 95, materials.paleWood);
  addBox('Sideboard', 140, 90, 42, x + 125, 0, z + 90, materials.wood);
  addObjective('Fruit bowl', createSphere('Fruit bowl', 18, x, 76, z, materials.targetGreen), 'dining room');
  addObjective('Cup', createCylinder('Cup', 10, 12, x + 125, 90, z + 90, materials.targetBlue, 22), 'dining room');
}

function createKitchen() {
  var x = -180;
  var z = 140;

  addBox('Kitchen counter', 250, 42, 60, x - 35, 0, z + 95, materials.paleWood);
  addBox('Kitchen cupboards', 240, 78, 55, x - 35, 42, z + 95, materials.white);
  addBox('Fridge', 70, 165, 70, x - 130, 0, z - 88, materials.dark);
  addTable('Kitchen island', x + 100, 82, z - 50, 125, 82, 70, materials.wood);
  addObjective('Plate', createCylinder('Plate', 20, 23, x + 100, 82, z - 50, materials.targetBlue, 5), 'kitchen');
  addObjective('Kettle', createCylinder('Kettle', 17, 20, x - 105, 42, z + 95, materials.targetRed, 30), 'kitchen');
}

function createBedroom() {
  var x = 180;
  var z = 140;

  addBox('Bed frame', 170, 32, 220, x - 15, 0, z + 8, materials.wood);
  addBox('Bed mattress', 162, 22, 210, x - 15, 32, z + 8, materials.mattress);
  addBox('Bed blanket', 162, 9, 125, x - 15, 58, z + 48, materials.fabric);
  addBox('Wardrobe', 115, 180, 65, x + 115, 0, z + 78, materials.wood);
  addTable('Bedside table', x - 140, 45, z - 62, 60, 45, 55, materials.paleWood);
  addObjective('Bedside lamp', createCylinder('Bedside lamp', 15, 10, x - 140, 45, z - 62, materials.targetYellow, 34), 'bedroom');
  var toyMouse = createBoxMesh('Toy mouse', 22, 14, 32, materials.targetGreen);
  toyMouse.position.set(x + 35, 78, z + 10);
  toyMouse.castShadow = true;
  scene.add(toyMouse);
  addObjective('Toy mouse', toyMouse, 'bedroom');
}

function createBathroom() {
  var x = 540;
  var z = -140;

  addBox('Bath', 80, 42, 185, x + 112, 0, z - 5, materials.white);
  addBox('Sink cabinet', 85, 70, 65, x - 110, 0, z - 83, materials.wood);
  addBox('Sink basin', 90, 14, 70, x - 110, 70, z - 83, materials.white);
  addBox('Toilet', 58, 55, 80, x - 110, 0, z + 88, materials.white);
  var soap = createBoxMesh('Soap', 22, 28, 18, materials.targetGreen);
  soap.position.set(x - 110, 98, z - 83);
  soap.castShadow = true;
  scene.add(soap);
  addObjective('Soap', soap, 'bathroom');
}

function createStudy() {
  var x = 540;
  var z = -420;

  addTable('Desk', x - 20, 65, z + 30, 170, 65, 75, materials.wood);
  addBox('Desk drawer unit', 50, 58, 65, x + 130, 0, z + 30, materials.paleWood);
  addBox('Low storage', 170, 55, 50, x + 100, 0, z + 145, materials.wood);
  addBox('Tall shelf', 80, 185, 40, x - 135, 0, z - 130, materials.wood);
  var book = createBoxMesh('Book', 34, 9, 25, materials.targetRed);
  book.position.set(x - 20, 70, z + 30);
  book.castShadow = true;
  scene.add(book);
  addObjective('Book', book, 'study');
}

function addTable(name, x, topY, z, width, height, depth, material) {
  addBox(name + ' top', width, 12, depth, x, topY - 12, z, material);
  var legHeight = height - 12;
  var offsetX = width / 2 - 10;
  var offsetZ = depth / 2 - 10;
  addBox(name + ' leg', 10, legHeight, 10, x - offsetX, topY - height, z - offsetZ, material);
  addBox(name + ' leg', 10, legHeight, 10, x + offsetX, topY - height, z - offsetZ, material);
  addBox(name + ' leg', 10, legHeight, 10, x - offsetX, topY - height, z + offsetZ, material);
  addBox(name + ' leg', 10, legHeight, 10, x + offsetX, topY - height, z + offsetZ, material);
}

function addBox(name, width, height, depth, x, y, z, material) {
  var mesh = createBoxMesh(name, width, height, depth, material);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createBoxMesh(name, width, height, depth, material) {
  var mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  mesh.name = name;
  return mesh;
}

function createCylinder(name, topRadius, bottomRadius, x, y, z, material, height) {
  var mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, 16),
    material
  );
  mesh.name = name;
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createSphere(name, radius, x, y, z, material) {
  var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addObjective(name, object, room) {
  object.name = name;
  object.userData.isObjective = true;
  object.userData.room = room;
  object.userData.canBeKnockedOver = true;
  return object;
}

function updateAspectRatio() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update() {
  cameraControls.update();
}

function render() {
  requestAnimationFrame(render);
  update();
  renderer.render(scene, camera);
}
