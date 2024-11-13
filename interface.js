/* Mostrar y ocultar menus */
function showMenu(id) {
  const element = document.getElementById(id);
  const primaryMenus = document.querySelectorAll('.primary-menu');
  let menuOpened = null;

  // Verifica si algún menú está abierto y lo guarda en la variable menuOpened
  primaryMenus.forEach(menu => {
    if (menu.style.display === 'block') {
      menuOpened = menu; // Guarda el menú que está abierto
    }
  });

  // Si hay un menú abierto y no es el que estamos intentando abrir, lo cerramos
  if (menuOpened && menuOpened !== element) {
    menuOpened.style.display = 'none'; // Cierra el menú anterior
  }

  // Alterna la visibilidad del menú que se quiere abrir
  if (element.style.display === 'none' || element.style.display === '') {
    element.style.display = 'block'; // Abre el nuevo menú
  } else {
    element.style.display = 'none'; // Si ya está abierto, lo cierra
  }
}

function hide() {
    const menus = document.querySelectorAll('.menu');
    const primaryMenus = document.querySelectorAll('.primary-menu');
    
    menus.forEach(menu => {
        menu.style.display = 'none';
    });

    primaryMenus.forEach(menu => {
        menu.style.display = 'none';
    });
}

document.querySelectorAll('button').forEach(button => {
  if (button.textContent.trim() === '×') {
    button.addEventListener('click', hide);
  }
});


/* Seleccion de Modo */
function changeMode() {
  const selectedMode = document.getElementById('modeDropdown').value;

  // Ocultar todos los modos
  const modes = ['objectMode', 'animationMode', 'riggingMode', 'materialMode'];
  modes.forEach(mode => {
    const modeContainer = document.getElementById(mode);
    if (modeContainer) {
      modeContainer.style.display = 'none'; // Ocultar todos los contenedores de modos
    }
  });

  // Mostrar el contenedor correspondiente al modo seleccionado
  const selectedContainer = document.getElementById(selectedMode);
  if (selectedContainer) {
    selectedContainer.style.display = 'block'; // Mostrar solo el contenedor seleccionado
  }
}


/* Pickr */
const pickr = Pickr.create({
  el: '#backgroundColor',
  theme: 'classic',
  swatches: [
    '#303030', '#464A70', '#5F66B3', '#9A9A9A', '#DEDEDE'
  ],
  components: {
    preview: true,
    opacity: true,
    hue: true,
    interaction: {
      hex: true,
      rgb: true,
      rgba: true,
      hsla: true,
      hsva: true,
    }
  }
});

pickr.on('change', (color) => {
  const rgbColor = color.toRGBA().toString();
  scene.background = new THREE.Color(rgbColor);
});


