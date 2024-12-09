// Acciones para Undo Redo
class AddBoneAction {
  constructor(bone, parent) {
    this.bone = bone;
    this.parent = parent;
  }

  undo() {
    this.parent.remove(this.bone);
  }

  redo() {
    this.parent.add(this.bone);
  }
}
class SetAncleAction {
  constructor(object, originalColor) {
    this.object = object;
    this.originalColor = originalColor;
  }

  undo() {
    this.object.userData.isAncle = false;
    const boneMesh = this.object.children.find((child) => child.userData.id === 'bone');
    if (boneMesh) {
      boneMesh.material.color.set(this.originalColor);
    }
  }

  redo() {
    this.object.userData.isAncle = true;
    const boneMesh = this.object.children.find((child) => child.userData.id === 'bone');
    if (boneMesh) {
      boneMesh.material.color.set(0x00ff00);
    }
  }
}
class SetControllerAction {
  constructor(object, originalColor, targetObject) {
    this.object = object;
    this.originalColor = originalColor;
    this.targetObject = targetObject;
  }

  undo() {
    this.object.userData.isController = false;
    const boneMesh = this.object.children.find((child) => child.userData.id === 'bone');
    if (boneMesh) {
      boneMesh.material.color.set(this.originalColor);
    }
    if (this.targetObject) {
      scene.remove(this.targetObject);
    }
  }

  redo() {
    this.object.userData.isController = true;
    const boneMesh = this.object.children.find((child) => child.userData.id === 'bone');
    if (boneMesh) {
      boneMesh.material.color.set(0xff0000);
    }
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeometry), lineMaterial);
    wireframe.position.copy(this.object.position);
    wireframe.position.y += 1;
    scene.add(wireframe);
    this.object.userData.target = wireframe;
  }
}

// Huesos y esqueletos
function addBone() {
  const boneLoader = new THREE.OBJLoader();
  boneLoader.load('assets/Models/bone.obj', function(obj) {
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
    bone.name = 'Bone';
    updateAttachment();

    camera.layers.enable(1);
    renderer.render(scene, camera);
    updateOutliner();

    // Crear la acción de añadir el hueso para deshacer
    const addBoneActionInstance = new AddBoneAction(bone, targetObject);
    undoRedoManager.addAction(addBoneActionInstance);
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
      const boneMesh = object.children.find((child) => child.userData.id === 'bone');
      const originalColor = boneMesh ? boneMesh.material.color.getHex() : null;

      object.userData.isAncle = true;

      if (boneMesh) {
        boneMesh.material.color.set(0x00ff00);
      }
      const setAncleActionInstance = new SetAncleAction(object, originalColor);
      undoRedoManager.addAction(setAncleActionInstance);
    }
  });
}
function setController() {
  scene.traverse((object) => {
    if (object.userData.SelectedObject) {
      const boneMesh = object.children.find((child) => child.userData.id === 'bone');
      const originalColor = boneMesh ? boneMesh.material.color.getHex() : null;
      object.userData.isController = true;
      if (boneMesh) {
        boneMesh.material.color.set(0xff0000);
      }
      const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeometry), lineMaterial);
      wireframe.position.copy(object.position);
      wireframe.position.y += 1;
      scene.add(wireframe);
      object.userData.target = wireframe;
      const setControllerActionInstance = new SetControllerAction(object, originalColor, wireframe);
      undoRedoManager.addAction(setControllerActionInstance);
    }
  });
  updateOutliner();
}
function createIKChain() {
  const bones = [];
  scene.traverse((object) => {
    if (object.type === "Bone") {
      bones.push(object);
    }
  });

  const ancle = bones.find((bone) => bone.name.includes("(A)"));
  const controller = bones.find((bone) => bone.name.includes("(C)"));
  const intermediates = bones.filter((bone) => bone.name.includes("(I)"));

  if (!ancle || !controller) {
    console.warn("Se requiere un hueso con (A) como Ancle y un hueso con (C) como Controller para crear una cadena IK.");
    return;
  }

  const chain = [ancle, ...intermediates, controller];

  const target = controller.userData.target;

  const ikSolver = new THREE.CCDIKSolver({
    bones: chain,
    target: target,
  });

  // Actualizar el IK en cada frame
  const updateIK = () => {
    ikSolver.solve();
  };

  animateCallbacks.push(updateIK);
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

// Mirror Mode
let mirrorEnabled = false;

function mirrorMode() {
  mirrorEnabled = !mirrorEnabled;

  if (mirrorEnabled) {
    updateConstraints();
  }
}

function updateConstraints() {
  scene.traverse((object) => {
    if (object.name.includes('left') && mirrorEnabled) {
      const rightObject = scene.getObjectByName(object.name.replace('left', 'right'));
      if (rightObject) {
        rightObject.position.set(-object.position.x, object.position.y, object.position.z);
        rightObject.rotation.set(-object.rotation.x, object.rotation.y, -object.rotation.z);
      }
    }
  });
}

// Pose Library 
let storedPoses = loadPosesFromLocalStorage();
renderStoredPoses();
function savePose() {
  const selectedObject = getSelectedObject(scene);

  if (!selectedObject) {
    alert('No bone selected');
    return;
  }

  const poseName = prompt('Enter pose name:');
  if (!poseName) return;

  const pose = {
    name: poseName,
    bones: []
  };

  selectedObject.traverse((object) => {
    if (object instanceof THREE.Bone) {
      pose.bones.push({
        name: object.name,
        position: object.position.toArray(),
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: object.scale.toArray()
      });
    }
  });

  storedPoses.push(pose);
  savePosesToLocalStorage();

  createPoseButton(poseName);
}
function applyPose(poseName) {
  const selectedObject = getSelectedObject(scene);

  if (!selectedObject) {
    alert('No bone selected');
    return;
  }

  const pose = storedPoses.find(p => p.name === poseName);

  if (pose) {
    selectedObject.traverse((object) => {
      if (object instanceof THREE.Bone) {
        const bonePose = pose.bones.find(p => p.name === object.name);
        if (bonePose) {
          object.position.fromArray(bonePose.position);
          object.rotation.set(...bonePose.rotation);
          object.scale.fromArray(bonePose.scale);
        }
      }
    });
  }
}
function createPoseButton(poseName) {
  const poseButton = document.createElement('button');
  poseButton.classList.add('poseItem');

  const poseIcon = document.createElement('img');
  poseIcon.src = 'icons/skeleton.svg';
  poseButton.appendChild(poseIcon);
  poseButton.appendChild(document.createTextNode(poseName));

  poseButton.addEventListener('click', () => {
    applyPose(poseName);
  });

  const savedPosesContainer = document.getElementById('savedPoses');
  savedPosesContainer.appendChild(poseButton);
}
function savePosesToLocalStorage() {
  localStorage.setItem('savedPoses', JSON.stringify(storedPoses));
}
function loadPosesFromLocalStorage() {
  const poses = localStorage.getItem('savedPoses');
  return poses ? JSON.parse(poses) : [];
}
function renderStoredPoses() {
  const savedPosesContainer = document.getElementById('savedPoses');
  storedPoses.forEach(pose => {
    createPoseButton(pose.name);
  });
}

// Rename Bone Chain
function fixBoneChain() {
  const selectedBone = getSelectedObject(scene);

  if (!selectedBone || !(selectedBone instanceof THREE.Bone)) {
    alert('No bone selected or selected object is not a bone');
    return;
  }

  let counter = 1;

  selectedBone.traverse((bone) => {
    if (bone instanceof THREE.Bone) {
      if (bone !== selectedBone) {
        bone.name = `${selectedBone.name} ${counter}`;
        counter++;
      }
    }
  });

  console.log(`Bone chain fixed starting from: ${selectedBone.name}`);
  selectedBone.traverse((bone) => {
    if (bone instanceof THREE.Bone) {
      console.log(`Bone name: ${bone.name}`);
    }
  });
}

// Delete Saved Poses
function deleteSavedPoses() {
  const confirmation = confirm('Are you sure you want to delete all saved poses? This action cannot be undone.');

  if (confirmation) {
    // Eliminar los datos almacenados en localStorage
    localStorage.removeItem('savedPoses');

    // Reiniciar el array en memoria
    storedPoses = [];

    // Vaciar el contenedor de los botones
    const savedPosesContainer = document.getElementById('savedPoses');
    while (savedPosesContainer.firstChild) {
      savedPosesContainer.removeChild(savedPosesContainer.firstChild);
    }

    console.log('All saved poses have been deleted.');
  } else {
    console.log('Deletion canceled.');
  }
}