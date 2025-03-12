uniform sampler2D noiseTexture;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float opacity;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vColor;
varying float vTime;

void main() {
    // Basic noise-based nebula effect
    vec2 uv = vUv;
    
    // Add time-based movement to UVs
    uv.x += vTime * 0.01;
    uv.y += vTime * 0.015;
    
    // Base color from vertex
    vec3 finalColor = vColor;
    
    // Add noise variation (would normally use texture)
    float noise = (sin(vPosition.x * 10.0 + vTime) * 0.5 + 0.5) * 
                  (cos(vPosition.y * 8.0 + vTime * 0.8) * 0.5 + 0.5) * 
                  (sin(vPosition.z * 12.0 + vTime * 0.5) * 0.5 + 0.5);
    
    // Mix colors based on noise
    finalColor = mix(color1, color2, noise);
    finalColor = mix(finalColor, color3, noise * noise);
    
    // Edge fade
    float edge = length(vUv - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.6, edge) * opacity;
    
    gl_FragColor = vec4(finalColor, alpha);
}
