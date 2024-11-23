/* HDRI */
const hdrTextureLoader = new THREE.RGBELoader();
const loadHdriButton = document.getElementById('loadHdriButton');
const loadHdriInput = document.getElementById('loadHdri');
const toggleHdriCheckbox = document.getElementById('toggleHdri');
let hdrTexture = null;
let envMap = null;
let originalBackgroundColor = scene.background;
loadHdriButton.addEventListener('click', function() {
  loadHdriInput.click();
});
loadHdriInput.addEventListener('change', function(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function(e) {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'hdr') {
        const arrayBuffer = e.target.result;

        hdrTextureLoader.load(URL.createObjectURL(new Blob([arrayBuffer])), function(texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          hdrTexture = texture;
          scene.background = hdrTexture;
          scene.environment = hdrTexture;

          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;

          const intensity = 0.2;

          scene.environment = envMap;
          scene.background = envMap;

          scene.traverse(function(child) {
            if (child.isMesh && !child.userData.exclude) {
              child.material = new THREE.MeshStandardMaterial({
                envMap: envMap,
                envMapIntensity: intensity,
              });
              child.material.needsUpdate = true;
            }
          });

          toggleHdriCheckbox.checked = true;
        });
      } else if (fileExtension === 'jpg' || fileExtension === 'png') {
        const textureLoader = new THREE.TextureLoader();

        textureLoader.load(URL.createObjectURL(file), function(texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          scene.background = texture;
          scene.environment = null;

          scene.traverse(function(child) {
            if (child.isMesh && !child.userData.exclude) {
              child.material.envMap = null;
            }
          });

          toggleHdriCheckbox.checked = false;
        });
      }
    };

    reader.readAsArrayBuffer(file);
  }
});
toggleHdriCheckbox.addEventListener('change', function() {
  if (toggleHdriCheckbox.checked && hdrTexture) {
    scene.background = hdrTexture;
    scene.environment = envMap;

    scene.traverse(function(child) {
      if (child.isMesh && !child.userData.exclude) {
        child.material.envMap = envMap;
      }
    });
  } else {
    scene.background = originalBackgroundColor;
    scene.environment = null;

    scene.traverse(function(child) {
      if (child.isMesh && !child.userData.exclude) {
        child.material.envMap = null;
      }
    });
  }
});
 
/* Render Image */
let hiddenObjects = [];
function renderImage() {
  scene.traverse((object) => {
    if (object instanceof THREE.GridHelper || object instanceof THREE.Bone || object instanceof THREE.AxesHelper || object instanceof THREE.TransformControls || object.userData.id === 'bone' || object.userData.id === 'exclude') {
      if (object.visible) {
        hiddenObjects.push(object);
      }
      object.visible = false;
    }
  });

  renderer.render(scene, camera);

  const imgData = renderer.domElement.toDataURL("image/png");

  const imgElement = document.createElement('img');
  imgElement.src = imgData;

  const renderedImageContainer = document.getElementById('renderedImage');
  renderedImageContainer.innerHTML = '';
  renderedImageContainer.appendChild(imgElement);

  setTimeout(() => {
    hiddenObjects.forEach((object) => {
      object.visible = true;
    });
    hiddenObjects = [];
  }, 10);
}

function saveRenderedImage() {
  const imgElement = document.getElementById('renderedImage').querySelector('img');

  if (imgElement) {
    const imgData = imgElement.src;
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'nexel_rendered_image.png';
    link.click();
  }
}
document.getElementById('saveRender').addEventListener('click', saveRenderedImage);