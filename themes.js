function cargarTheme() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.css';

  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const cssContent = e.target.result;

        const themeDiv = document.createElement('div');
        themeDiv.classList.add('theme-item', 'submenu-option');

        const themeName = document.createElement('p');
        themeName.textContent = file.name;
        themeDiv.appendChild(themeName);

        const installButton = document.createElement('button');
        installButton.textContent = 'Instalar';
        themeDiv.appendChild(installButton);

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Eliminar';
        themeDiv.appendChild(removeButton);

        const styleElement = document.createElement('style');
        styleElement.textContent = cssContent;

        let isInstalled = false;

        installButton.onclick = () => {
          if (!isInstalled) {
            document.head.appendChild(styleElement); // Añadir el tema al head
            installButton.textContent = 'Desinstalar';
            isInstalled = true;
            saveThemeToLocalStorage(file.name, cssContent, true);
          } else {
            document.head.removeChild(styleElement); // Quitar el tema del head
            installButton.textContent = 'Instalar';
            isInstalled = false;
            saveThemeToLocalStorage(file.name, cssContent, false);
          }
        };

        removeButton.onclick = () => {
          if (isInstalled) {
            document.head.removeChild(styleElement);
          }
          removeThemeFromLocalStorage(file.name);
          themeDiv.remove();
          location.reload();
        };

        const themeList = document.getElementById('Theme-list');
        themeList.appendChild(themeDiv); // Agregar al Theme-list

        saveThemeToLocalStorage(file.name, cssContent, isInstalled);
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function saveThemeToLocalStorage(name, cssContent, isInstalled) {
  const themes = JSON.parse(localStorage.getItem('themes')) || [];
  const existingThemeIndex = themes.findIndex(theme => theme.name === name);

  if (existingThemeIndex === -1) {
    themes.push({ name, cssContent, isInstalled });
  } else {
    themes[existingThemeIndex] = { name, cssContent, isInstalled };
  }

  localStorage.setItem('themes', JSON.stringify(themes));
}

function loadThemesFromLocalStorage() {
  const themes = JSON.parse(localStorage.getItem('themes')) || [];

  themes.forEach(theme => {
    const themeDiv = document.createElement('div');
    themeDiv.classList.add('theme-item', 'submenu-option');

    const themeName = document.createElement('p');
    themeName.textContent = theme.name;
    themeDiv.appendChild(themeName);

    const installButton = document.createElement('button');
    installButton.textContent = theme.isInstalled ? 'Desinstalar' : 'Instalar';
    themeDiv.appendChild(installButton);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Eliminar';
    themeDiv.appendChild(removeButton);

    const styleElement = document.createElement('style');
    styleElement.textContent = theme.cssContent;

    if (theme.isInstalled) {
      document.head.appendChild(styleElement);
    }

    installButton.onclick = () => {
      if (!theme.isInstalled) {
        document.head.appendChild(styleElement); // Añadir el tema al head
        installButton.textContent = 'Desinstalar';
        theme.isInstalled = true;
        saveThemeToLocalStorage(theme.name, theme.cssContent, true);
      } else {
        document.head.removeChild(styleElement); // Quitar el tema del head
        installButton.textContent = 'Instalar';
        theme.isInstalled = false;
        saveThemeToLocalStorage(theme.name, theme.cssContent, false);
      }
    };

    removeButton.onclick = () => {
      if (theme.isInstalled) {
        document.head.removeChild(styleElement);
      }
      removeThemeFromLocalStorage(theme.name);
      themeDiv.remove();
      location.reload();
    };

    const themeList = document.getElementById('Theme-list');
    themeList.appendChild(themeDiv); // Añadir al div de Theme-list
  });
}

function removeThemeFromLocalStorage(name) {
  const themes = JSON.parse(localStorage.getItem('themes')) || [];
  const updatedThemes = themes.filter(theme => theme.name !== name);
  localStorage.setItem('themes', JSON.stringify(updatedThemes));
}

window.onload = loadThemesFromLocalStorage;