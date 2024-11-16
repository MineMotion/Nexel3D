const transformControls = new THREE.TransformControls(camera, renderer.domElement);
transformControls.setSpace('local');
scene.add(transformControls);

transformControls.addEventListener('dragging-changed', function(event) {
  controls.enableRotate = !event.value;
});

transformControls.traverse((child) => {
  if (child.isMesh || child.isObject3D) {
    child.userData.transformControlElement = true;
    child.userData.noSeleccionable = true;
    child.userData.exclude = true;
  }
});

function getSelectedObject() {
  return scene.children.find(obj => obj.userData.SelectedObject === true && !obj.userData.locked);
}

/* Transform Buttons */
document.getElementById('pos').addEventListener('click', function() {
  transformControls.setMode('translate');
  updateAttachment();
  if (transformControls.mode === 'translate') {
    this.style.backgroundColor = 'var(--accent-secondary)';
  }
});

transformControls.addEventListener('change', function() {
  if (transformControls.mode !== 'translate') {
    document.getElementById('pos').style.backgroundColor = '';
  }
});

document.getElementById('rot').addEventListener('click', function() {
  transformControls.setMode('rotate');
  updateAttachment();
  if (transformControls.mode === 'rotate') {
    this.style.backgroundColor = 'var(--accent-secondary)';
  }
});

transformControls.addEventListener('change', function() {
  if (transformControls.mode !== 'rotate') {
    document.getElementById('rot').style.backgroundColor = '';
  }
});

document.getElementById('scl').addEventListener('click', function() {
  transformControls.setMode('scale');
  updateAttachment();
  if (transformControls.mode === 'scale') {
    this.style.backgroundColor = 'var(--accent-secondary)';
  }
});

transformControls.addEventListener('change', function() {
  if (transformControls.mode !== 'scale') {
    document.getElementById('scl').style.backgroundColor = '';
  }
});

// Snap functionality
document.addEventListener('DOMContentLoaded', () => {
  const snapButton = document.getElementById('snap-toggle');
  const snapImage = document.getElementById('snap-img');
  let snapEnabled = false;
  let snapValue = 1;

  let clickCount = 0;
  const doubleClickTime = 50;

  snapButton.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
      setTimeout(() => {
        if (clickCount === 1) {
          snapEnabled = !snapEnabled;
          if (snapEnabled) {
            snapImage.src = '/icons/snap_on.svg';
            snapButton.style.backgroundColor = 'var(--accent-secondary)';
          } else {
            snapImage.src = '/icons/snap_off.svg';
            snapButton.style.backgroundColor = '';
          }
        }
        clickCount = 0;
      }, doubleClickTime);
    } else if (clickCount === 2) {
      const newSnapValue = prompt('Ingrese el valor de Snap:', snapValue);
      if (newSnapValue !== null && !isNaN(newSnapValue)) {
        snapValue = parseFloat(newSnapValue);
        alert(`Nuevo valor de Snap: ${snapValue}`);
      }
      clickCount = 0;
    }
  });

  transformControls.addEventListener('objectChange', () => {
    const selectedObject = getSelectedObject();
    if (selectedObject) {
      const gridSize = snapValue;

      if (snapEnabled && (transformControls.mode === 'translate' || transformControls.mode === 'rotate')) {
        const position = selectedObject.position;
        selectedObject.position.set(
          Math.round(position.x / gridSize) * gridSize,
          Math.round(position.y / gridSize) * gridSize,
          Math.round(position.z / gridSize) * gridSize
        );

        const rotation = selectedObject.rotation;
        selectedObject.rotation.set(
          Math.round(rotation.x / gridSize) * gridSize,
          Math.round(rotation.y / gridSize) * gridSize,
          Math.round(rotation.z / gridSize) * gridSize
        );
      }

      if (snapEnabled && transformControls.mode === 'scale') {
        const scale = selectedObject.scale;
        selectedObject.scale.set(
          Math.round(scale.x / gridSize) * gridSize,
          Math.round(scale.y / gridSize) * gridSize,
          Math.round(scale.z / gridSize) * gridSize
        );
      }
    }
  });
});

function updateAttachment() {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject && !obj.userData.locked);

  checkTransformControlsSize();

  if (selectedObject) {
    selectedObject.updateMatrixWorld(true);

    if (selectedObject.parent) {
      transformControls.attach(selectedObject);
      selectedObject.updateMatrixWorld(true);
    } else {
      transformControls.attach(selectedObject);
    }
  } else {
    transformControls.detach(); // Desvincula si no hay objeto seleccionado
  }
}

function checkTransformControlsSize() {
  if (window.innerWidth > window.innerHeight) {
    transformControls.setSize(2.1);
  } else {
    transformControls.setSize(1);
  }
}

window.addEventListener('resize', checkTransformControlsSize);