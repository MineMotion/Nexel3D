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

/* Mesh */
function addCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const cube = new THREE.Mesh(geometry, material);
  
  cube.name = "cube";
  cube.position.set(0, 0, 0);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  updateOutliner()
}
function addSphere() {
  const geometry = new THREE.SphereGeometry(0.5, 16, 10);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF});
  const sphere = new THREE.Mesh(geometry, material);

  sphere.name = "sphere";
  sphere.position.set(0, 0, 0);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);
  updateOutliner()
}
function addPlane() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);

  plane.name = "plane";
  plane.position.set(0, 0, 0);
  plane.rotation.x = Math.PI / -2;
  plane.receiveShadow = true;
  scene.add(plane);
  updateOutliner()
}
function addCylinder() {
  const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const cylinder = new THREE.Mesh(geometry, material);

  cylinder.name = "cylinder";
  cylinder.position.set(0, 0, 0);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  scene.add(cylinder);
  updateOutliner()
}
function addPyramid() {
  const geometry = new THREE.ConeGeometry(1, 1.5, 4);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const pyramid = new THREE.Mesh(geometry, material);

  pyramid.castShadow = true;
  pyramid.receiveShadow = true;
  pyramid.name = "pyramid";
  pyramid.position.set(0, 0, 0);
  scene.add(pyramid);
  updateOutliner()
}
function addToroid() {
  const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const toroid = new THREE.Mesh(geometry, material);

  toroid.name = "toroid";
  toroid.position.set(0, 0, 0);
  scene.add(toroid);
  toroid.castShadow = true;
  toroid.receiveShadow = true;
  updateOutliner()
}
function addCircle() {
  const geometry = new THREE.CircleGeometry(1, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const circle = new THREE.Mesh(geometry, material);

  circle.name = "circle";
  circle.position.set(0, 0, 0);
  scene.add(circle);
  circle.castShadow = true;
  circle.receiveShadow = true;
  updateOutliner()
}
function addMirror() {
  const mirrorGeometry = new THREE.PlaneGeometry(5, 5);
  const mirror = new THREE.Reflector(mirrorGeometry, {
    clipBias: 0,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xaaaaaa,
  });

  mirror.position.set(0, 0, 0);
  mirror.rotation.set(-Math.PI / 2, 0, 0);
  mirror.name = "mirror object"
  scene.add(mirror);
  updateOutliner()
}
function addMonkey() {
  const loader = new THREE.OBJLoader();
  loader.load('assets/suzanne.obj', function(object) {
    object.scale.set(0.5, 0.5, 0.5);
    object.position.set(0, 0, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: false,
    });

    object.traverse(function(child) {
      if (child.isMesh) {
        child.material = material;
        scene.add(child);
      }
    });
  });
}

/* Light */
function addPointLight() {
  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 5, 0);
  pointLight.castShadow = true;
  pointLight.name = 'Point Light';
  const lightHelper = new THREE.PointLightHelper(pointLight, 0.5);
  scene.add(pointLight);
  scene.add(lightHelper);
  updateOutliner()
}
function addDirectionalLight() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(7, 4, 3);
  directionalLight.castShadow = true;
  directionalLight.name = 'Sun Light';
  scene.add(directionalLight);
}
function addSpotLight() {
  const spotLight = new THREE.SpotLight(0xffffff, 1);
  spotLight.position.set(10, 10, 10);
  spotLight.castShadow = true;
  spotLight.angle = Math.PI / 1.1;
  spotLight.distance = 50;
  spotLight.name = 'Spot Light'
  scene.add(spotLight);
  updateOutliner()
 

  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  scene.add(spotLightHelper);
}
function addAmbientLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  ambientLight.name = 'Ambient Light';
  scene.add(ambientLight);
  updateOutliner()
}
function addHemisphereLight() {
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x0000ff, 0.5);
  hemisphereLight.position.set(0, 0, 0);
  hemisphereLight.castShadow = false;
  hemisphereLight.name = 'Hemisphere Light';
  scene.add(hemisphereLight);

  const helper = new THREE.HemisphereLightHelper(hemisphereLight, 1);
  scene.add(helper);
  updateOutliner()
}
function addRectAreaLight() {
  const rectAreaLight = new THREE.RectAreaLight(0xffffff, 1, 5, 5);
  rectAreaLight.position.set(0, 2, 0);
  rectAreaLight.rotation.x = Math.PI / 2;
  rectAreaLight.castShadow = false;
  rectAreaLight.name = 'Area Light';
  scene.add(rectAreaLight);

  const rectAreaLightHelper = new THREE.RectAreaLightHelper(rectAreaLight);
  scene.add(rectAreaLightHelper);
  updateOutliner();
}

/* Line */
function addLine() {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const points = [
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(5, 0, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  line.name = 'Line'
  scene.add(line);
  updateOutliner()
}
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
  line.computeLineDistances();
  scene.add(line);
  updateOutliner()
}
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
  lineSegments.name = 'Line Segments'
  scene.add(lineSegments);
  updateOutliner()
}
function addThickLine() {
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    linewidth: 4,
    scale: 1,
    dashSize: 3,
    gapSize: 1 
  });

  const points = [
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(5, 0, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const thickLine = new THREE.Line(geometry, material);
  thickLine.computeLineDistances();
  thickLine.name = 'Thick Line'
  scene.add(thickLine);
  updateOutliner()
}
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

  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)); 
  const curveLine = new THREE.Line(geometry, material);
  curveLine.name = 'Curve Line'
  scene.add(curveLine);
  updateOutliner()
}
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

  const arrowHead = new THREE.ConeGeometry(arrowHeadWidth, arrowHeadLength, 3);
  const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const arrowHeadMesh = new THREE.Mesh(arrowHead, arrowHeadMaterial);
  arrowHeadMesh.position.set(arrowLength, 0, 0);
  arrowHeadMesh.rotation.z = Math.PI / 2;
  arrowHead.name = 'Arrow'
  scene.add(arrowLine);
  scene.add(arrowHeadMesh);
  updateOutliner()
}


/* Scene Add */
addDirectionalLight();
addCube();