/**
 * Vertex and fragment shaders for enhanced nebula cloud visualization
 */

// Vertex shader for volumetric nebula
export const nebulaVolumeVertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
        vPosition = position;
        vNormal = normal;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment shader for volumetric nebula
export const nebulaVolumeFragmentShader = `
    uniform float time;
    uniform vec3 primaryColor;
    uniform vec3 secondaryColor;
    uniform vec3 tertiaryColor;
    uniform vec3 blackHolePosition;
    uniform float blackHoleRadius;
    uniform float nebulaIntensity;
    uniform sampler2D noiseTexture;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    // Noise functions
    
    // 3D noise function
    float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        
        // Cubic smoothing
        f = f * f * (3.0 - 2.0 * f);
        
        // Sample the noise texture using interpolated coordinates
        vec2 offset = vec2(
            dot(p.yz, vec2(7.13, 13.7)),
            dot(p.zx, vec2(11.3, 17.1))
        ) * 0.005;
        
        return mix(
            texture2D(noiseTexture, (i.xy + offset) / 256.0).r,
            texture2D(noiseTexture, (i.xy + vec2(1.0, 0.0) + offset) / 256.0).r,
            f.x
        );
    }
    
    // FBM (Fractal Brownian Motion) for more complex noise
    float fbm(vec3 p) {
        float result = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        // Add multiple octaves of noise
        for (int i = 0; i < 5; i++) {
            result += amplitude * noise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
        }
        
        return result;
    }
    
    void main() {
        // Calculate distance from black hole
        vec3 relativePos = vPosition - blackHolePosition;
        float distFromCenter = length(relativePos);
        
        // No nebula inside the black hole
        if (distFromCenter < blackHoleRadius * 1.2) {
            discard;
        }
        
        // Normalized direction for noise sampling
        vec3 dir = normalize(relativePos);
        
        // Calculate animated noise coordinates
        vec3 noiseCoord = vPosition * 0.05 + vec3(0.0, 0.0, time * 0.02);
        
        // Generate complex noise pattern
        float noiseSample1 = fbm(noiseCoord);
        float noiseSample2 = fbm(noiseCoord * 2.0 + 10.0);
        float noiseSample3 = fbm(noiseCoord * 0.5 - 5.0);
        
        // Combine noise samples for complex effect
        float combinedNoise = noiseSample1 * 0.5 + noiseSample2 * 0.3 + noiseSample3 * 0.2;
        
        // Apply distance-based fading
        float maxDistance = blackHoleRadius * 8.0;
        float distanceFade = 1.0 - smoothstep(blackHoleRadius * 1.5, maxDistance, distFromCenter);
        
        // Mix between colors based on noise value
        vec3 color;
        if (combinedNoise < 0.4) {
            // Mix between primary and secondary colors
            float t = combinedNoise / 0.4;
            color = mix(primaryColor, secondaryColor, t);
        } else {
            // Mix between secondary and tertiary colors
            float t = (combinedNoise - 0.4) / 0.6;
            color = mix(secondaryColor, tertiaryColor, t);
        }
        
        // Add subtle glow based on noise
        color *= 0.8 + 0.4 * noiseSample2;
        
        // Calculate final opacity based on noise and distance
        float opacity = combinedNoise * distanceFade * nebulaIntensity;
        
        // Apply intensity multiplier for control
        opacity *= nebulaIntensity;
        
        // Ensure opacity is in valid range
        opacity = clamp(opacity, 0.0, 1.0);
        
        gl_FragColor = vec4(color, opacity);
    }
`;

// Vertex shader for nebula particles
export const nebulaParticlesVertexShader = `
    attribute float size;
    attribute float opacity;
    attribute vec3 particleColor;
    
    uniform float time;
    uniform float pixelRatio;
    uniform vec3 blackHolePosition;
    uniform float blackHoleRadius;
    
    varying float vOpacity;
    varying vec3 vColor;
    
    // Simple hash function
    float hash(float n) {
        return fract(sin(n) * 43758.5453);
    }
    
    void main() {
        vOpacity = opacity;
        vColor = particleColor;
        
        // Calculate distance from black hole
        vec3 relativePos = position - blackHolePosition;
        float distFromCenter = length(relativePos);
        
        // Calculate unique particle ID based on position
        float particleId = hash(position.x * 31.21 + position.y * 43.43 + position.z * 94.32);
        
        // Generate subtle movement
        vec3 pos = position;
        
        // Movement amplitude decreases with distance from black hole
        float movementAmplitude = 0.3 * smoothstep(blackHoleRadius * 6.0, blackHoleRadius * 2.0, distFromCenter);
        
        // Unique movement pattern for each particle
        float timeOffset = particleId * 6.28;
        pos.x += sin(time * 0.2 + timeOffset) * movementAmplitude;
        pos.y += cos(time * 0.3 + timeOffset * 1.2) * movementAmplitude;
        pos.z += sin(time * 0.1 + timeOffset * 0.7) * movementAmplitude;
        
        // Calculate view-space position
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Set point size based on attribute and distance
        gl_PointSize = size * pixelRatio * (30.0 / -mvPosition.z);
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment shader for nebula particles
export const nebulaParticlesFragmentShader = `
    uniform sampler2D particleTexture;
    
    varying float vOpacity;
    varying vec3 vColor;
    
    void main() {
        // Sample the particle texture
        vec4 texColor = texture2D(particleTexture, gl_PointCoord);
        
        // Apply color and opacity
        vec3 color = vColor * texColor.rgb;
        float alpha = texColor.a * vOpacity;
        
        // Discard fully transparent pixels
        if (alpha < 0.01) discard;
        
        gl_FragColor = vec4(color, alpha);
    }
`;

// Vertex shader for energy filaments
export const nebulaFilamentsVertexShader = `
    attribute float offset;
    
    uniform float time;
    uniform vec3 blackHolePosition;
    uniform float blackHoleRadius;
    
    varying float vOffset;
    varying vec3 vPosition;
    
    void main() {
        vOffset = offset;
        vPosition = position;
        
        // Set position with subtle movement
        vec3 pos = position;
        
        // Calculate unique line ID for varied animation
        float lineId = fract(offset * 43.785);
        
        // Movement is stronger closer to black hole
        vec3 relativePos = position - blackHolePosition;
        float distFromCenter = length(relativePos);
        float movementFactor = smoothstep(blackHoleRadius * 8.0, blackHoleRadius * 2.0, distFromCenter) * 0.5;
        
        // Add subtle rippling motion
        pos.x += sin(time * 0.3 + offset * 10.0) * movementFactor;
        pos.y += cos(time * 0.2 + offset * 12.0) * movementFactor;
        pos.z += sin(time * 0.4 + offset * 8.0) * movementFactor;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

// Fragment shader for energy filaments
export const nebulaFilamentsFragmentShader = `
    uniform float time;
    uniform vec3 filamentColor;
    uniform vec3 blackHolePosition;
    uniform float blackHoleRadius;
    
    varying float vOffset;
    varying vec3 vPosition;
    
    void main() {
        // Calculate distance from black hole
        vec3 relativePos = vPosition - blackHolePosition;
        float distFromCenter = length(relativePos);
        
        // Pulse effect along the filaments
        float pulse = sin(time * 2.0 + vOffset * 20.0) * 0.5 + 0.5;
        
        // Filaments glow brighter closer to the black hole
        float proximityGlow = smoothstep(blackHoleRadius * 8.0, blackHoleRadius * 1.5, distFromCenter);
        
        // Apply distance-based opacity
        float maxDistance = blackHoleRadius * 10.0;
        float opacity = (1.0 - smoothstep(blackHoleRadius * 1.5, maxDistance, distFromCenter)) * 0.6;
        
        // Combine with pulse effect
        opacity *= 0.5 + 0.5 * pulse;
        
        // Apply proximity glow to color
        vec3 color = filamentColor * (1.0 + proximityGlow);
        
        gl_FragColor = vec4(color, opacity);
    }
`; 