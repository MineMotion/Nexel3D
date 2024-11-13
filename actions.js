/* Delete */
function deleteSel() {
  const selectedObjects = [];
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObjects.push(object);
    }
  });

  selectedObjects.forEach((object) => {
    if (object instanceof THREE.Mesh) {
      if (object.edges) scene.remove(object.edges);
      if (object.helper) scene.remove(object.helper);
      scene.remove(object);
      object.geometry.dispose();
      object.material.dispose();
    }

    else if (object instanceof THREE.Group) {
      scene.remove(object);
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    }

    else if (object instanceof THREE.Light) {
      scene.remove(object);
    }

    else if (object instanceof THREE.Skeleton) {
      scene.remove(object.bones);
    }

    else if (object instanceof THREE.Object3D) {
      scene.remove(object);
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

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObjects.push(object);
      parentObject = object.parent;
    }
  });

  const group = new THREE.Group();
  group.name = 'NuevoGrupo';

  if (selectedObjects.length > 0) {
    selectedObjects.forEach((object) => {
      group.add(object);
      object.userData.SelectedObject = false;
    });

    if (parentObject) {
      parentObject.add(group);
      group.position.copy(selectedObjects[0].position);
    } else {
      scene.add(group);
    }
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
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);
  if (selectedObject) {
    const newName = prompt('Introduce un nuevo nombre para el objeto:', selectedObject.name);
    if (newName && newName.trim() !== '') {
      selectedObject.name = newName;
      updateOutliner();
    }
  }
}

/* Lock */
function lockSel() {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);
  if (selectedObject) {
    selectedObject.userData.locked = !selectedObject.userData.locked;

    selectedObject.traverse((child) => {
      child.userData.locked = selectedObject.userData.locked;
    });

    if (selectedObject.userData.locked) {
      transformControls.detach();
    } else {
      transformControls.attach(selectedObject);
    }

    updateOutliner();
  }
} 

/* Prefab */
const prefabs = loadPrefabsFromLocalStorage() || [];

function presetSel() {
  const selectedObject = scene.children.find(obj => obj.userData.SelectedObject);
  if (!selectedObject) return;
  const prefab = selectedObject.clone();
  prefab.userData.SelectedObject = false;
  prefabs.push(prefab);
  savePrefabsToLocalStorage();

  const presetMenu = document.getElementById("presetMenu");
  const presetOption = document.createElement("div");
  const presetIndex = prefabs.length - 1;

  presetOption.classList.add("submenu-option");
  presetOption.textContent = `Preset ${prefab.name || 'Object'} ${presetIndex + 1}`;
  presetOption.onclick = () => {
    addPrefabToScene(presetIndex);
    hideSubmenus();
  };

  presetMenu.appendChild(presetOption);
}

function addPrefabToScene(prefabIndex) {
  if (prefabIndex < 0 || prefabIndex >= prefabs.length) return;
  const prefabClone = prefabs[prefabIndex].clone();
  prefabClone.position.set(0, 0, 0);
  scene.add(prefabClone);
  updateOutliner();
}

function savePrefabsToLocalStorage() {
  const serializedPrefabs = prefabs.map(prefab => prefab.toJSON());
  localStorage.setItem('prefabs', JSON.stringify(serializedPrefabs));
}

function loadPrefabsFromLocalStorage() {
  const serializedPrefabs = JSON.parse(localStorage.getItem('prefabs'));
  if (serializedPrefabs) {
    return serializedPrefabs.map(data => new THREE.ObjectLoader().parse(data));
  }
  return [];
}

// Cargar prefabs al iniciar la aplicación
window.onload = () => {
  const loadedPrefabs = loadPrefabsFromLocalStorage();
  const presetMenu = document.getElementById("presetMenu");

  loadedPrefabs.forEach((prefab, index) => {
    const presetOption = document.createElement("div");
    presetOption.classList.add("submenu-option");
    presetOption.textContent = `Preset ${prefab.name || 'Object'} ${index + 1}`;
    presetOption.onclick = () => {
      addPrefabToScene(index);
      hideSubmenus();
    };

    presetMenu.appendChild(presetOption);
  });
};



