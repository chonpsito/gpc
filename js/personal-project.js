
// Variables globales que van siempre
var renderer, scene, camera;
var mixer = null;
var clock = new THREE.Clock();
var camaraMapa;
var gatoRaiz, accionesGato = {};
var accionActualGato = null;
var teclasPulsadas = {};
var velocidadGato = 90;
var multiplicadorCarrera = 1.8;
var saltando = false;
var cayendo = false;
var animacionSaltoActiva = false;
var velocidadVertical = 0;
var gravedadSalto = -220;
var posicionSegura = new THREE.Vector3();
var alturaLimiteCaida = -2;
var alturaSalto = 50;
var alturaUmbralCaida = 12;
var inicioAnimacionSalto = 0.2 ;
var posicionCamara = new THREE.Vector3();
var objetivoCamara = new THREE.Vector3();
var camaraLista = false;
var rayoCamara = new THREE.Raycaster();
var direccionRayoCamara = new THREE.Vector3();
var camaraLibre = new THREE.Vector3();
var distanciaCamaraActual = null;
var angulo = 0;
var velocidadGiro = 2.5;
// Aspecto visual: iluminación y ambiente
var colorCielo = 0x9fc5e8;
var colorLuzCielo = 0xfff4e0;
var colorLuzSuelo = 0x6b5b4b;
var intensidadLuzAmbiente = 0.45;
var colorLuzSol = 0xfff1d6;
var intensidadLuzSol = 0.55;
var posicionLuzSol = { x: 150, y: 900, z: 100 };
var resolucionSombras = 2048;
var sesgoSombras = -0.0005;
var exposicionRenderer = 0.8;

var largoCasa = 1000;
var anchoCasa = 1200;
var altoExterior = 300;
var altoInterior = 300;
var altoPuerta = 150;
var objetosColision = [];
var superficiesCaminables = [];
var rayoMovimiento = new THREE.Raycaster();
var direccionMovimiento = new THREE.Vector3();
var origenRayo = new THREE.Vector3();
var rayoSuelo = new THREE.Raycaster();
var origenRayoSuelo = new THREE.Vector3();
var direccionRayoSuelo = new THREE.Vector3(0, -1, 0);
var alturaInicioSalto = 0;
var holguraGato = 14;
var alturaEscalon = 4;
var anchoPuerta = 100;
var tamañoMinimapa = 250;
var objetosTirables = [];
var objetosRotos = 0;
var distanciaTirar = 35;
var alturaMaximaTirar = 30;
var empujeObjeto = 30;
var numeroFragmentos = 18;
var velocidadVuelco = 4;
var ejeVuelco = new THREE.Vector3();
var normalImpacto = new THREE.Vector3();
var tamañoFragmento = 12;
var alturaFragmentos = 2;
var radioDispersion = 14;
var contadorTirados, avisoTirar;
var gatoPuedeTirar = false;
var juegoTerminado = false;
var retardoVictoria = 2500;

// Dueño: caja que patrulla pasillo y comedor y vigila desde el pasillo si el gato está en una habitación
var dueño, mensajeDueño;
var estadoDueño = 'patrullando';
var alturaDueño = 110;
var anchoDueño = 30;
var velocidadDueño = 60;
var alturaOjosDueño = 90;
var alturaObjetivoVisionDueño = 15;
var alcanceVisionDueño = 700;
var anguloVisionDueño = Math.PI / 2;
var distanciaLlegadaDueño = 5;
var mezcladorDueño = null;
var accionesDueño = {};
var animacionActualDueño = '';
var tiempoMezclaDueño = 0.25;
var esperaRevision = 8;
var tiempoRevision = 0;
var zonaAnteriorGato = null;
var zonaVigilada = null;
var dueñoEsperando = false;
var vigiladoX = 0;
var vigiladoZ = 0;
var indiceRutaDueño = 0;
var rutaDueño = [[-400, 0], [0, 0], [150, 0], [150, -300], [150, 300], [150, 0]];
var anchoPasillo = 200;
var largoZonaHabitaciones = 600;
var profundidadVigilancia = 60;
var origenRayoDueño = new THREE.Vector3();
var direccionRayoDueño = new THREE.Vector3();
var rayoDueño = new THREE.Raycaster();

// Pantalla de carga: el juego no empieza hasta que gato, animaciones del gato y dueño estén cargados
var recursosPendientes = 3;
var pantallaCarga = document.createElement('div');
pantallaCarga.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#fff;font:28px sans-serif;display:flex;align-items:center;justify-content:center;z-index:10';
pantallaCarga.textContent = 'Cargando...';
document.body.appendChild(pantallaCarga);

function recursoCargado() {
  recursosPendientes -= 1;
  if (recursosPendientes === 0) {
    pantallaCarga.style.display = 'none';
    clock.getDelta();
  }
}

// 1-inicializa 
init();
// 2-Crea una scene
loadScene();
// 3-renderiza
render();

function init()
{
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(colorCielo) );
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposicionRenderer;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();
  
  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 2000 );
  camera.position.set(0, 65, 110);

  camaraMapa = new THREE.OrthographicCamera(-tamañoMinimapa, tamañoMinimapa, tamañoMinimapa, -tamañoMinimapa, 1, 1200);
  camaraMapa.up.set(0, 0, -1);
  camaraMapa.position.set(0, 600, 0);
  camaraMapa.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(colorLuzCielo, colorLuzSuelo, intensidadLuzAmbiente));
  var light = new THREE.DirectionalLight(colorLuzSol, intensidadLuzSol);
  light.position.set(posicionLuzSol.x, posicionLuzSol.y, posicionLuzSol.z);
  light.castShadow = true;
  light.shadow.mapSize.set(resolucionSombras, resolucionSombras);
  light.shadow.camera.left = -largoCasa / 2;
  light.shadow.camera.right = largoCasa / 2;
  light.shadow.camera.top = anchoCasa / 2;
  light.shadow.camera.bottom = -anchoCasa / 2;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 1200;
  light.shadow.bias = sesgoSombras;
  scene.add(light);

  window.addEventListener('resize', updateAspectRatio );
  window.addEventListener('keydown', alPulsarTecla);
  window.addEventListener('keyup', alSoltarTecla);
  window.addEventListener('blur', limpiarTeclas);
}

function cargarModeloGato()
{
  if (!THREE.GLTFLoader) {
    console.error('GLTFLoader did not load. Check personal-project.html.');
    return;
  }

  var cargador = new THREE.GLTFLoader();
  cargador.load('models/cat.glb', function (gltf) {
    var modelo = gltf.scene;
    var limites = new THREE.Box3().setFromObject(modelo);
    var tamaño = limites.getSize(new THREE.Vector3());
    var tieneMalla = false;
    modelo.traverse(function (parte) {
      if (parte.isMesh) {
        tieneMalla = true;
        parte.castShadow = true;
        parte.receiveShadow = true;
      }
    });

    if (tamaño.y <= 0 || !tieneMalla) {
      console.error('models/cat.glb has no visible mesh geometry.');
      return;
    }

    var centro = limites.getCenter(new THREE.Vector3());
    modelo.position.set(-centro.x, -limites.min.y, -centro.z);
    gatoRaiz = new THREE.Group();
    gatoRaiz.name = 'Cat';
    gatoRaiz.scale.setScalar(30 / tamaño.y);
    var orientacionModelo = new THREE.Group();
    orientacionModelo.rotation.y = Math.PI;
    orientacionModelo.add(modelo);
    gatoRaiz.add(orientacionModelo);
    scene.add(gatoRaiz);

    mixer = new THREE.AnimationMixer(modelo);
    recursoCargado();
    cargarAnimacionesGato(cargador);
  }, undefined, function (error) {
    console.error('Could not load models/cat.glb. Run the page through a local web server.', error);
  });
}

function cargarAnimacionesGato(cargador) {
  cargador.load('models/fox-animations.glb', function (gltf) {
    gltf.animations.forEach(function (clip) {
      var clipGato = clip.clone();
      clipGato.tracks = clipGato.tracks.filter(function (pista) {
        return !/^root\.(posicion|quaternion|scale)$/i.test(pista.name);
      });
      accionesGato[clip.name.toLowerCase()] = mixer.clipAction(clipGato);
    });
    reproducirAnimacionGato(false);
    recursoCargado();
  }, undefined, function (error) {
    console.error('Could not load models/fox-animations.glb.', error);
  });
}

function alPulsarTecla(evento) {
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'KeyE'].indexOf(evento.code) !== -1) {
    evento.preventDefault();
    teclasPulsadas[evento.code] = true;
    if (evento.code === 'Space' && !evento.repeat) {
      saltarGato();
    }
    if (evento.code === 'KeyE' && !evento.repeat) {
      tirarObjetoCercano();
    }
  }
}

function alSoltarTecla(evento) {
  teclasPulsadas[evento.code] = false;
}

function limpiarTeclas() {
  teclasPulsadas = {};
}

function moverGato(delta) {
  if (!gatoRaiz) {
    return;
  }

  var giro = (teclasPulsadas.KeyA ? 1 : 0) - (teclasPulsadas.KeyD ? 1 : 0);
  var direccion = (teclasPulsadas.KeyW ? 1 : 0) - (teclasPulsadas.KeyS ? 1 : 0);

  if (giro !== 0) {
    angulo += giro * velocidadGiro * delta;
    gatoRaiz.rotation.y = angulo;
  }

  if (direccion !== 0) {
    direccionMovimiento.set(-Math.sin(angulo) * direccion, 0, -Math.cos(angulo) * direccion);
    var corriendo = teclasPulsadas.ShiftLeft || teclasPulsadas.ShiftRight;
    var distanciaPaso = velocidadGato * (corriendo ? multiplicadorCarrera : 1) * delta;
    if (gatoPuedeMoverse(distanciaPaso)) {
      gatoRaiz.position.addScaledVector(direccionMovimiento, distanciaPaso);
    } else {
      direccion = 0;
    }
  }
  var moviendose = direccion !== 0;

  gatoRaiz.position.x = THREE.MathUtils.clamp(
    gatoRaiz.position.x,
    -largoCasa / 2 + holguraGato + 2.5,
    largoCasa / 2 - holguraGato - 2.5
  );
  gatoRaiz.position.z = THREE.MathUtils.clamp(
    gatoRaiz.position.z,
    -anchoCasa / 2 + holguraGato + 2.5,
    anchoCasa / 2 - holguraGato - 2.5
  );

  actualizarAlturaGato(delta);

  reproducirAnimacionGato(moviendose);
  actualizarCamaraTerceraPersona(delta);
  actualizarObjetosTirables(delta);
  actualizarAvisoTirar();
  actualizarDueño(delta);
}

function buscarObjetoCercano() {
  var masCercano = null;
  var distanciaMinima = distanciaTirar;
  for (var i = 0; i < objetosTirables.length; i += 1) {
    var tirable = objetosTirables[i];
    if (tirable.estado !== 'quieto') {
      continue;
    }
    var dx = tirable.objeto.position.x - gatoRaiz.position.x;
    var dz = tirable.objeto.position.z - gatoRaiz.position.z;
    var distancia = Math.sqrt(dx * dx + dz * dz);
    var diferenciaAltura = Math.abs(tirable.objeto.position.y - gatoRaiz.position.y);
    if (distancia < distanciaMinima && diferenciaAltura < alturaMaximaTirar) {
      distanciaMinima = distancia;
      masCercano = tirable;
    }
  }
  return masCercano;
}

function tirarObjetoCercano() {
  if (!gatoRaiz || juegoTerminado) {
    return;
  }
  var tirable = buscarObjetoCercano();
  if (tirable !== null && dueñoVeAlGato()) {
    juegoTerminado = true;
    alert('Perdiste: el dueño te ha visto tirar un objeto');
    location.reload();
    return;
  }
  if (tirable === null) {
    return;
  }
  tirable.estado = 'cayendo';
  tirable.velocidadX = tirable.direccionX * empujeObjeto;
  tirable.velocidadZ = tirable.direccionZ * empujeObjeto;
}

function romperObjeto(tirable, alturaSuelo) {
  var posicion = tirable.objeto.position;
  scene.remove(tirable.objeto);
  var materialFragmento = new THREE.MeshBasicMaterial({ color: tirable.color, side: THREE.DoubleSide });
  for (var i = 0; i < numeroFragmentos; i += 1) {
    var vertices = new Float32Array(9);
    for (var v = 0; v < 3; v += 1) {
      vertices[v * 3] = (Math.random() - 0.5) * tamañoFragmento;
      vertices[v * 3 + 2] = (Math.random() - 0.5) * tamañoFragmento;
    }
    var geometriaFragmento = new THREE.BufferGeometry();
    geometriaFragmento.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var fragmento = new THREE.Mesh(geometriaFragmento, materialFragmento);
    fragmento.position.set(
      posicion.x + (Math.random() - 0.5) * radioDispersion,
      alturaSuelo + alturaFragmentos,
      posicion.z + (Math.random() - 0.5) * radioDispersion
    );
    scene.add(fragmento);
  }
  tirable.estado = 'roto';
  objetosRotos += 1;
  contadorTirados.textContent = 'Objetos tirados: ' + objetosRotos + '/' + objetosTirables.length;
  if (objetosRotos === objetosTirables.length && !juegoTerminado) {
    juegoTerminado = true;
    setTimeout(function () {
      alert('¡Victoria! Has tirado todos los objetos');
      location.reload();
    }, retardoVictoria);
  }
}

function actualizarObjetosTirables(delta) {
  for (var i = 0; i < objetosTirables.length; i += 1) {
    var tirable = objetosTirables[i];
    if (tirable.estado !== 'cayendo') {
      continue;
    }
    var posicion = tirable.objeto.position;
    tirable.velocidadVertical += gravedadSalto * delta;
    var distanciaCaida = -tirable.velocidadVertical * delta;
    posicion.x = THREE.MathUtils.clamp(posicion.x + tirable.velocidadX * delta, -largoCasa / 2 + 5, largoCasa / 2 - 5);
    posicion.z = THREE.MathUtils.clamp(posicion.z + tirable.velocidadZ * delta, -anchoCasa / 2 + 5, anchoCasa / 2 - 5);
    // Vuelca hacia el lado del empuje (el eje es arriba × dirección)
    ejeVuelco.set(tirable.direccionZ, 0, -tirable.direccionX);
    tirable.objeto.rotateOnWorldAxis(ejeVuelco, velocidadVuelco * delta);

    // Rayo hacia abajo: solo cuenta una superficie por debajo de donde estaba apoyado
    origenRayoSuelo.set(posicion.x, posicion.y + 1, posicion.z);
    rayoSuelo.far = 1 + distanciaCaida;
    rayoSuelo.set(origenRayoSuelo, direccionRayoSuelo);
    var impactos = rayoSuelo.intersectObjects(superficiesCaminables, true);
    var alturaImpacto = null;
    for (var j = 0; j < impactos.length; j += 1) {
      // Solo cuentan las caras superiores: así no se cae por dentro del mueble
      normalImpacto.copy(impactos[j].face.normal).transformDirection(impactos[j].object.matrixWorld);
      if (normalImpacto.y > 0.5 && impactos[j].point.y < tirable.alturaInicio - 1) {
        alturaImpacto = impactos[j].point.y;
        break;
      }
    }

    if (alturaImpacto !== null) {
      romperObjeto(tirable, alturaImpacto);
    } else {
      posicion.y -= distanciaCaida;
    }
  }
}

function actualizarAvisoTirar() {
  gatoPuedeTirar = buscarObjetoCercano() !== null;
  avisoTirar.style.display = gatoPuedeTirar ? 'block' : 'none';
}

// Rayo desde los ojos del dueño al gato: dentro del alcance, del cono de visión y sin paredes por medio
function dueñoVeAlGato() {
  origenRayoDueño.set(dueño.position.x, alturaOjosDueño, dueño.position.z);
  direccionRayoDueño.set(
    gatoRaiz.position.x - origenRayoDueño.x,
    gatoRaiz.position.y + alturaObjetivoVisionDueño - origenRayoDueño.y,
    gatoRaiz.position.z - origenRayoDueño.z
  );
  var distancia = direccionRayoDueño.length();
  if (distancia > alcanceVisionDueño) {
    return false;
  }
  direccionRayoDueño.normalize();

  var distanciaHorizontal = Math.sqrt(direccionRayoDueño.x * direccionRayoDueño.x + direccionRayoDueño.z * direccionRayoDueño.z);
  if (distanciaHorizontal > 0) {
    var cosenoAngulo = (Math.sin(dueño.rotation.y) * direccionRayoDueño.x + Math.cos(dueño.rotation.y) * direccionRayoDueño.z) / distanciaHorizontal;
    if (cosenoAngulo < Math.cos(anguloVisionDueño / 2)) {
      return false;
    }
  }

  rayoDueño.set(origenRayoDueño, direccionRayoDueño);
  rayoDueño.far = distancia;
  var colisionesDueño = rayoDueño.intersectObjects(objetosColision, true);
  for (var i = 0; i < colisionesDueño.length; i += 1) {
    var limitesColisionDueño = new THREE.Box3().setFromObject(colisionesDueño[i].object);
    if (limitesColisionDueño.max.y >= altoPuerta * 2) {
      return false;
    }
  }
  return true;
}

// Carga el modelo con la animación de reposo y la de andar, ajustado a la altura del dueño
function cargarModeloDueño() {
  var cargadorFBX = new THREE.FBXLoader();
  cargadorFBX.load('models/breathing-idle.fbx', function (modeloFBX) {
    var limites = new THREE.Box3().setFromObject(modeloFBX);
    modeloFBX.scale.setScalar(alturaDueño / (limites.max.y - limites.min.y));
    modeloFBX.traverse(function (parte) {
      if (parte.isMesh) {
        parte.castShadow = true;
      }
    });
    dueño.add(modeloFBX);
    mezcladorDueño = new THREE.AnimationMixer(modeloFBX);
    accionesDueño.reposo = mezcladorDueño.clipAction(buscarClipConPistas(modeloFBX.animations));
    cargadorFBX.load('models/walking.fbx', function (animacionAndar) {
      accionesDueño.andar = mezcladorDueño.clipAction(buscarClipConPistas(animacionAndar.animations));
      cambiarAnimacionDueño('reposo');
      recursoCargado();
    });
  });
}

// El FBX trae un clip vacío ("Take 001") además del clip real de Mixamo
function buscarClipConPistas(clips) {
  var clip = clips.find(function (clip) { return clip.tracks.length > 0; });
  quitarMovimientoRaiz(clip);
  return clip;
}

// Mixamo mueve la cadera hacia delante dentro del clip y al repetirse el bucle vuelve atrás;
// se dejan fijas X y Z (el desplazamiento lo hace el código) y se conserva la altura
function quitarMovimientoRaiz(clip) {
  clip.tracks.forEach(function (pista) {
    if (pista.name === 'mixamorigHips.position') {
      for (var i = 0; i < pista.values.length; i += 3) {
        pista.values[i] = pista.values[0];
        pista.values[i + 2] = pista.values[2];
      }
    }
  });
}

function cambiarAnimacionDueño(nombre) {
  if (!accionesDueño[nombre] || animacionActualDueño === nombre) {
    return;
  }
  var anterior = accionesDueño[animacionActualDueño];
  var nueva = accionesDueño[nombre].reset().play();
  if (anterior) {
    nueva.crossFadeFrom(anterior, tiempoMezclaDueño, false);
  }
  animacionActualDueño = nombre;
}

function actualizarDueño(delta) {
  var posicionPrevia = dueño.position.clone();
  var limiteComedorX = -largoCasa / 2 + largoZonaHabitaciones;
  var limiteFilasX = -largoCasa / 2 + largoZonaHabitaciones / 2;
  var mitadPasillo = anchoPasillo / 2;
  var gatoEnComedor = gatoRaiz.position.x > limiteComedorX;
  var gatoEnHabitacion = !gatoEnComedor && Math.abs(gatoRaiz.position.z) > mitadPasillo;

  // Zona del gato: una por habitación (fila y lado del pasillo) y una para el comedor
  var zonaGato = null;
  if (gatoEnComedor) {
    zonaGato = 'comedor';
  } else if (gatoEnHabitacion) {
    zonaGato = (gatoRaiz.position.x < limiteFilasX ? 'fila1' : 'fila2') + (gatoRaiz.position.z < 0 ? 'norte' : 'sur');
  }

  // Si el dueño estaba quieto vigilando y el gato cambia de zona (sale al pasillo o pasa a otra
  // habitación por la puerta interior), se queda en su puesto esperaRevision segundos más
  if (zonaGato !== zonaAnteriorGato && dueñoEsperando) {
    tiempoRevision = esperaRevision;
  }
  if (zonaGato === zonaVigilada) {
    tiempoRevision = 0;
  }
  zonaAnteriorGato = zonaGato;

  var destinoX;
  var destinoZ;
  if (tiempoRevision > 0) {
    // Revisa que el gato no haya tirado nada: se queda en su puesto sin moverse
    tiempoRevision -= delta;
    estadoDueño = 'vigilando';
    destinoX = vigiladoX;
    destinoZ = vigiladoZ;
  } else if (gatoEnHabitacion) {
    // Vigila entrando un poco en la habitación por la puerta de su fila (el centro de la fila)
    estadoDueño = 'vigilando';
    var xFilaInicio = gatoRaiz.position.x < limiteFilasX ? -largoCasa / 2 : limiteFilasX;
    destinoX = xFilaInicio + largoZonaHabitaciones / 4;
    destinoZ = Math.sign(gatoRaiz.position.z) * (mitadPasillo + profundidadVigilancia);
    vigiladoX = destinoX;
    vigiladoZ = destinoZ;
    zonaVigilada = zonaGato;
  } else if (gatoEnComedor) {
    // El comedor se trata como una habitación: vigila desde su entrada, en el eje del pasillo
    estadoDueño = 'vigilando';
    destinoX = limiteComedorX + profundidadVigilancia;
    destinoZ = 0;
    vigiladoX = destinoX;
    vigiladoZ = destinoZ;
    zonaVigilada = zonaGato;
  } else {
    if (estadoDueño === 'vigilando') {
      estadoDueño = 'patrullando';
      indiceRutaDueño = 0;
    }
    destinoX = rutaDueño[indiceRutaDueño][0];
    destinoZ = rutaDueño[indiceRutaDueño][1];
  }

  // Waypoints para no atravesar paredes: siempre se pasa por el eje del pasillo (z = 0)
  var dueñoEnComedor = dueño.position.x > limiteComedorX;
  var dueñoEnHabitacion = !dueñoEnComedor && Math.abs(dueño.position.z) > mitadPasillo;
  var destinoEnHabitacion = destinoX < limiteComedorX && Math.abs(destinoZ) > mitadPasillo;
  var puertaAlineada = Math.abs(dueño.position.x - destinoX) <= distanciaLlegadaDueño;
  var pasoX = destinoX;
  var pasoZ = destinoZ;
  if (dueñoEnHabitacion && !(destinoEnHabitacion && puertaAlineada &&
      Math.sign(dueño.position.z) === Math.sign(destinoZ))) {
    // Sale de la habitación por su puerta antes de ir a otro sitio
    pasoX = dueño.position.x;
    pasoZ = 0;
  } else if (dueñoEnComedor && destinoX < limiteComedorX &&
      Math.abs(dueño.position.z) > distanciaLlegadaDueño) {
    pasoX = dueño.position.x;
    pasoZ = 0;
  } else if (destinoEnHabitacion && !dueñoEnHabitacion && !puertaAlineada) {
    // Recorre el pasillo hasta quedar frente a la puerta y entonces entra
    pasoX = destinoX;
    pasoZ = 0;
  }

  var dx = pasoX - dueño.position.x;
  var dz = pasoZ - dueño.position.z;
  var distanciaPaso = Math.sqrt(dx * dx + dz * dz);
  if (distanciaPaso > distanciaLlegadaDueño) {
    var avance = Math.min(distanciaPaso, velocidadDueño * delta);
    dueño.position.x += dx / distanciaPaso * avance;
    dueño.position.z += dz / distanciaPaso * avance;
    dueño.rotation.y = Math.atan2(dx, dz);
    dueñoEsperando = false;
  } else if (pasoX !== destinoX || pasoZ !== destinoZ) {
    // Waypoint alcanzado: se ajusta a él para que el siguiente tramo sea recto
    dueño.position.x = pasoX;
    dueño.position.z = pasoZ;
  } else if (estadoDueño === 'patrullando') {
    indiceRutaDueño = (indiceRutaDueño + 1) % rutaDueño.length;
  } else {
    // Llegó a su puesto de vigilancia y se queda quieto mirando al gato
    dueñoEsperando = true;
    dueño.rotation.y = Math.atan2(gatoRaiz.position.x - dueño.position.x, gatoRaiz.position.z - dueño.position.z);
  }

  cambiarAnimacionDueño(dueño.position.distanceToSquared(posicionPrevia) > 0.0001 ? 'andar' : 'reposo');

  // La regañina dura mientras el gato esté al alcance del objeto y el dueño lo vea
  if (gatoPuedeTirar && dueñoVeAlGato()) {
    mensajeDueño.textContent = 'Dueño: ¡Gato, deja eso ahora mismo!';
    mensajeDueño.style.display = 'block';
  } else {
    mensajeDueño.style.display = 'none';
  }
}

function detectarSuperficieSuelo(posicion, maximoSobre) {
  if (superficiesCaminables.length === 0) {
    return null;
  }

  // Cinco rayos hacia abajo (centro y cuatro puntos del cuerpo); gana la superficie más alta
  var radioCuerpo = holguraGato * 0.5;
  var desplazamientos = [[0, 0], [radioCuerpo, 0], [-radioCuerpo, 0], [0, radioCuerpo], [0, -radioCuerpo]];
  var masAlta = null;
  for (var k = 0; k < desplazamientos.length; k += 1) {
    origenRayoSuelo.set(
      posicion.x + desplazamientos[k][0],
      posicion.y + alturaSalto + alturaEscalon + 5,
      posicion.z + desplazamientos[k][1]
    );
    rayoSuelo.far = origenRayoSuelo.y + 5;
    rayoSuelo.set(origenRayoSuelo, direccionRayoSuelo);
    var impactos = rayoSuelo.intersectObjects(superficiesCaminables, true);

    for (var i = 0; i < impactos.length; i += 1) {
      if (impactos[i].point.y <= posicion.y + maximoSobre) {
        if (masAlta === null || impactos[i].point.y > masAlta) {
          masAlta = impactos[i].point.y;
        }
        break;
      }
    }
  }
  return masAlta;
}

function actualizarAlturaGato(delta) {
  // Se usa la velocidad del siguiente paso para que el suelo no se salte en caídas largas
  var distanciaCaida = Math.max(0, -(velocidadVertical + gravedadSalto * delta) * delta);
  var superficie = detectarSuperficieSuelo(
    gatoRaiz.position,
    saltando ? distanciaCaida + 0.5 : alturaEscalon
  );

  if (!saltando && superficie !== null &&
      superficie >= gatoRaiz.position.y - alturaEscalon &&
      superficie <= gatoRaiz.position.y + alturaEscalon) {
    gatoRaiz.position.y = superficie;
    velocidadVertical = 0;
    cayendo = false;
    posicionSegura.copy(gatoRaiz.position);
    return;
  }

  if (!saltando) {
    saltando = true;
    alturaInicioSalto = gatoRaiz.position.y;
  }

  velocidadVertical += gravedadSalto * delta;
  gatoRaiz.position.y += velocidadVertical * delta;
  if (gatoRaiz.position.y < alturaLimiteCaida) {
    // Red de seguridad: si atraviesa el suelo vuelve a la última posición apoyada
    gatoRaiz.position.copy(posicionSegura);
    velocidadVertical = 0;
    saltando = false;
    cayendo = false;
    return;
  }
  var alturaSuelo = detectarSuperficieSuelo(gatoRaiz.position, Number.MAX_VALUE);
  var alturaSobreSuelo = alturaSuelo === null
    ? gatoRaiz.position.y
    : gatoRaiz.position.y - alturaSuelo;
  cayendo = velocidadVertical < 0 &&
    alturaSobreSuelo >= alturaUmbralCaida;

  if (
    velocidadVertical <= 0 &&
    superficie !== null &&
    superficie <= alturaInicioSalto + alturaSalto &&
    gatoRaiz.position.y <= superficie &&
    gatoRaiz.position.y + distanciaCaida >= superficie
  ) {
    gatoRaiz.position.y = superficie;
    velocidadVertical = 0;
    saltando = false;
    cayendo = false;
    animacionSaltoActiva = false;
    if (accionActualGato === 'jump') {
      accionesGato.jump.stop();
      accionActualGato = null;
    }
  }
}

function gatoPuedeMoverse(distanciaPaso) {
  if (objetosColision.length === 0) {
    return true;
  }

  var desplazamientosRayos = [-holguraGato * 0.7, 0, holguraGato * 0.7];
  // Rayos a ras de los pies y a media altura, para detectar también obstáculos bajos
  var alturasRayos = [alturaEscalon + 1, 12, 26];
  rayoMovimiento.far = distanciaPaso + holguraGato;

  for (var j = 0; j < alturasRayos.length; j += 1) {
    for (var i = 0; i < desplazamientosRayos.length; i += 1) {
      origenRayo.set(
        gatoRaiz.position.x + Math.cos(angulo) * desplazamientosRayos[i],
        gatoRaiz.position.y + alturasRayos[j],
        gatoRaiz.position.z - Math.sin(angulo) * desplazamientosRayos[i]
      );
      rayoMovimiento.set(origenRayo, direccionMovimiento);
      var colisiones = rayoMovimiento.intersectObjects(objetosColision, true);

      if (colisiones.length === 0) {
        continue;
      }

      // Si los pies ya están a la altura de la cima (con margen de escalón), se puede avanzar
      var limitesObstaculo = new THREE.Box3().setFromObject(colisiones[0].object);
      if (gatoRaiz.position.y + alturaEscalon >= limitesObstaculo.max.y) {
        continue;
      }
      return false;
    }
  }
  return true;
}

function reproducirAnimacionGato(moviendose) {
  var nombres = Object.keys(accionesGato);
  if (nombres.length === 0) {
    return;
  }

  var agachado = teclasPulsadas.ControlLeft || teclasPulsadas.ControlRight;
  var corriendo = teclasPulsadas.ShiftLeft || teclasPulsadas.ShiftRight;
  var deseada = cayendo
    ? nombres.find(function (nombre) { return /fall/.test(nombre); })
    : saltando && animacionSaltoActiva
      ? nombres.find(function (nombre) { return /jump/.test(nombre); })
      : moviendose && agachado
        ? nombres.find(function (nombre) { return /sneak/.test(nombre); })
        : moviendose && corriendo
          ? nombres.find(function (nombre) { return /run|sprint/.test(nombre); })
          : moviendose
            ? nombres.find(function (nombre) { return /walk/.test(nombre); })
              || nombres.find(function (nombre) { return /run|move/.test(nombre); })
            : nombres.find(function (nombre) { return /idle|stand|rest/.test(nombre); });
  deseada = deseada || nombres[0];

  if (accionActualGato === deseada && (deseada === 'jump' || accionesGato[deseada].isRunning())) {
    return;
  }
  if (accionActualGato && accionesGato[accionActualGato].isRunning()) {
    accionesGato[accionActualGato].fadeOut(0.2);
  }
  var accion = accionesGato[deseada];
  accion.reset().fadeIn(0.2);
  if (/fall/.test(deseada)) {
    accion.setLoop(THREE.LoopRepeat, Infinity);
    accion.clampWhenFinished = false;
    accion.timeScale = 1;
  } else if (/jump/.test(deseada)) {
    var duracionSalto = 2 * Math.sqrt(2 * alturaSalto / -gravedadSalto);
    accion.time = inicioAnimacionSalto;
    accion.setLoop(THREE.LoopOnce, 1);
    accion.clampWhenFinished = true;
    accion.timeScale = (accion.getClip().duration - inicioAnimacionSalto) / duracionSalto;
  } else {
    accion.setLoop(THREE.LoopRepeat, Infinity);
    accion.clampWhenFinished = false;
    accion.timeScale = 1;
  }
  accion.play();
  accionActualGato = deseada;
}

function saltarGato() {
  if (!gatoRaiz || saltando || !accionesGato.jump) {
    return;
  }
  saltando = true;
  cayendo = false;
  animacionSaltoActiva = true;
  alturaInicioSalto = gatoRaiz.position.y;
  velocidadVertical = Math.sqrt(2 * -gravedadSalto * alturaSalto);
  reproducirAnimacionGato(false);
}

function actualizarCamaraTerceraPersona(delta) {
  var distanciaDetras = 180;
  var alturaCamara = 100;
  var alturaMirada = 18;
  var adelanteX = -Math.sin(gatoRaiz.rotation.y);
  var adelanteZ = -Math.cos(gatoRaiz.rotation.y);

  posicionCamara.set(
    gatoRaiz.position.x - adelanteX * distanciaDetras,
    gatoRaiz.position.y + alturaCamara,
    gatoRaiz.position.z - adelanteZ * distanciaDetras
  );
  objetivoCamara.set(
    gatoRaiz.position.x,
    gatoRaiz.position.y + alturaMirada,
    gatoRaiz.position.z
  );

  if (!camaraLista) {
    camaraLibre.copy(posicionCamara);
    camaraLista = true;
  } else {
    var suavizado = 1 - Math.exp(-6 * delta);
    camaraLibre.lerp(posicionCamara, suavizado);
  }

  // Si una pared se interpone entre el gato y la cámara, acercamos la cámara a la pared
  direccionRayoCamara.subVectors(camaraLibre, objetivoCamara);
  var distanciaCamara = direccionRayoCamara.length();
  direccionRayoCamara.normalize();
  rayoCamara.set(objetivoCamara, direccionRayoCamara);
  rayoCamara.far = distanciaCamara;
  var colisionesCamara = rayoCamara.intersectObjects(objetosColision, true);
  var distanciaPermitida = distanciaCamara;
  for (var i = 0; i < colisionesCamara.length; i += 1) {
    var limitesColision = new THREE.Box3().setFromObject(colisionesCamara[i].object);
    if (limitesColision.max.y >= altoPuerta * 2) {
      distanciaPermitida = Math.max(colisionesCamara[i].distance - 10, 20);
      break;
    }
  }
  // La distancia se suaviza para evitar saltos; la posición libre no se modifica
  if (distanciaCamaraActual === null || distanciaPermitida < distanciaCamaraActual) {
    distanciaCamaraActual = distanciaPermitida;
  } else {
    distanciaCamaraActual += (distanciaPermitida - distanciaCamaraActual) *
      (1 - Math.exp(-4 * delta));
  }
  camera.position.copy(objetivoCamara).addScaledVector(direccionRayoCamara, distanciaCamaraActual);
  camera.lookAt(objetivoCamara);
}


function loadScene() {
    cargarModeloGato();
    scene.add(new THREE.AxesHelper(200));

    // Largo pared
    function crearPared(largo, alto, rotada, color = 0xeeeeee) {
      const rugosidadPared = 0.9;
      const materialPared = new THREE.MeshStandardMaterial({ color: color, roughness: rugosidadPared, metalness: 0 });
      const grosorPared = 5;
      var pared = new THREE.Mesh(
        new THREE.BoxGeometry(largo, alto, grosorPared),
        materialPared
      );
      pared.position.y = alto/2;
      pared.castShadow = true;
      pared.receiveShadow = true;
      if (rotada) {
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

    let paredExteriorAb = crearPared(anchoCasa, altoExterior, true, 0x4a6fb5);
    paredExteriorAb.position.x = largoCasa / 2;
    casa.add(paredExteriorAb);


    let largoBaño = 300;
    let anchoBaño = 500;
    let largoHab = 300;
    let anchoHab = 500;

    // Paredes sin puerta: lado de la habitación y del despacho hacia el comedor
    let paredHabAb = crearPared(anchoHab, altoInterior, true);
    paredHabAb.position.x = - largoCasa / 2 + largoHab + largoBaño;
    paredHabAb.position.z = - (anchoCasa / 2) + anchoHab / 2;
    casa.add(paredHabAb);

    let paredDespachoAb = crearPared(anchoHab, altoInterior, true);
    paredDespachoAb.position.x = - largoCasa / 2 + largoHab + largoBaño;
    paredDespachoAb.position.z = (anchoCasa / 2) - anchoHab / 2;
    casa.add(paredDespachoAb);

    // Paredes con puerta centrada: [largo, rotada, x, z, color]
    // entrada, baño-pasillo, habitación-pasillo, baño-habitación,
    // cocina-pasillo, despacho-pasillo, cocina-despacho
    let paredesConPuerta = [
      [anchoCasa, true, - largoCasa / 2, 0, 0xc0504d],
      [largoBaño, false, - largoCasa / 2 + largoBaño / 2, - anchoCasa / 2 + anchoBaño, 0xeeeeee],
      [largoHab, false, - largoCasa / 2 + largoBaño + largoHab / 2, - anchoCasa / 2 + anchoHab, 0xeeeeee],
      [anchoBaño, true, - largoCasa / 2 + largoBaño, - anchoCasa / 2 + anchoBaño / 2, 0xeeeeee],
      [largoBaño, false, - largoCasa / 2 + largoBaño / 2, anchoCasa / 2 - anchoBaño, 0xeeeeee],
      [largoHab, false, - largoCasa / 2 + largoBaño + largoHab / 2, anchoCasa / 2 - anchoHab, 0xeeeeee],
      [anchoBaño, true, - largoCasa / 2 + largoBaño, anchoCasa / 2 - anchoBaño / 2, 0xeeeeee]
    ];
    for (let i = 0; i < paredesConPuerta.length; i++) {
      let p = paredesConPuerta[i];
      let largoTramo = (p[0] - anchoPuerta) / 2;
      for (let lado = -1; lado <= 1; lado += 2) {
        let tramo = crearPared(largoTramo, altoInterior, p[1], p[4]);
        let desplazamiento = lado * (anchoPuerta + largoTramo) / 2;
        tramo.position.x = p[2] + (p[1] ? 0 : desplazamiento);
        tramo.position.z = p[3] + (p[1] ? desplazamiento : 0);
        casa.add(tramo);
      }
      let dintel = crearPared(anchoPuerta, altoInterior - altoPuerta, p[1], p[4]);
      dintel.position.set(p[2], altoPuerta + (altoInterior - altoPuerta) / 2, p[3]);
      casa.add(dintel);
    }

    // Comedor: última fila sin paredes interiores, conectado al pasillo
    
    // Decoración básica: cada objeto define sus medidas antes de crearse y lo reutilizable se clona
    let cargadorTexturas = new THREE.TextureLoader().setPath('images/');
    let texturaMadera = cargadorTexturas.load('wood512.jpg');
    texturaMadera.encoding = THREE.sRGBEncoding;
    texturaMadera.wrapS = texturaMadera.wrapT = THREE.RepeatWrapping;
    let texturaMetal = cargadorTexturas.load('pisometalico_1024.jpg');
    texturaMetal.encoding = THREE.sRGBEncoding;
    texturaMetal.wrapS = texturaMetal.wrapT = THREE.RepeatWrapping;
    texturaMetal.repeat.set(2, 1);

    let materialMadera = new THREE.MeshStandardMaterial({ map: texturaMadera, color: 0xb0804f, roughness: 0.75, metalness: 0 });
    let materialTela = new THREE.MeshStandardMaterial({ color: 0x4466aa, roughness: 1, metalness: 0 });
    let materialBlanco = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.35, metalness: 0.1 });
    let materialEncimera = new THREE.MeshStandardMaterial({ color: 0x8888a0, roughness: 0.3, metalness: 0.25 });
    let materialMueble = new THREE.MeshStandardMaterial({ map: texturaMadera, color: 0xd9a66b, roughness: 0.6, metalness: 0 });
    let materialPantalla = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.6 });

    // Esquinas de las zonas de la casa (el eje x es el largo y el z el ancho)
    let xBaño = - largoCasa / 2;
    let zBaño = - anchoCasa / 2;
    let xHab = xBaño + largoBaño;
    let zHab = zBaño;
    let xCocina = xBaño;
    let zCocina = anchoCasa / 2;
    let xDespacho = xHab;
    let zDespacho = zCocina;
    let xComedor = xHab + largoHab;
    let zCentroComedor = 0;

    // Estantería escalonada (pegada a una pared en x = 0 local)
    let alturaEstanteria = 110;
    let anchoEstanteria = 240;
    let grosorFondoEstanteria = 4;
    let numeroEstantes = 3;
    let profundidadEstante = 35;
    let anchoEstante = 60;
    let grosorEstante = 4;
    let separacionVerticalEstantes = 35;
    let separacionZEstantes = 80;
    let zPrimerEstante = - separacionZEstantes;
    let estanteria = new THREE.Object3D();
    let fondoEstanteria = new THREE.Mesh(new THREE.BoxGeometry(grosorFondoEstanteria, alturaEstanteria, anchoEstanteria), materialMadera);
    fondoEstanteria.position.set(- grosorFondoEstanteria, alturaEstanteria / 2, 0);
    estanteria.add(fondoEstanteria);
    let tablaGeometria = new THREE.BoxGeometry(profundidadEstante, grosorEstante, anchoEstante);
    for (let i = 0; i < numeroEstantes; i++) {
      let tabla = new THREE.Mesh(tablaGeometria, materialMueble);
      tabla.position.set(
        - profundidadEstante / 2 - grosorFondoEstanteria,
        separacionVerticalEstantes * (i + 1) - grosorEstante / 2,
        zPrimerEstante + separacionZEstantes * i
      );
      estanteria.add(tabla);
    }

    // Silla: asiento, respaldo y patas; mira hacia +z y se clona donde se use
    let anchoSilla = 34;
    let alturaAsiento = 20;
    let grosorAsiento = 4;
    let alturaRespaldo = 28;
    let grosorRespaldo = 4;
    let grosorPataSilla = 4;
    let alturaPataSilla = alturaAsiento - grosorAsiento / 2;
    let silla = new THREE.Object3D();
    let asientoSilla = new THREE.Mesh(new THREE.BoxGeometry(anchoSilla, grosorAsiento, anchoSilla), materialTela);
    asientoSilla.position.y = alturaAsiento;
    silla.add(asientoSilla);
    let respaldoSilla = new THREE.Mesh(new THREE.BoxGeometry(anchoSilla, alturaRespaldo, grosorRespaldo), materialTela);
    respaldoSilla.position.set(0, alturaAsiento + grosorAsiento / 2 + alturaRespaldo / 2, - (anchoSilla - grosorRespaldo) / 2);
    silla.add(respaldoSilla);
    let pataSillaGeometria = new THREE.BoxGeometry(grosorPataSilla, alturaPataSilla, grosorPataSilla);
    let separacionPatasSilla = (anchoSilla - grosorPataSilla) / 2;
    for (let i = 0; i < 4; i++) {
      let pataSilla = new THREE.Mesh(pataSillaGeometria, materialMadera);
      pataSilla.position.set(
        i % 2 ? separacionPatasSilla : - separacionPatasSilla,
        alturaPataSilla / 2,
        i < 2 ? separacionPatasSilla : - separacionPatasSilla
      );
      silla.add(pataSilla);
    }

    // Armario ropero (se clona en habitación y despacho)
    let anchoRopero = 70;
    let alturaRopero = 60;
    let profundidadRopero = 50;
    let ropero = new THREE.Mesh(new THREE.BoxGeometry(anchoRopero, alturaRopero, profundidadRopero), materialMueble);

    // Habitación: cama, almohada, mesilla, ropero y estantería (formando escalera)
    let anchoCama = 100;
    let alturaCama = 20;
    let largoCama = 180;
    let margenCama = 20;
    let xCama = xHab + margenCama + anchoCama / 2;
    let zCama = zHab + margenCama + largoCama / 2;
    let cama = new THREE.Mesh(new THREE.BoxGeometry(anchoCama, alturaCama, largoCama), materialTela);
    cama.position.set(xCama, alturaCama / 2, zCama);
    casa.add(cama);

    let anchoAlmohada = 80;
    let alturaAlmohada = 8;
    let largoAlmohada = 30;
    let almohada = new THREE.Mesh(new THREE.BoxGeometry(anchoAlmohada, alturaAlmohada, largoAlmohada), materialBlanco);
    almohada.position.set(xCama, alturaCama + alturaAlmohada / 2, zCama - largoCama / 2 + largoAlmohada / 2);
    casa.add(almohada);

    let anchoMesilla = 40;
    let alturaMesilla = 25;
    let profundidadMesilla = 40;
    let separacionMesilla = 20;
    let margenParedMesilla = 10;
    let mesilla = new THREE.Mesh(new THREE.BoxGeometry(anchoMesilla, alturaMesilla, profundidadMesilla), materialMadera);
    mesilla.position.set(
      xCama + anchoCama / 2 + separacionMesilla + anchoMesilla / 2,
      alturaMesilla / 2,
      zHab + margenParedMesilla + profundidadMesilla / 2
    );
    casa.add(mesilla);

    let margenParedRopero = 10;
    let zRoperoHab = zHab + 60;
    ropero.position.set(xHab + largoHab - margenParedRopero - anchoRopero / 2, alturaRopero / 2, zRoperoHab);
    casa.add(ropero);

    estanteria.position.set(xComedor, 0, zHab + 210);
    casa.add(estanteria);
    superficiesCaminables.push(cama, almohada, mesilla, ropero, ...estanteria.children.slice(1));

    // Baño: bañera, lavabo, inodoro y estantería clonada
    let anchoBañera = 60;
    let alturaBañera = 25;
    let largoBañera = 150;
    let banera = new THREE.Mesh(new THREE.BoxGeometry(anchoBañera, alturaBañera, largoBañera), materialBlanco);
    banera.position.set(xBaño + 35, alturaBañera / 2, zBaño + 350);
    casa.add(banera);

    let anchoLavabo = 40;
    let alturaLavabo = 30;
    let largoLavabo = 60;
    let lavabo = new THREE.Mesh(new THREE.BoxGeometry(anchoLavabo, alturaLavabo, largoLavabo), materialBlanco);
    lavabo.position.set(xBaño + 25, alturaLavabo / 2, zBaño + 100);
    casa.add(lavabo);

    let anchoInodoro = 30;
    let alturaInodoro = 20;
    let largoInodoro = 35;
    let inodoro = new THREE.Mesh(new THREE.BoxGeometry(anchoInodoro, alturaInodoro, largoInodoro), materialBlanco);
    inodoro.position.set(xBaño + 20, alturaInodoro / 2, zBaño + 180);
    casa.add(inodoro);

    let estanteriaBaño = estanteria.clone();
    estanteriaBaño.position.set(xBaño + 150, 0, zBaño + 1);
    estanteriaBaño.rotation.y = Math.PI / 2;
    casa.add(estanteriaBaño);
    superficiesCaminables.push(banera, lavabo, inodoro, ...estanteriaBaño.children.slice(1));

    // Cocina: encimera en L, alacena, nevera y mesa con sillas
    let alturaEncimera = 30;
    let anchoEncimeraLateral = 50;
    let largoEncimeraLateral = 200;
    let anchoEncimeraFondo = 150;
    let profundidadEncimeraFondo = 50;
    let encimeraLateral = new THREE.Mesh(new THREE.BoxGeometry(anchoEncimeraLateral, alturaEncimera, largoEncimeraLateral), materialEncimera);
    encimeraLateral.position.set(xCocina + 30, alturaEncimera / 2, zCocina - 100);
    casa.add(encimeraLateral);
    let encimeraFondo = new THREE.Mesh(new THREE.BoxGeometry(anchoEncimeraFondo, alturaEncimera, profundidadEncimeraFondo), materialEncimera);
    encimeraFondo.position.set(xCocina + 130, alturaEncimera / 2, zCocina - profundidadEncimeraFondo / 2);
    casa.add(encimeraFondo);

    let anchoAlacena = 40;
    let alturaAlacena = 70;
    let largoAlacena = 80;
    let alacena = new THREE.Mesh(new THREE.BoxGeometry(anchoAlacena, alturaAlacena, largoAlacena), materialMueble);
    alacena.position.set(xCocina + 20, alturaAlacena / 2, zCocina - 270);
    casa.add(alacena);

    let anchoNevera = 50;
    let alturaNevera = 90;
    let profundidadNevera = 50;
    let nevera = new THREE.Mesh(new THREE.BoxGeometry(anchoNevera, alturaNevera, profundidadNevera), materialBlanco);
    nevera.position.set(xCocina + 30, alturaNevera / 2, zCocina - 340);
    casa.add(nevera);

    let xMesaCocina = xCocina + 160;
    let zMesaCocina = zCocina - 260;
    let ladoMesaCocina = 80;
    let grosorTapaMesaCocina = 4;
    let alturaPataMesaCocina = 32;
    let radioPataMesaCocina = 6;
    let separacionSillaCocina = 55;
    let mesaCocinaTapa = new THREE.Mesh(new THREE.BoxGeometry(ladoMesaCocina, grosorTapaMesaCocina, ladoMesaCocina), materialMadera);
    mesaCocinaTapa.position.set(xMesaCocina, alturaPataMesaCocina + grosorTapaMesaCocina / 2, zMesaCocina);
    casa.add(mesaCocinaTapa);
    let mesaCocinaPata = new THREE.Mesh(new THREE.CylinderGeometry(radioPataMesaCocina, radioPataMesaCocina, alturaPataMesaCocina), materialMadera);
    mesaCocinaPata.position.set(xMesaCocina, alturaPataMesaCocina / 2, zMesaCocina);
    casa.add(mesaCocinaPata);
    let sillaCocina1 = silla.clone();
    sillaCocina1.position.set(xMesaCocina, 0, zMesaCocina - separacionSillaCocina);
    casa.add(sillaCocina1);
    let sillaCocina2 = silla.clone();
    sillaCocina2.position.set(xMesaCocina, 0, zMesaCocina + separacionSillaCocina);
    sillaCocina2.rotation.y = Math.PI;
    casa.add(sillaCocina2);
    superficiesCaminables.push(sillaCocina1, sillaCocina2, encimeraLateral, encimeraFondo, alacena, nevera, mesaCocinaTapa);

    // Despacho: escritorio, silla, ropero y estantería clonados
    let anchoEscritorio = 100;
    let alturaEscritorio = 35;
    let profundidadEscritorio = 50;
    let xEscritorio = xDespacho + 80;
    let escritorio = new THREE.Mesh(new THREE.BoxGeometry(anchoEscritorio, alturaEscritorio, profundidadEscritorio), materialMadera);
    escritorio.position.set(xEscritorio, alturaEscritorio / 2, zDespacho - profundidadEscritorio / 2 - 5);
    casa.add(escritorio);
    let sillaDespacho = silla.clone();
    sillaDespacho.position.set(xEscritorio, 0, zDespacho - profundidadEscritorio - 35);
    casa.add(sillaDespacho);
    let roperoDespacho = ropero.clone();
    roperoDespacho.position.set(xDespacho + largoHab - margenParedRopero - anchoRopero / 2, alturaRopero / 2, zDespacho - 300);
    casa.add(roperoDespacho);
    let estanteriaDespacho = estanteria.clone();
    estanteriaDespacho.position.set(xComedor, 0, zDespacho - 150);
    casa.add(estanteriaDespacho);
    superficiesCaminables.push(escritorio, sillaDespacho, roperoDespacho, ...estanteriaDespacho.children.slice(1));

    // Comedor: mesa grande con patas clonadas, sillas clonadas y aparador
    let anchoMesaComedor = 160;
    let largoMesaComedor = 300;
    let grosorTapaMesaComedor = 6;
    let alturaPataMesaComedor = 30;
    let grosorPataMesaComedor = 8;
    let margenPataMesaComedor = 10;
    let xMesaComedor = xComedor + largoCasa / 2 - 300;
    let mesaComedor = new THREE.Mesh(new THREE.BoxGeometry(anchoMesaComedor, grosorTapaMesaComedor, largoMesaComedor), materialMadera);
    mesaComedor.position.set(xMesaComedor, alturaPataMesaComedor + grosorTapaMesaComedor / 2, zCentroComedor);
    casa.add(mesaComedor);
    let pataComedor = new THREE.Mesh(new THREE.BoxGeometry(grosorPataMesaComedor, alturaPataMesaComedor, grosorPataMesaComedor), materialMadera);
    let separacionXPatas = anchoMesaComedor / 2 - margenPataMesaComedor;
    let separacionZPatas = largoMesaComedor / 2 - margenPataMesaComedor;
    for (let i = 0; i < 4; i++) {
      let pata = pataComedor.clone();
      pata.position.set(
        xMesaComedor + (i % 2 ? separacionXPatas : - separacionXPatas),
        alturaPataMesaComedor / 2,
        zCentroComedor + (i < 2 ? separacionZPatas : - separacionZPatas)
      );
      casa.add(pata);
    }
    let separacionSillaComedor = 30;
    let separacionEntreSillasComedor = 100;
    superficiesCaminables.push(mesaComedor);
    for (let lado = -1; lado <= 1; lado += 2) {
      for (let j = -1; j <= 1; j++) {
        let sillaC = silla.clone();
        sillaC.position.set(
          xMesaComedor + lado * (anchoMesaComedor / 2 + separacionSillaComedor),
          0,
          zCentroComedor + j * separacionEntreSillasComedor
        );
        sillaC.rotation.y = - lado * Math.PI / 2;
        casa.add(sillaC);
        superficiesCaminables.push(sillaC);
      }
    }

    let profundidadAparador = 40;
    let alturaAparador = 60;
    let largoAparador = 200;
    let aparador = new THREE.Mesh(new THREE.BoxGeometry(profundidadAparador, alturaAparador, largoAparador), materialMueble);
    aparador.position.set(largoCasa / 2 - profundidadAparador / 2 - 5, alturaAparador / 2, zCentroComedor);
    casa.add(aparador);
    superficiesCaminables.push(aparador);

    // Extremo del comedor: televisión sobre un mueble bajo
    let anchoMuebleTV = 140;
    let alturaMuebleTV = 30;
    let profundidadMuebleTV = 45;
    let anchoPantallaTV = 110;
    let alturaPantallaTV = 60;
    let grosorPantallaTV = 4;
    let zMuebleTV = - anchoCasa / 2 + profundidadMuebleTV / 2 + 5;
    let muebleTV = new THREE.Mesh(new THREE.BoxGeometry(anchoMuebleTV, alturaMuebleTV, profundidadMuebleTV), materialMueble);
    muebleTV.position.set(xMesaComedor, alturaMuebleTV / 2, zMuebleTV);
    casa.add(muebleTV);
    let pantallaTV = new THREE.Mesh(new THREE.BoxGeometry(anchoPantallaTV, alturaPantallaTV, grosorPantallaTV), materialPantalla);
    pantallaTV.position.set(xMesaComedor, alturaMuebleTV + alturaPantallaTV / 2, zMuebleTV - 5);
    casa.add(pantallaTV);
    superficiesCaminables.push(muebleTV);

    // Extremo opuesto: mini biblioteca con dos estanterías clonadas y una silla
    let escalaBiblioteca = 0.6;
    let separacionEstanteriasBiblioteca = 190;
    let zBiblioteca = anchoCasa / 2 - 1;
    let bibliotecaIzq = estanteria.clone();
    bibliotecaIzq.scale.z = escalaBiblioteca;
    bibliotecaIzq.position.set(xMesaComedor - separacionEstanteriasBiblioteca / 2, 0, zBiblioteca);
    bibliotecaIzq.rotation.y = -Math.PI / 2;
    casa.add(bibliotecaIzq);
    let bibliotecaDer = estanteria.clone();
    bibliotecaDer.scale.z = escalaBiblioteca;
    bibliotecaDer.position.set(xMesaComedor + separacionEstanteriasBiblioteca / 2, 0, zBiblioteca);
    bibliotecaDer.rotation.y = -Math.PI / 2;
    casa.add(bibliotecaDer);
    let sillaBiblioteca = silla.clone();
    sillaBiblioteca.position.set(xMesaComedor, 0, zBiblioteca - 60);
    casa.add(sillaBiblioteca);
    superficiesCaminables.push(sillaBiblioteca, ...bibliotecaIzq.children.slice(1), ...bibliotecaDer.children.slice(1));

    // Objetos tirables: una plantilla por tipo, clonada en cada punto (todos dentro de `scene`, sin colisión)
    let alturaLibro = 15;
    let anchoLibro = 5;
    let largoLibro = 11;
    let colorLibro = 0xaa3333;
    let libro = new THREE.Object3D();
    libro.add(new THREE.Mesh(new THREE.BoxGeometry(anchoLibro, alturaLibro, largoLibro), new THREE.MeshStandardMaterial({ color: colorLibro, roughness: 0.8, metalness: 0 })));
    libro.children[0].position.y = alturaLibro / 2;

    let radioTaza = 4;
    let alturaTaza = 8;
    let radioAsaTaza = 1.5;
    let colorTaza = 0xffffff;
    let materialTaza = new THREE.MeshStandardMaterial({ color: colorTaza, roughness: 0.2, metalness: 0.05 });
    let taza = new THREE.Object3D();
    let cuerpoTaza = new THREE.Mesh(new THREE.CylinderGeometry(radioTaza, radioTaza, alturaTaza), materialTaza);
    cuerpoTaza.position.y = alturaTaza / 2;
    taza.add(cuerpoTaza);
    let asaTaza = new THREE.Mesh(new THREE.BoxGeometry(radioAsaTaza, alturaTaza / 2, radioAsaTaza), materialTaza);
    asaTaza.position.set(radioTaza + radioAsaTaza / 2, alturaTaza / 2, 0);
    taza.add(asaTaza);

    let radioBotella = 3;
    let alturaCuerpoBotella = 14;
    let radioCuelloBotella = 1.2;
    let alturaCuelloBotella = 5;
    let colorBotella = 0x2e8b57;
    let materialBotella = new THREE.MeshStandardMaterial({ color: colorBotella, roughness: 0.1, metalness: 0.1 });
    let botella = new THREE.Object3D();
    let cuerpoBotella = new THREE.Mesh(new THREE.CylinderGeometry(radioBotella, radioBotella, alturaCuerpoBotella), materialBotella);
    cuerpoBotella.position.y = alturaCuerpoBotella / 2;
    botella.add(cuerpoBotella);
    let cuelloBotella = new THREE.Mesh(new THREE.CylinderGeometry(radioCuelloBotella, radioCuelloBotella, alturaCuelloBotella), materialBotella);
    cuelloBotella.position.y = alturaCuerpoBotella + alturaCuelloBotella / 2;
    botella.add(cuelloBotella);

    let radioVela = 2.5;
    let alturaVela = 14;
    let radioLlama = 1.2;
    let alturaLlama = 4;
    let colorVela = 0xf5e6b3;
    let vela = new THREE.Object3D();
    let cuerpoVela = new THREE.Mesh(new THREE.CylinderGeometry(radioVela, radioVela, alturaVela), new THREE.MeshStandardMaterial({ color: colorVela, roughness: 0.9, metalness: 0 }));
    cuerpoVela.position.y = alturaVela / 2;
    vela.add(cuerpoVela);
    let llamaVela = new THREE.Mesh(new THREE.ConeGeometry(radioLlama, alturaLlama), new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.8, roughness: 1, metalness: 0 }));
    llamaVela.position.y = alturaVela + alturaLlama / 2;
    vela.add(llamaVela);

    let radioSuperiorJarron = 5;
    let radioInferiorJarron = 3.5;
    let alturaJarron = 18;
    let colorJarron = 0x3366cc;
    let jarron = new THREE.Object3D();
    jarron.add(new THREE.Mesh(new THREE.CylinderGeometry(radioSuperiorJarron, radioInferiorJarron, alturaJarron), new THREE.MeshStandardMaterial({ color: colorJarron, roughness: 0.25, metalness: 0.1 })));
    jarron.children[0].position.y = alturaJarron / 2;

    // Lámpara de mesa: base, pie, pantalla y luz puntual; se clona en cada mesa donde se use
    let radioBaseLampara = 6;
    let alturaBaseLampara = 2;
    let radioPieLampara = 1;
    let alturaPieLampara = 22;
    let radioInferiorPantallaLampara = 9;
    let radioSuperiorPantallaLampara = 5;
    let alturaPantallaLampara = 12;
    let colorLuzLampara = 0xffd9a0;
    let intensidadLuzLampara = 0.9;
    let distanciaLuzLampara = 350;
    let materialMetalLampara = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.6 });
    let materialPantallaLampara = new THREE.MeshStandardMaterial({ color: 0xfff0cc, emissive: 0xffc870, emissiveIntensity: 0.9, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    let lampara = new THREE.Object3D();
    let baseLampara = new THREE.Mesh(new THREE.CylinderGeometry(radioBaseLampara, radioBaseLampara, alturaBaseLampara), materialMetalLampara);
    baseLampara.position.y = alturaBaseLampara / 2;
    lampara.add(baseLampara);
    let pieLampara = new THREE.Mesh(new THREE.CylinderGeometry(radioPieLampara, radioPieLampara, alturaPieLampara), materialMetalLampara);
    pieLampara.position.y = alturaBaseLampara + alturaPieLampara / 2;
    lampara.add(pieLampara);
    let pantallaLampara = new THREE.Mesh(new THREE.CylinderGeometry(radioSuperiorPantallaLampara, radioInferiorPantallaLampara, alturaPantallaLampara, 16, 1, true), materialPantallaLampara);
    pantallaLampara.position.y = alturaBaseLampara + alturaPieLampara + alturaPantallaLampara / 2 - 4;
    lampara.add(pantallaLampara);
    let luzLampara = new THREE.PointLight(colorLuzLampara, intensidadLuzLampara, distanciaLuzLampara, 2);
    luzLampara.position.y = pantallaLampara.position.y;
    lampara.add(luzLampara);

    // Lámparas sobre escritorio, mesilla, aparador y encimera (apartadas de los objetos tirables)
    let margenLampara = 15;
    let lamparasMesa = [
      [escritorio.position.x + anchoEscritorio / 2 - margenLampara, alturaEscritorio, escritorio.position.z],
      [mesilla.position.x, alturaMesilla, mesilla.position.z - 8],
      [aparador.position.x, alturaAparador, aparador.position.z + largoAparador / 2 - margenLampara],
      [encimeraFondo.position.x + anchoEncimeraFondo / 2 - margenLampara, alturaEncimera, encimeraFondo.position.z]
    ];
    for (let i = 0; i < lamparasMesa.length; i++) {
      let lamparaClon = lampara.clone();
      lamparaClon.position.set(lamparasMesa[i][0], lamparasMesa[i][1], lamparasMesa[i][2]);
      casa.add(lamparaClon);
    }

    // Bombilla de techo del pasillo (sin sombras para no gastar rendimiento)
    let radioBombilla = 6;
    let alturaBombilla = altoInterior - radioBombilla - 4;
    let intensidadBombilla = 0.8;
    let distanciaBombilla = 450;
    let bombillaPasillo = new THREE.Mesh(new THREE.SphereGeometry(radioBombilla, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0cc }));
    bombillaPasillo.position.set(xComedor - 250, alturaBombilla, 0);
    casa.add(bombillaPasillo);
    let luzPasillo = new THREE.PointLight(colorLuzLampara, intensidadBombilla, distanciaBombilla, 2);
    luzPasillo.position.copy(bombillaPasillo.position);
    casa.add(luzPasillo);

    // Cada objeto se coloca en el borde de una superficie con su centro justo sobre el filo
    // y se empuja hacia fuera en la dirección libre del borde (dirX, dirZ)
    // Puntos: [plantilla, color al romperse, x, y de la superficie, z, dirX, dirZ]
    let margenBorde = 1;
    let alturaEstanteSuperior = separacionVerticalEstantes * numeroEstantes;
    let tablaSuperior = estanteria.children[numeroEstantes];
    // Borde libre de los estantes: el lado contrario a la pared (-x local)
    let bordeEstanteLocal = new THREE.Vector3(
      tablaSuperior.position.x - profundidadEstante / 2 + margenBorde,
      alturaEstanteSuperior,
      tablaSuperior.position.z
    );
    let direccionBordeEstanteLocal = new THREE.Vector3(-1, 0, 0);
    let bordesEstanteria = [];
    let estanteriasConObjeto = [estanteria, estanteriaDespacho, estanteriaBaño, bibliotecaIzq];
    for (let i = 0; i < estanteriasConObjeto.length; i++) {
      estanteriasConObjeto[i].updateMatrixWorld(true);
      bordesEstanteria.push([
        estanteriasConObjeto[i].localToWorld(bordeEstanteLocal.clone()),
        direccionBordeEstanteLocal.clone().transformDirection(estanteriasConObjeto[i].matrixWorld)
      ]);
    }
    let puntosTirables = [
      [libro, colorLibro, bordesEstanteria[0][0].x, alturaEstanteSuperior, bordesEstanteria[0][0].z, bordesEstanteria[0][1].x, bordesEstanteria[0][1].z],
      [vela, colorVela, mesilla.position.x, alturaMesilla, mesilla.position.z + profundidadMesilla / 2 - margenBorde, 0, 1],
      [taza, colorTaza, ropero.position.x - anchoRopero / 2 + margenBorde, alturaRopero, ropero.position.z, -1, 0],
      [botella, colorBotella, bordesEstanteria[2][0].x, alturaEstanteSuperior, bordesEstanteria[2][0].z, bordesEstanteria[2][1].x, bordesEstanteria[2][1].z],
      [botella, colorBotella, nevera.position.x + anchoNevera / 2 - margenBorde, alturaNevera, nevera.position.z, 1, 0],
      [taza, colorTaza, encimeraFondo.position.x, alturaEncimera, encimeraFondo.position.z - profundidadEncimeraFondo / 2 + margenBorde, 0, -1],
      [taza, colorTaza, escritorio.position.x, alturaEscritorio, escritorio.position.z - profundidadEscritorio / 2 + margenBorde, 0, -1],
      [libro, colorLibro, bordesEstanteria[1][0].x, alturaEstanteSuperior, bordesEstanteria[1][0].z, bordesEstanteria[1][1].x, bordesEstanteria[1][1].z],
      [jarron, colorJarron, aparador.position.x - profundidadAparador / 2 + margenBorde, alturaAparador, aparador.position.z, -1, 0],
      [libro, colorLibro, bordesEstanteria[3][0].x, alturaEstanteSuperior, bordesEstanteria[3][0].z, bordesEstanteria[3][1].x, bordesEstanteria[3][1].z]
    ];
    for (let i = 0; i < puntosTirables.length; i++) {
      let punto = puntosTirables[i];
      let objetoTirable = punto[0].clone();
      objetoTirable.position.set(punto[2], punto[3], punto[4]);
      objetoTirable.traverse(function (parte) {
        if (parte.isMesh) {
          parte.castShadow = true;
        }
      });
      scene.add(objetoTirable);
      objetosTirables.push({
        objeto: objetoTirable,
        color: punto[1],
        estado: 'quieto',
        alturaInicio: punto[3],
        direccionX: punto[5],
        direccionZ: punto[6],
        velocidadVertical: 0,
        velocidadX: 0,
        velocidadZ: 0
      });
    }

    // Dueño: una caja que empieza en la entrada del pasillo
    dueño = new THREE.Group();
    dueño.position.set(rutaDueño[0][0], 0, rutaDueño[0][1]);
    scene.add(dueño);
    cargarModeloDueño();

    // Interfaz: contador y aviso de tirar
    contadorTirados = document.createElement('div');
    contadorTirados.style.cssText = 'position:fixed;top:16px;right:16px;color:#fff;font:20px sans-serif;text-shadow:0 0 4px #000';
    document.body.appendChild(contadorTirados);
    avisoTirar = document.createElement('div');
    avisoTirar.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);color:#fff;font:24px sans-serif;text-shadow:0 0 4px #000;display:none';
    avisoTirar.textContent = 'Pulsa E para tirar';
    document.body.appendChild(avisoTirar);
    mensajeDueño = document.createElement('div');
    mensajeDueño.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);color:#ff6666;font:28px sans-serif;text-shadow:0 0 4px #000;display:none';
    document.body.appendChild(mensajeDueño);
    contadorTirados.textContent = 'Objetos tirados: 0/' + objetosTirables.length;

    casa.traverse(function (parte) {
      if (parte.isMesh) {
        parte.castShadow = true;
        parte.receiveShadow = true;
      }
    });
    scene.add(casa);
    casa.updateMatrixWorld(true);
    objetosColision.push(casa);
    // Añadir suelo 
    let repeticionesSueloX = 4;
    let repeticionesSueloZ = 6;
    let texturaSuelo = texturaMadera.clone();
    texturaSuelo.wrapS = texturaSuelo.wrapT = THREE.MirroredRepeatWrapping;
    texturaSuelo.needsUpdate = true;
    texturaSuelo.repeat.set(repeticionesSueloX, repeticionesSueloZ);
    let materialSuelo = new THREE.MeshStandardMaterial({ map: texturaSuelo, color: 0xa08868, roughness: 0.8, metalness: 0 });
    let geometriaSuelo = new THREE.PlaneGeometry(largoCasa, anchoCasa);
    let suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
    suelo.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    suelo.receiveShadow = true;
    scene.add(suelo);
    superficiesCaminables.push(suelo);

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
  moverGato(delta);
  if (mezcladorDueño) {
    mezcladorDueño.update(delta);
  }
  if (mixer) {
    mixer.update(delta);
  }
  camaraMapa.position.x = gatoRaiz.position.x
  camaraMapa.position.z = gatoRaiz.position.z
}

function render()
{
	requestAnimationFrame( render );
  if (recursosPendientes > 0) {
    return;
  }
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
  renderer.render(scene, camaraMapa);
  renderer.setScissorTest(false);
}