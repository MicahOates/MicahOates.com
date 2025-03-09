// Three.js setup - using modern ES6 architecture
const app = {
    scene: null,
    camera: null,
    renderer: null,
    blackHole: null,
    particles: null,
    composer: null,
    clock: new THREE.Clock(),
    sizes: {
        width: window.innerWidth,
        height: window.innerHeight
    },
    mouse: { x: 0, y: 0 },
    orbData: [],
    fragments: [],
    initialized: false,
    config: {
        particleCount: 2000,
        blackHoleRadius: 10,
        accretionDiskRadius: 15,
        bloom: true
    },
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
        this.camera.position.z = 50;
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('scene'),
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance' 
        });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add loading indicator
        this.showLoader();
        
        // Initialize components
        this.initBlackHole();
        this.initParticles();
        this.initPostProcessing();
        this.initOrbs();
        this.initEventListeners();
        
        // Hide loader when everything is ready
        setTimeout(() => {
            this.hideLoader();
            this.initialized = true;
        }, 1500);
        
        // Start animation loop
        this.animate();
    },
    
    showLoader() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div class="spinner"></div>
            <div class="loader-text">Initializing Singularity...</div>
        `;
        document.body.appendChild(loader);
    },
    
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 500);
        }
    },
    
    initBlackHole() {
        // Create enhanced black hole with more realistic shader
        const blackHoleGeometry = new THREE.SphereGeometry(this.config.blackHoleRadius, 64, 64);
        const blackHoleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                float rand(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    // Calculate normalized coordinates
                    vec2 uv = vUv - 0.5;
                    float dist = length(uv);
                    
                    // Event horizon (center of black hole)
                    float eventHorizon = 0.2;
                    
                    // Accretion disk effect with dynamic colors
                    float diskStart = eventHorizon;
                    float diskEnd = 0.45;
                    float diskMask = smoothstep(diskStart, diskStart + 0.01, dist) * (1.0 - smoothstep(diskEnd - 0.1, diskEnd, dist));
                    
                    // Add swirling motion to the disk
                    float angle = atan(uv.y, uv.x);
                    float swirl = sin(angle * 6.0 + time * 2.0 + dist * 15.0);
                    
                    // Create color bands in the disk
                    vec3 diskColor = mix(
                        vec3(1.0, 0.1, 0.8), // Hot pink
                        vec3(0.0, 0.7, 1.0),  // Cyan
                        smoothstep(0.0, 1.0, sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5)
                    );
                    
                    // Add stars in the background
                    float stars = 0.0;
                    if (dist > diskEnd) {
                        vec2 gridPosition = floor(vUv * 100.0) / 100.0;
                        stars = step(0.995, rand(gridPosition + time * 0.01)) * 0.5;
                    }
                    
                    // Gravitational lensing effect
                    float lensing = 1.0 / (1.0 + 20.0 * dist * dist) * 0.5;
                    
                    // Combine effects
                    vec3 finalColor = diskColor * diskMask + vec3(stars) + vec3(lensing) * vec3(0.6, 0.0, 1.0);
                    
                    // Event horizon is pure black
                    if (dist < eventHorizon) {
                        finalColor = vec3(0.0);
                    }
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });
        
        this.blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        this.scene.add(this.blackHole);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(this.config.blackHoleRadius * 1.2, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 glowColor = mix(vec3(0.6, 0.0, 1.0), vec3(0.0, 0.7, 1.0), sin(time) * 0.5 + 0.5);
                    gl_FragColor = vec4(glowColor, intensity * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(glow);
    },
    
    initParticles() {
        // Improved particle system using buffer geometry
        const particleCount = this.getOptimalParticleCount();
        const particleGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = []; // For animation, not part of buffer
        
        const diskRadius = this.config.accretionDiskRadius;
        const diskThickness = 2.5;
        const colorOptions = [
            new THREE.Color(0xff00ff), // Magenta
            new THREE.Color(0x00ffff), // Cyan
            new THREE.Color(0xffffff), // White
            new THREE.Color(0x9900ff)  // Purple
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Create spiral distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = diskRadius + (Math.random() - 0.5) * 10;
            const spiralOffset = Math.random() * Math.PI * 20;
            const armOffset = Math.random() < 0.5 ? 0 : Math.PI;
            
            const x = Math.cos(angle + spiralOffset + armOffset) * radius;
            const y = Math.sin(angle + spiralOffset + armOffset) * radius;
            const z = (Math.random() - 0.5) * diskThickness * (radius / diskRadius);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random particle size variation
            sizes[i] = Math.random() * 0.5 + 0.1;
            
            // Random colors from palette
            const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Store velocities for animation
            const speed = (0.05 + Math.random() * 0.03) * (radius < diskRadius ? 1.2 : 0.8);
            velocities.push({
                vx: Math.sin(angle) * speed,
                vy: -Math.cos(angle) * speed,
                vz: 0,
                turbulence: Math.random() * 0.01
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Use custom shader for better particles
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                uniform float time;
                uniform float pixelRatio;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Calculate distance from center of point
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float r = length(xy);
                    
                    // Discard pixels outside of circle
                    if (r > 0.5) discard;
                    
                    // Create soft edge
                    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        
        this.particles = {
            points: new THREE.Points(particleGeometry, particleMaterial),
            geometry: particleGeometry,
            velocities: velocities
        };
        
        this.scene.add(this.particles.points);
    },
    
    getOptimalParticleCount() {
        // Adjust particle count based on device performance
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowPerformance = isMobile || (window.devicePixelRatio < 2);
        
        return isLowPerformance ? 
            Math.floor(this.config.particleCount * 0.5) : 
            this.config.particleCount;
    },
    
    initPostProcessing() {
        // Skip post-processing on mobile to save performance
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.config.bloom = false;
            return;
        }
        
        // Create composer with effects
        this.composer = new THREE.EffectComposer(this.renderer);
        
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        if (this.config.bloom) {
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.sizes.width, this.sizes.height),
                1.5,  // strength
                0.4,  // radius
                0.85  // threshold
            );
            this.composer.addPass(bloomPass);
        }
        
        // Add subtle film grain and color adjustment
        const filmPass = new THREE.ShaderPass({
            uniforms: {
                time: { value: 0 },
                nIntensity: { value: 0.2 },
                sIntensity: { value: 0.2 },
                grayscale: { value: 0 },
                tint: { value: new THREE.Vector3(1.05, 0.97, 1.1) }
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
                uniform float nIntensity;
                uniform float sIntensity;
                uniform int grayscale;
                uniform vec3 tint;
                varying vec2 vUv;
                uniform sampler2D tDiffuse;
                
                float rand(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    // Add film grain
                    vec2 noiseCoord = vUv + time;
                    float noise = rand(noiseCoord) * nIntensity;
                    
                    // Add scanlines
                    float scanline = sin(vUv.y * 800.0) * sIntensity;
                    
                    // Combine effects
                    color.rgb += noise - scanline;
                    
                    // Apply tint
                    color.rgb *= tint;
                    
                    // Optional grayscale
                    if (grayscale == 1) {
                        float average = (color.r + color.g + color.b) / 3.0;
                        color.rgb = vec3(average);
                    }
                    
                    gl_FragColor = color;
                }
            `
        });
        this.composer.addPass(filmPass);
    },
    
    initOrbs() {
        const orbs = document.querySelectorAll('.orb');
        this.orbData = Array.from(orbs).map((orb, index) => {
            // Calculate starting positions in a circle
            const totalOrbs = orbs.length;
            const angle = (index / totalOrbs) * Math.PI * 2;
            const radius = Math.min(this.sizes.width, this.sizes.height) * 0.3;
            
            return {
                element: orb,
                x: this.sizes.width / 2 + Math.cos(angle) * radius,
                y: this.sizes.height / 2 + Math.sin(angle) * radius,
                targetX: 0,
                targetY: 0,
                vx: 0,
                vy: 0,
                radius: radius,
                angle: angle,
                baseAngle: angle,
                speed: 0.005 + Math.random() * 0.005,
                entangled: false,
                hoverState: false,
                pulsePhase: Math.random() * Math.PI * 2
            };
        });
        
        // Position orbs initially
        this.updateOrbPositions();
    },
    
    initEventListeners() {
        // Mouse Movement
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / this.sizes.width) * 2 - 1;
            this.mouse.y = -(e.clientY / this.sizes.height) * 2 + 1;
            
            // Update quantum state based on observer effect
            this.updateQuantumState(e.clientX, e.clientY);
        });
        
        // Input Handling
        const input = document.getElementById('data-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value) {
                this.createDataFragment(input.value);
                input.value = '';
            }
        });
        
        // Window Resize
        window.addEventListener('resize', () => {
            // Update sizes
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;
            
            // Update camera
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();
            
            // Update renderer
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Update composer if it exists
            if (this.composer) {
                this.composer.setSize(this.sizes.width, this.sizes.height);
            }
            
            // Recalculate orb positions
            this.orbData.forEach((orb, index) => {
                const totalOrbs = this.orbData.length;
                const angle = (index / totalOrbs) * Math.PI * 2;
                orb.radius = Math.min(this.sizes.width, this.sizes.height) * 0.3;
                orb.baseAngle = angle;
            });
        });
        
        // Orb hover effects
        document.querySelectorAll('.orb').forEach((orb, index) => {
            orb.addEventListener('mouseenter', () => {
                if (this.orbData[index]) {
                    this.orbData[index].hoverState = true;
                    orb.classList.add('hovered');
                }
            });
            
            orb.addEventListener('mouseleave', () => {
                if (this.orbData[index]) {
                    this.orbData[index].hoverState = false;
                    orb.classList.remove('hovered');
                }
            });
        });
    },
    
    updateQuantumState(mouseX, mouseY) {
        // Only update occasionally for quantum "jumps"
        if (Math.random() > 0.01) return;
        
        // Find closest orb to mouse
        let closestOrb = null;
        let minDistance = Infinity;
        
        this.orbData.forEach(orb => {
            const dx = mouseX - orb.x;
            const dy = mouseY - orb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestOrb = orb;
            }
        });
        
        // Quantum entanglement between closest orb and random other orb
        if (closestOrb && minDistance < 150 && Math.random() > 0.7) {
            closestOrb.entangled = true;
            
            // Find another random orb to entangle with
            const otherOrbs = this.orbData.filter(orb => orb !== closestOrb);
            if (otherOrbs.length > 0) {
                const randomOrb = otherOrbs[Math.floor(Math.random() * otherOrbs.length)];
                randomOrb.entangled = true;
                
                // Create temporary connection line
                this.createQuantumConnection(closestOrb, randomOrb);
                
                // Reset after a short time
                setTimeout(() => {
                    closestOrb.entangled = false;
                    randomOrb.entangled = false;
                }, 2000);
            }
        }
    },
    
    createQuantumConnection(orb1, orb2) {
        const connection = document.createElement('div');
        connection.className = 'quantum-connection';
        document.getElementById('ui').appendChild(connection);
        
        // Animate connection line
        const duration = 2000;
        const startTime = Date.now();
        
        const updateLine = () => {
            const dx = orb2.x - orb1.x;
            const dy = orb2.y - orb1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Calculate elapsed percentage
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Animate line length
            connection.style.width = `${distance * progress}px`;
            connection.style.left = `${orb1.x}px`;
            connection.style.top = `${orb1.y}px`;
            connection.style.transform = `rotate(${angle}rad)`;
            connection.style.opacity = Math.sin(progress * Math.PI);
            
            if (progress < 1) {
                requestAnimationFrame(updateLine);
            } else {
                connection.remove();
            }
        };
        
        updateLine();
    },
    
    createDataFragment(text) {
        // Create visual fragment
        const fragment = document.createElement('div');
        fragment.className = 'data-fragment';
        
        // Create abbreviated text display or emoji based on input
        const displayText = text.length <= 2 ? text : text.slice(0, 2);
        fragment.textContent = displayText;
        
        // Randomize colors
        const hue = Math.floor(Math.random() * 360);
        fragment.style.background = `radial-gradient(circle, hsl(${hue}, 100%, 70%) 20%, hsl(${hue + 40}, 100%, 50%) 80%)`;
        
        document.getElementById('orbs').appendChild(fragment);
        
        // Add to fragments array for physics updates
        this.fragments.push({
            element: fragment,
            x: this.sizes.width / 2,
            y: this.sizes.height - 50,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 4 - 3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            size: 30 + Math.random() * 20,
            text: text
        });
    },
    
    updateOrbPositions() {
        this.orbData.forEach(orb => {
            // Update orbit angle with individual speeds
            orb.angle = orb.baseAngle + this.clock.getElapsedTime() * orb.speed;
            
            // Calculate base position
            orb.targetX = this.sizes.width / 2 + Math.cos(orb.angle) * orb.radius;
            orb.targetY = this.sizes.height / 2 + Math.sin(orb.angle) * orb.radius;
            
            // Apply mouse repulsion
            if (this.mouse.x !== 0 || this.mouse.y !== 0) {
                const mouseWorldX = this.mouse.x * this.sizes.width / 2;
                const mouseWorldY = this.mouse.y * this.sizes.height / 2;
                
                const dx = orb.targetX - (this.sizes.width / 2 + mouseWorldX);
                const dy = orb.targetY - (this.sizes.height / 2 + mouseWorldY);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const force = 100 / Math.max(distance, 50);
                    orb.vx += dx * 0.001 * force;
                    orb.vy += dy * 0.001 * force;
                }
            }
            
            // Apply velocities with damping
            orb.vx *= 0.95;
            orb.vy *= 0.95;
            
            // Smooth transitioning to target position
            orb.x = THREE.MathUtils.lerp(orb.x, orb.targetX + orb.vx * 30, 0.1);
            orb.y = THREE.MathUtils.lerp(orb.y, orb.targetY + orb.vy * 30, 0.1);
            
            // Quantum effects - subtle random jumps
            if (Math.random() < 0.001) {
                orb.x += (Math.random() - 0.5) * 20;
                orb.y += (Math.random() - 0.5) * 20;
            }
            
            // Update DOM element
            const size = orb.hoverState ? 70 : 60;
            orb.element.style.left = `${orb.x - size/2}px`;
            orb.element.style.top = `${orb.y - size/2}px`;
            orb.element.style.width = `${size}px`;
            orb.element.style.height = `${size}px`;
            
            // Update visual state
            if (orb.entangled) {
                orb.element.style.background = 'radial-gradient(circle, #00ffff 20%, #ff00ff 80%)';
                orb.element.style.boxShadow = '0 0 20px #00ffff';
            } else if (orb.hoverState) {
                orb.element.style.background = 'radial-gradient(circle, #ffffff 20%, #ff00ff 80%)';
                orb.element.style.boxShadow = '0 0 15px #ff00ff';
            } else {
                // Pulsing effect
                const pulse = Math.sin(this.clock.getElapsedTime() * 3 + orb.pulsePhase) * 0.1 + 0.9;
                orb.element.style.background = 'radial-gradient(circle, #fff 20%, #ff00ff 80%)';
                orb.element.style.boxShadow = `0 0 ${10 * pulse}px #ff00ff`;
                orb.element.style.transform = `scale(${pulse})`;
            }
        });
    },
    
    updateFragments() {
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const frag = this.fragments[i];
            
            // Apply physics
            frag.x += frag.vx;
            frag.y += frag.vy;
            frag.rotation += frag.rotationSpeed;
            
            // Gravity toward black hole (center)
            const dx = this.sizes.width / 2 - frag.x;
            const dy = this.sizes.height / 2 - frag.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Stronger gravity as fragments get closer
            const gravityForce = 0.1 * (1 + 100 / Math.max(dist, 100));
            frag.vx += Math.cos(angle) * gravityForce;
            frag.vy += Math.sin(angle) * gravityForce;
            
            // Add slight turbulence
            frag.vx += (Math.random() - 0.5) * 0.1;
            frag.vy += (Math.random() - 0.5) * 0.1;
            
            // Update visual elements
            if (frag.element) {
                // Position
                frag.element.style.left = `${frag.x - frag.size/2}px`;
                frag.element.style.top = `${frag.y - frag.size/2}px`;
                
                // Size and rotation (shrink as it approaches center)
                const scale = Math.min(1, dist / 100);
                frag.element.style.width = `${frag.size * scale}px`;
                frag.element.style.height = `${frag.size * scale}px`;
                frag.element.style.transform = `rotate(${frag.rotation}rad) scale(${scale})`;
                frag.element.style.opacity = scale;
                
                // Remove when it reaches the black hole
                if (dist < 50) {
                    // Create absorption effect
                    this.createAbsorptionEffect(frag);
                    
                    frag.element.remove();
                    this.fragments.splice(i, 1);
                }
            }
        }
    },
    
    createAbsorptionEffect(fragment) {
        // Create particle explosion when absorbed
        const particleCount = 8;
        const particles = [];
        
        // Create particle container
        const container = document.createElement('div');
        container.className = 'absorption-particles';
        container.style.left = `${fragment.x}px`;
        container.style.top = `${fragment.y}px`;
        document.getElementById('ui').appendChild(container);
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'absorption-particle';
            
            // Use same color as fragment
            particle.style.background = fragment.element.style.background;
            
            container.appendChild(particle);
            
            // Calculate random direction
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            particles.push({
                element: particle,
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
        }
        
        // Animate particles
        let frameCount = 0;
        const maxFrames = 30;
        
        const animateParticles = () => {
            frameCount++;
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.element.style.transform = `translate(${p.x}px, ${p.y}px) scale(${1 - frameCount/maxFrames})`;
                p.element.style.opacity = 1 - frameCount/maxFrames;
            });
            
            if (frameCount < maxFrames) {
                requestAnimationFrame(animateParticles);
            } else {
                container.remove();
            }
        };
        
        animateParticles();
    },
    
    updateParticles() {
        if (!this.particles) return;
        
        const time = this.clock.getElapsedTime();
        const positions = this.particles.geometry.attributes.position.array;
        
        // Update particle positions
        for (let i = 0; i < positions.length / 3; i++) {
            // Apply velocity
            positions[i * 3] += this.particles.velocities[i].vx;
            positions[i * 3 + 1] += this.particles.velocities[i].vy;
            
            // Apply turbulence
            const turbulence = this.particles.velocities[i].turbulence;
            positions[i * 3] += Math.sin(time * 5 + i) * turbulence;
            positions[i * 3 + 1] += Math.cos(time * 5 + i) * turbulence;
            
            // Distance from center
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const dist = Math.sqrt(x * x + y * y);
            
            // Reset particles that get too close or too far
            if (dist < 10 || dist > 35) {
                // Create a new particle in the disk
                const angle = Math.random() * Math.PI * 2;
                const radius = this.config.accretionDiskRadius + (Math.random() - 0.5) * 5;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = Math.sin(angle) * radius;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
                
                const speed = 0.05 + Math.random() * 0.03;
                this.particles.velocities[i].vx = Math.sin(angle) * speed;
                this.particles.velocities[i].vy = -Math.cos(angle) * speed;
            }
        }
        
        // Update shader uniforms
        this.particles.points.material.uniforms.time.value = time;
        
        // Flag for GPU update
        this.particles.geometry.attributes.position.needsUpdate = true;
    },
    
    updateShaders(time) {
        // Update black hole shader
        if (this.blackHole && this.blackHole.material.uniforms) {
            this.blackHole.material.uniforms.time.value = time;
            
            // Rotate the black hole slowly
            this.blackHole.rotation.z = time * 0.05;
        }
        
        // Update post-processing uniforms if available
        if (this.composer) {
            const passes = this.composer.passes;
            for (let i = 0; i < passes.length; i++) {
                if (passes[i].uniforms && passes[i].uniforms.time) {
                    passes[i].uniforms.time.value = time;
                }
            }
        }
    },
    
    animate() {
        const time = this.clock.getElapsedTime();
        
        // Update particles
        this.updateParticles();
        
        // Update shader uniforms
        this.updateShaders(time);
        
        // Update UI elements
        this.updateOrbPositions();
        this.updateFragments();
        
        // Render scene
        if (this.composer && this.config.bloom) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Continue animation loop
        requestAnimationFrame(() => this.animate());
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Load any polyfills or dependencies first
    if (!THREE.EffectComposer) {
        // Create simple replacements if full Three.js post-processing not available
        THREE.EffectComposer = function(renderer) {
            this.renderer = renderer;
            this.passes = [];
            this.render = function() { renderer.render(app.scene, app.camera); };
            this.addPass = function(pass) { this.passes.push(pass); };
            this.setSize = function(w, h) { /* no-op */ };
        };
        
        THREE.RenderPass = function(scene, camera) { this.uniforms = {}; };
        THREE.ShaderPass = function(shader) { this.uniforms = shader.uniforms || {}; };
        THREE.UnrealBloomPass = function() { this.uniforms = {}; };
    }
    
    // Initialize app
    app.init();
});