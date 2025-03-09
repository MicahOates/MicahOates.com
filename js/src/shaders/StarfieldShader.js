/**
 * Vertex and fragment shaders for starfield background
 */

// Starfield vertex shader
export const starfieldVertexShader = `
    attribute float size;
    attribute float brightness;
    attribute float twinkleSpeed;
    
    uniform float time;
    uniform float pixelRatio;
    
    varying float vBrightness;
    varying float vDistance;
    
    void main() {
        vBrightness = brightness;
        
        // Get distance from center for depth effect
        vDistance = length(position) / 100.0;
        
        // Add subtle movement to simulate space drift
        vec3 pos = position;
        float driftFactor = 0.05;
        float driftSpeed = 0.1;
        
        pos.x += sin(time * driftSpeed + position.z * 0.1) * driftFactor;
        pos.y += cos(time * driftSpeed * 0.7 + position.x * 0.1) * driftFactor;
        pos.z += sin(time * driftSpeed * 0.5 + position.y * 0.1) * driftFactor;
        
        // Add twinkle effect
        float twinkle = sin(time * twinkleSpeed + vBrightness * 10.0) * 0.5 + 0.5;
        
        // Convert to view space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale point size by distance and pixel ratio
        gl_PointSize = size * (500.0 / -mvPosition.z) * pixelRatio * (0.5 + twinkle * 0.5);
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Starfield fragment shader
export const starfieldFragmentShader = `
    uniform vec3 baseColor;
    
    varying float vBrightness;
    varying float vDistance;
    
    void main() {
        // Create point light with soft edge
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center * 2.0);
        
        // Create soft circular shape
        float alpha = 1.0 - smoothstep(0.5, 1.0, dist);
        
        // Apply brightness variation based on vertex attribute
        alpha *= vBrightness;
        
        // Apply distance fade for stars further away
        alpha *= 1.0 - (vDistance * 0.5);
        
        // Add color variation based on brightness and distance
        // Brighter stars are whiter, distant stars have more color
        vec3 color = mix(baseColor, vec3(1.0), vBrightness * 0.6);
        
        // Set final color with alpha
        if (dist > 1.0) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;

// Distant nebula background vertex shader
export const nebulaBackgroundVertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Distant nebula background fragment shader
export const nebulaBackgroundFragmentShader = `
    uniform float time;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform vec3 colorC;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Simplex noise functions
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        // First corner
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        // x0 = x0 - 0.0 + 0.0 * C.xxx;
        // x1 = x0 - i1  + 1.0 * C.xxx;
        // x2 = x0 - i2  + 2.0 * C.xxx;
        // x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
        
        // Permutations
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                   
        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        float n_ = 0.142857142857; // 1.0/7.0
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        // Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
    
    void main() {
        // Create large-scale nebula effect with simplex noise
        vec2 uv = vUv;
        
        // Set up different noise scales
        float scale1 = 3.0;  // Large-scale structures
        float scale2 = 6.0;  // Medium-scale details
        float scale3 = 12.0; // Small-scale details
        
        // Add slow movement to the nebula
        float timeScale = time * 0.05;
        
        // Sample noise at different scales and movement speeds
        float noise1 = snoise(vec3(uv * scale1, timeScale * 0.2)) * 0.5 + 0.5;
        float noise2 = snoise(vec3(uv * scale2, timeScale * 0.3)) * 0.5 + 0.5;
        float noise3 = snoise(vec3(uv * scale3, timeScale * 0.4)) * 0.5 + 0.5;
        
        // Combine noise layers
        float combinedNoise = noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1;
        
        // Map noise to color gradient
        vec3 color;
        if (combinedNoise < 0.4) {
            float t = combinedNoise / 0.4;
            color = mix(vec3(0.0, 0.0, 0.1), colorA, t); // Dark to first color
        } else if (combinedNoise < 0.7) {
            float t = (combinedNoise - 0.4) / 0.3;
            color = mix(colorA, colorB, t); // First color to second
        } else {
            float t = (combinedNoise - 0.7) / 0.3;
            color = mix(colorB, colorC, t); // Second color to third
        }
        
        // Add more depth with vignette
        float vignette = 1.0 - length((uv - 0.5) * 1.5);
        vignette = smoothstep(0.0, 1.0, vignette);
        
        // Make edges of background darker
        color *= vignette * 0.5 + 0.5;
        
        // Make background subtly transparent at the edges
        float alpha = 0.7 * (vignette * 0.8 + 0.2);
        
        gl_FragColor = vec4(color, alpha);
    }
`; 