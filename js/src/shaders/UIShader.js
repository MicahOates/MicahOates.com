/**
 * UI Shader Collection - Contains shaders for the UI elements
 */

// Navigation Orb Vertex Shader
export const navigationOrbVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

// Navigation Orb Fragment Shader
export const navigationOrbFragmentShader = `
uniform vec3 orbColor;
uniform vec3 glowColor;
uniform float time;
uniform float hoverState;
uniform float activeState;
uniform float opacity;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    // Calculate basic lighting
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float intensity = 0.5 + 0.5 * dot(vNormal, light);
    
    // Fresnel effect for glow around edges
    float rimPower = 3.0;
    float rimStrength = 0.7 + 0.3 * sin(time * 1.5);
    vec3 viewDirection = normalize(-vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), rimPower);
    
    // Pulse effect
    float pulse = 0.5 + 0.5 * sin(time * 2.0);
    float pulseFactor = 0.05 + 0.05 * pulse;
    
    // Calculate orb color
    vec3 baseColor = orbColor * intensity;
    vec3 rim = glowColor * fresnel * rimStrength;
    
    // Add quantum-like noise pattern
    float noiseScale = 20.0;
    float noise = fract(sin(dot(vNormal + time * 0.1, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    
    // Enhance when hovered or active
    float hoverEffect = hoverState * 0.3;
    float activeEffect = activeState * 0.5;
    
    // Apply effects
    vec3 finalColor = mix(baseColor, rim, fresnel * (0.5 + 0.5 * pulse));
    finalColor += noise * 0.1 * (1.0 + hoverEffect * 2.0 + activeEffect * 3.0);
    finalColor += glowColor * (hoverEffect + activeEffect) * pulse;
    
    // Adjust opacity based on hover and active states
    float finalOpacity = opacity + hoverEffect * 0.2 + activeEffect * 0.3;
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}
`;

// Quantum Connection Vertex Shader
export const quantumConnectionVertexShader = `
uniform float time;
uniform vec3 startPoint;
uniform vec3 endPoint;

attribute float progress;

varying float vProgress;
varying float vTime;

void main() {
    vProgress = progress;
    vTime = time;
    
    // Calculate position along the line
    vec3 direction = endPoint - startPoint;
    vec3 position = startPoint + direction * progress;
    
    // Add wave pattern
    float waveAmplitude = sin(progress * 10.0 + time) * 0.3;
    float waveFrequency = 5.0;
    
    // Calculate perpendicular direction to create wave
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(direction, up));
    vec3 wave = normalize(cross(right, direction)) * waveAmplitude;
    
    // Add quantum jitter
    float jitter = sin(progress * 20.0 + time * 3.0) * 0.1;
    wave += right * jitter;
    
    // Apply wave to position
    position += wave * sin(progress * waveFrequency + time * 2.0);
    
    // Set position
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Set point size
    float size = 3.0 * (1.0 - abs(progress - 0.5) * 1.5);
    gl_PointSize = size + sin(progress * 30.0 + time * 5.0) * 1.0;
}
`;

// Quantum Connection Fragment Shader
export const quantumConnectionFragmentShader = `
uniform float time;
uniform float connectionStrength;
uniform vec3 connectionColor;

varying float vProgress;
varying float vTime;

void main() {
    // Calculate point shape (circular)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Calculate energy pulse
    float pulse = sin(vProgress * 30.0 - vTime * 5.0) * 0.5 + 0.5;
    float alphaFade = smoothstep(0.5, 0.0, dist);
    
    // Calculate quantum energy glow
    float energyGlow = pow(1.0 - dist * 2.0, 2.0) * (0.4 + 0.6 * pulse);
    
    // Calculate alpha
    float alpha = alphaFade * energyGlow * connectionStrength;
    alpha *= smoothstep(0.0, 0.2, vProgress) * smoothstep(1.0, 0.8, vProgress); // Fade at ends
    
    // Final color
    vec3 finalColor = connectionColor * (0.6 + 0.4 * pulse);
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

// Data Fragment Vertex Shader
export const dataFragmentVertexShader = `
uniform float time;
uniform float pixelRatio;
uniform float activeState;

attribute float size;
attribute vec3 customColor;

varying vec3 vColor;
varying float vTime;
varying float vActiveState;

void main() {
    vColor = customColor;
    vTime = time;
    vActiveState = activeState;
    
    // Calculate position with subtle floating motion
    vec3 pos = position;
    
    // Add floating motion
    float floatSpeed = 0.7;
    float floatAmplitude = 0.3;
    pos += normal * sin(time * floatSpeed) * floatAmplitude;
    
    // Add orbital rotation when active
    if (activeState > 0.0) {
        float angle = time * activeState * 0.5;
        float radius = length(pos.xz);
        float c = cos(angle);
        float s = sin(angle);
        pos.x = c * pos.x - s * pos.z;
        pos.z = s * pos.x + c * pos.z;
    }
    
    // Set position
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Calculate size with pulsing effect
    float pulseFactor = 0.2 * sin(time * 3.0 + length(position) * 5.0) + 1.0;
    float finalSize = size * pulseFactor * (1.0 + activeState * 0.5);
    
    // Set point size
    gl_PointSize = finalSize * pixelRatio * (300.0 / -mvPosition.z);
}
`;

// Data Fragment Fragment Shader
export const dataFragmentFragmentShader = `
uniform sampler2D fragmentTexture;
uniform float time;
uniform float activeState;

varying vec3 vColor;
varying float vTime;
varying float vActiveState;

void main() {
    vec2 uv = gl_PointCoord;
    
    // Sample texture
    vec4 texColor = texture2D(fragmentTexture, uv);
    
    // Early discard for transparent pixels
    if (texColor.a < 0.1) discard;
    
    // Add glowing pulse effect
    float pulse = 0.2 * sin(vTime * 2.0) + 0.8;
    
    // Calculate energy glow
    float energyGlow = 0.8 + 0.2 * pulse;
    
    // Enhance when active
    energyGlow += vActiveState * 0.3;
    
    // Apply color and glow
    vec3 finalColor = vColor * texColor.rgb * energyGlow;
    
    // Add quantum scintillation (random sparkles)
    float sparkleTime = vTime * 5.0;
    vec2 sparklePos = vec2(
        fract(sin(dot(uv, vec2(12.9898, 78.233)) + sparkleTime) * 43758.5453),
        fract(sin(dot(uv, vec2(39.346, 11.135)) + sparkleTime) * 22873.2631)
    );
    float sparkle = pow(1.0 - distance(sparklePos, vec2(0.5)), 8.0) * 0.15;
    finalColor += sparkle * vColor * vActiveState;
    
    // Calculate alpha
    float alpha = texColor.a * (0.7 + 0.3 * pulse) * (1.0 + vActiveState * 0.3);
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

// Section Background Vertex Shader
export const sectionBackgroundVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Section Background Fragment Shader
export const sectionBackgroundFragmentShader = `
uniform vec3 colorA;
uniform vec3 colorB;
uniform float activeState;
uniform float time;

varying vec2 vUv;

// Simplex noise function
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                    -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    // Calculate gradient from top to bottom
    float gradientFactor = 1.0 - vUv.y;
    
    // Calculate noise pattern
    float scale = 5.0;
    float noiseValue = snoise(vUv * scale + vec2(time * 0.05, time * 0.03)) * 0.1;
    
    // Edge highlighting
    float edgeX = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
    float edgeY = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
    float edge = edgeX * edgeY;
    
    // Combine color
    vec3 gradientColor = mix(colorB, colorA, gradientFactor + noiseValue);
    
    // Add glow at edges
    float glow = 0.3 * (1.0 - edge) * (0.5 + 0.5 * sin(time * 0.5));
    gradientColor += glow * colorA;
    
    // Add subtle noise pattern for quantum effect
    gradientColor += noiseValue * colorA;
    
    // Calculate alpha with fade-in effect
    float alpha = 0.4 + 0.2 * gradientFactor;
    alpha *= activeState * (0.8 + 0.2 * sin(time));
    
    gl_FragColor = vec4(gradientColor, alpha);
}
`; 