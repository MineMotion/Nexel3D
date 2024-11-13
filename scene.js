// Variables globales
let container, camera, scene, renderer, controls, gridHelper;

// Inicialización
function init() {
  container = document.getElementById('container');

  // Crear la cámara
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);

  // Crear la escena
  scene = new THREE.Scene();
  scene.userData.exclude = true;
  
  // Color de fondo
  scene.background = new THREE.Color(0x292929);
  
  // Textura de fondo
  // const textureLoader = new THREE.TextureLoader();
  // const backgroundTexture = textureLoader.load('img');
  // scene.background = backgroundTexture;
  
  // Grid
  gridHelper = new THREE.GridHelper(30, 30);
  gridHelper.position.y -= 0.01;
  scene.add(gridHelper);
  gridHelper.userData.exclude = true;

  const positions = gridHelper.geometry.attributes.position.array;

  for (let i = 0; i < positions.length; i += 3) {
  if (positions[i] === 0) {
    gridHelper.geometry.attributes.color.setXYZ(i / 3, 117 / 255, 152 / 255, 1); // Azul claro
  }
  if (positions[i + 2] === 0) {
    gridHelper.geometry.attributes.color.setXYZ(i / 3, 255 / 255, 83 / 255, 83 / 255); // Rojo claro
  }
}

  gridHelper.geometry.attributes.color.needsUpdate = true;
  
  // Luz ambiental
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  ambientLight.userData.exclude = true;

  // Renderizador
  renderer = new THREE.WebGLRenderer({ antialias: true});

  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  container.appendChild(renderer.domElement);
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controles de la cámara
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.15;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI / 0;
  controls.minPolarAngle = 0;
  controls.enableKeys = true;
  controls.keyPanSpeed = 10;
  controls.enableZoom = true;
  controls.zoomSpeed = 1;
  controls.enableRotate = true;
  controls.rotateSpeed = 1;

  // Eventos de ventana
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}


// FPS Counter
