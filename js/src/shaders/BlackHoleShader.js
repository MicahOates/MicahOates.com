/**
 * Vertex and fragment shaders for black hole rendering
 */

// Vertex shader for the black hole
export const blackHoleVertexShader = `
    uniform float time;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vNormal = normal;
        vPosition = position;
        
        // Slightly deform the sphere for a more organic feel
        vec3 newPosition = position;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

// Fragment shader for the black hole
export const blackHoleFragmentShader = `
    uniform float time;
    uniform float intensity;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        // Almost pure black with a hint of deep purple at the edges
        vec3 normal = normalize(vNormal);
        float rim = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 6.0) * 0.2;
        
        vec3 color = vec3(0.05, 0.0, 0.1) * rim * intensity;
        
        // Make the interior incredibly dark
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Vertex shader for the accretion disk
export const accretionDiskVertexShader = `
    attribute float size;
    attribute vec3 color;
    attribute float offset;
    
    uniform float time;
    uniform float pixelRatio;
    uniform float intensity;
    
    varying vec3 vColor;
    varying float vDiscard;
    
    void main() {
        vColor = color;
        vDiscard = 0.0;
        
        // Get particle distance from center
        float radius = length(position.xz);
        
        // Orbital speed decreases with distance (Keplerian motion)
        float speed = 0.2 * pow(10.0 / radius, 0.5);
        
        // Apply rotation based on radius
        float angle = time * speed + offset;
        vec3 pos = position;
        
        pos.x = radius * cos(angle);
        pos.z = radius * sin(angle);
        
        // Perturb particles slightly for more chaotic look
        pos.y += sin(time * 2.0 + offset) * 0.05;
        
        // Convert to screen space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale point size by distance and device pixel ratio
        gl_PointSize = size * (50.0 / -mvPosition.z) * pixelRatio * intensity;
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment shader for the accretion disk
export const accretionDiskFragmentShader = `
    varying vec3 vColor;
    varying float vDiscard;
    
    void main() {
        if (vDiscard > 0.5) discard;
        
        // Create circular particles with soft edges
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        float alpha = 1.0 - smoothstep(0.5, 1.0, r);
        
        // Apply slight glow effect
        gl_FragColor = vec4(vColor, alpha);
    }
`;

// Vertex shader for event horizon particles
export const eventHorizonVertexShader = `
    attribute float size;
    attribute vec3 color;
    
    uniform float time;
    uniform float pixelRatio;
    
    varying vec3 vColor;
    
    void main() {
        vColor = color;
        
        // Create subtle movement around the event horizon
        vec3 pos = position;
        
        // Generate unique identifier based on position
        float vertexId = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        
        // Subtle pulsation
        float pulseFactor = 0.05 * sin(time * 0.5 + vertexId * 10.0);
        
        // Scale position to create pulsing motion around horizon
        pos *= 1.0 + pulseFactor;
        
        // Add subtle rotation
        float angle = time * 0.2 + vertexId * 6.28;
        vec3 rotPos = pos;
        rotPos.x = pos.x * cos(angle) - pos.z * sin(angle);
        rotPos.z = pos.x * sin(angle) + pos.z * cos(angle);
        pos = rotPos;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Set point size
        gl_PointSize = size * (30.0 / -mvPosition.z) * pixelRatio;
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment shader for event horizon particles
export const eventHorizonFragmentShader = `
    varying vec3 vColor;
    
    void main() {
        // Create circular particles with faded edges
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        float alpha = 1.0 - smoothstep(0.5, 1.0, r);
        
        // Set final color
        gl_FragColor = vec4(vColor, alpha * 0.7); // Slightly transparent for ethereal look
    }
`;

// Vertex shader for hawking radiation
export const hawkingRadiationVertexShader = `
    attribute float size;
    attribute float particleType;
    attribute float vertexIndex;
    
    uniform float time;
    uniform float pixelRatio;
    uniform float intensity;
    
    varying float vAlpha;
    varying float vParticleType;
    
    void main() {
        // Pass particle position and type to fragment shader
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vParticleType = particleType;
        
        // Adjust point size based on distance to camera and intensity
        // Even smaller point size to reduce artifacts
        gl_PointSize = size * pixelRatio * (180.0 / -mvPosition.z) * intensity;
        gl_Position = projectionMatrix * mvPosition;
        
        // Calculate alpha based on position and intensity
        // Make escaping particles more visible than in-falling ones
        float visibilityFactor = particleType > 0.5 ? 0.7 : 0.4;
        vAlpha = smoothstep(0.0, 1.0, 1.0 - (length(mvPosition.xyz) / 50.0)) * intensity * visibilityFactor;
        
        // Add temporal variation for quantum fluctuation effect - even subtler
        // Using vertex position hash for WebGL compatibility
        float vertexRandomFactor = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        vAlpha *= 0.85 + 0.15 * sin(time * 1.5 + vertexRandomFactor * 10.0);
    }
`;

// Fragment shader for hawking radiation
export const hawkingRadiationFragmentShader = `
    uniform vec3 escapeColor;
    uniform vec3 infallColor;
    uniform float intensity;
    uniform float time;
    
    varying float vAlpha;
    varying float vParticleType;
    
    void main() {
        // Circular particles with smooth edges
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard; // Discard pixels outside circle
        
        // Apply stronger distance-based fading for softer particles
        float alpha = vAlpha * smoothstep(0.5, 0.1, dist) * 0.5; // Reduced opacity
        
        // Choose color based on particle type
        vec3 color = mix(infallColor, escapeColor, vParticleType);
        
        // Add very subtle glow effect
        float glowFactor = 1.0 + 0.05 * sin(time * 1.5 + vParticleType * 3.14); // Even subtler glow
        
        gl_FragColor = vec4(color * glowFactor, alpha * min(0.8, intensity)); // Cap the opacity
    }
`;

// Vertex shader for magnetic field lines
export const magneticFieldVertexShader = `
    attribute float lineProgress;
    
    uniform float time;
    uniform float fieldStrength;
    
    varying float vProgress;
    
    void main() {
        vProgress = lineProgress;
        
        vec3 pos = position;
        
        // Create subtle movement along the magnetic field lines
        // Unique pattern for each vertex 
        float vertexHash = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        float angle = time * 0.5 + vertexHash * 6.28;
        
        // Amplitude changes based on distance from center
        float distFromOrigin = length(position);
        float amplitude = 0.1 * fieldStrength * (1.0 - lineProgress);
        
        // Apply wave motion
        pos.x += sin(angle + lineProgress * 10.0) * amplitude;
        pos.y += cos(angle + lineProgress * 8.0) * amplitude;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

// Fragment shader for magnetic field lines
export const magneticFieldFragmentShader = `
    uniform vec3 startColor;
    uniform vec3 endColor;
    uniform float time;
    
    varying float vProgress;
    
    void main() {
        // Gradient color along the line based on progress
        vec3 color = mix(startColor, endColor, vProgress);
        
        // Pulsating glow effect
        float pulse = 0.8 + 0.2 * sin(time * 2.0 + vProgress * 6.0);
        
        // Fading opacity toward ends
        float opacity = (1.0 - vProgress * 0.7) * pulse;
        
        gl_FragColor = vec4(color, opacity);
    }
`; 