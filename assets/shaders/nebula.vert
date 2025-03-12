uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 color;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vColor;
varying float vTime;

void main() {
    vUv = uv;
    vPosition = position;
    vColor = color;
    vTime = time;
    
    // Add subtle movement
    vec3 pos = position;
    pos.x += sin(time * 0.5 + position.z * 0.1) * 0.1;
    pos.y += cos(time * 0.4 + position.x * 0.1) * 0.1;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
