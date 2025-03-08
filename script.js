// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Black hole with custom shader for gravitational lensing
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D sceneTexture;
  uniform vec2 blackHolePos;
  uniform float strength;
  varying vec2 vUv;

  void main() {
    vec2 toBH = blackHolePos - vUv;
    float dist = length(toBH);
    vec2 dir = normalize(toBH);
    float warp = strength * (1.0 / (dist + 0.1));
    vec2 distortedUv = vUv + dir * warp;
    gl_FragColor = texture2D(sceneTexture, distortedUv);
  }
`;

const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    sceneTexture: { value: renderTarget.texture },
    blackHolePos: { value: new THREE.Vector2(0.5, 0.5) },
    strength: { value: 0.05 }
  },
  vertexShader,
  fragmentShader
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
const renderScene = new THREE.Scene();
renderScene.add(quad);

// Black hole core
const blackHole = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000 })
);
scene.add(blackHole);

// Stars
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
const starVertices = [];
for (let i = 0; i < 2000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Interactive particles with instancing
const particleCount = 1000;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 100;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  velocities[i * 3] = (Math.random() - 0.5) * 0.1;
  velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
  velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.3 });
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// Camera position
camera.position.z = 50;

// Mouse interaction
const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Puzzle runes
const runes = [];
const puzzleSequence = [0, 2, 1]; // Click order: rune 0, rune 2, rune 1
let userSequence = [];
for (let i = 0; i < 3; i++) {
  const rune = new THREE.Mesh(
    new THREE.TetrahedronGeometry(1),
    new THREE.MeshBasicMaterial({ color: 0xff00ff })
  );
  rune.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, -50);
  scene.add(rune);
  runes.push(rune);
}

// Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine';
oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
const gainNode = audioContext.createGain();
gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);
oscillator.start();

// Click detection
const raycaster = new THREE.Raycaster();
const mouseClick = new THREE.Vector2();
document.addEventListener('click', (event) => {
  mouseClick.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseClick.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouseClick, camera);
  const intersects = raycaster.intersectObjects(runes);
  if (intersects.length > 0) {
    const index = runes.indexOf(intersects[0].object);
    userSequence.push(index);
    intersects[0].object.material.color.set(0x00ffcc); // Visual feedback
    if (userSequence.length === puzzleSequence.length) {
      if (JSON.stringify(userSequence) === JSON.stringify(puzzleSequence)) {
        document.getElementById('easter-egg').style.display = 'block';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      }
      userSequence = [];
      runes.forEach(rune => rune.material.color.set(0xff00ff)); // Reset colors
    }
  }
});

// Close easter egg
document.getElementById('close-easter-egg').addEventListener('click', () => {
  document.getElementById('easter-egg').style.display = 'none';
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Black hole rotation
  blackHole.rotation.y += 0.002;

  // Particle movement
  const posArray = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    posArray[i * 3] += velocities[i * 3];
    posArray[i * 3 + 1] += velocities[i * 3 + 1];
    posArray[i * 3 + 2] += velocities[i * 3 + 2];
    const distToBH = Math.sqrt(posArray[i * 3] ** 2 + posArray[i * 3 + 1] ** 2 + posArray[i * 3 + 2] ** 2);
    if (distToBH < 10 || distToBH > 100) {
      posArray[i * 3] = (Math.random() - 0.5) * 100;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // Camera movement
  camera.position.x += (mouse.x * 20 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 20 - camera.position.y) * 0.05;
  camera.lookAt(blackHole.position);

  // Render with lensing effect
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(renderScene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderTarget.setSize(window.innerWidth, window.innerHeight);
});
