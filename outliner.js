function updateOutliner() {
  const outlinerDiv = document.getElementById('outlinerDiv');
  outlinerDiv.innerHTML = '';

  function addObjectToOutliner(object, container, marginLeft = 0) {
    if (object.userData.bone || object.userData.exclude) {
      return;
    }

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('outliner-item');
    itemDiv.style.minWidth = '250px';
    itemDiv.style.marginLeft = `${marginLeft}px`;

    let objectName = object.name || 'Unnamed';
    let iconUrl = '';

    if (object instanceof THREE.Light) {
      iconUrl = 'icons/light.svg';
    } else if (object instanceof THREE.Camera) {
      iconUrl = 'icons/camera.svg';
    } else if (object instanceof THREE.Mesh) {
      iconUrl = 'icons/mesh.svg';
    } else if (object instanceof THREE.Group) {
      iconUrl = 'icons/group.svg';
    } else if (object instanceof THREE.Bone) {
      iconUrl = 'icons/bone.svg';
    } else if (object instanceof THREE.SkinnedMesh) {
      iconUrl = 'icons/skeleton.svg';
    } else {
      iconUrl = 'icons/unknown.svg';
    }

    let isChildrenHidden = object.userData.isChildrenHidden || false;
    let childrenContainers = [];

    if (object.children && object.children.length > 0) {
      const toggleButton = document.createElement('button');
      toggleButton.classList.add('toggle-children-btn');
      const openIcon = document.createElement('img');
      openIcon.src = isChildrenHidden ? 'icons/close.svg' : 'icons/open.svg';
      openIcon.classList.add('icon');
      toggleButton.appendChild(openIcon);
      itemDiv.appendChild(toggleButton);

      toggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        isChildrenHidden = !isChildrenHidden;
        object.userData.isChildrenHidden = isChildrenHidden;
        openIcon.src = isChildrenHidden ? 'icons/close.svg' : 'icons/open.svg';

        childrenContainers.forEach(childContainer => {
          childContainer.style.display = isChildrenHidden ? 'none' : 'block';
        });
      });
    }

    const imgElement = document.createElement('img');
    imgElement.src = iconUrl;
    imgElement.classList.add('icon');
    itemDiv.appendChild(imgElement);

    const textElement = document.createElement('span');
    textElement.classList.add('name');
    textElement.textContent = objectName;
    itemDiv.appendChild(textElement);

    const accentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();

    itemDiv.style.backgroundColor = object.userData.SelectedObject ? accentPrimary : '';

    itemDiv.addEventListener('click', () => {
      const isSelected = object.userData.SelectedObject;

      // Deseleccionamos todos los objetos antes de seleccionar el nuevo
      scene.traverse((otherObject) => {
        otherObject.userData.SelectedObject = false;
      });

      // Si el objeto no estaba seleccionado, lo seleccionamos y adjuntamos al transformControls
      if (!isSelected) {
        object.userData.SelectedObject = true;
        transformControls.attach(object);
      } else {
        // Si el objeto estaba seleccionado, deseleccionamos
        transformControls.detach();
      }

      // Actualizamos el Outliner
      updateOutliner();
    });

    container.appendChild(itemDiv);

    if (object.children && object.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.classList.add('children-container');
      childrenContainer.style.marginLeft = '8px';

      object.children.forEach((child) => {
        addObjectToOutliner(child, childrenContainer, marginLeft + 8);
      });

      container.appendChild(childrenContainer);

      childrenContainers.push(childrenContainer);

      childrenContainer.style.display = isChildrenHidden ? 'none' : 'block';
    }
  }

  scene.children.forEach((object) => {
    addObjectToOutliner(object, outlinerDiv);
  });
}