/* Outliner */
function updateOutliner() {
  const outlinerDiv = document.getElementById('outlinerDiv');
  outlinerDiv.innerHTML = '';

  function addObjectToOutliner(object, container, marginLeft = 0) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('outliner-item');
    itemDiv.style.minWidth = '250px';
    itemDiv.style.marginLeft = `${marginLeft}px`;

    let objectName = object.name || 'Unnamed';
    let iconUrl = '';

    // Asignación de imágenes según el tipo de objeto
    if (object instanceof THREE.Light) {
      iconUrl = '/icons/light.svg';
    } else if (object instanceof THREE.Camera) {
      iconUrl = '/icons/camera.svg';
    } else if (object instanceof THREE.Mesh) {
      iconUrl = '/icons/mesh.svg';
    } else if (object instanceof THREE.Group) {
      iconUrl = '/icons/group.svg';
    } else if (object instanceof THREE.Bone) {
      iconUrl = '/icons/bone.svg';
    } else if (object instanceof THREE.SkinnedMesh) {
      iconUrl = '/icons/skeleton.svg';
    } else {
      iconUrl = '/icons/unknown.svg';
    }

    // Crear el botón para mostrar/ocultar hijos solo si el objeto tiene hijos
    let isChildrenHidden = object.userData.isChildrenHidden || false;
    let childrenContainers = [];

    if (object.children && object.children.length > 0) {
      const toggleButton = document.createElement('button');
      toggleButton.classList.add('toggle-children-btn');
      const openIcon = document.createElement('img');
      openIcon.src = isChildrenHidden ? '/icons/close.svg' : '/icons/open.svg';
      openIcon.classList.add('icon');
      toggleButton.appendChild(openIcon);
      itemDiv.appendChild(toggleButton);

      // Agregar funcionalidad para ocultar/mostrar hijos al hacer clic en el botón
      toggleButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que se propague el clic al itemDiv
        isChildrenHidden = !isChildrenHidden;
        object.userData.isChildrenHidden = isChildrenHidden; // Guardar el estado de despliegue

        // Cambiar el ícono según el estado de visibilidad
        openIcon.src = isChildrenHidden ? '/icons/close.svg' : '/icons/open.svg';

        // Mostrar u ocultar los contenedores de hijos
        childrenContainers.forEach(childContainer => {
          childContainer.style.display = isChildrenHidden ? 'none' : 'block';
        });
      });
    }

    // Crear la imagen para el tipo de objeto
    const imgElement = document.createElement('img');
    imgElement.src = iconUrl;
    imgElement.classList.add('icon');
    itemDiv.appendChild(imgElement);

    // Crear el texto con el nombre del objeto
    const textElement = document.createElement('span');
    textElement.classList.add('name');
    textElement.textContent = objectName;
    itemDiv.appendChild(textElement);

    // Cambiar el color de fondo si el objeto está seleccionado
    itemDiv.style.backgroundColor = object.userData.SelectedObject ? 'orange' : '';

    // Agregar la interacción de selección al hacer clic
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

    // Verificar si tiene hijos y agregarlos de manera recursiva
    if (object.children && object.children.length > 0) {
      // Crear un contenedor para los hijos
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
    if (!object.userData.exclude) {
      addObjectToOutliner(object, outlinerDiv);
    }
  });
}