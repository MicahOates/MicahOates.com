import * as THREE from 'three';
import {
    timeDilationVertexShader,
    timeDilationFragmentShader,
    timeDilationParticlesVertexShader,
    timeDilationParticlesFragmentShader,
    clockVertexShader,
    clockFragmentShader
} from '../shaders/TimeDilationShader.js';

/**
 * TimeDilation - Visualizes how time flows differently near a black hole
 * This class creates three visual elements:
 * 1. A time dilation field showing the distortion of time around the black hole
 * 2. Particles moving at different speeds based on their proximity to the black hole
 * 3. Clock visualizations that run at different rates to show time dilation
 */
export class TimeDilation {
    constructor(app) {
        this.app = app;
        
        // Settings
        this.settings = {
            active: true,
            dilationStrength: 2.0, // Amplification factor for visual effect
            blackHoleRadius: this.app.config.blackHoleRadius || 10,
            particleCount: 150,
            clockCount: 8, // Number of clock visualizations
            debugMode: false,
            visualizationType: 'all' // 'field', 'particles', 'clocks', or 'all'
        };
        
        // Adjust settings based on device performance
        this.adjustSettingsForPerformance();
        
        // Scene elements
        this.dilationField = null;
        this.dilationParticles = null;
        this.clockVisualizations = null;
        
        // Colors
        this.colors = {
            innerField: new THREE.Color(0x330066), // Deep purple for strong dilation
            outerField: new THREE.Color(0x9966ff), // Light purple for minimal dilation
            slowParticles: new THREE.Color(0xff3366), // Red for slow-moving particles
            fastParticles: new THREE.Color(0x66ffff), // Cyan for fast-moving particles
            clockFace: new THREE.Color(0x333366), // Dark blue clock face
            clockHands: new THREE.Color(0xffffff) // White clock hands
        };
    }
    
    /**
     * Initialize the time dilation visualization
     */
    init() {
        // Create visualization components based on settings
        if (this.settings.visualizationType === 'all' || this.settings.visualizationType === 'field') {
            this.createTimeDilationField();
        }
        
        if (this.settings.visualizationType === 'all' || this.settings.visualizationType === 'particles') {
            this.createDilationParticles();
        }
        
        if (this.settings.visualizationType === 'all' || this.settings.visualizationType === 'clocks') {
            this.createClockVisualizations();
        }
    }
    
    /**
     * Adjust settings based on device performance
     */
    adjustSettingsForPerformance() {
        const performance = this.app.config.devicePerformance;
        
        switch (performance) {
            case 'low':
                this.settings.particleCount = 50;
                this.settings.clockCount = 3;
                this.settings.visualizationType = 'particles'; // Only show particles on low-end devices
                break;
            case 'medium':
                this.settings.particleCount = 100;
                this.settings.clockCount = 6;
                // On medium devices, show particles and clocks but no field
                this.settings.visualizationType = 'particles';
                break;
            // 'high' uses default settings
        }
    }
    
    /**
     * Create the time dilation field visualization
     */
    createTimeDilationField() {
        // Create spherical mesh for time dilation field
        const geometry = new THREE.SphereGeometry(this.settings.blackHoleRadius * 5, 32, 32);
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                blackHoleRadius: { value: this.settings.blackHoleRadius },
                dilationStrength: { value: this.settings.dilationStrength },
                blackHolePosition: { value: new THREE.Vector3(0, 0, 0) },
                colorInner: { value: this.colors.innerField },
                colorOuter: { value: this.colors.outerField }
            },
            vertexShader: timeDilationVertexShader,
            fragmentShader: timeDilationFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        // Create mesh and add to scene
        this.dilationField = new THREE.Mesh(geometry, material);
        this.dilationField.frustumCulled = false;
        this.app.scene.add(this.dilationField);
    }
    
    /**
     * Create particles that visualize time dilation
     */
    createDilationParticles() {
        const particleCount = this.settings.particleCount;
        
        // Create geometry for particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const offsets = new Float32Array(particleCount);
        const particleTypes = new Float32Array(particleCount);
        
        // Initial particle attributes
        for (let i = 0; i < particleCount; i++) {
            // Create particles in orbital paths around black hole
            const orbitRadius = this.settings.blackHoleRadius * 1.5 + Math.random() * this.settings.blackHoleRadius * 4;
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * this.settings.blackHoleRadius;
            
            positions[i * 3] = Math.cos(angle) * orbitRadius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * orbitRadius;
            
            // Random sizes
            sizes[i] = 0.2 + Math.random() * 0.3;
            
            // Random offsets for varied animation
            offsets[i] = Math.random();
            
            // Alternate particle types (0 or 1)
            particleTypes[i] = Math.random() > 0.5 ? 1.0 : 0.0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
        geometry.setAttribute('particleType', new THREE.BufferAttribute(particleTypes, 1));
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                blackHolePosition: { value: new THREE.Vector3(0, 0, 0) },
                blackHoleRadius: { value: this.settings.blackHoleRadius },
                dilationStrength: { value: this.settings.dilationStrength },
                colorFast: { value: this.colors.fastParticles },
                colorSlow: { value: this.colors.slowParticles }
            },
            vertexShader: timeDilationParticlesVertexShader,
            fragmentShader: timeDilationParticlesFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create particle system
        this.dilationParticles = new THREE.Points(geometry, material);
        this.dilationParticles.frustumCulled = false;
        this.app.scene.add(this.dilationParticles);
    }
    
    /**
     * Create clock visualizations that show time dilation
     */
    createClockVisualizations() {
        const clockCount = this.settings.clockCount;
        
        // Create geometry for clock points
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(clockCount * 3);
        const clockIndices = new Float32Array(clockCount);
        const clockRadii = new Float32Array(clockCount);
        
        // Position clocks at different distances from the black hole
        for (let i = 0; i < clockCount; i++) {
            // Distribute clocks along a line extending from the black hole
            const distanceFactor = i / (clockCount - 1);
            const distance = this.settings.blackHoleRadius * 1.5 + 
                            distanceFactor * this.settings.blackHoleRadius * 6;
            
            // Angle for clock position (distributed in a semicircle)
            const angle = Math.PI * distanceFactor;
            
            // Position clocks in a semicircle pattern
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = Math.sin(angle) * distance * 0.3; // Flatten the semicircle
            positions[i * 3 + 2] = 0; // All in the same z-plane for visibility
            
            // Store clock index
            clockIndices[i] = i;
            
            // Set clock radius (size)
            clockRadii[i] = 2.0 + distanceFactor * 1.0; // Larger clocks farther out
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('clockIndex', new THREE.BufferAttribute(clockIndices, 1));
        geometry.setAttribute('radius', new THREE.BufferAttribute(clockRadii, 1));
        
        // Create shader material for clocks
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                blackHolePosition: { value: new THREE.Vector3(0, 0, 0) },
                blackHoleRadius: { value: this.settings.blackHoleRadius },
                dilationStrength: { value: this.settings.dilationStrength },
                clockFaceColor: { value: this.colors.clockFace },
                clockHandColor: { value: this.colors.clockHands }
            },
            vertexShader: clockVertexShader,
            fragmentShader: clockFragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        // Create points for clocks
        this.clockVisualizations = new THREE.Points(geometry, material);
        this.clockVisualizations.frustumCulled = false;
        this.app.scene.add(this.clockVisualizations);
    }
    
    /**
     * Update time dilation visualization with current time
     */
    update(time) {
        if (!this.settings.active) return;
        
        // Update dilation field
        if (this.dilationField) {
            this.dilationField.material.uniforms.time.value = time;
        }
        
        // Update dilation particles
        if (this.dilationParticles) {
            this.dilationParticles.material.uniforms.time.value = time;
        }
        
        // Update clock visualizations
        if (this.clockVisualizations) {
            this.clockVisualizations.material.uniforms.time.value = time;
        }
    }
    
    /**
     * Set dilation effect strength
     */
    setDilationStrength(strength) {
        this.settings.dilationStrength = strength;
        
        // Update uniforms in all visualizations
        if (this.dilationField) {
            this.dilationField.material.uniforms.dilationStrength.value = strength;
        }
        
        if (this.dilationParticles) {
            this.dilationParticles.material.uniforms.dilationStrength.value = strength;
        }
        
        if (this.clockVisualizations) {
            this.clockVisualizations.material.uniforms.dilationStrength.value = strength;
        }
    }
    
    /**
     * Toggle the effect on/off
     */
    setActive(active) {
        this.settings.active = active;
        
        // Show/hide all visualizations
        if (this.dilationField) {
            this.dilationField.visible = active;
        }
        
        if (this.dilationParticles) {
            this.dilationParticles.visible = active;
        }
        
        if (this.clockVisualizations) {
            this.clockVisualizations.visible = active;
        }
    }
    
    /**
     * Change visualization type
     */
    setVisualizationType(type) {
        if (!['field', 'particles', 'clocks', 'all'].includes(type)) {
            console.error(`Invalid visualization type: ${type}`);
            return;
        }
        
        this.settings.visualizationType = type;
        
        // Show/hide components based on type
        if (this.dilationField) {
            this.dilationField.visible = 
                (type === 'all' || type === 'field') && this.settings.active;
        }
        
        if (this.dilationParticles) {
            this.dilationParticles.visible = 
                (type === 'all' || type === 'particles') && this.settings.active;
        }
        
        if (this.clockVisualizations) {
            this.clockVisualizations.visible = 
                (type === 'all' || type === 'clocks') && this.settings.active;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Clean up field
        if (this.dilationField) {
            this.dilationField.geometry.dispose();
            this.dilationField.material.dispose();
            this.app.scene.remove(this.dilationField);
        }
        
        // Clean up particles
        if (this.dilationParticles) {
            this.dilationParticles.geometry.dispose();
            this.dilationParticles.material.dispose();
            this.app.scene.remove(this.dilationParticles);
        }
        
        // Clean up clocks
        if (this.clockVisualizations) {
            this.clockVisualizations.geometry.dispose();
            this.clockVisualizations.material.dispose();
            this.app.scene.remove(this.clockVisualizations);
        }
    }
} 