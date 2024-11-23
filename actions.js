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
    lockButtonImage.src = 'icons/locked.svg';
    lockButton.style.backgroundColor = 'var(--accent-secondary)';
  } else {
    lockButtonImage.src = 'icons/unlocked.svg';
    lockButton.style.backgroundColor = '';
  }
}

/* Parent */
const parentSelButton = document.getElementById('parentSel');
let selectedForParenting = null;
let isWaitingForParent = false;
function updateButtonStyle() {
  parentSelButton.style.backgroundColor = isWaitingForParent ? 'var(--accent-secondary)' : '';
}
function parentSel() {
  if (selectedForParenting) {
    let targetObject = null;

    scene.traverse((object) => {
      if (object.userData.SelectedObject && object !== selectedForParenting) {
        targetObject = object;
      }
    });

    if (!targetObject) {
      console.warn("No se ha encontrado un segundo objeto para parentar.");
      return;
    }

    const globalPosition = new THREE.Vector3();
    selectedForParenting.getWorldPosition(globalPosition);

    targetObject.add(selectedForParenting);

    const localPosition = targetObject.worldToLocal(globalPosition);
    selectedForParenting.position.copy(localPosition);

    deselectObject(selectedForParenting);
    deselectObject(targetObject);

    selectedForParenting = null;
    isWaitingForParent = false;
    updateButtonStyle();
    console.log("El objeto seleccionado ahora es hijo de:", targetObject);
  } else {
    scene.traverse((object) => {
      if (object.userData.SelectedObject) {
        selectedForParenting = object;
        isWaitingForParent = true;
        updateButtonStyle();
      }
    });
  }
}
parentSelButton.addEventListener('click', () => {
  parentSel();
  if (!isWaitingForParent) {
    console.log("Esperando el próximo objeto para parentar.");
  }
});

/* Fix */
function fixSel() {
  let selectedObject = null;

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObject = object;
    }
  });

  if (!selectedObject) {
    console.warn('No hay un objeto seleccionado.');
    return;
  }

  const scale = selectedObject.scale.clone();

  selectedObject.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.applyMatrix4(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z));
      child.geometry.computeBoundingSphere();
      child.geometry.computeBoundingBox();
    }
  });

  selectedObject.scale.set(1, 1, 1);

  deselectObject(); // Reinicia el outline al deseleccionar
}

/* Save Projects */
function saveProject() {
  const projectName = prompt("Ingrese el nombre del proyecto:");

  if (!projectName) return;

  // Crear objeto con los datos de la escena
  const projectData = {
    name: projectName,
    objects: [],
    materials: [],
    animations: [],
    timeline: getTimelineState(),
    buttonsState: getButtonsState(),
  };

  // Recorrer los objetos de la escena
  scene.traverse((object) => {
    if (object.type === "Mesh") {
      const objectData = {
        name: object.name,
        position: object.position.toArray(),
        rotation: object.rotation.toArray(),
        scale: object.scale.toArray(),
        material: getMaterialData(object.material),
      };
      projectData.objects.push(objectData);
    }
  });

  // Guardar el proyecto en IndexedDB
  const request = indexedDB.open("projectDB", 1);

  request.onsuccess = function(e) {
    const db = e.target.result;
    const transaction = db.transaction("projects", "readwrite");
    const store = transaction.objectStore("projects");

    const addRequest = store.add(projectData);
    addRequest.onsuccess = function() {
      alert("Proyecto guardado correctamente");
    };

    addRequest.onerror = function() {
      alert("Error al guardar el proyecto");
    };
  };

  request.onerror = function() {
    alert("Error al acceder a la base de datos");
  };
}
function getTimelineState() {
  return {
    currentTime: timeline.currentTime, // Suponiendo que tienes una variable 'timeline' que maneja la línea de tiempo
    keyframes: timeline.keyframes, // Todos los keyframes
  };
}
function getButtonsState() {
  const buttonsState = {};

  // Suponiendo que tienes botones con IDs específicos en tu interfaz
  document.querySelectorAll('button').forEach(button => {
    buttonsState[button.id] = {
      enabled: !button.disabled,
      text: button.textContent,
    };
  });

  return buttonsState;
}
function getMaterialData(material) {
  const materialData = {
    type: material.type,
    color: material.color ? material.color.getHex() : null,
    emissive: material.emissive ? material.emissive.getHex() : null,
    roughness: material.roughness,
    metalness: material.metalness,
    texture: material.map ? material.map.image.src : null,
  };

  return materialData;
}