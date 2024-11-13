function cargarAddon() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js';

  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const scriptContent = e.target.result;
        const addonName = file.name;

        const addons = JSON.parse(localStorage.getItem('addons')) || [];
        const existingAddonIndex = addons.findIndex(addon => addon.name === addonName);

        if (existingAddonIndex !== -1) {
          // Si ya existe un addon con el mismo nombre, muestra un mensaje de confirmación
          const confirmReplace = confirm(`El addon "${addonName}" ya está instalado. ¿Deseas actualizarlo? Esto podría causar la pérdida de avances. La página se recargará para aplicar los cambios.`);
          if (!confirmReplace) {
            return; // Si el usuario no confirma, no hacemos nada
          }

          // Eliminar el addon antiguo
          const existingAddon = addons[existingAddonIndex];
          if (existingAddon.isInstalled) {
            // Eliminar el script antiguo del DOM
            const oldScriptElement = document.querySelector(`#addon-${existingAddon.name}`);
            if (oldScriptElement) {
              oldScriptElement.remove();
            }
          }
          // Eliminar el addon del localStorage
          removeAddonFromLocalStorage(addonName);
        }

        // Crear el script del nuevo addon
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.id = `addon-${addonName}`;
        scriptElement.text = scriptContent;
        document.body.appendChild(scriptElement);

        // Guardar el nuevo addon en el almacenamiento local e instalarlo
        saveAddonToLocalStorage(addonName, scriptContent, true);

        // Reiniciar la página después de actualizar el addon
        alert(`El addon "${addonName}" ha sido actualizado. La página se recargará para aplicar los cambios.`);
        location.reload(); // Recargar la página
      };
      reader.readAsText(file);
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
      location.reload();
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

window.onload = loadAddonsFromLocalStorage;