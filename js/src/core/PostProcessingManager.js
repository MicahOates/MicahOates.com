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
            spaceDistortion: false,
            gravitationalLensing: true // New effect
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
        
        // Advanced effects (will be set externally)
        this.gravitationalLensing = null;
    }
    
    /**
     * Initialize post-processing effects
     */
    init() {
        try {
            if (!this.app.renderer) {
                console.error('Cannot initialize post-processing: Renderer not available');
                return;
            }

            console.log('Initializing post-processing...');
            
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
            
            // Force pass update to ensure order is correct
            this.updatePasses();
            
            // Validate that all passes are properly initialized
            this.validatePasses();
            
            // Store reference in the app
            this.app.composer = this.composer;
            
            console.log('Post-processing initialized successfully');
        } catch (error) {
            console.error('Failed to initialize post-processing:', error);
            // Disable post-processing on error
            this.composer = null;
        }
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
     * Register an external gravitational lensing effect
     */
    registerGravitationalLensing(lensingEffect) {
        this.gravitationalLensing = lensingEffect;
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
        
        // Update gravitational lensing if available
        if (this.gravitationalLensing && this.effectsEnabled.gravitationalLensing) {
            this.gravitationalLensing.update(time);
        }
    }
    
    /**
     * Override the standard compose method to support custom effects like gravitational lensing
     */
    render() {
        // If composer doesn't exist, don't proceed
        if (!this.composer) return;
        
        try {
            // Standard EffectComposer implementation with our extensions
            const passes = this.composer.passes;
            if (!passes || !Array.isArray(passes) || passes.length === 0) return;
            
            const renderer = this.app.renderer;
            if (!renderer) return;
            
            const renderTarget1 = this.composer.renderTarget1;
            const renderTarget2 = this.composer.renderTarget2;
            if (!renderTarget1 || !renderTarget2) return;
            
            // Save the original render target
            const originalRenderTarget = renderer.getRenderTarget();
            
            let inputRenderTarget = null;
            let outputRenderTarget = null;
            
            // For each pass in our composer
            for (let i = 0; i < passes.length; i++) {
                const pass = passes[i];
                // Skip disabled or invalid passes
                if (!pass || pass.enabled === false) continue;
                
                // Handle RenderPass differently from shader passes
                if (pass instanceof RenderPass) {
                    try {
                        // Render scene to the next render target
                        pass.render(renderer, renderTarget1, renderTarget1);
                        inputRenderTarget = renderTarget1;
                    } catch (renderPassError) {
                        console.error('Error in RenderPass:', renderPassError);
                    }
                } else {
                    // Only attempt to process passes that have required uniforms and we have a valid input
                    if (!inputRenderTarget) {
                        console.warn('No input render target available for pass:', pass.constructor.name);
                        continue;
                    }
                    
                    // Verify uniforms exist before trying to use them
                    if (!pass.uniforms) {
                        console.warn('Pass is missing uniforms:', pass.constructor.name);
                        continue;
                    }
                    
                    // Verify tDiffuse uniform exists before trying to use it
                    if (!pass.uniforms['tDiffuse']) {
                        console.warn('Pass is missing tDiffuse uniform:', pass.constructor.name);
                        continue;
                    }
                    
                    // Now we can safely set the tDiffuse value
                    pass.uniforms['tDiffuse'].value = inputRenderTarget.texture;
                    
                    // Determine the output target (null for final pass, swap between renderTarget1/2 otherwise)
                    outputRenderTarget = i === passes.length - 1 ? null : 
                        (inputRenderTarget === renderTarget1 ? renderTarget2 : renderTarget1);
                        
                    // Check if this should be processed by gravitational lensing
                    if (this.gravitationalLensing && 
                        this.effectsEnabled.gravitationalLensing && 
                        (i === passes.length - 1 || i === passes.length - 2 && passes[passes.length - 1].enabled === false)) {
                        
                        try {
                            // Let the lensing effect process the current render target
                            this.gravitationalLensing.prepareForRender(inputRenderTarget);
                            
                            // Render the lensing effect to the output
                            this.gravitationalLensing.render(renderer, outputRenderTarget);
                        } catch (lensingError) {
                            console.error('Error in gravitational lensing:', lensingError);
                            
                            // Fallback to normal rendering on error
                            try {
                                renderer.setRenderTarget(outputRenderTarget);
                                pass.render(renderer, outputRenderTarget);
                            } catch (fallbackError) {
                                console.error('Fallback rendering also failed:', fallbackError);
                            }
                        }
                    } else {
                        // Normal pass rendering
                        try {
                            renderer.setRenderTarget(outputRenderTarget);
                            pass.render(renderer, outputRenderTarget);
                        } catch (passError) {
                            console.error('Error rendering pass:', passError);
                        }
                    }
                    
                    inputRenderTarget = outputRenderTarget;
                }
            }
            
            // Restore the original render target
            renderer.setRenderTarget(originalRenderTarget);
        } catch (error) {
            console.error('Fatal error in post-processing render:', error);
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
     * Toggle gravitational lensing effect
     */
    toggleGravitationalLensing(enabled) {
        this.effectsEnabled.gravitationalLensing = enabled;
        
        // Update the actual effect if available
        if (this.gravitationalLensing) {
            this.gravitationalLensing.setActive(enabled);
        }
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
     * Set bloom parameters
     */
    setBloomParams(params = {}) {
        if (!this.passes.bloom) return;
        
        if (params.strength !== undefined) {
            this.effectParams.bloom.strength = params.strength;
            this.passes.bloom.strength = params.strength;
        }
        
        if (params.radius !== undefined) {
            this.effectParams.bloom.radius = params.radius;
            this.passes.bloom.radius = params.radius;
        }
        
        if (params.threshold !== undefined) {
            this.effectParams.bloom.threshold = params.threshold;
            this.passes.bloom.threshold = params.threshold;
        }
    }
    
    /**
     * Set color correction parameters
     */
    setColorCorrection(params = {}) {
        if (!this.passes.colorCorrection || 
            !this.passes.colorCorrection.uniforms) return;
        
        const uniforms = this.passes.colorCorrection.uniforms;
        
        if (params.brightness !== undefined) {
            this.effectParams.colorCorrection.brightness = params.brightness;
            uniforms.brightness.value = params.brightness;
        }
        
        if (params.contrast !== undefined) {
            this.effectParams.colorCorrection.contrast = params.contrast;
            uniforms.contrast.value = params.contrast;
        }
        
        if (params.saturation !== undefined) {
            this.effectParams.colorCorrection.saturation = params.saturation;
            uniforms.saturation.value = params.saturation;
        }
        
        if (params.hue !== undefined) {
            this.effectParams.colorCorrection.hue = params.hue;
            uniforms.hue.value = params.hue;
        }
        
        if (params.vignetteIntensity !== undefined) {
            this.effectParams.colorCorrection.vignetteIntensity = params.vignetteIntensity;
            if (uniforms.vignetteIntensity) {
                uniforms.vignetteIntensity.value = params.vignetteIntensity;
            }
        }
        
        if (params.vignetteSize !== undefined) {
            this.effectParams.colorCorrection.vignetteSize = params.vignetteSize;
            if (uniforms.vignetteSize) {
                uniforms.vignetteSize.value = params.vignetteSize;
            }
        }
        
        if (params.noiseIntensity !== undefined) {
            this.effectParams.colorCorrection.noiseIntensity = params.noiseIntensity;
            if (uniforms.noiseIntensity) {
                uniforms.noiseIntensity.value = params.noiseIntensity;
            }
        }
        
        if (params.chromaticAberration !== undefined) {
            this.effectParams.colorCorrection.chromaticAberration = params.chromaticAberration;
            if (uniforms.chromaticAberration) {
                uniforms.chromaticAberration.value = params.chromaticAberration;
            }
        }
    }
    
    /**
     * Set film grain parameters
     */
    setFilmGrain(params = {}) {
        if (!this.passes.filmGrain || 
            !this.passes.filmGrain.uniforms) return;
        
        if (params.intensity !== undefined) {
            this.effectParams.filmGrain.intensity = params.intensity;
            this.passes.filmGrain.uniforms.grainIntensity.value = params.intensity;
        }
        
        if (params.size !== undefined) {
            this.effectParams.filmGrain.size = params.size;
            this.passes.filmGrain.uniforms.grainSize.value = params.size;
        }
    }
    
    /**
     * Set space distortion parameters
     */
    setSpaceDistortion(params = {}) {
        if (!this.passes.spaceDistortion || 
            !this.passes.spaceDistortion.uniforms) return;
        
        if (params.strength !== undefined) {
            this.effectParams.spaceDistortion.strength = params.strength;
            this.passes.spaceDistortion.uniforms.distortionStrength.value = params.strength;
        }
        
        if (params.mousePosition) {
            this.effectParams.spaceDistortion.mousePosition.copy(params.mousePosition);
            this.passes.spaceDistortion.uniforms.mousePosition.value.copy(params.mousePosition);
        }
    }
    
    /**
     * Adjust gravitational lensing parameters
     */
    setGravitationalLensing(params = {}) {
        if (!this.gravitationalLensing) return;
        
        if (params.lensStrength !== undefined) {
            this.gravitationalLensing.setLensStrength(params.lensStrength);
        }
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
        
        // Clean up gravitational lensing effect
        if (this.gravitationalLensing) {
            this.gravitationalLensing.dispose();
        }
    }
    
    /**
     * Validates that all passes are properly initialized
     */
    validatePasses() {
        if (!this.composer || !this.composer.passes) return;
        
        console.log('Validating post-processing passes...');
        
        for (let i = 0; i < this.composer.passes.length; i++) {
            const pass = this.composer.passes[i];
            
            // Skip RenderPass as it doesn't need tDiffuse
            if (pass instanceof RenderPass) {
                console.log(`Pass ${i}: RenderPass - OK`);
                continue;
            }
            
            console.log(`Pass ${i}: ${pass.constructor.name} - Checking uniforms...`);
            
            // Check if this is a ShaderPass and fix if needed
            if (pass.constructor.name === 'ShaderPass') {
                // ShaderPass must have uniforms
                if (!pass.uniforms) {
                    console.warn(`Pass ${i} (${pass.constructor.name}) has no uniforms - attempting to fix`);
                    
                    // Create basic uniforms if missing
                    pass.uniforms = {
                        tDiffuse: { value: null }
                    };
                    
                    console.log(`Added default uniforms to pass ${i}`);
                }
                
                // ShaderPass must have tDiffuse uniform
                if (!pass.uniforms['tDiffuse']) {
                    console.warn(`Pass ${i} (${pass.constructor.name}) missing tDiffuse - adding it`);
                    pass.uniforms['tDiffuse'] = { value: null };
                }
                
                // Verify the shader is set up correctly
                if (!pass.material) {
                    console.warn(`Pass ${i} (${pass.constructor.name}) has no material - removing it`);
                    this.composer.passes.splice(i, 1);
                    i--; // Adjust index after removal
                    continue;
                }
                
                console.log(`Pass ${i}: ${pass.constructor.name} - Validated`);
            } else {
                // For non-ShaderPass objects, just verify they have the basic requirement
                if (!pass.uniforms || !pass.uniforms['tDiffuse']) {
                    console.warn(`Pass ${i} (${pass.constructor.name}) is missing required uniforms - removing it`);
                    // Remove invalid passes
                    this.composer.passes.splice(i, 1);
                    i--; // Adjust index after removal
                    continue;
                }
                
                console.log(`Pass ${i}: ${pass.constructor.name} - OK`);
            }
        }
        
        // Ensure the last pass renders to screen
        if (this.composer.passes.length > 0) {
            const lastPass = this.composer.passes[this.composer.passes.length - 1];
            if (lastPass && lastPass.renderToScreen !== true) {
                console.log('Setting last pass to render to screen');
                lastPass.renderToScreen = true;
            }
        }
        
        console.log(`Post-processing validation complete. ${this.composer.passes.length} passes active.`);
    }
    
    /**
     * Handle WebGL context restoration
     */
    onContextRestored() {
        console.log('Reinitializing post-processing after context restoration');
        
        // Store current configuration
        const enabledEffects = { ...this.effectsEnabled };
        const effectParameters = { 
            bloom: { ...this.effectParams.bloom },
            colorCorrection: { ...this.effectParams.colorCorrection },
            filmGrain: { ...this.effectParams.filmGrain },
            spaceDistortion: { ...this.effectParams.spaceDistortion }
        };
        
        // Clear the composer and passes
        this.composer = null;
        
        // Recreate with previous configuration
        this.init();
        
        // Restore configuration if init was successful
        if (this.composer) {
            // Restore enabled effects
            this.effectsEnabled = enabledEffects;
            
            // Restore effect parameters
            this.setBloomParams(effectParameters.bloom);
            this.setColorCorrection(effectParameters.colorCorrection);
            this.setFilmGrain(effectParameters.filmGrain);
            this.setSpaceDistortion(effectParameters.spaceDistortion);
            
            // Update pass order
            this.updatePasses();
            
            // Force validation again after restoration
            this.validatePasses();
            
            // Resize to current dimensions
            const { width, height } = this.app.sizes;
            this.resize(width, height);
            
            console.log('Post-processing restored successfully after context loss');
        } else {
            console.error('Failed to restore post-processing after context loss');
        }
    }
} 