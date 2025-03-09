import * as THREE from 'three';

export class BlackHole {
    constructor(app) {
        this.app = app;
        this.blackHole = null;
        this.accretionDisk = null;
        this.eventHorizon = null;
        this.hawkingRadiation = null;
        this.magneticField = null;
        
        // Black hole parameters
        this.blackHoleParams = {
            radius: this.app.config.blackHoleRadius || 10,
            intensity: 1.0,
            rotationSpeed: 0.05,
            distortion: 1.0,
            accretionDiskSize: this.app.config.accretionDiskRadius || 15,
            accretionDiskIntensity: 0.8,
            hawkingIntensity: 0.7,
            magneticFieldStrength: 0.6,
            eventHorizonIntensity: 0.9
        };
    }
    
    /**
     * Initialize the black hole and related effects
     */
    init() {
        this.createBlackHoleMesh();
        this.createAccretionDisk();
        this.createEventHorizonParticles();
        this.createHawkingRadiation();
        this.createMagneticFieldLines();
        
        // Advanced effects
        this.createGravitationalLensing();
        this.createTimeDilationField();
        this.createFrameDraggingEffect();
    }
    
    /**
     * Create black hole mesh
     */
    createBlackHoleMesh() {
        // Black hole is essentially an ultra-dark sphere
        const sphereGeometry = new THREE.SphereGeometry(this.blackHoleParams.radius, 32, 32);
        const blackHoleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: this.blackHoleParams.intensity }
            },
            vertexShader: `
                uniform float time;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normal;
                    vPosition = position;
                    
                    // Slightly deform the sphere for a more organic feel
                    vec3 newPosition = position;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Almost pure black with a hint of deep purple at the edges
                    vec3 normal = normalize(vNormal);
                    float rim = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 6.0) * 0.2;
                    
                    vec3 color = vec3(0.05, 0.0, 0.1) * rim * intensity;
                    
                    // Make the interior incredibly dark
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide
        });
        
        this.blackHole = new THREE.Mesh(sphereGeometry, blackHoleMaterial);
        this.blackHole.userData.shader = blackHoleMaterial;
        this.app.scene.add(this.blackHole);
    }
    
    /**
     * Create accretion disk
     */
    createAccretionDisk() {
        const particleCount = this.app.config.devicePerformance === 'low' ? 5000 : 
                             (this.app.config.devicePerformance === 'medium' ? 10000 : 20000);
        
        const diskGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        const offsetValues = new Float32Array(particleCount);
        
        // Distribute particles in a disk shape
        for (let i = 0; i < particleCount; i++) {
            // Generate random angle and radius for disk shape
            const angle = Math.random() * Math.PI * 2;
            const innerRadius = this.blackHoleParams.radius * 1.05; // Ensure particles start just outside the black hole
            const outerRadius = this.blackHoleParams.accretionDiskSize;
            
            // Distribution with more particles close to the black hole
            const radiusSqrt = Math.sqrt(Math.random());
            const radius = innerRadius + (outerRadius - innerRadius) * radiusSqrt;
            
            // Add some thickness to the disk
            const thickness = 0.5 * (1 - (radius - innerRadius) / (outerRadius - innerRadius));
            const heightVariation = (Math.random() - 0.5) * thickness;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = heightVariation;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Particles are smaller at the inner edge (closer to black hole)
            sizes[i] = Math.max(0.1, Math.random() * 0.2 * (radius / outerRadius));
            
            // Offset values for animation
            offsetValues[i] = Math.random() * Math.PI * 2;
            
            // Colors ranging from hot orange/yellow (inner) to cool blue (outer)
            const normalizedRadius = (radius - innerRadius) / (outerRadius - innerRadius);
            
            if (normalizedRadius < 0.4) {
                // Hot inner region (white to yellow)
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.7 + normalizedRadius * 0.3;
                colors[i * 3 + 2] = normalizedRadius * 0.7;
            } else if (normalizedRadius < 0.7) {
                // Middle region (yellow to orange)
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.6 - (normalizedRadius - 0.4) * 0.5;
                colors[i * 3 + 2] = 0.3 - (normalizedRadius - 0.4) * 0.3;
            } else {
                // Outer region (orange to reddish)
                colors[i * 3] = 1.0 - (normalizedRadius - 0.7) * 0.5;
                colors[i * 3 + 1] = 0.3 - (normalizedRadius - 0.7) * 0.3;
                colors[i * 3 + 2] = 0.1;
            }
        }
        
        diskGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        diskGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        diskGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        diskGeometry.setAttribute('offset', new THREE.BufferAttribute(offsetValues, 1));
        
        // Create shader material
        const diskMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                intensity: { value: this.blackHoleParams.accretionDiskIntensity }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float offset;
                
                uniform float time;
                uniform float pixelRatio;
                uniform float intensity;
                
                varying vec3 vColor;
                varying float vDiscard;
                
                void main() {
                    vColor = color;
                    vDiscard = 0.0;
                    
                    // Get particle distance from center
                    float radius = length(position.xz);
                    
                    // Orbital speed decreases with distance (Keplerian motion)
                    float speed = 0.2 * pow(10.0 / radius, 0.5);
                    
                    // Apply rotation based on radius
                    float angle = time * speed + offset;
                    vec3 pos = position;
                    
                    pos.x = radius * cos(angle);
                    pos.z = radius * sin(angle);
                    
                    // Perturb particles slightly for more chaotic look
                    pos.y += sin(time * 2.0 + offset) * 0.05;
                    
                    // Convert to screen space
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // Scale point size by distance and device pixel ratio
                    gl_PointSize = size * (50.0 / -mvPosition.z) * pixelRatio * intensity;
                    
                    // Set position
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vDiscard;
                
                void main() {
                    if (vDiscard > 0.5) discard;
                    
                    // Create circular particles with soft edges
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    float r = dot(cxy, cxy);
                    float alpha = 1.0 - smoothstep(0.5, 1.0, r);
                    
                    // Apply slight glow effect
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.accretionDisk = new THREE.Points(diskGeometry, diskMaterial);
        this.accretionDisk.userData.shader = diskMaterial;
        this.accretionDisk.frustumCulled = false;
        this.app.scene.add(this.accretionDisk);
    }
    
    /**
     * Create event horizon particles
     */
    createEventHorizonParticles() {
        // Implementation from original code would go here
        // This is a placeholder for module structure
    }
    
    /**
     * Create Hawking radiation particles
     */
    createHawkingRadiation() {
        // Implementation from original code would go here
        // This is a placeholder for module structure
    }
    
    /**
     * Create magnetic field lines
     */
    createMagneticFieldLines() {
        // Implementation from original code would go here
        // This is a placeholder for module structure
    }
    
    /**
     * Create gravitational lensing effect
     */
    createGravitationalLensing() {
        // Implementation from original code would go here
        // This is a placeholder for module structure
    }
    
    /**
     * Create time dilation field
     */
    createTimeDilationField() {
        // Implementation from original code would go here
        // This is a placeholder for module structure
    }
    
    /**
     * Create frame dragging effect
     */
    createFrameDraggingEffect() {
        // Implementation from original code would go here
        // This is a placeholder for module structure
    }
    
    /**
     * Update black hole and related effects
     */
    update(time) {
        // Update all shaders' time uniform
        if (this.blackHole && this.blackHole.userData.shader) {
            this.blackHole.userData.shader.uniforms.time.value = time;
        }
        
        if (this.accretionDisk && this.accretionDisk.userData.shader) {
            this.accretionDisk.userData.shader.uniforms.time.value = time;
        }
        
        // Other updates would go here
    }
} 