import * as THREE from 'three';
import {
    nebulaVolumeVertexShader,
    nebulaVolumeFragmentShader,
    nebulaParticlesVertexShader,
    nebulaParticlesFragmentShader,
    nebulaFilamentsVertexShader,
    nebulaFilamentsFragmentShader
} from '../shaders/NebulaShader.js';
import { NoiseTextureGenerator } from '../utils/NoiseTextureGenerator.js';

/**
 * NebulaEffect - Creates volumetric nebula clouds around the black hole
 * This class creates a multi-layered volumetric nebula with:
 * 1. A volumetric cloud layer
 * 2. Particle dust
 * 3. Energy filaments
 */
export class NebulaEffect {
    constructor(app) {
        this.app = app;
        
        // Settings
        this.settings = {
            active: true,
            nebulaIntensity: 1.0,
            particleCount: 1000,
            filamentCount: 20,
            blackHoleRadius: this.app.config.blackHoleRadius || 10,
            particleTextureSize: 64,
            noiseTextureSize: 256,
            layerCount: 4 // Number of nebula volume layers for depth effect
        };
        
        // Adjust settings based on device performance
        this.adjustSettingsForPerformance();
        
        // Scene elements
        this.nebulaVolumes = [];
        this.nebulaParticles = null;
        this.nebulaFilaments = null;
        
        // Textures
        this.noiseTexture = null;
        this.particleTexture = null;
        
        // Colors
        this.colors = {
            primary: new THREE.Color(this.app.getThemeColor('primary') || '#8844ff'),
            secondary: new THREE.Color(this.app.getThemeColor('secondary') || '#44aaff'),
            tertiary: new THREE.Color(this.app.getThemeColor('tertiary') || '#ff44aa')
        };
    }
    
    /**
     * Initialize the nebula effect
     */
    init() {
        // Generate textures
        this.generateTextures();
        
        // Create nebula components
        this.createNebulaVolumes();
        this.createNebulaParticles();
        this.createNebulaFilaments();
    }
    
    /**
     * Adjust settings based on device performance
     */
    adjustSettingsForPerformance() {
        const performance = this.app.config.devicePerformance;
        
        switch (performance) {
            case 'low':
                this.settings.particleCount = 150;
                this.settings.filamentCount = 5;
                this.settings.layerCount = 1; // Single layer only
                this.settings.particleTextureSize = 32;
                this.settings.noiseTextureSize = 128;
                break;
            case 'medium':
                this.settings.particleCount = 500;
                this.settings.filamentCount = 10;
                this.settings.layerCount = 2; // Two layers
                break;
            // 'high' uses default settings
        }
    }
    
    /**
     * Generate textures used by the nebula effect
     */
    generateTextures() {
        // Generate noise texture
        this.noiseTexture = NoiseTextureGenerator.generateNoiseTexture(this.settings.noiseTextureSize, true);
        
        // Generate particle texture
        this.particleTexture = NoiseTextureGenerator.generateParticleTexture(this.settings.particleTextureSize);
    }
    
    /**
     * Create the volumetric nebula layers
     */
    createNebulaVolumes() {
        const layerCount = this.settings.layerCount;
        
        // Clean previous volumes if any
        this.nebulaVolumes.forEach(volume => {
            if (volume) {
                this.app.scene.remove(volume);
                volume.geometry.dispose();
                volume.material.dispose();
            }
        });
        this.nebulaVolumes = [];
        
        // Create each layer
        for (let i = 0; i < layerCount; i++) {
            // Create a spherical shell geometry
            // Scale increases with each layer for depth effect
            const scale = 1.0 + i * 0.5;
            const geometry = new THREE.SphereGeometry(
                this.settings.blackHoleRadius * 5 * scale, 
                32, 
                32
            );
            
            // Create shader material
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    primaryColor: { value: this.colors.primary.clone().multiplyScalar(0.8) },
                    secondaryColor: { value: this.colors.secondary.clone().multiplyScalar(0.8) },
                    tertiaryColor: { value: this.colors.tertiary.clone().multiplyScalar(0.8) },
                    blackHolePosition: { value: new THREE.Vector3(0, 0, 0) },
                    blackHoleRadius: { value: this.settings.blackHoleRadius },
                    nebulaIntensity: { value: this.settings.nebulaIntensity * (1.0 - i * 0.15) }, // Fade with distance
                    noiseTexture: { value: this.noiseTexture }
                },
                vertexShader: nebulaVolumeVertexShader,
                fragmentShader: nebulaVolumeFragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            
            // Create mesh
            const nebulaMesh = new THREE.Mesh(geometry, material);
            nebulaMesh.frustumCulled = false;
            
            // Add random rotation for varied appearance
            nebulaMesh.rotation.x = Math.random() * Math.PI;
            nebulaMesh.rotation.y = Math.random() * Math.PI;
            nebulaMesh.rotation.z = Math.random() * Math.PI;
            
            // Add to scene
            this.app.scene.add(nebulaMesh);
            this.nebulaVolumes.push(nebulaMesh);
        }
    }
    
    /**
     * Create the nebula particles
     */
    createNebulaParticles() {
        const particleCount = this.settings.particleCount;
        
        // Create geometry for particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        
        // Prepare for color interpolation
        const color1 = this.colors.primary;
        const color2 = this.colors.secondary;
        const color3 = this.colors.tertiary;
        
        // Generate random particles around the black hole
        for (let i = 0; i < particleCount; i++) {
            // Generate position in a spherical shell around black hole
            const radius = this.settings.blackHoleRadius * 2 + Math.random() * this.settings.blackHoleRadius * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random size - follow power law distribution for more small particles
            sizes[i] = Math.pow(Math.random(), 2) * 3 + 0.5;
            
            // Random opacity
            opacities[i] = Math.random() * 0.5 + 0.2;
            
            // Random color from color palette
            let color;
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                color = color1;
            } else if (colorChoice < 0.66) {
                color = color2;
            } else {
                color = color3;
            }
            
            // Store color components
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        // Set attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        geometry.setAttribute('particleColor', new THREE.BufferAttribute(colors, 3));
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                blackHolePosition: { value: new THREE.Vector3(0, 0, 0) },
                blackHoleRadius: { value: this.settings.blackHoleRadius },
                particleTexture: { value: this.particleTexture }
            },
            vertexShader: nebulaParticlesVertexShader,
            fragmentShader: nebulaParticlesFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create points
        this.nebulaParticles = new THREE.Points(geometry, material);
        this.nebulaParticles.frustumCulled = false;
        this.app.scene.add(this.nebulaParticles);
    }
    
    /**
     * Create energy filaments
     */
    createNebulaFilaments() {
        const filamentCount = this.settings.filamentCount;
        
        // Group to hold all filaments
        this.nebulaFilaments = new THREE.Group();
        
        // Create each filament
        for (let i = 0; i < filamentCount; i++) {
            this.createFilament(i / filamentCount);
        }
        
        // Add to scene
        this.app.scene.add(this.nebulaFilaments);
    }
    
    /**
     * Create a single filament
     * @param {number} index - Normalized index (0-1) for variation
     */
    createFilament(index) {
        // Number of points in the filament
        const pointCount = 50 + Math.floor(Math.random() * 50);
        
        // Create curve points
        const points = [];
        
        // Start at a random angle around black hole
        const startAngle = Math.random() * Math.PI * 2;
        const startRadius = this.settings.blackHoleRadius * 1.5 + Math.random() * this.settings.blackHoleRadius;
        const startHeight = (Math.random() - 0.5) * this.settings.blackHoleRadius * 2;
        
        // Create a random curved path
        let currentAngle = startAngle;
        let currentRadius = startRadius;
        let currentHeight = startHeight;
        
        for (let i = 0; i < pointCount; i++) {
            // Calculate position
            const x = Math.cos(currentAngle) * currentRadius;
            const y = currentHeight;
            const z = Math.sin(currentAngle) * currentRadius;
            
            points.push(new THREE.Vector3(x, y, z));
            
            // Update path parameters
            const progressFactor = i / (pointCount - 1);
            
            // Increase radius as we move away from black hole
            currentRadius += (0.1 + Math.random() * 0.2) * this.settings.blackHoleRadius;
            
            // Change angle (curved path)
            currentAngle += (Math.random() - 0.5) * 0.3;
            
            // Change height
            currentHeight += (Math.random() - 0.5) * 0.3 * this.settings.blackHoleRadius;
        }
        
        // Create curve from points
        const curve = new THREE.CatmullRomCurve3(points);
        
        // Create geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(
            curve.getPoints(pointCount * 2)
        );
        
        // Add offset attribute for animation
        const offsets = new Float32Array(geometry.attributes.position.count);
        for (let i = 0; i < offsets.length; i++) {
            offsets[i] = i / offsets.length; // Normalized offset (0-1)
        }
        geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
        
        // Choose a color based on index
        const colorMix = Math.random();
        let filamentColor;
        if (colorMix < 0.33) {
            filamentColor = this.colors.primary;
        } else if (colorMix < 0.66) {
            filamentColor = this.colors.secondary;
        } else {
            filamentColor = this.colors.tertiary;
        }
        
        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                filamentColor: { value: filamentColor },
                blackHolePosition: { value: new THREE.Vector3(0, 0, 0) },
                blackHoleRadius: { value: this.settings.blackHoleRadius }
            },
            vertexShader: nebulaFilamentsVertexShader,
            fragmentShader: nebulaFilamentsFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create line
        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        
        // Add to filaments group
        this.nebulaFilaments.add(line);
    }
    
    /**
     * Update nebula effect
     */
    update(time) {
        if (!this.settings.active) return;
        
        // Update nebula volumes
        for (const volume of this.nebulaVolumes) {
            volume.material.uniforms.time.value = time;
        }
        
        // Update nebula particles
        if (this.nebulaParticles) {
            this.nebulaParticles.material.uniforms.time.value = time;
        }
        
        // Update filaments
        if (this.nebulaFilaments) {
            for (const filament of this.nebulaFilaments.children) {
                filament.material.uniforms.time.value = time;
            }
        }
    }
    
    /**
     * Set nebula intensity
     */
    setIntensity(intensity) {
        this.settings.nebulaIntensity = intensity;
        
        // Update nebula volumes
        for (let i = 0; i < this.nebulaVolumes.length; i++) {
            // Each layer has slightly lower intensity
            const layerIntensity = intensity * (1.0 - i * 0.15);
            this.nebulaVolumes[i].material.uniforms.nebulaIntensity.value = layerIntensity;
        }
    }
    
    /**
     * Toggle the nebula effect on/off
     */
    setActive(active) {
        this.settings.active = active;
        
        // Update visibility
        for (const volume of this.nebulaVolumes) {
            volume.visible = active;
        }
        
        if (this.nebulaParticles) {
            this.nebulaParticles.visible = active;
        }
        
        if (this.nebulaFilaments) {
            this.nebulaFilaments.visible = active;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Dispose of textures
        if (this.noiseTexture) {
            this.noiseTexture.dispose();
        }
        
        if (this.particleTexture) {
            this.particleTexture.dispose();
        }
        
        // Dispose of nebula volumes
        for (const volume of this.nebulaVolumes) {
            this.app.scene.remove(volume);
            volume.geometry.dispose();
            volume.material.dispose();
        }
        this.nebulaVolumes = [];
        
        // Dispose of particles
        if (this.nebulaParticles) {
            this.app.scene.remove(this.nebulaParticles);
            this.nebulaParticles.geometry.dispose();
            this.nebulaParticles.material.dispose();
            this.nebulaParticles = null;
        }
        
        // Dispose of filaments
        if (this.nebulaFilaments) {
            // Dispose each filament
            for (const filament of this.nebulaFilaments.children) {
                filament.geometry.dispose();
                filament.material.dispose();
            }
            this.app.scene.remove(this.nebulaFilaments);
            this.nebulaFilaments = null;
        }
    }
} 