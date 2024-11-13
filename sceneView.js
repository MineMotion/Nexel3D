/* Shadows */
const shadowToggle = document.getElementById('shadowToggle');

shadowToggle.addEventListener('change', (event) => {
  const castShadows = event.target.checked;

  pointLight.castShadow = castShadows ? true : false;
  directionalLight.castShadow = castShadows ? true : false;
  potLight.castShadow = castShadows ? true : false;
});


/* Lightning */
const lightingToggle = document.getElementById('lightingToggle');

lightingToggle.addEventListener('change', (event) => {
  const enableLighting = event.target.checked;

  scene.traverse((object) => {
    if (object.isLight && !(object instanceof THREE.AmbientLight)) {
      object.visible = enableLighting;
    }
  });
});

/* Textures */
const texturesToggle = document.getElementById('texturesToggle');

texturesToggle.addEventListener('change', (event) => {
  const enableTextures = event.target.checked;

  scene.traverse((object) => {
    if (object.isMesh) {
      object.traverse((child) => {
        if (child.isMesh) {
          if (enableTextures) {
            if (!child.material.originalMap) {
              child.material.originalMap = child.material.map;
            }
            child.material.map = child.material.originalMap;
          } else {
            child.material.originalMap = child.material.map;
            child.material.map = null;
          }
          child.material.needsUpdate = true;
        }
      });
    }
  });
});

/* Grid */
const gridToggle = document.getElementById('gridToggle');

gridToggle.addEventListener('change', (event) => {
  const showGrid = event.target.checked;
  gridHelper.visible = showGrid;
});

/* Axes */
const axesToggle = document.getElementById('axesToggle');
const axesHelper = new THREE.AxesHelper(1);
axesHelper.name = 'axesHelper';
axesHelper.userData.exclude = true;

if (axesToggle.checked) {
  scene.add(axesHelper);
}

axesToggle.addEventListener('change', (event) => {
  if (event.target.checked) {
    if (!scene.getObjectByName('axesHelper')) {
      scene.add(axesHelper);
    }
  } else {
    const helper = scene.getObjectByName('axesHelper');
    if (helper) {
      scene.remove(helper);
    }
  }
});

/* Wireframe */
const wireframeToggle = document.getElementById('wireframeToggle');

wireframeToggle.addEventListener('change', (event) => {
  const wireframeEnabled = event.target.checked;
  scene.traverse((object) => {
    if (object.isMesh) {
      object.material.wireframe = wireframeEnabled;
    }
  });
});


/* Skeleton */
const skeletonToggle = document.getElementById('skeletonToggle');

function toggleSkeleton() {
  scene.traverse((object) => {
    if (object.isMesh && object.skeleton) {
      if (object.helper) {
        scene.remove(object.helper);
        delete object.helper;
      } else {
        const helper = new THREE.SkeletonHelper(object);
        const material = new THREE.LineBasicMaterial({
          color: 0xFFA500,
          linewidth: 3,
          opacity: 1,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          vertexColors: false,
          wireframe: true,
          wireframeLinewidth: 1,
          fog: false,
          lights: true,
          dithering: false,
          flatShading: false,
          visible: true,
          clipShadows: false,
        });
        helper.material = material;
        object.helper = helper;
        scene.add(helper);
      }
    }
  });
}

skeletonToggle.addEventListener('change', () => {
  if (skeletonToggle.checked) {
    toggleSkeleton();
  } else {
    scene.traverse((object) => {
      if (object.isMesh && object.skeleton && object.helper) {
        scene.remove(object.helper);
        delete object.helper;
      }
    });
  }
});


/* Counters */
const countersToggle = document.getElementById('countersToggle');
const counterContainer = document.getElementById('counterContainer');

countersToggle.addEventListener('change', (event) => {
  counterContainer.style.display = event.target.checked ? 'flex' : 'none';
});


/* Full HD */
const fullHdToggle = document.getElementById('fullHdToggle');

fullHdToggle.addEventListener('change', (event) => {
  if (event.target.checked) {
    const width = Math.min(1920, window.innerWidth);
    const height = Math.min(1080, window.innerHeight);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
  } else {
    const width = Math.min(1280, window.innerWidth);
    const height = Math.min(720, window.innerHeight);
    renderer.setSize(width, height);
    renderer.setPixelRatio(0.9);
  }
});


