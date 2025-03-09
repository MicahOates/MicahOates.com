/**
 * Vertex and fragment shaders for post-processing effects
 */

// Basic vertex shader for post-processing
export const basicPostProcessingVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Color correction fragment shader
export const colorCorrectionFragmentShader = `
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
`;

// Edge detection fragment shader
export const edgeDetectionFragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float edgeStrength;
    uniform vec3 edgeColor;
    
    varying vec2 vUv;
    
    void main() {
        vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
        
        // Sample neighboring pixels
        vec3 center = texture2D(tDiffuse, vUv).rgb;
        vec3 left = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb;
        vec3 right = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb;
        vec3 up = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
        vec3 down = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb;
        
        // Calculate edge intensity using Sobel operator
        vec3 dx = right - left;
        vec3 dy = down - up;
        float edge = length(dx) + length(dy);
        
        // Apply edge detection
        edge = smoothstep(0.1, 0.3, edge * edgeStrength);
        
        // Combine edge with original color
        vec3 finalColor = mix(center, edgeColor, edge);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Film grain effect fragment shader
export const filmGrainFragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grainIntensity;
    uniform float grainSize;
    
    varying vec2 vUv;
    
    // Pseudo-random number generator
    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
        // Get original color
        vec4 originalColor = texture2D(tDiffuse, vUv);
        
        // Generate noise
        vec2 grainUv = vUv * grainSize;
        grainUv.y *= rand(vec2(grainUv.x, time * 0.01));
        float grain = rand(grainUv + time * 0.01);
        
        // Apply grain to color
        vec3 color = originalColor.rgb + (grain - 0.5) * grainIntensity;
        
        gl_FragColor = vec4(color, originalColor.a);
    }
`;

// Glow effect fragment shader
export const glowEffectFragmentShader = `
    uniform sampler2D tDiffuse;
    uniform sampler2D blurTexture;
    uniform float glowStrength;
    uniform vec3 glowColor;
    
    varying vec2 vUv;
    
    void main() {
        // Original scene color
        vec4 originalColor = texture2D(tDiffuse, vUv);
        
        // Blurred scene color for glow
        vec4 blurColor = texture2D(blurTexture, vUv);
        
        // Calculate glow based on brightness
        float luminance = dot(blurColor.rgb, vec3(0.299, 0.587, 0.114));
        float glowFactor = smoothstep(0.5, 1.0, luminance) * glowStrength;
        
        // Apply glow
        vec3 finalColor = originalColor.rgb + glowColor * glowFactor;
        
        gl_FragColor = vec4(finalColor, originalColor.a);
    }
`;

// Space distortion fragment shader
export const spaceDistortionFragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float distortionStrength;
    uniform vec2 mousePosition;
    
    varying vec2 vUv;
    
    void main() {
        // Create distortion direction based on mouse position or center
        vec2 center = mousePosition;
        if (length(center) < 0.001) {
            center = vec2(0.5, 0.5);
        }
        
        // Calculate distortion
        vec2 dir = center - vUv;
        float dist = length(dir);
        float distortionFactor = 1.0 / (1.0 + 25.0 * dist * dist);
        
        // Apply distortion with subtle animation
        vec2 offset = normalize(dir) * distortionFactor * distortionStrength * sin(time * 0.5) * 0.01;
        vec2 distortedUv = vUv + offset;
        
        // Sample color
        vec4 color = texture2D(tDiffuse, distortedUv);
        
        gl_FragColor = color;
    }
`; 