import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import {
    basicPostProcessingVertexShader,
    colorCorrectionFragmentShader,
    edgeDetectionFragmentShader,
    filmGrainFragmentShader,
    glowEffectFragmentShader,
    spaceDistortionFragmentShader
} from '../shaders/PostProcessingShader.js';

export class PostProcessingManager {
    constructor(app) {
        this.app = app;
        this.composer = null;
        this.passes = {
            render: null,
            bloom: null,
            colorCorrection: null,
            filmGrain: null,
            spaceDistortion: null
        };
        
        // Keeps track of which effects are enabled
        this.effectsEnabled = {
            bloom: true,
            colorCorrection: true,
            filmGrain: true,
            spaceDistortion: false
        };
        
        // Default effect parameters
        this.effectParams = {
            bloom: {
                strength: 1.0,
                radius: 0.75,
                threshold: 0.15
            },
            colorCorrection: {
                brightness: 0.05,
                contrast: 0.12,
                saturation: 0.2,
                hue: 0.0,
                vignetteIntensity: 1.5,
                vignetteSize: 0.6,
                noiseIntensity: 0.03,
                chromaticAberration: 0.003
            },
            filmGrain: {
                intensity: 0.05,
                size: 1.0
            },
            spaceDistortion: {
                strength: 0.2,
                mousePosition: new THREE.Vector2(0.5, 0.5)
            }
        };
    }
    
    /**
     * Initialize post-processing effects
     */
    init() {
        this.composer = new EffectComposer(this.app.renderer);
        
        // Add standard render pass
        this.setupRenderPass();
        
        // Add bloom pass for glow effects
        this.setupBloom();
        
        // Add custom color correction pass
        this.setupColorCorrection();
        
        // Add film grain
        this.setupFilmGrain();
        
        // Setup space distortion effect (disabled by default)
        this.setupSpaceDistortion();
        
        // Store reference in the app
        this.app.composer = this.composer;
    }
    
    /**
     * Set up render pass
     */
    setupRenderPass() {
        this.passes.render = new RenderPass(this.app.scene, this.app.camera);
        this.composer.addPass(this.passes.render);
    }
    
    /**
     * Set up bloom effect
     */
    setupBloom() {
        const { width, height } = this.app.sizes;
        
        // Adjust bloom parameters based on device performance
        let bloomStrength, bloomRadius, bloomThreshold;
        
        switch (this.app.config.devicePerformance) {
            case 'low':
                bloomStrength = 0.6;
                bloomRadius = 0.5;
                bloomThreshold = 0.3;
                break;
            case 'medium':
                bloomStrength = 0.8;
                bloomRadius = 0.7;
                bloomThreshold = 0.2;
                break;
            case 'high':
            default:
                bloomStrength = this.effectParams.bloom.strength;
                bloomRadius = this.effectParams.bloom.radius;
                bloomThreshold = this.effectParams.bloom.threshold;
                break;
        }
        
        this.passes.bloom = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            bloomStrength,
            bloomRadius,
            bloomThreshold
        );
        
        // Only add bloom if enabled
        if (this.effectsEnabled.bloom) {
            this.composer.addPass(this.passes.bloom);
        }
    }
    
    /**
     * Set up custom color correction pass
     */
    setupColorCorrection() {
        // Custom shader for color correction and visual effects
        const params = this.effectParams.colorCorrection;
        
        const colorCorrectionShader = {
            uniforms: {
                tDiffuse: { value: null },
                brightness: { value: params.brightness },
                contrast: { value: params.contrast },
                saturation: { value: params.saturation },
                hue: { value: params.hue },
                vignetteIntensity: { value: params.vignetteIntensity },
                vignetteSize: { value: params.vignetteSize },
                time: { value: 0.0 },
                noiseIntensity: { value: params.noiseIntensity },
                chromaticAberration: { value: params.chromaticAberration }
            },
            vertexShader: basicPostProcessingVertexShader,
            fragmentShader: colorCorrectionFragmentShader
        };
        
        this.passes.colorCorrection = new ShaderPass(colorCorrectionShader);
        
        // Only add color correction if enabled
        if (this.effectsEnabled.colorCorrection) {
            this.composer.addPass(this.passes.colorCorrection);
        }
    }
    
    /**
     * Set up film grain effect
     */
    setupFilmGrain() {
        const params = this.effectParams.filmGrain;
        
        const filmGrainShader = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                grainIntensity: { value: params.intensity },
                grainSize: { value: params.size }
            },
            vertexShader: basicPostProcessingVertexShader,
            fragmentShader: filmGrainFragmentShader
        };
        
        this.passes.filmGrain = new ShaderPass(filmGrainShader);
        this.passes.filmGrain.renderToScreen = true;
        
        // Only add film grain if enabled
        if (this.effectsEnabled.filmGrain) {
            this.composer.addPass(this.passes.filmGrain);
        }
    }
    
    /**
     * Set up space distortion effect
     */
    setupSpaceDistortion() {
        const params = this.effectParams.spaceDistortion;
        
        const spaceDistortionShader = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                distortionStrength: { value: params.strength },
                mousePosition: { value: params.mousePosition }
            },
            vertexShader: basicPostProcessingVertexShader,
            fragmentShader: spaceDistortionFragmentShader
        };
        
        this.passes.spaceDistortion = new ShaderPass(spaceDistortionShader);
        
        // Only add space distortion if enabled
        if (this.effectsEnabled.spaceDistortion) {
            this.composer.addPass(this.passes.spaceDistortion);
        }
    }
    
    /**
     * Update post-processing effects
     */
    update(time) {
        // Update time uniforms
        if (this.passes.colorCorrection) {
            this.passes.colorCorrection.uniforms.time.value = time;
        }
        
        if (this.passes.filmGrain) {
            this.passes.filmGrain.uniforms.time.value = time;
        }
        
        if (this.passes.spaceDistortion) {
            this.passes.spaceDistortion.uniforms.time.value = time;
        }
    }
    
    /**
     * Toggle bloom effect
     */
    toggleBloom(enabled) {
        this.effectsEnabled.bloom = enabled;
        this.updatePasses();
    }
    
    /**
     * Toggle color correction effect
     */
    toggleColorCorrection(enabled) {
        this.effectsEnabled.colorCorrection = enabled;
        this.updatePasses();
    }
    
    /**
     * Toggle film grain effect
     */
    toggleFilmGrain(enabled) {
        this.effectsEnabled.filmGrain = enabled;
        this.updatePasses();
    }
    
    /**
     * Toggle space distortion effect
     */
    toggleSpaceDistortion(enabled) {
        this.effectsEnabled.spaceDistortion = enabled;
        this.updatePasses();
    }
    
    /**
     * Update pass order and enabled state
     */
    updatePasses() {
        // Clear existing passes, keep only the render pass
        this.composer.passes = [this.passes.render];
        
        // Add passes in desired order
        if (this.effectsEnabled.bloom && this.passes.bloom) {
            this.composer.addPass(this.passes.bloom);
        }
        
        if (this.effectsEnabled.colorCorrection && this.passes.colorCorrection) {
            this.composer.addPass(this.passes.colorCorrection);
        }
        
        if (this.effectsEnabled.spaceDistortion && this.passes.spaceDistortion) {
            this.composer.addPass(this.passes.spaceDistortion);
        }
        
        // Film grain should always be the last effect
        if (this.effectsEnabled.filmGrain && this.passes.filmGrain) {
            this.composer.addPass(this.passes.filmGrain);
        }
        
        // Set the last pass to render to screen
        if (this.composer.passes.length > 0) {
            for (let i = 0; i < this.composer.passes.length; i++) {
                this.composer.passes[i].renderToScreen = (i === this.composer.passes.length - 1);
            }
        }
    }
    
    /**
     * Adjust bloom intensity
     */
    setBloomIntensity(intensity) {
        if (!this.passes.bloom) return;
        this.passes.bloom.strength = intensity;
        this.effectParams.bloom.strength = intensity;
    }
    
    /**
     * Adjust bloom parameters
     */
    setBloomParams(params = {}) {
        if (!this.passes.bloom) return;
        
        if (params.strength !== undefined) this.passes.bloom.strength = params.strength;
        if (params.radius !== undefined) this.passes.bloom.radius = params.radius;
        if (params.threshold !== undefined) this.passes.bloom.threshold = params.threshold;
        
        // Update stored parameters
        Object.assign(this.effectParams.bloom, params);
    }
    
    /**
     * Adjust color correction parameters
     */
    setColorCorrection(params = {}) {
        if (!this.passes.colorCorrection) return;
        
        const uniforms = this.passes.colorCorrection.uniforms;
        
        if (params.brightness !== undefined) uniforms.brightness.value = params.brightness;
        if (params.contrast !== undefined) uniforms.contrast.value = params.contrast;
        if (params.saturation !== undefined) uniforms.saturation.value = params.saturation;
        if (params.hue !== undefined) uniforms.hue.value = params.hue;
        if (params.vignetteIntensity !== undefined) uniforms.vignetteIntensity.value = params.vignetteIntensity;
        if (params.vignetteSize !== undefined) uniforms.vignetteSize.value = params.vignetteSize;
        if (params.noiseIntensity !== undefined) uniforms.noiseIntensity.value = params.noiseIntensity;
        if (params.chromaticAberration !== undefined) uniforms.chromaticAberration.value = params.chromaticAberration;
        
        // Update stored parameters
        Object.assign(this.effectParams.colorCorrection, params);
    }
    
    /**
     * Adjust film grain parameters
     */
    setFilmGrain(params = {}) {
        if (!this.passes.filmGrain) return;
        
        const uniforms = this.passes.filmGrain.uniforms;
        
        if (params.intensity !== undefined) uniforms.grainIntensity.value = params.intensity;
        if (params.size !== undefined) uniforms.grainSize.value = params.size;
        
        // Update stored parameters
        Object.assign(this.effectParams.filmGrain, params);
    }
    
    /**
     * Adjust space distortion parameters
     */
    setSpaceDistortion(params = {}) {
        if (!this.passes.spaceDistortion) return;
        
        const uniforms = this.passes.spaceDistortion.uniforms;
        
        if (params.strength !== undefined) uniforms.distortionStrength.value = params.strength;
        if (params.mousePosition !== undefined) uniforms.mousePosition.value.copy(params.mousePosition);
        
        // Update stored parameters
        if (params.strength !== undefined) this.effectParams.spaceDistortion.strength = params.strength;
        if (params.mousePosition !== undefined) this.effectParams.spaceDistortion.mousePosition.copy(params.mousePosition);
    }
    
    /**
     * Update distortion effect mouse position
     */
    updateDistortionCenter(x, y) {
        if (this.passes.spaceDistortion && this.passes.spaceDistortion.uniforms.mousePosition) {
            this.passes.spaceDistortion.uniforms.mousePosition.value.set(x, y);
            this.effectParams.spaceDistortion.mousePosition.set(x, y);
        }
    }
    
    /**
     * Resize post-processing effects
     */
    resize(width, height) {
        if (!this.composer) return;
        
        this.composer.setSize(width, height);
        
        // Update bloom pass resolution
        if (this.passes.bloom) {
            this.passes.bloom.resolution.set(width, height);
        }
    }
    
    /**
     * Set effect quality based on device performance
     */
    setQualityLevel() {
        const performance = this.app.config.devicePerformance;
        
        if (performance === 'low') {
            this.setFilmGrain({ intensity: 0.02 });
            this.setBloomParams({ strength: 0.6, radius: 0.5, threshold: 0.3 });
            this.setColorCorrection({ noiseIntensity: 0.01, chromaticAberration: 0.001 });
            
            // Disable expensive effects
            this.toggleSpaceDistortion(false);
            
        } else if (performance === 'medium') {
            this.setFilmGrain({ intensity: 0.03 });
            this.setBloomParams({ strength: 0.8, radius: 0.7, threshold: 0.2 });
            this.setColorCorrection({ noiseIntensity: 0.02, chromaticAberration: 0.002 });
            
        } else { // high
            this.setFilmGrain({ intensity: 0.05 });
            this.setBloomParams({ strength: 1.0, radius: 0.75, threshold: 0.15 });
            this.setColorCorrection({ noiseIntensity: 0.03, chromaticAberration: 0.003 });
            
            // Enable advanced effects for high-performance devices
            // this.toggleSpaceDistortion(true);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.dispose) pass.dispose();
            });
        }
    }
} 