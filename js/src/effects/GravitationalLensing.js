import * as THREE from 'three';
import {
    lensingMapVertexShader,
    lensingMapFragmentShader,
    lensedStarsVertexShader,
    lensedStarsFragmentShader,
    lensingRenderVertexShader,
    lensingRenderFragmentShader
} from '../shaders/GravitationalLensingShader.js';

/**
 * GravitationalLensing - Creates the visual distortion of space around the black hole
 * This class implements a two-pass rendering approach:
 * 1. First render pass creates a distortion map
 * 2. Second pass applies the distortion to the background
 */
export class GravitationalLensing {
    constructor(app) {
        this.app = app;
        
        // Settings
        this.settings = {
            active: true,
            lensStrength: 2.0,
            resolution: 512, // Resolution of the distortion map
            distortionMultiplier: 1.0,
            blackHoleRadius: this.app.config.blackHoleRadius || 10,
            renderToScreen: false,
            starCount: 200, // Additional stars for gravitational lensing demonstration
            updateDistortionMap: true, // Whether to update the distortion map when camera moves
            debugMode: false // Show distortion map for debugging
        };
        
        // Adjustments based on device performance
        this.adjustSettingsForPerformance();
        
        // Scene elements
        this.distortionRenderTarget = null;
        this.distortionMaterial = null;
        this.lensedStars = null;
        this.lensingQuad = null;
        this.distortionQuad = null;
        
        // Cached values
        this.lastCameraPosition = new THREE.Vector3();
        this.lastBlackHoleScreenPosition = new THREE.Vector2(0.5, 0.5);
    }
    
    /**
     * Initialize the gravitational lensing effect
     */
    init() {
        this.createDistortionMap();
        this.createLensedStars();
        this.createLensingEffect();
        
        // Debug helpers
        if (this.settings.debugMode) {
            this.createDebugView();
        }
    }
    
    /**
     * Adjust settings based on device performance
     */
    adjustSettingsForPerformance() {
        const performance = this.app.config.devicePerformance;
        
        switch (performance) {
            case 'low':
                this.settings.resolution = 256;
                this.settings.starCount = 50;
                this.settings.updateDistortionMap = false; // Only update on significant camera movement
                break;
            case 'medium':
                this.settings.resolution = 384;
                this.settings.starCount = 100;
                break;
            // 'high' uses default settings
        }
    }
    
    /**
     * Create the distortion map using a render target
     */
    createDistortionMap() {
        // Create render target for distortion map
        this.distortionRenderTarget = new THREE.WebGLRenderTarget(
            this.settings.resolution,
            this.settings.resolution,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType
            }
        );
        
        // Create distortion material
        this.distortionMaterial = new THREE.ShaderMaterial({
            uniforms: {
                blackHoleRadius: { value: this.settings.blackHoleRadius / 100 }, // Normalized value (0-1)
                lensStrength: { value: this.settings.lensStrength },
                blackHolePosition: { value: new THREE.Vector2(0.5, 0.5) } // Center of screen by default
            },
            vertexShader: lensingMapVertexShader,
            fragmentShader: lensingMapFragmentShader
        });
        
        // Create quad to render distortion map
        this.distortionQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this.distortionMaterial
        );
        this.distortionQuad.frustumCulled = false;
        
        // Create scene for distortion map rendering
        this.distortionScene = new THREE.Scene();
        this.distortionScene.add(this.distortionQuad);
        
        // Create orthographic camera for distortion map rendering
        this.distortionCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    
    /**
     * Create stars that will be distorted by the black hole
     */
    createLensedStars() {
        const starCount = this.settings.starCount;
        
        // Create geometry for stars
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const brightness = new Float32Array(starCount);
        
        // Create stars with random positions
        for (let i = 0; i < starCount; i++) {
            // Place stars in a plane behind the black hole
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 35; // Between 15-50 units away
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = -30 - Math.random() * 20; // Behind the black hole
            
            // Random star size
            sizes[i] = 0.2 + Math.random() * 0.8;
            
            // Random brightness
            brightness[i] = 0.3 + Math.random() * 0.7;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
        
        // Create shader material for stars
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                distortionMap: { value: this.distortionRenderTarget.texture },
                baseColor: { value: new THREE.Color(0xaaccff) },
                distortionStrength: { value: 1.0 }
            },
            vertexShader: lensedStarsVertexShader,
            fragmentShader: lensedStarsFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create points for stars
        this.lensedStars = new THREE.Points(geometry, material);
        this.lensedStars.frustumCulled = false;
        
        // Add to scene
        this.app.scene.add(this.lensedStars);
    }
    
    /**
     * Create the effect that applies the distortion to the background
     */
    createLensingEffect() {
        // Create material for lensing effect
        this.lensingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                distortionMap: { value: this.distortionRenderTarget.texture },
                backgroundTexture: { value: null }, // Will be set during rendering
                blackHolePosition: { value: new THREE.Vector2(0.5, 0.5) },
                blackHoleRadius: { value: this.settings.blackHoleRadius / 100 } // Normalized value (0-1)
            },
            vertexShader: lensingRenderVertexShader,
            fragmentShader: lensingRenderFragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        // Create full-screen quad for rendering
        this.lensingQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this.lensingMaterial
        );
        this.lensingQuad.frustumCulled = false;
        
        // Scene for lensing effect rendering
        this.lensingScene = new THREE.Scene();
        this.lensingScene.add(this.lensingQuad);
        
        // Camera for lensing effect rendering
        this.lensingCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    
    /**
     * Create debug view to visualize the distortion map
     */
    createDebugView() {
        // Create debug material that shows the distortion map
        const debugMaterial = new THREE.MeshBasicMaterial({
            map: this.distortionRenderTarget.texture,
            transparent: true,
            opacity: 0.7
        });
        
        // Create a plane to show the distortion map
        this.debugPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            debugMaterial
        );
        
        // Position in corner of screen
        this.debugPlane.position.set(0, 0, -10);
        this.debugPlane.scale.set(0.3, 0.3, 1);
        
        // Add to camera - this makes it follow the camera
        this.app.camera.add(this.debugPlane);
        this.debugPlane.position.set(-0.7, -0.7, -1);
    }
    
    /**
     * Calculate black hole position in screen space (0-1)
     */
    calculateBlackHoleScreenPosition() {
        // Create a vector at the origin (black hole position)
        const blackHoleWorldPos = new THREE.Vector3(0, 0, 0);
        
        // Project to screen coordinates
        const screenPosition = blackHoleWorldPos.clone().project(this.app.camera);
        
        // Convert from [-1, 1] to [0, 1]
        const x = (screenPosition.x + 1) / 2;
        const y = (screenPosition.y + 1) / 2;
        
        return new THREE.Vector2(x, y);
    }
    
    /**
     * Check if camera position has changed significantly
     */
    hasCameraMovedSignificantly() {
        const currentPos = this.app.camera.position.clone();
        const distance = currentPos.distanceTo(this.lastCameraPosition);
        
        // Consider a movement significant if it's more than 1% of the camera's distance from origin
        const threshold = this.app.camera.position.length() * 0.01;
        
        return distance > threshold;
    }
    
    /**
     * Update distortion map based on current camera view
     */
    updateDistortionMap() {
        // Get current black hole screen position
        const screenPosition = this.calculateBlackHoleScreenPosition();
        
        // Update uniform
        this.distortionMaterial.uniforms.blackHolePosition.value.copy(screenPosition);
        this.lensingMaterial.uniforms.blackHolePosition.value.copy(screenPosition);
        
        // Cache the last camera position for performance checks
        this.lastCameraPosition.copy(this.app.camera.position);
        this.lastBlackHoleScreenPosition.copy(screenPosition);
        
        // Render the distortion map
        const renderer = this.app.renderer;
        const originalRenderTarget = renderer.getRenderTarget();
        
        renderer.setRenderTarget(this.distortionRenderTarget);
        renderer.render(this.distortionScene, this.distortionCamera);
        renderer.setRenderTarget(originalRenderTarget);
    }
    
    /**
     * Prepare for rendering after scene is rendered
     * This will be called by the post-processing manager
     */
    prepareForRender(inputRenderTarget) {
        if (!this.settings.active) return inputRenderTarget;
        
        // Update the distortion map if needed
        if (this.settings.updateDistortionMap || this.hasCameraMovedSignificantly()) {
            this.updateDistortionMap();
        }
        
        // Set the input texture as the background texture for the lensing effect
        this.lensingMaterial.uniforms.backgroundTexture.value = inputRenderTarget.texture;
        
        return inputRenderTarget;
    }
    
    /**
     * Render the lensing effect
     * This will be called by the post-processing manager
     */
    render(renderer, outputRenderTarget) {
        if (!this.settings.active) return;
        
        // Render the lensing effect
        renderer.setRenderTarget(outputRenderTarget);
        renderer.render(this.lensingScene, this.lensingCamera);
    }
    
    /**
     * Update the lensing effect
     */
    update(time) {
        if (!this.settings.active) return;
        
        // Update lensed stars effect
        if (this.lensedStars) {
            this.lensedStars.material.uniforms.time.value = time;
        }
    }
    
    /**
     * Set effect strength
     */
    setLensStrength(strength) {
        this.settings.lensStrength = strength;
        if (this.distortionMaterial) {
            this.distortionMaterial.uniforms.lensStrength.value = strength;
        }
    }
    
    /**
     * Toggle the effect on/off
     */
    setActive(active) {
        this.settings.active = active;
        
        // Show/hide lensed stars
        if (this.lensedStars) {
            this.lensedStars.visible = active;
        }
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        // Dispose of render target
        if (this.distortionRenderTarget) {
            this.distortionRenderTarget.dispose();
        }
        
        // Dispose of materials
        if (this.distortionMaterial) {
            this.distortionMaterial.dispose();
        }
        
        if (this.lensingMaterial) {
            this.lensingMaterial.dispose();
        }
        
        // Dispose of geometries
        if (this.lensingQuad) {
            this.lensingQuad.geometry.dispose();
            this.lensingScene.remove(this.lensingQuad);
        }
        
        if (this.distortionQuad) {
            this.distortionQuad.geometry.dispose();
            this.distortionScene.remove(this.distortionQuad);
        }
        
        // Remove lensed stars
        if (this.lensedStars) {
            this.lensedStars.geometry.dispose();
            this.lensedStars.material.dispose();
            this.app.scene.remove(this.lensedStars);
        }
        
        // Remove debug plane
        if (this.debugPlane) {
            this.debugPlane.geometry.dispose();
            this.debugPlane.material.dispose();
            this.app.camera.remove(this.debugPlane);
        }
    }
} 