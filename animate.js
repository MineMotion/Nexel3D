function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateOutlines();
  listMaterials();
  updateObjectToolsButton();
}

init();
animate();
