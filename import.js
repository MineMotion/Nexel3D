const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');

function showProgressBar() {
  progressBar.style.display = 'block';
}

function hideProgressBar() {
  progressBar.style.display = 'none';
}

importBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'gltf' || extension === 'glb') {
    importGLTF(file);
  } else if (extension === 'obj') {
    importOBJ(file);
  } else if (extension === 'fbx') {
    importFBX(file);
  } else {
    alert('Formato de archivo no soportado.');
  }
});

function updateProgressBar(event) {
  if (event.lengthComputable) {
    const percentComplete = (event.loaded / event.total) * 100;
    progress.style.width = percentComplete + '%';
    progress.textContent = Math.round(percentComplete) + '%';
  }
}

function resetProgressBar() {
  progress.style.width = '0%';
  progress.textContent = '0%';
}

function importGLTF(file) {
  showProgressBar();
  const reader = new FileReader();
  reader.onloadstart = resetProgressBar;
  reader.onprogress = updateProgressBar;
  reader.onload = function(e) {
    const contents = e.target.result;
    const loader = new THREE.GLTFLoader();
    loader.parse(contents, '', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.userData.SelectedObject = false;
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.needsUpdate = true;
        }
      });
      scene.add(gltf.scene);
    });
    resetProgressBar();
    hideProgressBar();
  };
  reader.onerror = function() {
    alert("Error al leer el archivo.");
    resetProgressBar();
    hideProgressBar();
  };
  reader.readAsArrayBuffer(file);
}

function importOBJ(file) {
  showProgressBar();
  const reader = new FileReader();
  reader.onloadstart = resetProgressBar;
  reader.onprogress = updateProgressBar;
  reader.onload = function(e) {
    const contents = e.target.result;
    const loader = new THREE.OBJLoader();
    const object = loader.parse(contents);
    object.traverse((child) => {
      if (child.isMesh) {
        child.userData.SelectedObject = false;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.needsUpdate = true;
      }
    });
    scene.add(object);
    resetProgressBar();
    hideProgressBar();
  };
  reader.onerror = function() {
    alert("Error al leer el archivo.");
    resetProgressBar();
    hideProgressBar();
  };
  reader.readAsText(file);
}

function importFBX(file) {
  showProgressBar();
  const reader = new FileReader();
  reader.onloadstart = resetProgressBar;
  reader.onprogress = updateProgressBar;
  reader.onload = function(e) {
    const contents = e.target.result;
    const loader = new THREE.FBXLoader();
    const object = loader.parse(contents);
    object.traverse((child) => {
      if (child.isMesh) {
        child.userData.SelectedObject = false;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.needsUpdate = true;
      }
    });
    scene.add(object);
    resetProgressBar();
    hideProgressBar();
  };
  reader.onerror = function() {
    alert("Error al leer el archivo.");
    resetProgressBar();
    hideProgressBar();
  };
  reader.readAsArrayBuffer(file);
}

// Cube
function addCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const cube = new THREE.Mesh(geometry, material);

  cube.name = "cube";
  cube.position.set(0, 0, 0);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
}

// Sphere
function addSphere() {
  const geometry = new THREE.SphereGeometry(0.5, 16, 10);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const sphere = new THREE.Mesh(geometry, material);

  sphere.name = "sphere";
  sphere.position.set(0, 1, 0);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);
}

// Plane
function addPlane() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);

  plane.name = "plane";
  plane.position.set(0, 0, 0);
  plane.rotation.x = Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);
}

// Toroid
function addToroid() {
  const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const toroid = new THREE.Mesh(geometry, material);

  toroid.name = "toroid";
  toroid.position.set(0, 0, 0);
  scene.add(toroid);
  toroid.castShadow = true;
  toroid.receiveShadow = true;
  
}

// Circle
function addCircle() {
  const geometry = new THREE.CircleGeometry(1, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const circle = new THREE.Mesh(geometry, material);

  circle.name = "circle";
  circle.position.set(0, 0, 0);
  scene.add(circle);
  circle.castShadow = true;
  circle.receiveShadow = true;
}

// Pyramid
function addPyramid() {
  const geometry = new THREE.ConeGeometry(1, 1.5, 4);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const pyramid = new THREE.Mesh(geometry, material);

  pyramid.castShadow = true;
  pyramid.receiveShadow = true;

  pyramid.name = "pyramid";
  pyramid.position.set(0, 0, 0);
  scene.add(pyramid);
}

// Cylinder
function addCylinder() {
  const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const cylinder = new THREE.Mesh(geometry, material);

  cylinder.name = "cylinder";
  cylinder.position.set(0, 0, 0);

  cylinder.castShadow = true;
  cylinder.receiveShadow = true;

  scene.add(cylinder);
}

// Point light
function addPointLight() {
  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 5, 0);
  pointLight.castShadow = true;

  const lightHelper = new THREE.PointLightHelper(pointLight, 0.5);
  scene.add(pointLight);
  scene.add(lightHelper);
}

// Directional light
function addDirectionalLight() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(7, 4, 3);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  directionalLight.name = 'Sun Light'
}

// Add Ambient light 
function addAmbientLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  hideSubmenus();
}

// Add Spot light 
function addSpotLight() {
  const spotLight = new THREE.SpotLight(0xffffff, 1);
  spotLight.position.set(10, 10, 10);
  spotLight.castShadow = true;
  spotLight.angle = Math.PI / 1.1;
  spotLight.distance = 50;
  scene.add(spotLight);

  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  scene.add(spotLightHelper);
}

// Add Hemisphere light
function addHemisphereLight() {
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x0000ff, 0.5);
  hemisphereLight.position.set(0, 0, 0);
  hemisphereLight.castShadow = true;
  scene.add(hemisphereLight);

  const helper = new THREE.HemisphereLightHelper(hemisphereLight, 1);
  scene.add(helper);
}

function addRectAreaLight() {
  const rectAreaLight = new THREE.RectAreaLight(0xffffff, 1, 5, 5);
  rectAreaLight.position.set(0, 2, 0);
  rectAreaLight.rotation.x = Math.PI / 2;
  rectAreaLight.castShadow = true;
  scene.add(rectAreaLight);

  const rectAreaLightHelper = new THREE.RectAreaLightHelper(rectAreaLight);
  scene.add(rectAreaLightHelper);
}

// Add Line
function addLine() {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const points = [
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(5, 0, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
}

// Add Dashed line 
function addDashedLine() {
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 3, // Tamaño de las rayas
    gapSize: 1, // Espaciado entre las rayas
  });
  const points = [
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(5, 0, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances(); // Necesario para las líneas discontinuas
  scene.add(line);
}

// Add Segment line 
function addLineSegments() {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const points = [
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(5, 0, 0),
    new THREE.Vector3(0, -5, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineSegments = new THREE.LineSegments(geometry, material);
  scene.add(lineSegments);
}

// Add Thick line 
function addThickLine() {
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    linewidth: 4, // Grosor de la línea
    scale: 1, // Factor de escala para las líneas
    dashSize: 3, // Tamaño de los segmentos de la línea
    gapSize: 1 // Espacio entre los segmentos
  });

  const points = [
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(5, 0, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const thickLine = new THREE.Line(geometry, material);
  thickLine.computeLineDistances(); // Necesario para las líneas discontinuas
  scene.add(thickLine);
}

// Add Curve line
function addCurve() {
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff
  });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(-2, 5, 0),
    new THREE.Vector3(2, -5, 0),
    new THREE.Vector3(5, 0, 0)
  ]);

  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)); // 50 segmentos para suavizar la curva
  const curveLine = new THREE.Line(geometry, material);
  scene.add(curveLine);
}

// Add Arrow line
function addArrow() {
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff
  });

  const arrowLength = 5;
  const arrowHeadLength = 1;
  const arrowHeadWidth = 0.5;

  const points = [
    new THREE.Vector3(0, 0, 0), // Punto inicial
    new THREE.Vector3(arrowLength, 0, 0) // Punto final
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const arrowLine = new THREE.Line(geometry, material);

  // Crear la cabeza de la flecha
  const arrowHead = new THREE.ConeGeometry(arrowHeadWidth, arrowHeadLength, 3);
  const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const arrowHeadMesh = new THREE.Mesh(arrowHead, arrowHeadMaterial);
  arrowHeadMesh.position.set(arrowLength, 0, 0);
  arrowHeadMesh.rotation.z = Math.PI / 2;

  // Añadir la línea y la cabeza de la flecha a la escena
  scene.add(arrowLine);
  scene.add(arrowHeadMesh);
}

addDirectionalLight()
addCube()