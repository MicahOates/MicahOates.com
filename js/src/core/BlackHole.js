import * as THREE from 'three';
import {
    blackHoleVertexShader,
    blackHoleFragmentShader,
    accretionDiskVertexShader,
    accretionDiskFragmentShader,
    eventHorizonVertexShader,
    eventHorizonFragmentShader,
    hawkingRadiationVertexShader,
    hawkingRadiationFragmentShader,
    magneticFieldVertexShader,
    magneticFieldFragmentShader
} from '../shaders/BlackHoleShader.js';

export class BlackHole {
    constructor(app) {
        this.app = app;
        this.blackHole = null;
        this.accretionDisk = null;
        this.eventHorizon = null;
        this.hawkingRadiation = null;
        this.magneticFieldLines = [];
        this.hawkingRadiationData = null;
        
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
            eventHorizonIntensity: 0.9,
            lensStrength: 3.0
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
        
        // Advanced effects - will be implemented later
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
            vertexShader: blackHoleVertexShader,
            fragmentShader: blackHoleFragmentShader,
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
            vertexShader: accretionDiskVertexShader,
            fragmentShader: accretionDiskFragmentShader,
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
        const particleCount = 300;
        const horizonRadius = this.blackHoleParams.radius * 1.1;
        
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const primaryColor = new THREE.Color(this.app.getThemeColor('primary') || '#ff00ff');
        const secondaryColor = new THREE.Color(this.app.getThemeColor('secondary') || '#00ffff');
        
        for (let i = 0; i < particleCount; i++) {
            // Create particles on a sphere around the event horizon
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = horizonRadius * Math.sin(phi) * Math.cos(theta);
            const y = horizonRadius * Math.sin(phi) * Math.sin(theta);
            const z = horizonRadius * Math.cos(phi);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random color between primary and secondary
            const mixAmount = Math.random();
            const color = new THREE.Color().lerpColors(primaryColor, secondaryColor, mixAmount);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Varied particle sizes
            sizes[i] = Math.random() * 0.5 + 0.1;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create shader material
        const particlesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: eventHorizonVertexShader,
            fragmentShader: eventHorizonFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.eventHorizonParticles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.eventHorizonParticles.userData.shader = particlesMaterial;
        this.eventHorizonParticles.frustumCulled = false;
        this.app.scene.add(this.eventHorizonParticles);
    }
    
    /**
     * Create Hawking radiation particles
     */
    createHawkingRadiation() {
        // Reduce particle count based on device performance
        const particleCount = this.app.config.devicePerformance === 'low' ? 150 : 
                             (this.app.config.devicePerformance === 'medium' ? 300 : 400);
        const particles = new THREE.BufferGeometry();
        
        // Set up particle attributes
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const types = new Float32Array(particleCount);
        const indexes = new Float32Array(particleCount); // Add vertex index attribute
        
        // Initial particle state - place them away from the scene at first
        for (let i = 0; i < particleCount; i++) {
            // Start particles farther out in a spherical formation
            const phi = Math.random() * Math.PI * 2;
            const cosTheta = Math.random() * 2 - 1;
            const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
            const radius = this.blackHoleParams.radius * 1.2 + Math.random() * 0.5;
            
            positions[i * 3] = radius * sinTheta * Math.cos(phi);
            positions[i * 3 + 1] = radius * sinTheta * Math.sin(phi);
            positions[i * 3 + 2] = radius * cosTheta;
            
            // Smaller, more subtle particles
            sizes[i] = Math.random() * 0.05 + 0.02;
            
            // Alternating particle types (escaping/in-falling)
            types[i] = i % 2 === 0 ? 1.0 : 0.0;
            
            // Store the vertex index as an attribute
            indexes[i] = i;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particles.setAttribute('particleType', new THREE.BufferAttribute(types, 1));
        particles.setAttribute('vertexIndex', new THREE.BufferAttribute(indexes, 1)); // Add vertex index attribute
        
        // Create shader material with improved transparency and blending
        const hawkingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                escapeColor: { value: new THREE.Color(0x82C6F0) }, // Soft blue
                infallColor: { value: new THREE.Color(0xF0A082) }, // Soft orange
                pixelRatio: { value: window.devicePixelRatio },
                intensity: { value: this.blackHoleParams.hawkingIntensity }
            },
            vertexShader: hawkingRadiationVertexShader,
            fragmentShader: hawkingRadiationFragmentShader,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending
        });
        
        // Create the Hawking radiation particle system
        this.hawkingRadiation = new THREE.Points(particles, hawkingMaterial);
        this.hawkingRadiation.userData.shader = hawkingMaterial;
        
        // Only add to scene if intensity is above minimum threshold
        if (this.blackHoleParams.hawkingIntensity > 0.1) {
            this.app.scene.add(this.hawkingRadiation);
        }
        
        // Store original positions and other properties for animation
        this.hawkingRadiationData = {
            positions: positions,
            sizes: sizes,
            particleType: types,
            particleCount: particleCount,
            horizonRadius: this.blackHoleParams.radius,
            emissionRadius: this.blackHoleParams.radius * 1.2, // Slightly farther from event horizon
            lastUpdateTime: 0
        };
    }
    
    /**
     * Create magnetic field lines
     */
    createMagneticFieldLines() {
        const lineCount = 12;
        const pointsPerLine = 50;
        
        const primaryColor = new THREE.Color(this.app.getThemeColor('primary') || '#ff00ff');
        const secondaryColor = new THREE.Color(this.app.getThemeColor('secondary') || '#00ffff');
        
        this.magneticFieldLines = [];
        
        for (let i = 0; i < lineCount; i++) {
            const lineGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(pointsPerLine * 3);
            const lineProgress = new Float32Array(pointsPerLine);
            
            // Create a randomized starting position around the black hole
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const startRadius = this.blackHoleParams.radius * 1.2;
            const startX = startRadius * Math.sin(phi) * Math.cos(theta);
            const startY = startRadius * Math.sin(phi) * Math.sin(theta);
            const startZ = startRadius * Math.cos(phi);
            
            // Create the field line points
            for (let j = 0; j < pointsPerLine; j++) {
                const t = j / (pointsPerLine - 1);
                
                // Create a spiraling path
                const radius = startRadius + t * 15;
                const spiralAngle = theta + t * 10 + i * (Math.PI * 2 / lineCount);
                const spiralHeight = startZ + (Math.random() - 0.5) * 5;
                
                const x = radius * Math.cos(spiralAngle);
                const y = radius * Math.sin(spiralAngle);
                const z = spiralHeight * (1 - t); // Field lines flatten out
                
                positions[j * 3] = x;
                positions[j * 3 + 1] = y;
                positions[j * 3 + 2] = z;
                
                // Store progress along the line (0-1)
                lineProgress[j] = t;
            }
            
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            lineGeometry.setAttribute('lineProgress', new THREE.BufferAttribute(lineProgress, 1));
            
            // Create material with custom shader
            const lineMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    fieldStrength: { value: this.blackHoleParams.magneticFieldStrength },
                    startColor: { value: primaryColor },
                    endColor: { value: secondaryColor }
                },
                vertexShader: magneticFieldVertexShader,
                fragmentShader: magneticFieldFragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.userData.shader = lineMaterial;
            this.app.scene.add(line);
            this.magneticFieldLines.push(line);
        }
    }
    
    /**
     * Create gravitational lensing effect
     */
    createGravitationalLensing() {
        // Placeholder - will be implemented in a separate module
    }
    
    /**
     * Create time dilation field
     */
    createTimeDilationField() {
        // Placeholder - will be implemented in a separate module
    }
    
    /**
     * Create frame dragging effect
     */
    createFrameDraggingEffect() {
        // Placeholder - will be implemented in a separate module
    }
    
    /**
     * Update Hawking radiation particles
     */
    updateHawkingRadiation(time) {
        // Skip update if effect doesn't exist or is disabled
        if (!this.hawkingRadiation || 
            !this.blackHoleParams || 
            this.blackHoleParams.hawkingIntensity <= 0.1) {
            
            // If visible but should be hidden, remove from scene
            if (this.hawkingRadiation && this.app.scene.children.includes(this.hawkingRadiation) && 
                (!this.blackHoleParams || this.blackHoleParams.hawkingIntensity <= 0.1)) {
                this.app.scene.remove(this.hawkingRadiation);
            }
            
            return;
        }
        
        // If it should be visible but isn't in the scene, add it
        if (!this.app.scene.children.includes(this.hawkingRadiation)) {
            this.app.scene.add(this.hawkingRadiation);
        }
        
        // Update shader time uniform with a slower value to reduce flickering
        this.hawkingRadiation.material.uniforms.time.value = time * 0.5;
        this.hawkingRadiation.material.uniforms.intensity.value = this.blackHoleParams.hawkingIntensity;
        
        // Get references to stored data
        const { positions, sizes, particleType, particleCount, horizonRadius, emissionRadius } = this.hawkingRadiationData;
        
        // Get current intensity (clamped to prevent extreme values)
        const intensity = Math.min(1.5, Math.max(0.1, this.blackHoleParams.hawkingIntensity));
        
        // Update geometry for animation
        const positionAttribute = this.hawkingRadiation.geometry.getAttribute('position');
        
        // Use time to create a emission rate that depends on intensity
        // Lower emission rate to reduce visual noise
        const emissionRate = 0.02 * intensity;
        const emitParticle = Math.random() < emissionRate;
        
        for (let i = 0; i < particleCount; i++) {
            // Calculate current position
            let x = positionAttribute.array[i * 3];
            let y = positionAttribute.array[i * 3 + 1];
            let z = positionAttribute.array[i * 3 + 2];
            
            // Calculate distance to center
            const distance = Math.sqrt(x * x + y * y + z * z);
            
            // Determine if this is an escaping or infalling particle
            const isEscaping = particleType[i] > 0.5;
            
            // Apply movement based on particle type
            if (isEscaping) {
                // Escaping particles move outward
                const dirX = x / distance;
                const dirY = y / distance;
                const dirZ = z / distance;
                
                // Increase speed farther from black hole
                const speedFactor = 0.02 + (distance / horizonRadius) * 0.01;
                x += dirX * speedFactor;
                y += dirY * speedFactor;
                z += dirZ * speedFactor;
            } else {
                // Infalling particles move inward
                const dirX = -x / distance;
                const dirY = -y / distance;
                const dirZ = -z / distance;
                
                // Increase speed closer to black hole
                const speedFactor = 0.01 + (horizonRadius / distance) * 0.02;
                x += dirX * speedFactor;
                y += dirY * speedFactor;
                z += dirZ * speedFactor;
            }
            
            // Reset particles that get too far away or fall into black hole
            // More controlled respawn logic
            if (distance > 20 || distance < horizonRadius) {
                // Only emit new particles based on emission rate
                if (emitParticle || i % 50 === 0) { // Much less frequent respawning
                    // Similar to creation logic - reset at emission radius
                    const phi = Math.random() * Math.PI * 2;
                    const cosTheta = Math.random() * 2 - 1;
                    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
                    
                    // Reset position to emission radius
                    x = emissionRadius * sinTheta * Math.cos(phi);
                    y = emissionRadius * sinTheta * Math.sin(phi);
                    z = emissionRadius * cosTheta;
                    
                    // Alternate particle types
                    particleType[i] = i % 2 === 0 ? 1.0 : 0.0;
                    
                    // Reset size for variation
                    sizes[i] = Math.random() * 0.05 + 0.02;
                } else {
                    // For particles we don't reset, move them far away but not at the same position
                    // to prevent clumping when they return
                    x = 1000 + Math.random() * 100;
                    y = 1000 + Math.random() * 100;
                    z = 1000 + Math.random() * 100;
                }
            }
            
            // Add very subtle gravitational influence
            const dir = new THREE.Vector3(-x, -y, -z).normalize();
            const gravitationalFactor = 0.0005 / (distance * distance) * horizonRadius;
            
            // Apply gravitational influence more strongly to in-falling particles
            const particleGravityFactor = particleType[i] > 0.5 ? 0.1 : 0.5;
            
            // Add gravitational velocity component
            x += dir.x * gravitationalFactor * particleGravityFactor;
            y += dir.y * gravitationalFactor * particleGravityFactor;
            z += dir.z * gravitationalFactor * particleGravityFactor;
            
            // Update position attribute
            positionAttribute.array[i * 3] = x;
            positionAttribute.array[i * 3 + 1] = y;
            positionAttribute.array[i * 3 + 2] = z;
        }
        
        // Mark attribute as needing update
        positionAttribute.needsUpdate = true;
    }
    
    /**
     * Update black hole parameters from controls
     */
    updateBlackHoleFromControls() {
        // Update black hole uniforms
        if (this.blackHole && this.blackHole.userData.shader) {
            this.blackHole.userData.shader.uniforms.intensity.value = this.blackHoleParams.intensity;
        }
        
        // Update accretion disk
        if (this.accretionDisk && this.accretionDisk.userData.shader) {
            this.accretionDisk.userData.shader.uniforms.intensity.value = this.blackHoleParams.accretionDiskIntensity;
        }
        
        // Update magnetic field lines
        if (this.magneticFieldLines) {
            this.magneticFieldLines.forEach(line => {
                line.userData.shader.uniforms.fieldStrength.value = this.blackHoleParams.magneticFieldStrength;
            });
        }
    }
    
    /**
     * Update black hole and related effects
     */
    update(time) {
        // Update shader uniforms for all components
        if (this.blackHole && this.blackHole.userData.shader) {
            this.blackHole.userData.shader.uniforms.time.value = time;
        }
        
        if (this.accretionDisk && this.accretionDisk.userData.shader) {
            this.accretionDisk.userData.shader.uniforms.time.value = time;
        }
        
        if (this.eventHorizonParticles && this.eventHorizonParticles.userData.shader) {
            this.eventHorizonParticles.userData.shader.uniforms.time.value = time;
        }
        
        // Update magnetic field lines
        if (this.magneticFieldLines) {
            this.magneticFieldLines.forEach(line => {
                if (line.userData && line.userData.shader) {
                    line.userData.shader.uniforms.time.value = time;
                }
            });
        }
        
        // Update Hawking radiation with more complex movement
        this.updateHawkingRadiation(time);
    }
} 