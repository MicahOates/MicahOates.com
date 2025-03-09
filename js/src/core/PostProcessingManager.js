import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class PostProcessingManager {
    constructor(app) {
        this.app = app;
        this.composer = null;
        this.bloomPass = null;
        this.colorCorrectionPass = null;
    }
    
    /**
     * Initialize post-processing effects
     */
    init() {
        this.composer = new EffectComposer(this.app.renderer);
        
        // Add standard render pass
        const renderPass = new RenderPass(this.app.scene, this.app.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom pass for glow effects
        this.setupBloom();
        
        // Add custom color correction pass
        this.setupColorCorrection();
        
        // Store reference in the app
        this.app.composer = this.composer;
    }
    
    /**
     * Set up bloom effect
     */
    setupBloom() {
        const { width, height } = this.app.sizes;
        
        // Bloom pass parameters adjusted based on device performance
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
                bloomStrength = 1.0;
                bloomRadius = 0.75;
                bloomThreshold = 0.15;
                break;
        }
        
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            bloomStrength,
            bloomRadius,
            bloomThreshold
        );
        
        // Only add bloom if enabled in config
        if (this.app.config.bloom) {
            this.composer.addPass(this.bloomPass);
        }
    }
    
    /**
     * Set up custom color correction pass
     */
    setupColorCorrection() {
        // Custom shader for color correction and visual effects
        const colorCorrectionShader = {
            uniforms: {
                tDiffuse: { value: null },
                brightness: { value: 0.05 },
                contrast: { value: 0.12 },
                saturation: { value: 0.2 },
                hue: { value: 0.0 },
                vignetteIntensity: { value: 1.5 },
                vignetteSize: { value: 0.6 },
                time: { value: 0.0 },
                noiseIntensity: { value: 0.03 },
                chromaticAberration: { value: 0.003 }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float brightness;
                uniform float contrast;
                uniform float saturation;
                uniform float hue;
                uniform float vignetteIntensity;
                uniform float vignetteSize;
                uniform float time;
                uniform float noiseIntensity;
                uniform float chromaticAberration;
                
                varying vec2 vUv;
                
                // Helper function for HSL to RGB conversion
                float hue2rgb(float p, float q, float t) {
                    if (t < 0.0) t += 1.0;
                    if (t > 1.0) t -= 1.0;
                    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                    if (t < 1.0/2.0) return q;
                    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                    return p;
                }
                
                // Function to convert RGB to HSL
                vec3 rgb2hsl(vec3 color) {
                    float maxColor = max(max(color.r, color.g), color.b);
                    float minColor = min(min(color.r, color.g), color.b);
                    float delta = maxColor - minColor;
                    
                    float h = 0.0;
                    float s = 0.0;
                    float l = (maxColor + minColor) / 2.0;
                    
                    if (delta > 0.0) {
                        s = l < 0.5 ? delta / (maxColor + minColor) : delta / (2.0 - maxColor - minColor);
                        
                        if (color.r == maxColor) {
                            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
                        } else if (color.g == maxColor) {
                            h = (color.b - color.r) / delta + 2.0;
                        } else {
                            h = (color.r - color.g) / delta + 4.0;
                        }
                        h /= 6.0;
                    }
                    
                    return vec3(h, s, l);
                }
                
                // Function to convert HSL to RGB
                vec3 hsl2rgb(vec3 hsl) {
                    float h = hsl.x;
                    float s = hsl.y;
                    float l = hsl.z;
                    
                    float r, g, b;
                    
                    if (s == 0.0) {
                        r = g = b = l;
                    } else {
                        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
                        float p = 2.0 * l - q;
                        
                        r = hue2rgb(p, q, h + 1.0/3.0);
                        g = hue2rgb(p, q, h);
                        b = hue2rgb(p, q, h - 1.0/3.0);
                    }
                    
                    return vec3(r, g, b);
                }
                
                // Function to generate a random value based on position
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void main() {
                    // Apply chromatic aberration
                    float caStrength = chromaticAberration;
                    vec2 dir = normalize(vec2(0.5) - vUv) * caStrength;
                    float r = texture2D(tDiffuse, vUv + dir * 1.0).r;
                    float g = texture2D(tDiffuse, vUv).g;
                    float b = texture2D(tDiffuse, vUv - dir * 1.0).b;
                    vec3 color = vec3(r, g, b);
                    
                    // Apply brightness
                    color += brightness;
                    
                    // Apply contrast
                    color = (color - 0.5) * (1.0 + contrast) + 0.5;
                    
                    // Apply hue and saturation adjustments
                    vec3 hsl = rgb2hsl(color);
                    hsl.x = mod(hsl.x + hue, 1.0); // Hue shift
                    hsl.y *= 1.0 + saturation;     // Saturation boost
                    color = hsl2rgb(hsl);
                    
                    // Apply vignette effect
                    vec2 uv = vUv;
                    float dist = distance(uv, vec2(0.5));
                    float vignette = smoothstep(vignetteSize, vignetteSize - 0.15, dist);
                    color = mix(color * 0.2, color, vignette);
                    
                    // Add subtle noise grain (quantum fluctuations)
                    float noise = random(vUv + time * 0.01) * noiseIntensity;
                    color += noise;
                    
                    // Finalize color
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
        
        this.colorCorrectionPass = new ShaderPass(colorCorrectionShader);
        this.colorCorrectionPass.renderToScreen = true;
        this.composer.addPass(this.colorCorrectionPass);
    }
    
    /**
     * Update post-processing effects
     */
    update(time) {
        if (this.colorCorrectionPass) {
            this.colorCorrectionPass.uniforms.time.value = time;
        }
    }
    
    /**
     * Toggle bloom effect
     */
    toggleBloom(enabled) {
        if (!this.bloomPass) return;
        
        const passIndex = this.composer.passes.indexOf(this.bloomPass);
        
        if (enabled && passIndex === -1) {
            // Add bloom pass right before color correction
            const colorCorrectionIndex = this.composer.passes.indexOf(this.colorCorrectionPass);
            this.composer.passes.splice(colorCorrectionIndex, 0, this.bloomPass);
        } else if (!enabled && passIndex !== -1) {
            // Remove bloom pass
            this.composer.passes.splice(passIndex, 1);
        }
        
        // Update config
        this.app.config.bloom = enabled;
    }
    
    /**
     * Adjust bloom intensity
     */
    setBloomIntensity(intensity) {
        if (!this.bloomPass) return;
        this.bloomPass.strength = intensity;
    }
    
    /**
     * Adjust color correction parameters
     */
    setColorCorrection(params = {}) {
        if (!this.colorCorrectionPass) return;
        
        const uniforms = this.colorCorrectionPass.uniforms;
        
        if (params.brightness !== undefined) uniforms.brightness.value = params.brightness;
        if (params.contrast !== undefined) uniforms.contrast.value = params.contrast;
        if (params.saturation !== undefined) uniforms.saturation.value = params.saturation;
        if (params.hue !== undefined) uniforms.hue.value = params.hue;
        if (params.vignetteIntensity !== undefined) uniforms.vignetteIntensity.value = params.vignetteIntensity;
        if (params.vignetteSize !== undefined) uniforms.vignetteSize.value = params.vignetteSize;
        if (params.noiseIntensity !== undefined) uniforms.noiseIntensity.value = params.noiseIntensity;
        if (params.chromaticAberration !== undefined) uniforms.chromaticAberration.value = params.chromaticAberration;
    }
} 