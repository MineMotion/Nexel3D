/* Delete */
function deleteSel() {
  const selectedObjects = [];
  scene.traverse((object) => {
    if (object.userData.SelectedObject === true) {
      selectedObjects.push(object);
    }
  });

  selectedObjects.forEach((object) => {
    if (object.edges) scene.remove(object.edges); // Eliminar outline si existe
    if (object.helper) scene.remove(object.helper); // Eliminar helper si existe

    if (object.parent) {
      object.parent.remove(object);
    } else {
      scene.remove(object);
    }

    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((mat) => mat.dispose());
      } else {
        object.material?.dispose();
      }
    } else if (object instanceof THREE.Group) {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }

    transformControls.detach();
  });

  updateOutliner();
}

/* Duplicate */
function duplicateSel() {
  const selectedObjects = [];

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObjects.push(object);
    }
  });

  selectedObjects.forEach((object) => {
    let clonedObject;

    if (object instanceof THREE.Mesh || object instanceof THREE.Group || object instanceof THREE.Light || object instanceof THREE.Object3D) {
      clonedObject = object.clone();

      if (clonedObject instanceof THREE.Mesh) {
        clonedObject.geometry = object.geometry.clone();
        clonedObject.material = object.material;
      }

      clonedObject.userData.SelectedObject = false;
      clonedObject.position.copy(object.position);

      let baseName = object.name || "Object";
      let nameMatch = baseName.match(/(.*?)(\d+)?$/);
      let base = nameMatch[1];
      let index = parseInt(nameMatch[2]) || 0;

      let newName;
      do {
        index += 1;
        newName = `${base}${index}`;
      } while (scene.getObjectByName(newName));

      clonedObject.name = newName;

      if (object.parent) {
        object.parent.add(clonedObject);
      } else {
        scene.add(clonedObject);
      }
    }
  });

  updateOutliner();
}

/* Group */
function groupSel() {
  const selectedObjects = [];
  let parentObject = null;
  const center = new THREE.Vector3();

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObjects.push(object);
      parentObject = object.parent;
      center.add(object.getWorldPosition(new THREE.Vector3()));
    }
  });

  const group = new THREE.Group();
  group.name = 'Group';

  if (selectedObjects.length > 0) {
    center.divideScalar(selectedObjects.length);

    selectedObjects.forEach((object) => {
      const localPosition = new THREE.Vector3();
      object.getWorldPosition(localPosition);
      object.userData.SelectedObject = false;

      scene.attach(object);
      group.add(object);
      object.position.copy(localPosition.sub(center));
    });

    group.position.copy(center);
  }

  if (parentObject) {
    parentObject.add(group);
  } else {
    scene.add(group);
  }

  updateOutliner();
}

/* Hide */
function hideSel() {
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      object.visible = !object.visible;
    }
  });
}

/* Rename */
function renameSel() {
  let selectedObject = null;

  // Recorre toda la jerarquía para encontrar el objeto seleccionado
  scene.traverse((obj) => {
    if (obj.userData.SelectedObject) {
      selectedObject = obj;
    }
  });

  if (selectedObject) {
    const newName = prompt('Introduce un nuevo nombre para el objeto:', selectedObject.name || 'Unnamed');
    if (newName && newName.trim() !== '') {
      const trimmedName = newName.trim();

      // Verifica si el nombre ya existe en la escena
      let isNameTaken = false;
      scene.traverse((obj) => {
        if (obj.name === trimmedName && obj !== selectedObject) {
          isNameTaken = true;
        }
      });

      if (isNameTaken) {
        alert(`El nombre "${trimmedName}" ya está en uso. Por favor, elige otro.`);
        return;
      }

      selectedObject.name = trimmedName;
      updateOutliner();
    }
  } else {
    alert('No hay ningún objeto seleccionado para renombrar.');
  }
}

/* Lock */
let lockIDCounter = 0;
function lockSel() {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);
  const lockButtonImage = document.getElementById('lock');
  const lockButton = lockButtonImage.closest('button');

  if (selectedObject) {
    if (!selectedObject.userData.locked) {
      lockIDCounter++;
      selectedObject.userData.lockID = lockIDCounter;
      selectedObject.userData.locked = true;

      selectedObject.traverse((child) => {
        child.userData.locked = true;
        child.userData.lockID = lockIDCounter;
      });

      transformControls.detach();
    } else {
      delete selectedObject.userData.lockID;
      selectedObject.userData.locked = false;

      selectedObject.traverse((child) => {
        child.userData.locked = false;
        delete child.userData.lockID;
      });

      transformControls.attach(selectedObject);
    }

    updateLockButton(selectedObject.userData.locked);
    updateOutliner();
  }
}
function updateLockButton(isLocked) {
  const lockButtonImage = document.getElementById('lock');
  const lockButton = lockButtonImage.closest('button');

  if (isLocked) {
    lockButtonImage.src = '/icons/locked.svg';
    lockButton.style.backgroundColor = 'var(--accent-secondary)';
  } else {
    lockButtonImage.src = '/icons/unlocked.svg';
    lockButton.style.backgroundColor = '';
  }
}