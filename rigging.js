// Configuración de Huesos
function addBone() {
  const boneLoader = new THREE.OBJLoader();
  boneLoader.load('assets/bone.obj', function(obj) {
    const boneMesh = obj.children[0];

    boneMesh.material = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      depthTest: false,
      depthWrite: false,
    });
    boneMesh.scale.set(0.5, 0.5, 0.5);
    boneMesh.userData.id = 'bone';
    boneMesh.userData.exclude = true;
    boneMesh.visible = true;

    boneMesh.renderOrder = 1000;
    boneMesh.layers.set(1);

    const bone = new THREE.Bone();
    bone.add(boneMesh);

    let targetObject = scene;
    let selectedBone = null;

    scene.traverse((object) => {
      if (object.userData.SelectedObject) {
        object.userData.SelectedObject = false;
        targetObject = object;
      }
    });

    if (targetObject instanceof THREE.Bone) {
      selectedBone = targetObject;
      selectedBone.add(bone);
      bone.position.set(0, 1, 0);
    } else if (selectedBone === null) {
      targetObject.add(bone);
      bone.position.set(0, 0, 0);
    } else {
      scene.add(bone);
      bone.position.set(0, 0, 0);
    }

    bone.rotation.set(0, 0, 0);
    bone.userData.SelectedObject = true;
    updateAttachment();

    camera.layers.enable(1);
    renderer.render(scene, camera);
    updateOutliner();
  });
}
function attachSkeleton() {
  let targetObject = null;

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      targetObject = object;
    }
  });

  if (!targetObject || !(targetObject.isMesh || targetObject.isSkinnedMesh)) return;

  // Eliminar los edge outlines previos si existen
  if (targetObject.edges) {
    scene.remove(targetObject.edges);
    targetObject.edges.geometry.dispose();
    targetObject.edges.material.dispose();
    targetObject.edges = null;
  }

  let material = targetObject.material;
  if (!material.skinning) {
    material = new THREE.MeshStandardMaterial({
      color: material.color,
      skinning: true,
      roughness: material.roughness,
      metalness: material.metalness,
    });
  }

  let bones = [];
  targetObject.traverse((child) => {
    if (child.isBone) {
      bones.push(child);
    }
  });

  if (bones.length === 0) {
    const rootBone = new THREE.Bone();
    rootBone.position.set(0, 0, 0);
    bones.push(rootBone);

    const childBone = new THREE.Bone();
    childBone.position.set(0, 1, 0);
    rootBone.add(childBone);
    bones.push(childBone);

    targetObject.add(rootBone);
  }

  const skeleton = new THREE.Skeleton(bones);

  const geometry = targetObject.geometry;
  const skinnedMesh = new THREE.SkinnedMesh(geometry, material);

  skinnedMesh.add(bones[0]);
  skinnedMesh.bind(skeleton);

  const originalChildren = [...targetObject.children];

  const vertexCount = geometry.attributes.position.count;
  const skinIndices = new Float32Array(vertexCount * 4);
  const skinWeights = new Float32Array(vertexCount * 4);

  const boneInfluenceRadius = 1;

  const weightTypeSelect = document.getElementById('weightTypeSelect');
  let weightType = weightTypeSelect ? weightTypeSelect.value : 'linear';

  function linearWeight(distance, radius) {
    return Math.max(0, 1 - distance / radius);
  }

  function smoothWeight(distance, radius) {
    return 1 / (1 + Math.exp(distance / radius));
  }

  function constantWeight(distance, radius) {
    return distance < radius ? 1 : 0;
  }

  function exponentialWeight(distance, radius) {
    return Math.exp(-distance / radius);
  }

  for (let i = 0; i < vertexCount; i++) {
    let closestBones = [];
    let vertex = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, i);

    let distances = bones.map(bone => {
      const bonePosition = bone.getWorldPosition(new THREE.Vector3());
      return vertex.distanceTo(bonePosition);
    });

    let sortedBones = bones
      .map((bone, index) => ({ bone, distance: distances[index] }))
      .sort((a, b) => a.distance - b.distance);

    let sumWeights = 0;

    for (let j = 0; j < 4; j++) {
      if (j < sortedBones.length) {
        let weight;

        switch (weightType) {
          case 'linear':
            weight = linearWeight(sortedBones[j].distance, boneInfluenceRadius);
            break;
          case 'smooth':
            weight = smoothWeight(sortedBones[j].distance, boneInfluenceRadius);
            break;
          case 'constant':
            weight = constantWeight(sortedBones[j].distance, boneInfluenceRadius);
            break;
          case 'exponential':
            weight = exponentialWeight(sortedBones[j].distance, boneInfluenceRadius);
            break;
        }

        skinIndices[i * 4 + j] = bones.indexOf(sortedBones[j].bone);
        skinWeights[i * 4 + j] = weight;
        sumWeights += weight;
      }
    }

    for (let j = 0; j < 4; j++) {
      skinWeights[i * 4 + j] /= sumWeights;
    }
  }

  geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4));

  skinnedMesh.position.copy(targetObject.position);
  skinnedMesh.rotation.copy(targetObject.rotation);
  skinnedMesh.scale.copy(targetObject.scale);

  originalChildren.forEach(child => {
    skinnedMesh.add(child);
  });

  targetObject.parent.add(skinnedMesh);
  targetObject.parent.remove(targetObject);

  skinnedMesh.layers.set(targetObject.layers);

  const skeletonHelper = new THREE.SkeletonHelper(skinnedMesh);
  scene.add(skeletonHelper);

  renderer.render(scene, camera);

  updateOutliner();

  const notification = document.getElementById('notification');
  notification.textContent = 'Se ha añadido el rig';
  notification.style.display = 'inline';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}
function detachSkeleton() {
  let targetObject = null;

  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      targetObject = object;
    }
  });

  if (!targetObject || !(targetObject.isSkinnedMesh)) return;

  const geometry = targetObject.geometry;
  const material = targetObject.material;

  const existingSkeletonHelper = scene.getObjectByName(targetObject.name + "_helper");
  if (existingSkeletonHelper) {
    existingSkeletonHelper.userData.id = 'exclude';
    scene.remove(existingSkeletonHelper);
  }

  targetObject.skeleton = null;
  targetObject.bindMatrix = null;
  targetObject.bindMatrixInverse = null;

  const originalMesh = new THREE.Mesh(geometry, material);
  originalMesh.position.copy(targetObject.position);
  originalMesh.rotation.copy(targetObject.rotation);
  originalMesh.scale.copy(targetObject.scale);
  
  targetObject.children.forEach(child => {
    originalMesh.add(child);
  });

  targetObject.parent.add(originalMesh);
  targetObject.parent.remove(targetObject);
  
  originalMesh.layers.set(targetObject.layers);
  
  updateOutliner();
  
  const notification = document.getElementById('notification');
  notification.textContent = "El rig ha sido eliminado";
  notification.style.display = 'inline';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// IK rigging
function setAncle() {
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      object.userData.isAncle = true;

      // Cambiar color del objeto hijo boneMesh
      const boneMesh = object.children.find((child) => child.userData.id === 'bone');
      if (boneMesh) {
        boneMesh.material.color.set(0x00ff00);
      }
    }
  });
}
function setController() {
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      object.userData.isController = true;

      // Cambiar color del objeto hijo boneMesh
      const boneMesh = object.children.find((child) => child.userData.id === 'bone');
      if (boneMesh) {
        boneMesh.material.color.set(0xff0000); // Rojo para Controller
      }

      // Crear objeto target con forma de cubo alámbrico
      const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Tamaño del cubo
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Material rojo
      const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeometry), lineMaterial);

      // Posicionar el controlador en la posición del hueso seleccionado, elevado en 1 unidad en el eje Y
      wireframe.position.copy(object.position);
      wireframe.position.y += 1;

      // Añadir el controlador a la escena y asociarlo al hueso
      scene.add(wireframe);
      object.userData.target = wireframe;
    }
    updateOutliner();
  });
}
function setupIK() {
  const notification = document.getElementById('notification');
  notification.textContent = "Esta función aun no esta disponible";
  notification.style.display = 'inline';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Controls
function addController() {
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      const boneMesh = object.children.find((child) => child.userData.id === 'bone');
      if (boneMesh && !object.getObjectByName('controller')) {
        const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeometry), lineMaterial);

        wireframe.position.set(0, 0, 0);
        wireframe.name = 'controller';
        object.add(wireframe);
      }
    }
  });
}

// Bone Dynamics 
let bonesWithDynamics = [];
let defaseStrength = 0.1;
let defaseTime = 0.1;
let defaseSpeed = 2;
function addDynamics() {
  let selectedBone;
  scene.traverse((object) => {
    if (object.userData.SelectedObject && object.isBone) {
      selectedBone = object;
    }
  });

  if (!selectedBone) {
    console.warn("No hay un hueso seleccionado.");
    return;
  }
  
  function applyOrRemoveDynamics(bone, parentRotation) {
    if (!bone) return;

    const boneMesh = bone.children.find((child) => child.userData.id === "bone");

    if (!bonesWithDynamics.includes(bone)) {
      bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, parentRotation.x, defaseStrength);
      bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, parentRotation.y, defaseStrength);
      bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, parentRotation.z, defaseStrength);

      if (boneMesh) {
        boneMesh.material.color.set(0x00bfff);
      }

      bonesWithDynamics.push(bone);
    } else {
      if (boneMesh) {
        boneMesh.material.color.set(0xaaaaaa);
      }

      bonesWithDynamics = bonesWithDynamics.filter((b) => b !== bone);
    }

    bone.children.forEach((child) => {
      if (child.isBone) {
        applyOrRemoveDynamics(child, bone.rotation);
      }
    });
  }

  applyOrRemoveDynamics(selectedBone, selectedBone.rotation);
}
function updateDynamics() {
  bonesWithDynamics.forEach((bone) => {
    bone.children.forEach((child) => {
      if (child.isBone) {
        child.rotation.x = THREE.MathUtils.lerp(child.rotation.x, bone.rotation.x, defaseStrength * defaseSpeed);
        child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, bone.rotation.y, defaseStrength * defaseSpeed);
        child.rotation.z = THREE.MathUtils.lerp(child.rotation.z, bone.rotation.z, defaseStrength * defaseSpeed);
      }
    });
  });

  requestAnimationFrame(updateDynamics);
}
updateDynamics();

/* Tests */
function savePoseToIndexedDB(poseName, selectedBone) {
  // Crear la solicitud para abrir la base de datos IndexedDB
  const openRequest = indexedDB.open("poseLibrary", 1);

  // Configuración inicial de la base de datos
  openRequest.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("poses")) {
      db.createObjectStore("poses", { keyPath: "name" });
    }
  };

  openRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction("poses", "readwrite");
    const store = transaction.objectStore("poses");

    // Obtenemos la posición, rotación y escala de los huesos hijos
    const poseData = {};
    selectedBone.traverse((object) => {
      if (object instanceof THREE.Bone) {
        poseData[object.name] = {
          position: object.position.toArray(),
          rotation: object.rotation.toArray(),
          scale: object.scale.toArray()
        };
      }
    });

    // Verificar si ya existe una pose con el mismo nombre
    const getPose = store.get(poseName);

    getPose.onsuccess = function() {
      if (getPose.result) {
        alert(`Ya existe una pose con el nombre '${poseName}'. Por favor, usa un nombre diferente.`);
        return;
      }

      const pose = {
        name: poseName,
        data: poseData
      };

      // Guardar la pose en la base de datos
      store.add(pose).onsuccess = function() {
        addPoseToDiv(poseName);
        console.log(`Pose '${poseName}' guardada exitosamente.`);
      };
    };

    getPose.onerror = function() {
      console.error("Error al buscar en la base de datos.");
    };
  };

  openRequest.onerror = function(event) {
    console.error("Error al abrir la base de datos:", event.target.error.message);
  };
}
function addPoseToDiv(poseName) {
  const poseDiv = document.createElement('div');
  poseDiv.textContent = poseName;
  poseDiv.classList.add('pose-item');
  poseDiv.addEventListener('click', () => {
    loadPose(poseName);
  });

  const posePresetsContainer = document.getElementById('posePresets');
  posePresetsContainer.appendChild(poseDiv);
}
function loadPose(poseName) {
  const openRequest = indexedDB.open("poseLibrary", 1);

  openRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction("poses", "readonly");
    const store = transaction.objectStore("poses");

    // Buscar la pose por su nombre
    const getPose = store.get(poseName);

    getPose.onsuccess = function() {
      const pose = getPose.result;
      if (pose) {
        applyPoseToBone(pose.data);
      } else {
        alert(`Pose '${poseName}' no encontrada.`);
      }
    };

    getPose.onerror = function() {
      console.error("Error al cargar la pose desde la base de datos.");
    };
  };

  openRequest.onerror = function(event) {
    console.error("Error al abrir la base de datos:", event.target.error.message);
  };
}
function applyPoseToBone(poseData) {
  scene.traverse((object) => {
    if (object instanceof THREE.Bone && poseData[object.name]) {
      const boneData = poseData[object.name];
      object.position.fromArray(boneData.position);
      object.rotation.fromArray(boneData.rotation);
      object.scale.fromArray(boneData.scale);
    }
  });
}
function savePose(selectedBone) {
  const poseName = prompt("Ingresa un nombre para la pose:");

  if (poseName) {
    savePoseToIndexedDB(poseName, selectedBone);
  } else {
    alert("El nombre de la pose no puede estar vacío.");
  }
}