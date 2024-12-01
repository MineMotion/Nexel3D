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
  const { mass = 0, shape = 'box', friction = 0.4, restitution = 0 } = options;

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
  const { mass = 2, shape = 'box', friction = 0.5, restitution = 1.5 } = options;

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

  const clothWidth = 10;
  const clothHeight = 10;
  const segments = 12;
  const restDistance = clothWidth / segments;

  const clothGeometry = new THREE.PlaneGeometry(clothWidth, clothHeight, segments, segments);
  const textureLoader = new THREE.TextureLoader();
  const clothTexture = textureLoader.load('assets/cloth.jpeg');
  const clothMaterial = new THREE.MeshStandardMaterial({
    map: clothTexture,
    normalMap: textureLoader.load('assets/clothNormal.jpg'),
    roughness: 0.3,
    metalness: 0.4,
    side: THREE.DoubleSide,
    wireframe: false,
    emissive: false,
    shadowSide: THREE.FrontSide,
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
        mass: 0.1,
        position: new CANNON.Vec3(
          j * restDistance - clothWidth / 2,
          8,
          i * restDistance - clothHeight / 2
        ),
        shape: new CANNON.Sphere(0.4),
      });
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

    // Fijar las esquinas
    topLeft.mass = 0;
    topRight.mass = 0;
    bottomLeft.mass= 0;
    bottomRight.mass = 0;
  }

  function updateClothMesh() {
    for (let i = 0; i < clothParticles.length; i++) {
      const particle = clothParticles[i];
      clothMesh.geometry.attributes.position.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
    }
    clothMesh.geometry.attributes.position.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);

    if (world) {
      world.step(1 / 60);
    }

    updateClothMesh();
    renderer.render(scene, camera);
  }

  animate();
}

initWorld();

function updatePhysics() {
  if (world) {
    world.step(1 / 60);
    scene.traverse((object) => {
      if (object.userData.physicsBody) {
        const body = object.userData.physicsBody;
        object.position.copy(body.position);
        object.quaternion.copy(body.quaternion);
      }
    });
  }
}