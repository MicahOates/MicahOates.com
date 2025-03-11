import * as THREE from 'three';
import {
    backgroundParticleVertexShader,
    backgroundParticleFragmentShader,
    quantumFluctuationVertexShader,
    quantumFluctuationFragmentShader,
    dataStreamVertexShader,
    dataStreamFragmentShader,
    nebulaVertexShader,
    nebulaFragmentShader
} from '../shaders/ParticleShader.js';

export class ParticleSystem {
    constructor(app) {
        this.app = app;
        this.particles = null;
        this.particleActivity = 0.0;
        this.activeEffects = [];
        
        // Effect settings
        this.settings = {
            baseParticleCount: 2000,
            maxDataStreamParticles: 200,
            maxEffects: 20
        };
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
            vertexShader: backgroundParticleVertexShader,
            fragmentShader: backgroundParticleFragmentShader,
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
        const baseCount = this.settings.baseParticleCount;
        
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
        
        // Update active effects and remove completed ones
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.update) {
                return effect.update(time);
            }
            return true;
        });
    }
    
    /**
     * Create a quantum particle effect (for interactive events)
     */
    createQuantumFluctuationEffect(position, intensity = 1.0) {
        // Cap the total number of active effects
        if (this.activeEffects.length >= this.settings.maxEffects) {
            return;
        }
        
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
                startTime: { value: this.app.clock.getElapsedTime() },
                intensity: { value: intensity },
                color: { value: new THREE.Color(this.app.getThemeColor('primary')) }
            },
            vertexShader: quantumFluctuationVertexShader,
            fragmentShader: quantumFluctuationFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.frustumCulled = false;
        this.app.scene.add(particles);
        
        // Create effect object with its own update logic
        const effect = {
            particles,
            geometry,
            material,
            startTime: this.app.clock.getElapsedTime(),
            duration: 2.0, // Lifetime in seconds
            
            update: (time) => {
                // Update time uniform
                material.uniforms.time.value = time;
                
                // Check if effect has completed its lifecycle
                if (time - this.startTime > this.duration) {
                    // Remove and clean up
                    this.app.scene.remove(particles);
                    geometry.dispose();
                    material.dispose();
                    return false; // Don't keep in activeEffects
                }
                
                return true; // Keep in activeEffects
            }
        };
        
        // Add to active effects
        this.activeEffects.push(effect);
        
        // Increase overall particle activity
        this.increaseParticleActivity(0.3);
    }
    
    /**
     * Create data stream effect - simulates data flowing to/from the black hole
     */
    createDataStreamEffect(origin, target, duration = 3.0, callback = null) {
        // Cap the total number of active effects
        if (this.activeEffects.length >= this.settings.maxEffects) {
            if (callback) callback();
            return;
        }
        
        // Number of particles based on device performance
        const particleCount = this.app.config.devicePerformance === 'low' ? 50 : 
                             (this.app.config.devicePerformance === 'medium' ? 100 : 
                             this.settings.maxDataStreamParticles);
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        
        // Calculate direction vector from origin to target
        const direction = new THREE.Vector3()
            .copy(target)
            .sub(origin)
            .normalize();
        
        // Calculate distance for distributing particles
        const distance = origin.distanceTo(target);
        
        // Color for stream (use theme color)
        const primaryColor = new THREE.Color(this.app.getThemeColor('primary'));
        const secondaryColor = new THREE.Color(this.app.getThemeColor('secondary'));
        
        // Create particles along the stream path
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles along the path with some randomness
            const progress = Math.random();
            const pos = new THREE.Vector3()
                .copy(origin)
                .add(direction.clone().multiplyScalar(distance * progress));
            
            // Add some random offset perpendicular to the path
            const perpendicularOffset = 0.5;
            const perpendicular1 = new THREE.Vector3(1, 0, 0);
            if (Math.abs(direction.dot(perpendicular1)) > 0.9) {
                perpendicular1.set(0, 1, 0);
            }
            const perpendicular2 = new THREE.Vector3().crossVectors(direction, perpendicular1).normalize();
            perpendicular1.crossVectors(direction, perpendicular2).normalize();
            
            pos.add(perpendicular1.multiplyScalar((Math.random() - 0.5) * perpendicularOffset));
            pos.add(perpendicular2.multiplyScalar((Math.random() - 0.5) * perpendicularOffset));
            
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            
            // Particle sizes based on position
            sizes[i] = 0.1 + Math.random() * 0.2;
            
            // Gradient color along the stream
            const colorMix = Math.random();
            const color = new THREE.Color().lerpColors(primaryColor, secondaryColor, colorMix);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: dataStreamVertexShader,
            fragmentShader: dataStreamFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const stream = new THREE.Points(geometry, material);
        stream.frustumCulled = false;
        this.app.scene.add(stream);
        
        // Create effect object with update logic
        const effect = {
            stream,
            geometry,
            material,
            startTime: this.app.clock.getElapsedTime(),
            duration,
            
            update: (time) => {
                // Update time uniform
                material.uniforms.time.value = time;
                
                // Calculate progress (0 to 1)
                const elapsed = time - this.startTime;
                const progress = Math.min(1.0, elapsed / this.duration);
                
                // Check if effect has completed
                if (progress >= 1.0) {
                    // Call completion callback
                    if (callback) callback();
                    
                    // Remove and clean up
                    this.app.scene.remove(stream);
                    geometry.dispose();
                    material.dispose();
                    return false; // Don't keep in activeEffects
                }
                
                return true; // Keep in activeEffects
            }
        };
        
        // Add to active effects
        this.activeEffects.push(effect);
        
        // Increase particle activity
        this.increaseParticleActivity(0.4);
        
        return effect;
    }
    
    /**
     * Create data particles that get pulled into the black hole
     * @param {string} input - User input from the "Feed the Singularity" field
     */
    createDataParticles(input) {
        console.log("createDataParticles called with input:", input);
        
        if (!input || input.trim().length === 0) {
            console.log("Input is empty, skipping particle creation");
            return;
        }
        
        // Skip if too many effects already active
        if (this.activeEffects.length >= this.settings.maxEffects) {
            console.log("Too many active effects, skipping particle creation");
            return;
        }
        
        try {
            // Get black hole position (assumed to be at the center)
            const blackHolePosition = new THREE.Vector3(0, 0, 0);
            
            // Create starting position for particles - in front of camera
            const cameraDirection = new THREE.Vector3(0, 0, -1);
            
            if (!this.app.camera) {
                console.error("Camera is not initialized");
                return;
            }
            
            cameraDirection.applyQuaternion(this.app.camera.quaternion);
            const startPosition = new THREE.Vector3().copy(this.app.camera.position).add(
                cameraDirection.multiplyScalar(10) // 10 units in front of camera
            );
            
            console.log("Camera position:", this.app.camera.position);
            console.log("Start position for particles:", startPosition);
            
            // Number of particles based on text length and device performance
            const particleCount = Math.min(100, Math.max(20, input.length * 5));
            console.log("Creating", particleCount, "particles");
            
            // Create individual particles for each character
            for (let i = 0; i < input.length; i++) {
                // Delay each character's particles slightly for a stream effect
                setTimeout(() => {
                    // Slightly randomize start position
                    const offset = 0.5;
                    const startPos = new THREE.Vector3(
                        startPosition.x + (Math.random() - 0.5) * offset,
                        startPosition.y + (Math.random() - 0.5) * offset,
                        startPosition.z + (Math.random() - 0.5) * offset
                    );
                    
                    // Create data stream from start position to black hole
                    this.createDataStreamEffect(
                        startPos, 
                        blackHolePosition,
                        3.0 + Math.random() * 2.0, // Random duration between 3-5 seconds
                        () => {
                            // Create a small particle burst at the black hole when particles arrive
                            if (Math.random() > 0.7) { // Only create bursts sometimes to prevent overwhelming effects
                                this.createQuantumFluctuationEffect(blackHolePosition, 0.5);
                            }
                        }
                    );
                    
                    // Increase overall particle activity
                    this.increaseParticleActivity(0.1);
                    
                }, i * 100); // 100ms delay between characters
            }
            
            // Create one quantum fluctuation at the start position
            this.createQuantumFluctuationEffect(startPosition, 0.8);
            console.log("Initial quantum fluctuation created");
            
        } catch (error) {
            console.error("Error in createDataParticles:", error);
        }
    }
    
    /**
     * Create particles at mouse position
     * @param {number} mouseX - Normalized mouse X position (-1 to 1)
     * @param {number} mouseY - Normalized mouse Y position (-1 to 1)
     * @param {string} text - Optional text to use for particle count
     */
    createParticlesAtMouse(mouseX, mouseY, text = "stardust") {
        try {
            console.log("Creating particles at mouse position:", mouseX, mouseY);
            
            // Skip if too many effects already active
            if (this.activeEffects.length >= this.settings.maxEffects) {
                console.log("Too many active effects, skipping particle creation");
                return;
            }
            
            // Get black hole position (assumed to be at the center)
            const blackHolePosition = new THREE.Vector3(0, 0, 0);
            
            // Create a ray from the camera through the mouse position
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(mouseX, mouseY);
            
            if (!this.app.camera) {
                console.error("Camera is not initialized");
                return;
            }
            
            raycaster.setFromCamera(mouse, this.app.camera);
            
            // Get start position - a point along the ray
            const startPosition = new THREE.Vector3();
            // Position the particles 15 units from camera along the ray
            startPosition.copy(raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(15)));
            
            console.log("Start position for particles:", startPosition);
            
            // Number of particles based on text length and device performance
            const particleCount = Math.min(100, Math.max(20, text.length * 5));
            console.log("Creating", particleCount, "particles");
            
            // Create a burst of particles
            for (let i = 0; i < 15; i++) {
                // Delay each particle slightly for a stream effect
                setTimeout(() => {
                    // Slightly randomize start position
                    const offset = 1.0;
                    const startPos = new THREE.Vector3(
                        startPosition.x + (Math.random() - 0.5) * offset,
                        startPosition.y + (Math.random() - 0.5) * offset,
                        startPosition.z + (Math.random() - 0.5) * offset
                    );
                    
                    // Create data stream from start position to black hole
                    this.createDataStreamEffect(
                        startPos, 
                        blackHolePosition,
                        2.0 + Math.random() * 2.0, // Random duration between 2-4 seconds
                        () => {
                            // Create a small particle burst at the black hole when particles arrive
                            if (Math.random() > 0.5) { // Higher chance of burst for mouse interaction
                                this.createQuantumFluctuationEffect(blackHolePosition, 0.7);
                            }
                        }
                    );
                    
                    // Increase overall particle activity
                    this.increaseParticleActivity(0.15);
                    
                }, i * 50); // Faster sequence for mouse interaction
            }
            
            // Create one quantum fluctuation at the start position
            this.createQuantumFluctuationEffect(startPosition, 1.0);
            console.log("Initial quantum fluctuation created");
            
        } catch (error) {
            console.error("Error in createParticlesAtMouse:", error);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Clean up background particles
        if (this.particles) {
            this.app.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        
        // Clean up active effects
        this.activeEffects.forEach(effect => {
            if (effect.particles) {
                this.app.scene.remove(effect.particles);
                effect.geometry.dispose();
                effect.material.dispose();
            }
            if (effect.stream) {
                this.app.scene.remove(effect.stream);
                effect.geometry.dispose();
                effect.material.dispose();
            }
        });
        
        this.activeEffects = [];
    }
} 