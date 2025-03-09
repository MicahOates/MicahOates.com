/**
 * Vertex and fragment shaders for time dilation visualization
 */

// Vertex shader for time dilation field
export const timeDilationVertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment shader for time dilation field
export const timeDilationFragmentShader = `
    uniform float time;
    uniform float blackHoleRadius;
    uniform float dilationStrength;
    uniform vec3 blackHolePosition;
    uniform vec3 colorInner;
    uniform vec3 colorOuter;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Function to calculate time dilation factor (simplified approximation of general relativity)
    float calculateTimeDilation(float distance) {
        // Using the Schwarzschild metric approximation: sqrt(1 - rs/r)
        // where rs is the Schwarzschild radius (approximated as blackHoleRadius)
        float schwarzschildRadius = blackHoleRadius * 0.8;
        float safeDistance = max(distance, schwarzschildRadius * 1.1);
        
        // Time dilation factor (1.0 means no dilation, approaching 0 means extreme dilation)
        float dilationFactor = sqrt(1.0 - (schwarzschildRadius / safeDistance));
        
        // Amplify the effect for visualization
        dilationFactor = pow(dilationFactor, dilationStrength);
        
        return dilationFactor;
    }
    
    void main() {
        // Calculate distance from black hole center
        vec3 relativePosition = vPosition - blackHolePosition;
        float dist = length(relativePosition);
        
        // Calculate time dilation factor
        float dilationFactor = calculateTimeDilation(dist);
        
        // Create a subtle wave effect based on time that's affected by dilation
        // Time appears to move slower closer to the black hole
        float timeScale = time * dilationFactor;
        float waveSpeed = 0.5;
        float waveFreq = 10.0;
        
        // Create waves that move slower near the black hole
        float wave = sin(timeScale * waveSpeed + dist * waveFreq) * 0.5 + 0.5;
        
        // Create color gradient based on dilation factor
        vec3 color = mix(colorInner, colorOuter, dilationFactor);
        
        // Add pulsing based on dilated time
        color *= 0.7 + 0.3 * wave;
        
        // Apply opacity based on distance (fade out away from black hole)
        float maxDistance = blackHoleRadius * 7.0;
        float opacity = smoothstep(maxDistance, blackHoleRadius, dist) * 0.6;
        
        // No dilation visualization inside event horizon
        if (dist < blackHoleRadius) {
            opacity = 0.0;
        }
        
        gl_FragColor = vec4(color, opacity);
    }
`;

// Vertex shader for time dilation particles
export const timeDilationParticlesVertexShader = `
    attribute float size;
    attribute float offset;
    attribute float particleType;
    
    uniform float time;
    uniform float pixelRatio;
    uniform vec3 blackHolePosition;
    uniform float blackHoleRadius;
    uniform float dilationStrength;
    
    varying float vParticleType;
    varying float vDilationFactor;
    
    // Calculate time dilation factor (simplified approximation of general relativity)
    float calculateTimeDilation(float distance) {
        // Using the Schwarzschild metric approximation: sqrt(1 - rs/r)
        float schwarzschildRadius = blackHoleRadius * 0.8;
        float safeDistance = max(distance, schwarzschildRadius * 1.1);
        
        // Time dilation factor
        float dilationFactor = sqrt(1.0 - (schwarzschildRadius / safeDistance));
        
        // Amplify the effect for visualization
        dilationFactor = pow(dilationFactor, dilationStrength);
        
        return dilationFactor;
    }
    
    void main() {
        vParticleType = particleType;
        
        // Get distance from black hole
        vec3 relativePosition = position - blackHolePosition;
        float distanceFromCenter = length(relativePosition);
        
        // Calculate time dilation factor
        float dilationFactor = calculateTimeDilation(distanceFromCenter);
        vDilationFactor = dilationFactor;
        
        // Adjust movement speed based on time dilation
        float adjustedTime = time * dilationFactor;
        
        // Basic circular orbits with time dilation affecting speed
        vec3 pos = position;
        
        // Use the offset for unique particle behavior
        float uniqueOffset = offset * 6.28;
        
        // Basic orbital motion in the x-z plane
        float orbitRadius = distanceFromCenter;
        float orbitSpeed = 0.2 * pow(10.0 / orbitRadius, 0.5); // Keplerian motion
        float angle = adjustedTime * orbitSpeed + uniqueOffset;
        
        // Different particles have slightly different orbital planes
        if (particleType > 0.5) {
            // Create orbit in the original plane with time dilation
            pos.x = blackHolePosition.x + orbitRadius * cos(angle);
            pos.z = blackHolePosition.z + orbitRadius * sin(angle);
        } else {
            // Create orbit in a slightly different plane
            float tiltAngle = offset * 0.2; // Small tilt
            pos.x = blackHolePosition.x + orbitRadius * cos(angle);
            pos.y = blackHolePosition.y + orbitRadius * sin(angle) * sin(tiltAngle);
            pos.z = blackHolePosition.z + orbitRadius * sin(angle) * cos(tiltAngle);
        }
        
        // Convert to screen space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale size based on distance and dilation
        float sizeScale = 0.7 + 0.3 * (1.0 - dilationFactor); // Larger near the black hole
        gl_PointSize = size * pixelRatio * (20.0 / -mvPosition.z) * sizeScale;
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment shader for time dilation particles
export const timeDilationParticlesFragmentShader = `
    uniform vec3 colorFast;
    uniform vec3 colorSlow;
    uniform float time;
    
    varying float vParticleType;
    varying float vDilationFactor;
    
    void main() {
        // Circular particles with soft edges
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord * 2.0);
        float alpha = 1.0 - smoothstep(0.5, 1.0, dist);
        
        // Discard pixels outside the circle
        if (dist > 1.0) discard;
        
        // Mix colors based on dilation factor
        vec3 color = mix(colorSlow, colorFast, vDilationFactor);
        
        // Add subtle pulsation based on dilated time
        float pulse = 0.8 + 0.2 * sin(time * vDilationFactor * 2.0 + vParticleType * 6.28);
        color *= pulse;
        
        // Set transparency based on dilation (slower time = more visible)
        float particleAlpha = alpha * (0.3 + 0.7 * (1.0 - vDilationFactor));
        
        gl_FragColor = vec4(color, particleAlpha);
    }
`;

// Vertex shader for clock visualization
export const clockVertexShader = `
    attribute float clockIndex;
    attribute float radius;
    
    uniform float time;
    uniform float pixelRatio;
    uniform vec3 blackHolePosition;
    uniform float blackHoleRadius;
    uniform float dilationStrength;
    
    varying float vDilationFactor;
    varying float vClockIndex;
    
    // Calculate time dilation factor (simplified approximation of general relativity)
    float calculateTimeDilation(float distance) {
        // Using the Schwarzschild metric approximation: sqrt(1 - rs/r)
        float schwarzschildRadius = blackHoleRadius * 0.8;
        float safeDistance = max(distance, schwarzschildRadius * 1.1);
        
        // Time dilation factor
        float dilationFactor = sqrt(1.0 - (schwarzschildRadius / safeDistance));
        
        // Amplify the effect for visualization
        dilationFactor = pow(dilationFactor, dilationStrength);
        
        return dilationFactor;
    }
    
    void main() {
        vClockIndex = clockIndex;
        
        // Get distance from black hole
        vec3 relativePosition = position - blackHolePosition;
        float distanceFromCenter = length(relativePosition);
        
        // Calculate time dilation factor
        float dilationFactor = calculateTimeDilation(distanceFromCenter);
        vDilationFactor = dilationFactor;
        
        // Adjust movement speed based on time dilation
        float adjustedTime = time * dilationFactor;
        
        // Calculate clock hands position
        // Each clock has a unique index to identify it
        vec3 pos = position;
        
        // Convert to screen space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale size based on distance
        gl_PointSize = radius * 2.0 * pixelRatio * (30.0 / -mvPosition.z);
        
        // Set position
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment shader for clock visualization
export const clockFragmentShader = `
    uniform float time;
    uniform vec3 clockFaceColor;
    uniform vec3 clockHandColor;
    
    varying float vDilationFactor;
    varying float vClockIndex;
    
    void main() {
        // Create a clock face
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);
        
        // Dilated time for this clock
        float dilatedTime = time * vDilationFactor;
        
        // Create clock hands
        // Hour hand (completes a rotation every 12 units of time)
        float hourAngle = (dilatedTime / 12.0) * 2.0 * 3.14159;
        vec2 hourHand = vec2(sin(hourAngle), cos(hourAngle)) * 0.3;
        float hourDist = length(uv - hourHand * length(uv) / 0.3);
        
        // Minute hand (completes a rotation every unit of time)
        float minuteAngle = dilatedTime * 2.0 * 3.14159;
        vec2 minuteHand = vec2(sin(minuteAngle), cos(minuteAngle)) * 0.4;
        float minuteDist = length(uv - minuteHand * length(uv) / 0.4);
        
        // Second hand (completes a rotation every 1/60 unit of time)
        float secondAngle = (dilatedTime * 60.0) * 2.0 * 3.14159;
        vec2 secondHand = vec2(sin(secondAngle), cos(secondAngle)) * 0.45;
        float secondDist = length(uv - secondHand * length(uv) / 0.45);
        
        // Draw clock hands
        float handWidth = 0.02;
        float secondHandWidth = 0.01;
        
        // Combine all components
        vec3 color = clockFaceColor;
        float alpha = smoothstep(0.5, 0.48, dist); // Clock face with slightly soft edge
        
        // Add hour markers
        for (int i = 0; i < 12; i++) {
            float markerAngle = float(i) / 12.0 * 2.0 * 3.14159;
            vec2 markerPos = vec2(sin(markerAngle), cos(markerAngle)) * 0.45;
            float markerDist = length(uv - markerPos * length(uv) / 0.45);
            
            if (markerDist < 0.03) {
                color = mix(color, clockHandColor, 0.7);
            }
        }
        
        // Draw hands
        if (hourDist < handWidth || minuteDist < handWidth || secondDist < secondHandWidth) {
            color = clockHandColor;
        }
        
        // Center dot
        if (dist < 0.05) {
            color = clockHandColor;
        }
        
        // Discard outside of clock
        if (dist > 0.5) discard;
        
        gl_FragColor = vec4(color, alpha);
    }
`; 