function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateOutlines();
  listMaterials();
  actualizarPropiedades();
  updateAttachment();
}

init();
animate();
