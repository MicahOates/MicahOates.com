// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 50;

// Black Hole (Sphere with Shader)
const blackHoleGeometry = new THREE.SphereGeometry(10, 32, 32);
const blackHoleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv - 0.5;
            float dist = length(uv);
            float swirl = sin(dist * 10.0 - time * 2.0) * 0.1;
            vec3 color = vec3(0.0);
            if (dist < 0.2) color = vec3(0.0); // Event horizon
            else if (dist < 0.3) color = vec3(1.0, 0.0, 1.0) * (1.0 - smoothstep(0.2, 0.3, dist)); // Accretion disk
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.DoubleSide
});
const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
scene.add(blackHole);

// Particle System (Accretion Disk)
const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 5;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    velocities[i * 3] = Math.sin(angle) * 0.05;
    velocities[i * 3 + 1] = -Math.cos(angle) * 0.05;
    velocities[i * 3 + 2] = 0;
}
particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({ color: 0xff00ff, size: 0.2 });
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Quantum Orbs (HTML + Physics)
const orbs = document.querySelectorAll('.orb');
const orbData = Array.from(orbs).map(orb => ({
    element: orb,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 200,
    angle: Math.random() * Math.PI * 2,
    entangled: false
}));

// Data Fragments
const fragments = [];

// Mouse Interaction
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Input Handling
const input = document.getElementById('data-input');
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value) {
        const fragment = document.createElement('div');
        fragment.className = 'orb';
        fragment.style.width = '30px';
        fragment.style.height = '30px';
        fragment.textContent = input.value.slice(0, 2);
        document.getElementById('orbs').appendChild(fragment);
        fragments.push({
            element: fragment,
            x: window.innerWidth / 2,
            y: window.innerHeight - 50,
            vx: (Math.random() - 0.5) * 2,
            vy: -2
        });
        input.value = '';
    }
});

// Animation Loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Black Hole Shader
    blackHoleMaterial.uniforms.time.value = time;

    // Particle Animation
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        const dist = Math.sqrt(positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2);
        if (dist < 10 || dist > 20) {
            const angle = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * 15;
            positions[i * 3 + 1] = Math.sin(angle) * 15;
            velocities[i * 3] = Math.sin(angle) * 0.05;
            velocities[i * 3 + 1] = -Math.cos(angle) * 0.05;
        }
    }
    particles.attributes.position.needsUpdate = true;

    // Orb Physics
    orbData.forEach((orb, i) => {
        orb.angle += 0.02;
        const baseX = window.innerWidth / 2 + orb.radius * Math.cos(orb.angle);
        const baseY = window.innerHeight / 2 + orb.radius * Math.sin(orb.angle);
        
        // Mouse repulsion
        const dx = mouseX * window.innerWidth / 2 - baseX;
        const dy = mouseY * window.innerHeight / 2 - baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
            orb.vx -= dx * 0.001;
            orb.vy -= dy * 0.001;
        }

        // Quantum Entanglement Effect
        if (Math.random() < 0.01) orb.entangled = !orb.entangled;
        if (orb.entangled) orb.element.style.background = 'radial-gradient(circle, #00ffff 20%, #ff00ff 80%)';

        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vx *= 0.95; // Damping
        orb.vy *= 0.95;
        orb.x = THREE.MathUtils.lerp(orb.x, baseX, 0.1);
        orb.y = THREE.MathUtils.lerp(orb.y, baseY, 0.1);

        orb.element.style.left = `${orb.x - 30}px`;
        orb.element.style.top = `${orb.y - 30}px`;
    });

    // Fragment Physics
    fragments.forEach((frag, i) => {
        frag.x += frag.vx;
        frag.y += frag.vy;
        frag.vy += 0.05; // Gravity toward black hole
        const dx = window.innerWidth / 2 - frag.x;
        const dy = window.innerHeight / 2 - frag.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50) {
            frag.element.remove();
            fragments.splice(i, 1);
        } else {
            frag.element.style.left = `${frag.x - 15}px`;
            frag.element.style.top = `${frag.y - 15}px`;
        }
    });

    renderer.render(scene, camera);
}
animate();

// Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});