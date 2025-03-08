// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Black hole
const blackHoleGeometry = new THREE.SphereGeometry(5, 32, 32);
const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
scene.add(blackHole);

// Stars
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const starVertices = [];
for (let i = 0; i < 1000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Camera position
camera.position.z = 50;

// Mouse controls
const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation
function animate() {
  requestAnimationFrame(animate);
  blackHole.rotation.y += 0.001;
  camera.position.x += (mouse.x * 10 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 10 - camera.position.y) * 0.05;
  camera.lookAt(blackHole.position);
  renderer.render(scene, camera);
}
animate();

// Easter egg star
const easterEggStar = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff00ff })
);
easterEggStar.position.set(10, 10, -50);
scene.add(easterEggStar);

// Click detection
const raycaster = new THREE.Raycaster();
const mouseClick = new THREE.Vector2();
document.addEventListener('click', (event) => {
  mouseClick.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseClick.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouseClick, camera);
  const intersects = raycaster.intersectObjects([easterEggStar]);
  if (intersects.length > 0) {
    document.getElementById('easter-egg').style.display = 'block';
  }
});

// Close easter egg
document.getElementById('close-easter-egg').addEventListener('click', () => {
  document.getElementById('easter-egg').style.display = 'none';
});
