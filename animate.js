function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateOutlines();
  listMaterials();
  updatePhysics();
  updateObjectToolsButton();
}

init();
animate();
