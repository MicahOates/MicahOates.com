import * as THREE from 'three';

export class ParticleSystem {
    constructor(app) {
        this.app = app;
        this.particles = null;
        this.particleActivity = 0.0;
    }
    
    /**
     * Initialize the particle system
     */
    init() {
        this.createBackgroundParticles();
    }
    
    /**
     * Create background particles
     */
    createBackgroundParticles() {
        // Get optimal particle count based on device performance
        const particleCount = this.getOptimalParticleCount();
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);
        
        // Create particles with random positions
        for (let i = 0; i < particleCount; i++) {
            // Place particles in a wide spherical volume
            const radius = 20 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random sizes for particles
            sizes[i] = Math.random() * 0.5 + 0.1;
            
            // Random base opacity
            opacities[i] = Math.random() * 0.5 + 0.2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        // Create shader material for particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                activityLevel: { value: 0.0 },
                color: { value: new THREE.Color(this.app.getThemeColor('primary')) }
            },
            vertexShader: `
                attribute float size;
                attribute float opacity;
                
                uniform float time;
                uniform float pixelRatio;
                uniform float activityLevel;
                
                varying float vOpacity;
                
                void main() {
                    vOpacity = opacity;
                    
                    // Get particle position
                    vec3 pos = position;
                    
                    // Add subtle drift in a quantum-like motion
                    float drift = 0.2 + activityLevel * 0.4;
                    pos.x += sin(time * 0.2 + pos.z) * drift;
                    pos.y += cos(time * 0.3 + pos.x) * drift;
                    pos.z += sin(time * 0.1 + pos.y) * drift;
                    
                    // Convert to view space
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // Scale size by distance
                    gl_PointSize = size * pixelRatio * (20.0 / -mvPosition.z);
                    
                    // Increase size with activity level
                    gl_PointSize *= 1.0 + activityLevel * 0.5;
                    
                    // Set position
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float activityLevel;
                
                varying float vOpacity;
                
                void main() {
                    // Create soft circular particle
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center * 2.0);
                    float alpha = (1.0 - smoothstep(0.5, 1.0, dist)) * vOpacity;
                    
                    // Boost alpha with activity level
                    alpha *= 1.0 + activityLevel * 0.3;
                    
                    // Set final color with alpha
                    if (dist > 1.0) discard;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.userData.shader = material;
        this.particles.frustumCulled = false;
        this.app.scene.add(this.particles);
    }
    
    /**
     * Determine optimal particle count based on device performance
     */
    getOptimalParticleCount() {
        const baseCount = 2000;
        
        switch (this.app.config.devicePerformance) {
            case 'low':
                return baseCount * 0.3;
            case 'medium':
                return baseCount * 0.6;
            case 'high':
            default:
                return baseCount;
        }
    }
    
    /**
     * Increase particle activity level (for interactive effects)
     */
    increaseParticleActivity(amount = 0.2) {
        // Increase with a maximum cap
        this.particleActivity = Math.min(1.0, this.particleActivity + amount);
        
        // Gradually decrease over time (handled in update)
    }
    
    /**
     * Update particle system
     */
    update(time) {
        if (!this.particles) return;
        
        // Update time uniform
        this.particles.userData.shader.uniforms.time.value = time;
        
        // Decay activity level over time
        if (this.particleActivity > 0) {
            this.particleActivity -= 0.01;
            this.particleActivity = Math.max(0, this.particleActivity);
            this.particles.userData.shader.uniforms.activityLevel.value = this.particleActivity;
        }
    }
    
    /**
     * Create a quantum particle effect (for interactive events)
     */
    createQuantumFluctuationEffect(position, intensity = 1.0) {
        // Create a small burst of particles
        const particleCount = this.app.config.devicePerformance === 'low' ? 10 : 
                             (this.app.config.devicePerformance === 'medium' ? 20 : 30);
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create particles around given position
        for (let i = 0; i < particleCount; i++) {
            // Random position around the center
            const offset = 0.5;
            positions[i * 3] = position.x + (Math.random() - 0.5) * offset;
            positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * offset;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * offset;
            
            // Random sizes
            sizes[i] = Math.random() * 0.2 + 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create shader material for particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                startTime: { value: time },
                intensity: { value: intensity },
                color: { value: new THREE.Color(this.app.getThemeColor('primary')) }
            },
            vertexShader: `
                attribute float size;
                
                uniform float time;
                uniform float startTime;
                uniform float pixelRatio;
                uniform float intensity;
                
                varying float vAge;
                
                void main() {
                    // Calculate age of the effect
                    vAge = (time - startTime) / 2.0; // Life span of 2 seconds
                    
                    // Expand particles outward over time
                    vec3 pos = position;
                    vec3 dir = normalize(position);
                    
                    float expansionDistance = vAge * 5.0;
                    pos = pos + dir * expansionDistance * intensity;
                    
                    // Convert to view space
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // Size decreases over lifetime
                    float sizeMultiplier = max(0.0, 1.0 - vAge);
                    gl_PointSize = size * pixelRatio * (20.0 / -mvPosition.z) * sizeMultiplier * intensity;
                    
                    // Set position
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                
                varying float vAge;
                
                void main() {
                    // Discard if past lifetime
                    if (vAge >= 1.0) discard;
                    
                    // Create soft circular particle that fades out over time
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center * 2.0);
                    float alpha = (1.0 - smoothstep(0.5, 1.0, dist)) * (1.0 - vAge);
                    
                    // Set final color with alpha
                    if (dist > 1.0) discard;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.frustumCulled = false;
        this.app.scene.add(particles);
        
        // Auto-remove after lifetime
        setTimeout(() => {
            this.app.scene.remove(particles);
            geometry.dispose();
            material.dispose();
        }, 2000);
        
        // Increase overall particle activity
        this.increaseParticleActivity(0.3);
    }
} 