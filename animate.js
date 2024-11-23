function animate() {
  requestAnimationFrame(animate);
  controls.update();
  //composer.render();
  //updateIK();
  renderer.render(scene, camera);
  updateOutlines();
  listMaterials();
  updatePhysics();
  //updateAttachment();
  
}

init();
animate();
