let world;
function initWorld() {
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
  const defaultMaterial = new CANNON.Material('default');
  const contactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.4,
      restitution: 0.2,
    }
  );

  world.defaultContactMaterial = contactMaterial;
  world.addContactMaterial(contactMaterial);

  console.log('Mundo de físicas inicializado');
}

/* Physics test */
function addStaticPhysics(options = {}) {
  const { mass = 0, shape = 'box', friction = 0.4, restitution = 0.4 } = options;

  let selectedObjects = [];

  // Buscar todos los objetos seleccionados
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObjects.push(object);
    }
  });

  if (selectedObjects.length === 0) {
    console.warn('No hay objetos seleccionados.');
    return;
  }

  selectedObjects.forEach((selectedObject) => {
    const { position, geometry } = selectedObject;

    if (!geometry) {
      console.warn('El objeto seleccionado no tiene geometría válida para agregar físicas.');
      return;
    }

    let bodyShape;
    try {
      switch (shape) {
        case 'box': {
          const boxSize = new THREE.Box3().setFromObject(selectedObject).getSize(new THREE.Vector3());
          bodyShape = new CANNON.Box(new CANNON.Vec3(boxSize.x / 2, boxSize.y / 2, boxSize.z / 2));
          break;
        }
        case 'sphere': {
          const boundingSphere = geometry.boundingSphere || new THREE.Sphere();
          bodyShape = new CANNON.Sphere(boundingSphere.radius);
          break;
        }
        case 'mesh': {
          const vertices = geometry.attributes.position.array;
          const shapeVertices = [];
          for (let i = 0; i < vertices.length; i += 3) {
            shapeVertices.push(new CANNON.Vec3(vertices[i], vertices[i + 1], vertices[i + 2]));
          }
          bodyShape = new CANNON.ConvexPolyhedron(shapeVertices);
          break;
        }
        default:
          throw new Error('Forma no reconocida.');
      }
    } catch (error) {
      console.warn(error.message, 'Usando forma box por defecto.');
      bodyShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    }

    // Crear el cuerpo físico con la transformación
    const body = new CANNON.Body({
      mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });

    body.addShape(bodyShape);
    body.material = new CANNON.Material();
    body.material.friction = friction;
    body.material.restitution = restitution;

    // Añadir el cuerpo físico al mundo
    world.addBody(body);

    // Guardar el cuerpo físico en el objeto Three.js para futuras referencias
    selectedObject.userData.physicsBody = body;

    console.log('Físicas añadidas al objeto seleccionado:', selectedObject);
  });
}

function addPhysics(options = {}) {
  const { mass = 2, shape = 'box', friction = 0.2, restitution = 0.4 } = options;

  let selectedObjects = [];

  // Buscar todos los objetos seleccionados
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObjects.push(object);
    }
  });

  if (selectedObjects.length === 0) {
    console.warn('No hay objetos seleccionados.');
    return;
  }

  selectedObjects.forEach((selectedObject) => {
    const { position, geometry } = selectedObject;

    if (!geometry) {
      console.warn('El objeto seleccionado no tiene geometría válida para agregar físicas.');
      return;
    }

    let bodyShape;
    try {
      switch (shape) {
        case 'box': {
          const boxSize = new THREE.Box3().setFromObject(selectedObject).getSize(new THREE.Vector3());
          bodyShape = new CANNON.Box(new CANNON.Vec3(boxSize.x / 2, boxSize.y / 2, boxSize.z / 2));
          break;
        }
        case 'sphere': {
          const boundingSphere = geometry.boundingSphere || new THREE.Sphere();
          bodyShape = new CANNON.Sphere(boundingSphere.radius);
          break;
        }
        case 'mesh': {
          const vertices = geometry.attributes.position.array;
          const shapeVertices = [];
          for (let i = 0; i < vertices.length; i += 3) {
            shapeVertices.push(new CANNON.Vec3(vertices[i], vertices[i + 1], vertices[i + 2]));
          }
          bodyShape = new CANNON.ConvexPolyhedron(shapeVertices);
          break;
        }
        default:
          throw new Error('Forma no reconocida.');
      }
    } catch (error) {
      console.warn(error.message, 'Usando forma box por defecto.');
      bodyShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    }

    // Crear el cuerpo físico con la transformación
    const body = new CANNON.Body({
      mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });

    body.addShape(bodyShape);
    body.material = new CANNON.Material();
    body.material.friction = friction;
    body.material.restitution = restitution;

    // Añadir el cuerpo físico al mundo
    world.addBody(body);

    // Guardar el cuerpo físico en el objeto Three.js para futuras referencias
    selectedObject.userData.physicsBody = body;

    console.log('Físicas añadidas al objeto seleccionado:', selectedObject);
  });
}

function deletePhysics() {
  let selectedObject = null;

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      selectedObject = object;
    }
  });

  if (!selectedObject) {
    console.warn('No hay ningún objeto seleccionado.');
    return;
  }

  const physicsBody = selectedObject.userData.physicsBody;

  if (!physicsBody) {
    console.warn('El objeto seleccionado no tiene físicas asociadas.');
    return;
  }

  // Eliminar el cuerpo físico del mundo
  world.removeBody(physicsBody);

  // Eliminar la referencia a las físicas del objeto
  delete selectedObject.userData.physicsBody;

  // Eliminar colisión o elementos asociados a físicas
  selectedObject.children = selectedObject.children.filter(
    (child) => !(child.isMesh && child.material.visible === false)
  );

  console.log('Físicas eliminadas del objeto seleccionado:', selectedObject);
}

function addCloth() {
  if (typeof world === 'undefined') {
    console.error('CANNON world is not defined');
    return;
  }

  const clothWidth = parseFloat(document.getElementById('clothWidth').value);
  const clothHeight = parseFloat(document.getElementById('clothHeight').value);
  const segments = parseInt(document.getElementById('segments').value);
  const clothMass = parseFloat(document.getElementById('clothMass').value);
  const clothElasticity = parseFloat(document.getElementById('clothElasticity').value);
  const clothFriction = parseFloat(document.getElementById('clothFriction').value);
  const clothDamping = parseFloat(document.getElementById('clothDamping').value);

  const restDistance = clothWidth / segments;

  const clothGeometry = new THREE.PlaneGeometry(clothWidth, clothHeight, segments, segments);
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
  clothMesh.position.set(0, 0, 0);
  clothMesh.castShadow = true;
  clothMesh.receiveShadow = true;
  scene.add(clothMesh);

  const clothParticles = [];
  const clothConstraints = [];

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const particle = new CANNON.Body({
        mass: clothMass,
        position: new CANNON.Vec3(
          j * restDistance - clothWidth / 2,
          8,
          i * restDistance - clothHeight / 2
        ),
        shape: new CANNON.Sphere(0.4),
        material: new CANNON.Material({
          friction: clothFriction,
          restitution: clothElasticity,
        }),
      });
      particle.linearDamping = clothDamping;
      clothParticles.push(particle);
      world.addBody(particle);

      if (i > 0) {
        const constraint = new CANNON.DistanceConstraint(
          clothParticles[i * (segments + 1) + j],
          clothParticles[(i - 1) * (segments + 1) + j],
          restDistance
        );
        clothConstraints.push(constraint);
        world.addConstraint(constraint);
      }
      if (j > 0) {
        const constraint = new CANNON.DistanceConstraint(
          clothParticles[i * (segments + 1) + j],
          clothParticles[i * (segments + 1) + (j - 1)],
          restDistance
        );
        clothConstraints.push(constraint);
        world.addConstraint(constraint);
      }
    }
  }

  for (let i = 0; i <= segments; i++) {
    const topLeft = clothParticles[i];
    const topRight = clothParticles[segments];
    const bottomLeft = clothParticles[(segments * (segments + 1))];
    const bottomRight = clothParticles[(segments * (segments + 1)) + segments];

    topLeft.mass = 0;
    topRight.mass = 0;
    bottomLeft.mass = 0;
    bottomRight.mass = 0;
  }

  clothMesh.userData.clothParticles = clothParticles;
  clothMesh.userData.clothConstraints = clothConstraints;
}

initWorld();

function updatePhysics() {
  if (world) {
    world.step(1 / 60);

    // Actualización de objetos rígidos
    scene.traverse((object) => {
      if (object.userData.physicsBody) {
        const body = object.userData.physicsBody;
        object.position.copy(body.position);
        object.quaternion.copy(body.quaternion);
      }
    });

    // Actualización de la tela
    scene.traverse((object) => {
      if (object.userData.clothParticles && object.userData.clothParticles.length > 0) {
        const clothParticles = object.userData.clothParticles;
        const clothMesh = object;

        for (let i = 0; i < clothParticles.length; i++) {
          const particle = clothParticles[i];
          clothMesh.geometry.attributes.position.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
        }
        clothMesh.geometry.attributes.position.needsUpdate = true;
      }
    });
  }
}

/* Custom Particle System */
let textureFile = null;
document.getElementById('particleSpeed').addEventListener('input', (e) => {
  document.getElementById('speedValue').textContent = e.target.value;
});
document.getElementById('particleSize').addEventListener('input', (e) => {
  document.getElementById('sizeValue').textContent = e.target.value;
});
document.getElementById('particleLifespan').addEventListener('input', (e) => {
  document.getElementById('lifespanValue').textContent = e.target.value;
});
document.getElementById('particleEmissionRange').addEventListener('input', (e) => {
  document.getElementById('emissionRangeValue').textContent = e.target.value;
});
document.getElementById('particleRotationSpeed').addEventListener('input', (e) => {
  document.getElementById('rotationSpeedValue').textContent = e.target.value;
});
document.getElementById('particleInitialScale').addEventListener('input', (e) => {
  document.getElementById('initialScaleValue').textContent = e.target.value;
});
document.getElementById('particleFinalScale').addEventListener('input', (e) => {
  document.getElementById('finalScaleValue').textContent = e.target.value;
});
function addCustomParticles() {
  const typeArea = document.getElementById('particleTypeArea').checked;
  const quantity = parseInt(document.getElementById('particleQuantity').value);
  const speed = parseFloat(document.getElementById('particleSpeed').value);
  const color = document.getElementById('particleColor').value;
  const size = parseFloat(document.getElementById('particleSize').value);
  const lifespan = parseFloat(document.getElementById('particleLifespan').value);
  const emissionRange = parseFloat(document.getElementById('particleEmissionRange').value);
  const rotationSpeed = parseFloat(document.getElementById('particleRotationSpeed').value);
  const initialScale = parseFloat(document.getElementById('particleInitialScale').value);
  const finalScale = parseFloat(document.getElementById('particleFinalScale').value);
  const gravityEffect = document.getElementById('particleGravity').checked;
  const bounceEffect = document.getElementById('particleBounce').checked;

  const particlesGeometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];
  const scales = [];

  for (let i = 0; i < quantity; i++) {
    positions.push(
      (Math.random() - 0.5) * emissionRange,
      (Math.random() - 0.5) * emissionRange,
      (Math.random() - 0.5) * emissionRange
    );

    velocities.push(
      (Math.random() - 0.5) * speed,
      Math.random() * speed,
      (Math.random() - 0.5) * speed
    );

    scales.push(initialScale);
  }

  particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
  particlesGeometry.setAttribute('scale', new THREE.Float32BufferAttribute(scales, 1));

  const particleMaterialOptions = {
    color: new THREE.Color(color),
    size,
    sizeAttenuation: true, // Esto hará que las partículas cambien de tamaño dependiendo de la distancia
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  };

  if (textureFile) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(URL.createObjectURL(textureFile), (texture) => {
      particleMaterialOptions.map = texture;
      particleMaterialOptions.map.wrapS = THREE.RepeatWrapping;
      particleMaterialOptions.map.wrapT = THREE.RepeatWrapping;

      const particlesMaterial = new THREE.PointsMaterial(particleMaterialOptions);
      const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);

      scene.add(particleSystem);
    });
  } else {
    const particlesMaterial = new THREE.PointsMaterial(particleMaterialOptions);
    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);
  }

  const clock = new THREE.Clock();

  function animateParticles() {
    const deltaTime = clock.getDelta();
    const positions = particlesGeometry.attributes.position.array;
    const velocities = particlesGeometry.attributes.velocity.array;
    const scales = particlesGeometry.attributes.scale.array;

    for (let i = 0; i < quantity; i++) {
      positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;

      if (gravityEffect) {
        velocities[i * 3 + 1] -= 9.8 * deltaTime;
      }

      if (positions[i * 3 + 1] < -emissionRange / 2 && bounceEffect) {
        velocities[i * 3 + 1] *= -0.8;
      }

      scales[i] = THREE.MathUtils.lerp(initialScale, finalScale, (lifespan - deltaTime) / lifespan);
    }

    particlesGeometry.attributes.position.needsUpdate = true;
    particlesGeometry.attributes.scale.needsUpdate = true;
    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}

// Fire Particles
let particles;
let fireTexture;
function loadTexture() {
  const textureLoader = new THREE.TextureLoader();
  fireTexture = textureLoader.load('assets/Textures/fire.png');
}
function addFireParticles() {
  const particleCount = 85;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const opacities = new Float32Array(particleCount);

  const origin = new THREE.Vector3(0, 0, 0);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = origin.x;
    positions[i * 3 + 1] = origin.y;
    positions[i * 3 + 2] = origin.z;

    velocities[i * 3] = Math.random() * 0.005 - 0.0025;
    velocities[i * 3 + 1] = Math.random() * 0.08 + 0.04;
    velocities[i * 3 + 2] = Math.random() * 0.005 - 0.0025;

    const r = Math.random() * 0.5 + 0.5;
    const g = Math.random() * 0.5;
    const b = 0;

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    sizes[i] = Math.random() * 2 + 1;
    opacities[i] = Math.random() * 0.5 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  const material = new THREE.PointsMaterial({
    map: fireTexture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    depthTest: true
  });

  particles = new THREE.Points(geometry, material);
  const particleContainer = new THREE.Object3D();
  particleContainer.add(particles);
  scene.add(particleContainer);

  animateParticles(particleContainer);
}
function animateParticles(particleContainer) {
  if (!particles) return;

  const positions = particles.geometry.attributes.position.array;
  const velocities = particles.geometry.attributes.velocity.array;
  const sizes = particles.geometry.attributes.size.array;
  const opacities = particles.geometry.attributes.opacity.array;

  for (let i = 0; i < 80; i++) {
    positions[i * 3] += velocities[i * 3];
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    positions[i * 3 + 2] += velocities[i * 3 + 2];

    if (positions[i * 3 + 1] > 1.5) {
      sizes[i] = Math.max(0.5, sizes[i] - 0.015);
    }

    if (positions[i * 3 + 1] > 2.5) {
      positions[i * 3 + 1] = 0;
      positions[i * 3] = Math.random() * 0.5 - 0.25;
      positions[i * 3 + 2] = Math.random() * 0.5 - 0.25;
      sizes[i] = Math.random() * 2 + 1;
      opacities[i] = Math.random() * 0.5 + 0.5;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.size.needsUpdate = true;
  particles.geometry.attributes.opacity.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(() => animateParticles(particleContainer));
}
loadTexture();

// Smoke Particles
let smokeParticles;
let smokeTexture;
function loadSmokeTexture() {
    const textureLoader = new THREE.TextureLoader();
    smokeTexture = textureLoader.load('assets/Textures/smoke.png');
    smokeTexture.magFilter = THREE.NearestFilter; // Para evitar el suavizado del borde
    smokeTexture.minFilter = THREE.NearestFilter; // Evitar el suavizado
}
function addSmokeParticles() {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = Math.random() * 0.5 - 0.25;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.random() * 0.5 - 0.25;

        velocities[i * 3] = 0.0;  // Sin movimiento en X
        velocities[i * 3 + 1] = Math.random() * 0.05 + 0.02;  // Solo movimiento vertical (un poco más rápido)
        velocities[i * 3 + 2] = 0.0; // Sin movimiento en Z

        opacities[i] = 0.1; // Mayor opacidad
        scales[i] = Math.random() * 0.5 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.PointsMaterial({
        size: 1.5,
        map: smokeTexture,
        transparent: true,
        opacity: 0.2,
        depthWrite: false, // Asegura que el alpha no oculte las partículas detrás
    });

    smokeParticles = new THREE.Points(geometry, material);
    scene.add(smokeParticles);

    animateSmokeParticles();
}
function animateSmokeParticles() {
    if (!smokeParticles) return;

    const positions = smokeParticles.geometry.attributes.position.array;
    const velocities = smokeParticles.geometry.attributes.velocity.array;
    const opacities = smokeParticles.geometry.attributes.opacity.array;
    const scales = smokeParticles.geometry.attributes.scale.array;

    for (let i = 0; i < 50; i++) {
        positions[i * 3] += velocities[i * 3]; // No hay movimiento en X
        positions[i * 3 + 1] += velocities[i * 3 + 1]; // Movimiento solo en Y
        positions[i * 3 + 2] += velocities[i * 3 + 2]; // No hay movimiento en Z

        if (positions[i * 3 + 1] > 3) { // Suben más alto
            positions[i * 3 + 1] = 0; // Reinicia la posición Y
        }

        opacities[i] = Math.max(0, opacities[i] - 0.002); // Reducir opacidad con el tiempo
        scales[i] = Math.max(0, scales[i] - 0.002); // Reducir tamaño con el tiempo
    }

    smokeParticles.geometry.attributes.position.needsUpdate = true;
    smokeParticles.geometry.attributes.opacity.needsUpdate = true;
    smokeParticles.geometry.attributes.scale.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animateSmokeParticles);
}
loadSmokeTexture();

// Rain Particles
let rainTexture;
let rainParticles;
function loadRainTexture() {
  const textureLoader = new THREE.TextureLoader();
  rainTexture = textureLoader.load('assets/Textures/rain.png', function() {
    console.log("Textura de lluvia cargada correctamente.");
  });
}
function addRainParticles() {
  if (!rainTexture) {
    console.error("La textura de lluvia no está cargada.");
    return;
  }

  const particleCount = 500;
  const areaWidth = 20;
  const areaDepth = 20;
  const height = 15;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = Math.random() * areaWidth - areaWidth / 2;
    positions[i * 3 + 1] = Math.random() * height + height;
    positions[i * 3 + 2] = Math.random() * areaDepth - areaDepth / 2;

    velocities[i * 3] = 0;
    velocities[i * 3 + 1] = -Math.random() * 1.5 - 0.5; // Velocidad de caída más variada
    velocities[i * 3 + 2] = 0;

    scales[i] = 1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    map: rainTexture,
    size: 1,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  rainParticles = new THREE.Points(geometry, material);

  scene.add(rainParticles);
  animateRainParticles();
}
function animateRainParticles() {
  if (!rainParticles) return;

  const positions = rainParticles.geometry.attributes.position.array;
  const velocities = rainParticles.geometry.attributes.velocity.array;

  for (let i = 0; i < positions.length / 3; i++) {
    positions[i * 3 + 1] += velocities[i * 3 + 1];

    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 15 + 15;
      positions[i * 3] = Math.random() * 20 - 10;
      positions[i * 3 + 2] = Math.random() * 20 - 10;
    }
  }

  rainParticles.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animateRainParticles);
}
loadRainTexture();

// Snow Particles
let snowTexture;
let snowParticles;
function loadSnowTexture() {
  const textureLoader = new THREE.TextureLoader();
  snowTexture = textureLoader.load('assets/Textures/snow.png', function() {
    console.log("Textura de nieve cargada correctamente.");
  });
}
function addSnowParticles() {
  if (!snowTexture) {
    console.error("La textura de nieve no está cargada.");
    return;
  }

  const particleCount = 1000;
  const areaWidth = 20;
  const areaDepth = 20;
  const height = 15;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const rotations = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = Math.random() * areaWidth - areaWidth / 2;
    positions[i * 3 + 1] = Math.random() * height + height;
    positions[i * 3 + 2] = Math.random() * areaDepth - areaDepth / 2;

    velocities[i * 3] = Math.random() * 0.1 - 0.05;
    velocities[i * 3 + 1] = -Math.random() * 0.05 - 0.02;
    velocities[i * 3 + 2] = Math.random() * 0.1 - 0.05;

    rotations[i * 3] = Math.random() * 0.02 - 0.01;
    rotations[i * 3 + 1] = Math.random() * 0.02 - 0.01;
    rotations[i * 3 + 2] = Math.random() * 0.02 - 0.01;

    scales[i] = Math.random() * 0.5 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 3));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    map: snowTexture,
    size: 1,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  snowParticles = new THREE.Points(geometry, material);

  scene.add(snowParticles);
  animateSnowParticles();
}
function animateSnowParticles() {
  if (!snowParticles) return;

  const positions = snowParticles.geometry.attributes.position.array;
  const velocities = snowParticles.geometry.attributes.velocity.array;
  const rotations = snowParticles.geometry.attributes.rotation.array;

  for (let i = 0; i < positions.length / 3; i++) {
    positions[i * 3] += velocities[i * 3];
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    positions[i * 3 + 2] += velocities[i * 3 + 2];

    rotations[i * 3] += 0.01;
    rotations[i * 3 + 1] += 0.01;
    rotations[i * 3 + 2] += 0.01;

    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 15 + 15;
      positions[i * 3] = Math.random() * 20 - 10;
      positions[i * 3 + 2] = Math.random() * 20 - 10;
    }
  }

  snowParticles.geometry.attributes.position.needsUpdate = true;
  snowParticles.geometry.attributes.rotation.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animateSnowParticles);
}
loadSnowTexture();

// Fog Particles
let fogTexture;
let fogParticles;
function loadFogTexture() {
  const textureLoader = new THREE.TextureLoader();
  fogTexture = textureLoader.load('assets/Textures/smoke.png');
}
function addFogParticles() {
  if (!fogTexture) {
    console.error("La textura de neblina no está cargada.");
    return;
  }

  const particleCount = 500;
  const areaWidth = 30;
  const areaDepth = 30;
  const height = 0.1;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = Math.random() * areaWidth - areaWidth / 2;
    positions[i * 3 + 1] = Math.random() * height;
    positions[i * 3 + 2] = Math.random() * areaDepth - areaDepth / 2;

    velocities[i * 3] = Math.random() * 0.01 - 0.005;
    velocities[i * 3 + 1] = Math.random() * 0.001 - 0.0005;
    velocities[i * 3 + 2] = Math.random() * 0.01 - 0.005;

    scales[i] = Math.random() * 2 + 1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    map: fogTexture,
    size: 3,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });

  fogParticles = new THREE.Points(geometry, material);

  scene.add(fogParticles);
  animateFogParticles();
}
function animateFogParticles() {
  if (!fogParticles) return;

  const positions = fogParticles.geometry.attributes.position.array;
  const velocities = fogParticles.geometry.attributes.velocity.array;

  let repelFactor = 0;
  scene.traverse(function(object) {
    if (object.name.includes('(R)')) {
      repelFactor = 0.005;
    }
  });

  for (let i = 0; i < positions.length / 3; i++) {
    positions[i * 3] += velocities[i * 3] - repelFactor;
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    positions[i * 3 + 2] += velocities[i * 3 + 2] - repelFactor;

    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 0.1;
      positions[i * 3] = Math.random() * 30 - 15;
      positions[i * 3 + 2] = Math.random() * 30 - 15;
    }
  }

  fogParticles.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animateFogParticles);
}
loadFogTexture();

// Magic Particles
function addMagicParticles() {
  const particleCount = 200;
  const range = 10;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range;
    positions[i * 3 + 1] = (Math.random() - 0.5) * range;
    positions[i * 3 + 2] = (Math.random() - 0.5) * range;

    velocities[i * 3] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const textureLoader = new THREE.TextureLoader();
  const magicTexture = textureLoader.load('assets/Textures/flame.png');

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: magicTexture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const magicParticles = new THREE.Points(geometry, material);
  scene.add(magicParticles);

  animateMagicParticles(magicParticles);
}
function animateMagicParticles(particles) {
  const positions = particles.geometry.attributes.position.array;
  const velocities = particles.geometry.attributes.velocity.array;

  const attractors = scene.children.filter(obj => obj.name.includes("(I)"));
  const repulsors = scene.children.filter(obj => obj.name.includes("(R)"));

  for (let i = 0; i < positions.length / 3; i++) {
    const particlePos = new THREE.Vector3(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2]
    );

    attractors.forEach(attractor => {
      const attractorPos = attractor.position;
      const direction = attractorPos.clone().sub(particlePos).normalize();
      const distance = attractorPos.distanceTo(particlePos);
      if (distance > 0.5) {
        velocities[i * 3] += direction.x * 0.05;
        velocities[i * 3 + 1] += direction.y * 0.05;
        velocities[i * 3 + 2] += direction.z * 0.05;
      }
    });

    repulsors.forEach(repulsor => {
      const repulsorPos = repulsor.position;
      const direction = particlePos.clone().sub(repulsorPos).normalize();
      const distance = repulsorPos.distanceTo(particlePos);
      if (distance < 2) {
        velocities[i * 3] += direction.x * 0.1;
        velocities[i * 3 + 1] += direction.y * 0.1;
        velocities[i * 3 + 2] += direction.z * 0.1;
      }
    });

    positions[i * 3] += velocities[i * 3];
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    positions[i * 3 + 2] += velocities[i * 3 + 2];

    velocities[i * 3] *= 0.98;
    velocities[i * 3 + 1] *= 0.98;
    velocities[i * 3 + 2] *= 0.98;
  }

  particles.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(() => animateMagicParticles(particles));
}

function addSea() {
  const waterGeometry = new THREE.PlaneGeometry(10, 10, 3, 3);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x87CEFF,
    metalness: 0,
    roughness: 0.35,
    opacity: 0.6,
    transparent: true,
    envMap: scene.background,
    emissive: 0x004466,
    emissiveIntensity: 0.1
  });

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;

  const video = document.createElement('video');
  video.src = 'assets/Textures/waterPBR.mp4';
  video.loop = true;
  video.play();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;
  waterMaterial.normalMap = videoTexture;
  waterMaterial.normalScale.set(4, 4);

  const waterReflection = new THREE.Reflector(waterGeometry, {
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x889999,
    blur: [3000, 3000],
    mixBlur: 0.2,
    distortion: 4
  });

  waterReflection.position.z = -0.02;
  water.add(waterReflection);

  scene.add(water);
}