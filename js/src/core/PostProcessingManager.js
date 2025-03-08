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
     * Initialize post-processing
     */
    init() {
        try {
            // Init default parameters
            this.defaultParams = {
                bloom: {
                    strength: 0.8,
                    radius: 0.8,
                    threshold: 0.5
                },
                colorCorrection: {
                    brightness: 0.1,
                    contrast: 0.1,
                    exposure: 0.5,
                    gamma: 1.0,
                    saturation: 0.5
                },
                filmGrain: {
                    intensity: 0.35,
                    speed: 1.0
                },
                spaceDistortion: {
                    strength: 0.1,
                    speed: 1.0,
                    scale: 1.0
                }
            };
            
            // Initialize render targets
            const renderTargetsInitialized = this.initRenderTargets();
            if (!renderTargetsInitialized) {
                console.error('Failed to initialize render targets, post-processing will not function properly');
                return;
            }
            
            // Set up render passes
            this.setupRenderPass();
            this.setupBloom();
            this.setupColorCorrection();
            this.setupFilmGrain();
            this.setupSpaceDistortion();
            
            // Validate everything is working
            this.validatePasses();
            
            // Log initialization
            console.log('Post-processing initialized successfully with effects:', 
                Object.keys(this.effectsEnabled)
                    .filter(key => this.effectsEnabled[key])
                    .join(', ')
            );
        } catch (error) {
            console.error('Error initializing post-processing:', error);
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
        try {
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
            
            // Create resolution with safeguards
            const resolution = new THREE.Vector2(
                Math.max(1, width || window.innerWidth),
                Math.max(1, height || window.innerHeight)
            );
            
            // Create the UnrealBloomPass with valid parameters
            try {
                this.passes.bloom = new UnrealBloomPass(
                    resolution,
                    bloomStrength,
                    bloomRadius,
                    bloomThreshold
                );
                
                // Validate that the pass was created properly
                if (!this.passes.bloom) {
                    console.error('Failed to create UnrealBloomPass');
                    this.effectsEnabled.bloom = false;
                    return;
                }
                
                // Verify and initialize the tDiffuse uniform if missing
                if (!this.passes.bloom.uniforms || !this.passes.bloom.uniforms.tDiffuse) {
                    if (!this.passes.bloom.uniforms) {
                        this.passes.bloom.uniforms = {};
                    }
                    this.passes.bloom.uniforms.tDiffuse = { value: null };
                    console.info('Initialized missing tDiffuse uniform for UnrealBloomPass');
                }
                
                // Ensure the pass has a render method
                if (typeof this.passes.bloom.render !== 'function') {
                    console.error('UnrealBloomPass is missing render method');
                    this.effectsEnabled.bloom = false;
                    return;
                }
                
                // Set flag to indicate the bloom effect is properly initialized
                this.effectsEnabled.bloom = true;
            } catch (bloomError) {
                console.error('Error initializing UnrealBloomPass:', bloomError);
                this.effectsEnabled.bloom = false;
            }
            
            // Add the default bloom parameters for later reference
            this.defaultParams.bloom = {
                strength: bloomStrength,
                radius: bloomRadius,
                threshold: bloomThreshold
            };
        } catch (error) {
            console.error('Error setting up bloom effect:', error);
            this.effectsEnabled.bloom = false;
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
        try {
            // Get required components
            const { renderer, scene, camera } = this.app;
            
            // Safety check
            if (!renderer || !scene || !camera) {
                console.warn('Missing required components for post-processing');
                return;
            }
            
            // Store the original render target
            const originalRenderTarget = renderer.getRenderTarget();
            
            // Clear render targets before starting the render chain
            renderer.setRenderTarget(this.renderTarget1);
            renderer.clear();
            renderer.setRenderTarget(this.renderTarget2);
            renderer.clear();
            
            // First, render the scene to renderTarget1
            renderer.setRenderTarget(this.renderTarget1);
            renderer.render(scene, camera);
            
            // Use the first render target as input
            let inputRenderTarget = this.renderTarget1;
            let outputRenderTarget = null;
            
            // If there are no passes enabled, render directly to the screen
            if (!this.updatedPasses || this.updatedPasses.length === 0) {
                renderer.setRenderTarget(null);
                renderer.render(scene, camera);
                return;
            }
            
            // Process each enabled pass
            for (let i = 0; i < this.updatedPasses.length; i++) {
                const pass = this.updatedPasses[i];
                
                // Skip if pass doesn't exist or is disabled
                if (!pass || pass.enabled === false) {
                    continue;
                }
                
                // Verify uniforms exist before trying to use them
                if (!pass.uniforms) {
                    console.warn('Pass is missing uniforms:', pass.constructor.name);
                    continue;
                }
                
                // Verify tDiffuse uniform exists before trying to use it
                if (!pass.uniforms['tDiffuse']) {
                    // Try to create tDiffuse uniform if it's missing
                    try {
                        pass.uniforms['tDiffuse'] = { value: null };
                        console.info('Created missing tDiffuse uniform for', pass.constructor.name);
                    } catch (uniformError) {
                        console.warn('Failed to create tDiffuse uniform for', pass.constructor.name, uniformError);
                        continue;
                    }
                }
                
                // Ensure we have a valid input texture
                if (!inputRenderTarget || !inputRenderTarget.texture) {
                    console.warn('Input render target or texture is invalid for pass:', pass.constructor.name);
                    // Try to recover by using the initial render target
                    if (this.renderTarget1 && this.renderTarget1.texture) {
                        console.info('Recovering with initial render target');
                        inputRenderTarget = this.renderTarget1;
                    } else {
                        // If we can't recover, skip this pass
                        continue;
                    }
                }
                
                // Now we can safely set the tDiffuse value
                pass.uniforms['tDiffuse'].value = inputRenderTarget.texture;
                
                // Determine the output target (null for final pass, swap between renderTarget1/2 otherwise)
                outputRenderTarget = i === this.updatedPasses.length - 1 ? null : 
                    (inputRenderTarget === this.renderTarget1 ? this.renderTarget2 : this.renderTarget1);
                    
                // Check if this should be processed by gravitational lensing
                if (this.gravitationalLensing && 
                    this.effectsEnabled.gravitationalLensing && 
                    (i === this.updatedPasses.length - 1 || i === this.updatedPasses.length - 2 && this.updatedPasses[this.updatedPasses.length - 1].enabled === false)) {
                    
                    try {
                        // Let the lensing effect process the current render target
                        this.gravitationalLensing.prepareForRender(inputRenderTarget);
                        
                        // Render the lensing effect to the output
                        this.gravitationalLensing.render(renderer, outputRenderTarget);
                    } catch (lensingError) {
                        console.error('Error in gravitational lensing:', lensingError);
                        
                        // Fallback to normal rendering on error
                        try {
                            if (outputRenderTarget && pass.render) {
                                renderer.setRenderTarget(outputRenderTarget);
                                pass.render(renderer, outputRenderTarget);
                            }
                        } catch (fallbackError) {
                            console.error('Fallback rendering also failed:', fallbackError);
                        }
                    }
                } else {
                    // Normal pass rendering
                    try {
                        if (!pass.render) {
                            console.warn('Pass is missing render method:', pass.constructor.name);
                            continue;
                        }
                        
                        renderer.setRenderTarget(outputRenderTarget);
                        pass.render(renderer, outputRenderTarget);
                    } catch (passError) {
                        console.error('Error rendering pass:', passError);
                        // Attempt recovery using default rendering if this is the final pass
                        if (i === this.updatedPasses.length - 1) {
                            try {
                                console.info('Attempting recovery with direct rendering');
                                renderer.setRenderTarget(null);
                                renderer.render(scene, camera);
                            } catch (recoveryError) {
                                console.error('Recovery rendering failed:', recoveryError);
                            }
                        }
                    }
                }
                
                // Only use this output as the next input if it's valid
                if (outputRenderTarget && outputRenderTarget.texture) {
                    inputRenderTarget = outputRenderTarget;
                } else if (i < this.updatedPasses.length - 1) {
                    // Only warn if this isn't the final pass (which uses null render target)
                    console.warn('Output render target is invalid, keeping previous input');
                }
            }
            
            // Restore the original render target
            renderer.setRenderTarget(originalRenderTarget);
        } catch (error) {
            console.error('Post-processing render error:', error);
            // Attempt fallback direct rendering
            try {
                const { renderer, scene, camera } = this.app;
                if (renderer && scene && camera) {
                    renderer.setRenderTarget(null);
                    renderer.render(scene, camera);
                }
            } catch (fallbackError) {
                console.error('Fallback rendering also failed:', fallbackError);
            }
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
     * Initialize render targets for post-processing
     * @private
     */
    initRenderTargets() {
        try {
            const { width, height } = this.app.sizes;
            const { renderer } = this.app;
            
            if (!renderer) {
                console.error('Cannot initialize render targets without renderer');
                return false;
            }
            
            // Ensure we have valid dimensions
            const w = Math.max(1, width || window.innerWidth);
            const h = Math.max(1, height || window.innerHeight);
            
            // Create render targets with appropriate format and configuration
            const pixelRatio = renderer.getPixelRatio();
            const renderTargetParams = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                stencilBuffer: false,
                depthBuffer: true,
                type: THREE.HalfFloatType, // Better color precision
                samples: 4 // Enable MSAA if supported
            };
            
            // Create both render targets
            this.renderTarget1 = new THREE.WebGLRenderTarget(
                w * pixelRatio, 
                h * pixelRatio,
                renderTargetParams
            );
            this.renderTarget1.texture.name = 'PostProcessing.RT1';
            
            this.renderTarget2 = new THREE.WebGLRenderTarget(
                w * pixelRatio, 
                h * pixelRatio,
                renderTargetParams
            );
            this.renderTarget2.texture.name = 'PostProcessing.RT2';
            
            // Validate render targets
            if (!this.renderTarget1.texture || !this.renderTarget2.texture) {
                console.error('Failed to create valid render targets');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing render targets:', error);
            return false;
        }
    }
    
    /**
     * Validate and update passes before rendering
     * @private
     */
    validatePasses() {
        try {
            // Create a copy of passes that are properly initialized and enabled
            this.updatedPasses = [];
            
            // Check each pass
            for (const key in this.passes) {
                if (!this.passes.hasOwnProperty(key)) continue;
                
                const pass = this.passes[key];
                if (!pass) continue;
                
                // Skip passes that are explicitly disabled
                if (!this.effectsEnabled[key]) continue;
                
                // Validate pass has required properties
                if (typeof pass.render !== 'function') {
                    console.warn(`Pass ${key} missing render method, skipping`);
                    continue;
                }
                
                // Ensure uniforms exist
                if (!pass.uniforms) {
                    pass.uniforms = {};
                }
                
                // Ensure tDiffuse exists for shader passes
                if (pass.constructor.name !== 'RenderPass' && !pass.uniforms.tDiffuse) {
                    pass.uniforms.tDiffuse = { value: null };
                }
                
                // Add to validated passes
                this.updatedPasses.push(pass);
            }
            
            return this.updatedPasses.length > 0;
        } catch (error) {
            console.error('Error validating passes:', error);
            return false;
        }
    }
    
    /**
     * Update post-processing for current frame
     * @param {number} time - Current time in seconds
     */
    update(time) {
        // Update all effects
        try {
            // Update all active effects
            for (const key in this.passes) {
                if (this.passes.hasOwnProperty(key) && this.passes[key] && this.effectsEnabled[key]) {
                    const pass = this.passes[key];
                    if (pass && typeof pass.update === 'function') {
                        pass.update(time);
                    }
                }
            }
            
            // Validate and update passes
            this.validatePasses();
            
            // Initialize render targets if needed
            if (!this.renderTarget1 || !this.renderTarget2) {
                this.initRenderTargets();
            }
        } catch (error) {
            console.error('Error updating post-processing:', error);
        }
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