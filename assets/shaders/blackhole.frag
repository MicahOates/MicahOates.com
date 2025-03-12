uniform sampler2D texture;
uniform float time;

varying vec3 vColor;
varying float vTime;
varying float vActiveState;

void main() {
    // Calculate distance from center of point
    vec2 uv = gl_PointCoord.xy - 0.5;
    float r = length(uv);
    
    // Base color
    vec3 color = vColor;
    
    // Pulsing effect
    float pulseSpeed = 2.0;
    float pulse = 0.5 + 0.5 * sin(vTime * pulseSpeed);
    
    // Alpha calculation with smooth edge
    float alpha = smoothstep(0.5, 0.4, r);
    
    // Apply active state
    alpha *= vActiveState;
    
    // Output color with transparency
    gl_FragColor = vec4(color, alpha);
}
