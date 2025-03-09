/**
 * Vertex and fragment shaders for gravitational lensing effect
 */

// Vertex shader for distortion map
export const lensingMapVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment shader for distortion map
export const lensingMapFragmentShader = `
    uniform float blackHoleRadius;
    uniform float lensStrength;
    uniform vec2 blackHolePosition;
    
    varying vec2 vUv;
    
    void main() {
        // Calculate normalized coordinates centered on black hole
        vec2 position = vUv - blackHolePosition;
        
        // Calculate distance from center of black hole
        float dist = length(position);
        
        // Calculate distortion amount based on distance from black hole
        // We're using a physically-inspired model based on Einstein's relativity
        // r' = r / (1 - rs/r) where rs is the Schwarzschild radius
        float schwarzschildRadius = blackHoleRadius * 0.8; // Visual adjustment
        
        // This prevents infinity at r = rs by adding a small offset
        float distortion = 0.0;
        float safeDistance = max(dist, schwarzschildRadius * 1.01);
        
        if (dist <= schwarzschildRadius) {
            // Inside the event horizon - maximum distortion
            distortion = 1.0;
        } else {
            // Gravitational lensing formula, simplified for real-time visualization
            float ratio = schwarzschildRadius / safeDistance;
            distortion = ratio * ratio * lensStrength; // Squared for stronger visual effect
        }
        
        // Normalized direction vector from black hole center
        vec2 direction = normalize(position);
        
        // Calculate distorted UV coordinates
        // The direction points from the black hole, but distortion pulls inward
        vec2 distortedUv = vUv - direction * distortion;
        
        // Output distortion as color
        // R,G channels store the distorted UV coordinates
        // B channel stores the distortion intensity for visual effects
        gl_FragColor = vec4(distortedUv, distortion, 1.0);
    }
`;

// Vertex shader for lensed stars
export const lensedStarsVertexShader = `
    attribute float size;
    attribute float brightness;
    
    uniform float time;
    uniform float pixelRatio;
    
    varying float vBrightness;
    varying float vDistortion;
    
    void main() {
        vBrightness = brightness;
        
        // Each star distortion will be calculated in the fragment shader
        // using the distortion map
        vDistortion = 0.0;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Scale point size by distance and pixel ratio
        gl_PointSize = size * (400.0 / -mvPosition.z) * pixelRatio;
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment shader for lensed stars
export const lensedStarsFragmentShader = `
    uniform sampler2D distortionMap;
    uniform vec3 baseColor;
    uniform float distortionStrength;
    
    varying float vBrightness;
    varying float vDistortion;
    
    void main() {
        // Create point light with soft edge
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center * 2.0);
        
        // Create soft circular shape
        float alpha = 1.0 - smoothstep(0.5, 1.0, dist);
        
        // Apply brightness variation
        alpha *= vBrightness;
        
        // Calculate color with distortion-based effects
        vec3 color = mix(baseColor, vec3(1.0), vBrightness * 0.6);
        
        // Set final color with alpha
        if (dist > 1.0) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;

// Vertex shader for background distortion rendering
export const lensingRenderVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment shader for background distortion rendering
export const lensingRenderFragmentShader = `
    uniform sampler2D distortionMap;
    uniform sampler2D backgroundTexture;
    uniform vec2 blackHolePosition;
    uniform float blackHoleRadius;
    
    varying vec2 vUv;
    
    void main() {
        // Sample the distortion map
        vec4 distortionSample = texture2D(distortionMap, vUv);
        
        // Distorted UV coordinates from the R and G channels
        vec2 distortedUv = distortionSample.rg;
        
        // Distortion intensity from the B channel
        float distortionIntensity = distortionSample.b;
        
        // Calculate distance from black hole center
        float dist = length(vUv - blackHolePosition);
        
        // Sample the background with the distorted UVs
        vec4 color;
        
        if (dist <= blackHoleRadius * 0.8) {
            // Inside the event horizon - pure black
            color = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            // Apply distortion to background
            color = texture2D(backgroundTexture, distortedUv);
            
            // Optional: add visual clue to show distortion strength
            // This can be commented out for a more realistic effect
            //color.rgb += vec3(0.1, 0.0, 0.2) * distortionIntensity * 2.0;
        }
        
        gl_FragColor = color;
    }
`; 