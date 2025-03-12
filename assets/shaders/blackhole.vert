uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float pixelRatio;
uniform float activeState;

attribute float size;
attribute vec3 customColor;
// We're not redefining normal as it's already a built-in attribute

varying vec3 vColor;
varying float vTime;
varying float vActiveState;

void main() {
    vColor = customColor;
    vTime = time;
    vActiveState = activeState;
    
    // Calculate position
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Size calculation
    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
