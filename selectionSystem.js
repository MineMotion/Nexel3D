/* Selection System */
let objetoSeleccionado = null;
let touchStartX = 0;
let touchStartY = 0;
const touchThreshold = 10;

const raycaster = new THREE.Raycaster();
const touch = new THREE.Vector2();
window.addEventListener('touchstart', (event) => {
  if (event.touches.length > 0) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
});
function isTouchOnUIElement(event) {
  const touchX = event.changedTouches[0].clientX;
  const touchY = event.changedTouches[0].clientY;
  const touchedElement = document.elementFromPoint(touchX, touchY);

  if (touchedElement) {
    const ignoredClasses = ["menu", "menu-item", "primary-menu"];
    const ignoredIDs = ["meshMenu", "addMenu"];

    if (ignoredClasses.some((cls) => touchedElement.classList.contains(cls))) {
      return true;
    }

    if (ignoredIDs.includes(touchedElement.id)) {
      return true;
    }
  }
  return false;
}
function seleccionarObjeto(event) {
  if (event.changedTouches.length > 0) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);

    if (deltaX < touchThreshold && deltaY < touchThreshold) {
      touch.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
      touch.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;

      if (isTouchOnUIElement(event)) return;

      raycaster.setFromCamera(touch, camera);
      const intersecciones = raycaster.intersectObjects(scene.children, true);
      const interseccionesConMalla = intersecciones.filter((interseccion) => {
        return interseccion.object instanceof THREE.Mesh && !isPartOfTransformControls(interseccion.object) && !isNoSeleccionable(interseccion.object);
      });

      if (interseccionesConMalla.length > 0) {
        const objetoTocado = interseccionesConMalla[0].object;

        if (objetoSeleccionado && objetoSeleccionado !== objetoTocado) {
          objetoSeleccionado.userData.SelectedObject = false;
        }

        objetoTocado.userData.SelectedObject = true;
        updateLockButton();
        updateAttachment();
        objetoSeleccionado = objetoTocado;

        console.log("Objeto seleccionado:", objetoTocado.name);
      }
    }
  }
}
function isPartOfTransformControls(object) {
  if (object === transformControls) return true;
  let parent = object.parent;
  while (parent) {
    if (parent === transformControls) return true;
    parent = parent.parent;
  }
  return false;
}
function isNoSeleccionable(object) {
  return object.userData.noSeleccionable === true;
}
window.addEventListener('touchend', seleccionarObjeto);

/* Deselect */
function deselectObject() {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.userData.SelectedObject = false;
    }
  });

  objetoSeleccionado = null;
  updateOutliner();
}

/* Area Selection */
const selectAreaButton = document.getElementById('selectArea');
let isSelectingArea = false;
selectAreaButton.addEventListener('click', () => {
  if (!isSelectingArea) {
    isSelectingArea = true;
    controls.enableRotate = false;
    selectAreaButton.style.backgroundColor = "var(--accent-primary)";
    console.log("Modo de selección activado");
    startSelectionRectangle();
  } else {
    console.log("Modo de selección desactivado");
    stopSelectionRectangle();
    controls.enableRotate = true;
    selectAreaButton.style.backgroundColor = "";
    isSelectingArea = false;
  }
});
let selectionRectangle;
let startX = 0;
let startY = 0;
function startSelectionRectangle() {
  window.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchmove', onTouchMove);
  window.addEventListener('touchend', onTouchEnd);

  selectionRectangle = document.createElement('div');
  selectionRectangle.style.position = 'absolute';
  selectionRectangle.style.border = '1px dashed #FFA500';
  selectionRectangle.style.backgroundColor = 'rgba(255, 165, 0, 0.2)';
  selectionRectangle.style.pointerEvents = 'none';
  document.body.appendChild(selectionRectangle);
}
function stopSelectionRectangle() {
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);

  if (selectionRectangle) {
    selectionRectangle.remove();
    selectionRectangle = null;
  }
}
function onTouchStart(event) {
  if (event.touches.length === 1) {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;

    selectionRectangle.style.left = `${startX}px`;
    selectionRectangle.style.top = `${startY}px`;
    selectionRectangle.style.width = `0px`;
    selectionRectangle.style.height = `0px`;
  }
}
function onTouchMove(event) {
  if (event.touches.length === 1) {
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionRectangle.style.left = `${Math.min(startX, currentX)}px`;
    selectionRectangle.style.top = `${Math.min(startY, currentY)}px`;
    selectionRectangle.style.width = `${width}px`;
    selectionRectangle.style.height = `${height}px`;
  }
}
function onTouchEnd() {
  console.log("Selección completada");

  const rect = selectionRectangle.getBoundingClientRect();
  const minX = rect.left;
  const minY = rect.top;
  const maxX = rect.right;
  const maxY = rect.bottom;

  const selectedObjects = [];

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && !isNoSeleccionable(object)) {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const screenPos = center.clone().project(camera);

      const screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight;

      if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
        selectedObjects.push(object);
        object.userData.SelectedObject = true;
        console.log("Objeto seleccionado:", object.name);
      } else {
        object.userData.SelectedObject = false;
      }
    }
  });

  if (selectedObjects.length === 0) {
    console.log("No se seleccionaron objetos.");
  } else {
    console.log(`${selectedObjects.length} objetos seleccionados.`);
  }

  stopSelectionRectangle();
  controls.enableRotate = true;
  selectAreaButton.style.backgroundColor = "";
}

/* Outline de Selección */
const edgeMaterial = new THREE.LineBasicMaterial({
  color: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
  linewidth: 6,
  depthTest: true,
  depthWrite: false,
});
function addEdgeOutline(object) {
  const edgesGeometry = new THREE.EdgesGeometry(object.geometry);
  const edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
  edges.position.set(0, 0, 0);
  object.add(edges);
  object.edges = edges;
  object.edges.userData.exclude = true;
  updateOutliner();
}
function removeEdgeOutline(object) {
  if (object.edges) {
    object.remove(object.edges);
    object.edges.geometry.dispose();
    object.edges.material.dispose();
    delete object.edges;
  }
}
function removeAllEdgeOutlines() {
  scene.traverse((object) => {
    if (object.edges) {
      object.remove(object.edges);
      object.edges.geometry.dispose();
      object.edges.material.dispose();
      delete object.edges;
    }
  });
}
function updateOutlines() {
  let selectedObjectExists = false;

  scene.traverse((object) => {
    const hasBones = object instanceof THREE.Object3D && object.children.some(child => child instanceof THREE.Bone);

    if (object instanceof THREE.Mesh && object.userData.SelectedObject && !hasBones) {
      selectedObjectExists = true;
      if (!object.edges) {
        addEdgeOutline(object);
      }
    } else if (object.edges) {
      removeEdgeOutline(object);
    }
  });

  if (!selectedObjectExists) {
    removeAllEdgeOutlines();
  }
}