const transformControls = new THREE.TransformControls(camera, renderer.domElement);
scene.add(transformControls);

// Asegurarse de que el gizmo no interfiera con el OrbitControls
transformControls.addEventListener('dragging-changed', function(event) {
  controls.enableRotate = !event.value;
});

// Añadir un ID de 'exclude' a los objetos que usan TransformControls
transformControls.traverse((child) => {
  if (child.isMesh || child.isObject3D) {
    child.userData.transformControlElement = true;
    child.userData.noSeleccionable = true;
    child.userData.exclude = true; // Mantener 'exclude' para que no se muestre en el Outliner
  }
});

function getSelectedObject() {
  return scene.children.find(obj => obj.userData.SelectedObject === true);
}

document.getElementById('pos').addEventListener('click', function() {
  transformControls.setMode('translate');
  updateAttachment();
});

document.getElementById('rot').addEventListener('click', function() {
  transformControls.setMode('rotate');
  updateAttachment();
});

document.getElementById('scl').addEventListener('click', function() {
  transformControls.setMode('scale');
  updateAttachment();
});

document.getElementById('cam').addEventListener('click', function() {
  transformControls.detach();
  controls.enableRotate = true;
});

function updateAttachment() {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject && !obj.userData.locked);

  if (selectedObject) {
    // Asegurarse de que la matriz del objeto seleccionado se actualice correctamente
    selectedObject.updateMatrixWorld(true);

    // Forzar la vinculación de los controles al objeto hijo si tiene un padre
    if (selectedObject.parent) {
      // Si el objeto tiene un padre, aplicar TransformControls al objeto hijo
      transformControls.attach(selectedObject);
      selectedObject.updateMatrixWorld(true); // Asegurarse de que la matriz del hijo esté actualizada
    } else {
      // Si el objeto es un objeto independiente, aplicar TransformControls normalmente
      transformControls.attach(selectedObject);
    }
  } else {
    //transformControls.detach(); // Si no hay objeto seleccionado, desvincular los controles
  }
}

// Escucha para cuando se hace clic en el Outliner (cuando se selecciona un objeto)
document.getElementById('outlinerDiv').addEventListener('click', () => {
  const selectedObject = getSelectedObject();

  if (selectedObject) {
    // Forzar la actualización de la matriz mundial para los hijos y padres
    selectedObject.updateMatrixWorld(true);

    // Forzar la vinculación del control de transformación al objeto seleccionado
    transformControls.attach(selectedObject);
  }
});