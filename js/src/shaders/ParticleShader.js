/**
 * Vertex and fragment shaders for particle effects
 */

// Background particle vertex shader
export const backgroundParticleVertexShader = `
    attribute float size;
    attribute float opacity;
    
    uniform float time;
    uniform float pixelRatio;
    uniform float activityLevel;
    
    varying float vOpacity;
    
    void main() {
        vOpacity = opacity;
        
        // Get particle position
        vec3 pos = position;
        
        // Add subtle drift in a quantum-like motion
        float drift = 0.2 + activityLevel * 0.4;
        pos.x += sin(time * 0.2 + pos.z) * drift;
        pos.y += cos(time * 0.3 + pos.x) * drift;
        pos.z += sin(time * 0.1 + pos.y) * drift;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale size by distance
        gl_PointSize = size * pixelRatio * (20.0 / -mvPosition.z);
        
        // Increase size with activity level
        gl_PointSize *= 1.0 + activityLevel * 0.5;
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Background particle fragment shader
export const backgroundParticleFragmentShader = `
    uniform vec3 color;
    uniform float activityLevel;
    
    varying float vOpacity;
    
    void main() {
        // Create soft circular particle
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center * 2.0);
        float alpha = (1.0 - smoothstep(0.5, 1.0, dist)) * vOpacity;
        
        // Boost alpha with activity level
        alpha *= 1.0 + activityLevel * 0.3;
        
        // Set final color with alpha
        if (dist > 1.0) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;

// Quantum fluctuation vertex shader
export const quantumFluctuationVertexShader = `
    attribute float size;
    
    uniform float time;
    uniform float startTime;
    uniform float pixelRatio;
    uniform float intensity;
    
    varying float vAge;
    
    void main() {
        // Calculate age of the effect
        vAge = (time - startTime) / 2.0; // Life span of 2 seconds
        
        // Expand particles outward over time
        vec3 pos = position;
        vec3 dir = normalize(position);
        
        float expansionDistance = vAge * 5.0;
        pos = pos + dir * expansionDistance * intensity;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Size decreases over lifetime
        float sizeMultiplier = max(0.0, 1.0 - vAge);
        gl_PointSize = size * pixelRatio * (20.0 / -mvPosition.z) * sizeMultiplier * intensity;
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Quantum fluctuation fragment shader
export const quantumFluctuationFragmentShader = `
    uniform vec3 color;
    
    varying float vAge;
    
    void main() {
        // Discard if past lifetime
        if (vAge >= 1.0) discard;
        
        // Create soft circular particle that fades out over time
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center * 2.0);
        float alpha = (1.0 - smoothstep(0.5, 1.0, dist)) * (1.0 - vAge);
        
        // Set final color with alpha
        if (dist > 1.0) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;

// Data stream particle vertex shader
export const dataStreamVertexShader = `
    attribute float size;
    attribute vec3 color;
    
    uniform float time;
    uniform float pixelRatio;
    
    varying vec3 vColor;
    varying float vProgress;
    
    void main() {
        vColor = color;
        
        // Generate unique identifier based on position
        float vertexId = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        vProgress = vertexId;
        
        // Add motion along the stream
        vec3 pos = position;
        float streamSpeed = 5.0;
        float waveFrequency = 3.0;
        float waveAmplitude = 0.1;
        
        // Progress along the stream
        float progress = mod(time * streamSpeed + vertexId * 10.0, 10.0);
        
        // Add sinusoidal motion perpendicular to stream direction
        pos.x += sin(progress * waveFrequency) * waveAmplitude;
        pos.y += cos(progress * waveFrequency) * waveAmplitude;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale size by distance
        gl_PointSize = size * pixelRatio * (40.0 / -mvPosition.z);
        
        // Add size variation based on stream position
        gl_PointSize *= 0.8 + 0.4 * sin(progress);
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Data stream particle fragment shader
export const dataStreamFragmentShader = `
    varying vec3 vColor;
    varying float vProgress;
    
    void main() {
        // Create glow effect for particles
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        
        // More pronounced glow for leading particles
        float glow = 1.0 - r * (0.5 + vProgress * 0.5);
        glow = max(0.0, glow);
        
        // Fade out at edges
        float alpha = glow * (1.0 - smoothstep(0.8, 1.0, r));
        
        // Set final color with alpha
        vec3 color = vColor * glow;
        gl_FragColor = vec4(color, alpha);
    }
`;

// Nebula cloud vertex shader
export const nebulaVertexShader = `
    attribute float size;
    attribute vec3 color;
    attribute float opacity;
    
    uniform float time;
    uniform float pixelRatio;
    
    varying vec3 vColor;
    varying float vOpacity;
    
    void main() {
        vColor = color;
        vOpacity = opacity;
        
        // Get particle position
        vec3 pos = position;
        
        // Add subtle flow motion to nebula particles
        float flowSpeed = 0.1;
        float flowAmplitude = 0.5;
        
        // Generate unique random value from position
        float randomOffset = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        
        // Add fluid-like motion
        pos.x += sin(time * flowSpeed + pos.z * 0.1 + randomOffset * 6.28) * flowAmplitude;
        pos.y += cos(time * flowSpeed * 1.3 + pos.x * 0.1 + randomOffset * 6.28) * flowAmplitude * 0.5;
        pos.z += sin(time * flowSpeed * 0.7 + pos.y * 0.1 + randomOffset * 6.28) * flowAmplitude * 0.3;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale size by distance
        gl_PointSize = size * pixelRatio * (100.0 / -mvPosition.z);
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Nebula cloud fragment shader
export const nebulaFragmentShader = `
    uniform sampler2D cloudTexture;
    
    varying vec3 vColor;
    varying float vOpacity;
    
    void main() {
        // Sample cloud texture for particle shape
        vec4 texColor = texture2D(cloudTexture, gl_PointCoord);
        
        // Apply color and alpha
        vec3 color = vColor * texColor.rgb;
        float alpha = texColor.a * vOpacity;
        
        // Set final color with alpha
        gl_FragColor = vec4(color, alpha);
    }
`; 