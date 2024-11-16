function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateOutlines();
  listMaterials();
  //updateAttachment();
  
}

init();
animate();
