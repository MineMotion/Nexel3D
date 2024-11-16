function cargarAddon() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js';
  input.multiple = true;

  input.onchange = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      let needToReload = false;

      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const scriptContent = e.target.result;
          const addonName = file.name;

          const addons = JSON.parse(localStorage.getItem('addons')) || [];
          const existingAddonIndex = addons.findIndex(addon => addon.name === addonName);

          if (existingAddonIndex !== -1) {
            const confirmReplace = confirm(`El addon "${addonName}" ya está instalado. ¿Deseas actualizarlo? Esto podría causar la pérdida de avances.`);
            if (!confirmReplace) return;

            const existingAddon = addons[existingAddonIndex];
            if (existingAddon.isInstalled) {
              const oldScriptElement = document.querySelector(`#addon-${existingAddon.name}`);
              if (oldScriptElement) {
                oldScriptElement.remove();
              }
            }

            removeAddonFromLocalStorage(addonName);
            needToReload = true;
          }

          const scriptElement = document.createElement('script');
          scriptElement.type = 'module';
          scriptElement.id = `addon-${addonName}`;
          scriptElement.text = scriptContent;

          document.body.appendChild(scriptElement);

          saveAddonToLocalStorage(addonName, scriptContent, true);

          if (needToReload) {
            const confirmReload = confirm(`Los cambios solo harán efecto al reiniciar la aplicación, ¿deseas reiniciar?`);
            if (confirmReload) {
              location.reload();
            } else {
              alert(`El addon "${addonName}" ha sido actualizado, pero necesitarás reiniciar la aplicación para que los cambios surtan efecto.`);
            }
          }

          updateAddonInterface(addonName, true);
        };
        reader.readAsText(file);
      }
    }
  };
  input.click();
}

function saveAddonToLocalStorage(name, scriptContent, isInstalled) {
  const addons = JSON.parse(localStorage.getItem('addons')) || [];
  const existingAddonIndex = addons.findIndex(addon => addon.name === name);

  if (existingAddonIndex === -1) {
    addons.push({ name, scriptContent, isInstalled });
  } else {
    addons[existingAddonIndex] = { name, scriptContent, isInstalled };
  }

  localStorage.setItem('addons', JSON.stringify(addons));
}

function loadAddonsFromLocalStorage() {
  const addons = JSON.parse(localStorage.getItem('addons')) || [];

  addons.forEach(addon => {
    const addonDiv = document.createElement('div');
    addonDiv.classList.add('addon-item', 'submenu-option');
    addonDiv.setAttribute('data-addon', addon.name);

    const addonName = document.createElement('p');
    addonName.textContent = addon.name;
    addonDiv.appendChild(addonName);

    const installButton = document.createElement('button');
    installButton.textContent = addon.isInstalled ? 'Desinstalar' : 'Instalar';
    addonDiv.appendChild(installButton);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Eliminar';
    addonDiv.appendChild(removeButton);

    const scriptElement = document.createElement('script');
    scriptElement.type = 'module';
    scriptElement.id = `addon-${addon.name}`;
    scriptElement.text = addon.scriptContent;

    if (addon.isInstalled) {
      document.body.appendChild(scriptElement);
    }

    installButton.onclick = () => {
      if (!addon.isInstalled) {
        document.body.appendChild(scriptElement);
        installButton.textContent = 'Desinstalar';
        addon.isInstalled = true;
        saveAddonToLocalStorage(addon.name, addon.scriptContent, true);
      } else {
        document.body.removeChild(scriptElement);
        installButton.textContent = 'Instalar';
        addon.isInstalled = false;
        saveAddonToLocalStorage(addon.name, addon.scriptContent, false);
      }
    };

    removeButton.onclick = () => {
      if (addon.isInstalled) {
        document.body.removeChild(scriptElement);
      }
      removeAddonFromLocalStorage(addon.name);
      addonDiv.remove();
      const confirmReload = confirm(`Los cambios solo harán efecto al reiniciar la aplicación, ¿deseas reiniciar?`);
      if (confirmReload) {
        location.reload();
      }
    };

    // Botón "Más opciones"
    const moreButton = document.createElement('button');
    moreButton.textContent = '...';
    addonDiv.appendChild(moreButton);

    // Contenedor de opciones adicionales
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('addon-options-container');
    optionsContainer.style.display = 'none'; // Inicialmente oculto

    const editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.onclick = () => codifyAddon(addon.scriptContent);
    optionsContainer.appendChild(editButton);

    const anotherOptionButton = document.createElement('button');
    anotherOptionButton.textContent = 'Otra opción';
    anotherOptionButton.onclick = () => alert('Otra opción seleccionada');
    optionsContainer.appendChild(anotherOptionButton);

    // Añadir el contenedor de opciones debajo del addon
    addonDiv.appendChild(optionsContainer);

    // Toggle para mostrar/ocultar las opciones
    moreButton.onclick = () => {
      if (optionsContainer.style.display === 'block') {
        optionsContainer.style.display = 'none';
      } else {
        optionsContainer.style.display = 'block';
      }
    };

    const addonList = document.getElementById('addon-list');
    addonList.appendChild(addonDiv);
  });
}

function removeAddonFromLocalStorage(name) {
  const addons = JSON.parse(localStorage.getItem('addons')) || [];
  const updatedAddons = addons.filter(addon => addon.name !== name);
  localStorage.setItem('addons', JSON.stringify(updatedAddons));
}

function updateAddonInterface(addonName, isInstalled) {
  const addonDiv = document.querySelector(`.addon-item[data-addon="${addonName}"]`);
  const installButton = addonDiv.querySelector('button');

  if (isInstalled) {
    installButton.textContent = 'Desinstalar';
  } else {
    installButton.textContent = 'Instalar';
  }

  const addons = JSON.parse(localStorage.getItem('addons')) || [];
  const updatedAddon = addons.find(addon => addon.name === addonName);
  if (updatedAddon) {
    updatedAddon.isInstalled = isInstalled;
    saveAddonToLocalStorage(addonName, updatedAddon.scriptContent, isInstalled);
  }
}

function codifyAddon(scriptContent) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const editorContainer = document.createElement('div');
  editorContainer.classList.add('editor-container');

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Escribe el código de tu addon aquí...';
  textarea.id = 'addon-code-input';

  const previewContainer = document.createElement('pre');
  const previewCode = document.createElement('code');
  previewCode.classList.add('language-javascript');
  previewCode.id = 'addon-code-preview';
  previewContainer.appendChild(previewCode);

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Guardar como .js';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Cerrar';

  const highlightButton = document.createElement('button');
  highlightButton.textContent = 'Resaltar';

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(highlightButton);
  buttonContainer.appendChild(closeButton);

  editorContainer.appendChild(textarea);
  editorContainer.appendChild(previewContainer);
  editorContainer.appendChild(buttonContainer);
  modal.appendChild(editorContainer);

  document.body.appendChild(modal);

  closeButton.onclick = () => {
    modal.remove();
  };

  highlightButton.onclick = () => {
    const code = textarea.value;
    previewCode.textContent = code;
    Prism.highlightElement(previewCode);
  };

  saveButton.onclick = () => {
    const addonCode = textarea.value;
    if (addonCode.trim() === '') {
      alert('El código del addon no puede estar vacío');
      return;
    }

    const addonName = prompt("Por favor, ingresa el nombre de tu addon:");
    if (!addonName || addonName.trim() === '') {
      alert("El nombre del addon es obligatorio.");
      return;
    }

    const blob = new Blob([addonCode], { type: 'application/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${addonName}.js`;

    link.click();

    saveAddonToLocalStorage(addonName, addonCode, false);

    alert(`Addon "${addonName}" guardado correctamente como ${addonName}.js`);
    modal.remove();
  };
}

window.onload = loadAddonsFromLocalStorage;