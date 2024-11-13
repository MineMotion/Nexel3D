/* Outliner */
function updateOutliner() {
  const outlinerDiv = document.getElementById('outlinerDiv');
  outlinerDiv.innerHTML = '';

  function addObjectToOutliner(object, container) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('outliner-item');
    itemDiv.style.minWidth = '250px';

    let objectType = '';
    let objectName = object.name || 'Unnamed';

    if (object instanceof THREE.Light) {
      objectType = 'Light: ';
    } else if (object instanceof THREE.Camera) {
      objectType = 'Camera: ';
    } else if (object instanceof THREE.Mesh) {
      objectType = 'Mesh: ';
    } else if (object instanceof THREE.Group) {
      objectType = 'Group: ';
    } else if (object instanceof THREE.Bone) {
      objectType = 'Bone: ';
    } else if (object instanceof THREE.SkinnedMesh) {
      objectType = 'Skeleton: ';
    } else if (object instanceof THREE.Object3D) {
      objectType = 'Object3D: ';
    } else {
      objectType = 'Unknown: ';
    }

    itemDiv.textContent = objectType + objectName;
    itemDiv.style.backgroundColor = object.userData.SelectedObject ? 'orange' : '';

    itemDiv.addEventListener('click', () => {
      transformControls.detach();
      const isSelected = object.userData.SelectedObject;

      if (isSelected) {
        object.userData.SelectedObject = false;
      } else {
        scene.traverse((otherObject) => {
          otherObject.userData.SelectedObject = false;
        });
        object.userData.SelectedObject = true;
        transformControls.attach(object);
      }

      updateOutliner();
    });

    container.appendChild(itemDiv);

    if (object.children && object.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.style.marginLeft = '20px';

      object.children.forEach((child) => {
        addObjectToOutliner(child, childrenContainer);
      });

      container.appendChild(childrenContainer);
    }
  }

  scene.children.forEach((object) => {
    if (!object.userData.exclude) {
      addObjectToOutliner(object, outlinerDiv);
    }
  });
}

/* Group Selection */
document.getElementById('createGroupBtn').addEventListener('click', () => {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);

  const group = new THREE.Group();
  group.name = 'NuevoGrupo';

  if (selectedObject) {
    group.add(selectedObject);
    selectedObject.userData.SelectedObject = false;
    console.log(`El objeto ${selectedObject.name} ha sido agregado al grupo.`);
  } else {
    console.log('No hay objeto seleccionado. Se ha creado un grupo vacío.');
  }

  scene.add(group);

  updateOutliner();
});

/* Parent Selection */
let selectedForParent = null;

function setParent() {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);

  if (selectedObject) {
    selectedForParent = selectedObject;
    console.log(`Objeto seleccionado para ser el hijo: ${selectedForParent.name}`);
  } else {
    console.log('No hay objeto seleccionado para ser hijo.');
  }
}

scene.children.forEach((object) => {
  if (object.userData.SelectedObject) {
    object.addEventListener('click', () => {
      const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);

      if (selectedObject && selectedForParent && selectedObject !== selectedForParent) {
        selectedObject.add(selectedForParent);
        selectedForParent.userData.SelectedObject = false; // Desmarca el objeto hijo después de añadirlo
        console.log(`${selectedForParent.name} ha sido agregado como hijo de ${selectedObject.name}`);

        selectedForParent = null; // Restablece la selección
        updateOutliner(); // Actualiza el outliner después de la operación
      }
    });
  }
});