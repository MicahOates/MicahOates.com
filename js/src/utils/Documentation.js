/**
 * Documentation system for the application
 * Provides self-documentation and usage guides
 */
export class Documentation {
    constructor(app) {
        this.app = app;
        
        // Component references for documentation
        this.components = [
            {
                id: 'app',
                name: 'Main Application',
                description: 'Core application handling initialization and main rendering loop',
                methods: [
                    { name: 'init', description: 'Initialize the application' },
                    { name: 'animate', description: 'Main animation loop' },
                    { name: 'update', description: 'Update all components' },
                    { name: 'render', description: 'Render the scene' }
                ]
            },
            {
                id: 'scene',
                name: 'Scene Manager',
                description: 'Manages the 3D scene, camera, and background elements',
                methods: [
                    { name: 'createScene', description: 'Create the Three.js scene' },
                    { name: 'createCamera', description: 'Create and configure the camera' },
                    { name: 'createRenderer', description: 'Set up the WebGL renderer' },
                    { name: 'animateCameraTo', description: 'Animate camera to new position' },
                    { name: 'orbitCamera', description: 'Make camera orbit around a point' }
                ]
            },
            {
                id: 'blackhole',
                name: 'Black Hole Effect',
                description: 'Visual simulation of a black hole with physics-based effects',
                methods: [
                    { name: 'createEventHorizon', description: 'Create the event horizon mesh' },
                    { name: 'createAccretionDisk', description: 'Create the accretion disk' },
                    { name: 'updateGravitationalLensing', description: 'Update the gravitational lensing effect' }
                ]
            },
            {
                id: 'nebula',
                name: 'Nebula Effect',
                description: 'Volumetric nebula cloud rendering',
                methods: [
                    { name: 'createNebulaCloud', description: 'Create nebula cloud particles' },
                    { name: 'createEnergyFilaments', description: 'Create energy filaments within nebula' }
                ]
            },
            {
                id: 'postprocessing',
                name: 'Post-Processing',
                description: 'Visual effects applied after scene rendering',
                methods: [
                    { name: 'applyBloom', description: 'Apply bloom effect to bright areas' },
                    { name: 'applyFilmGrain', description: 'Apply film grain noise' },
                    { name: 'applyChromatic', description: 'Apply chromatic aberration' }
                ]
            },
            {
                id: 'ui',
                name: 'UI System',
                description: 'User interface elements and interactions',
                methods: [
                    { name: 'createOrbs', description: 'Create navigation orbs' },
                    { name: 'handleInteraction', description: 'Handle user interactions' },
                    { name: 'showSection', description: 'Show content section' }
                ]
            },
            {
                id: 'audio',
                name: 'Audio System',
                description: 'Sound generation and audio management',
                methods: [
                    { name: 'createAmbientSound', description: 'Create ambient background sound' },
                    { name: 'createUISound', description: 'Create UI interaction sound' }
                ]
            },
            {
                id: 'performance',
                name: 'Performance Monitor',
                description: 'Performance monitoring and quality adaptation',
                methods: [
                    { name: 'updateFPS', description: 'Update FPS calculations' },
                    { name: 'checkPerformance', description: 'Check and adapt to performance changes' },
                    { name: 'toggleDebug', description: 'Toggle debug overlay' }
                ]
            }
        ];
        
        // Performance tips
        this.performanceTips = [
            'Disable post-processing effects for better performance on mobile devices',
            'Lower the pixel ratio for significant performance gains',
            'Use low-poly models and limit the number of particles',
            'Use instanced geometry for repeating elements',
            'Avoid dynamic lights when possible, use baked lighting',
            'Use object pooling to reduce garbage collection',
            'Optimize shader complexity, especially fragment shaders'
        ];
        
        // GLSL shader examples for reference
        this.shaderExamples = {
            vertex: `
// Example vertex shader with attributes
attribute vec3 position;
attribute vec2 uv;
attribute float size;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float time;

varying vec2 vUv;
varying float vSize;

void main() {
    vUv = uv;
    vSize = size;
    
    // Animation based on time
    vec3 pos = position;
    pos.y += sin(time * 0.5 + position.x) * 0.1;
    
    // Final position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size;
}`,
            fragment: `
// Example fragment shader with uniforms
uniform vec3 color;
uniform sampler2D texture;
uniform float opacity;

varying vec2 vUv;
varying float vSize;

void main() {
    // Sample texture
    vec4 texColor = texture2D(texture, vUv);
    
    // Apply color and opacity
    gl_FragColor = vec4(color, 1.0) * texColor;
    gl_FragColor.a *= opacity;
}`,
            blackHole: `
// Fragment shader snippet for black hole effect
uniform sampler2D backgroundTexture;
uniform vec2 resolution;
uniform float blackHoleRadius;
uniform float gravitationalConstant;

varying vec2 vUv;

void main() {
    // Convert UV to clip space coordinates (-1 to 1)
    vec2 p = (vUv * 2.0 - 1.0) * resolution / min(resolution.x, resolution.y);
    
    // Distance from center
    float r = length(p);
    
    // Schwarzschild radius (event horizon)
    float rs = blackHoleRadius;
    
    // Gravitational lensing effect
    float displacement = gravitationalConstant / max(r - rs, 0.001);
    
    // Distort coordinates
    vec2 distortedUv = vUv;
    if (r > rs) {
        // Apply distortion outside event horizon
        vec2 dir = normalize(p);
        distortedUv -= dir * displacement / resolution;
    }
    
    // Sample background with distorted coordinates
    vec4 color;
    if (r <= rs) {
        // Inside event horizon
        color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Outside event horizon - apply distortion
        color = texture2D(backgroundTexture, distortedUv);
    }
    
    gl_FragColor = color;
}`
        };
    }
    
    /**
     * Generate documentation output
     * @param {string} componentId - Optional component ID to filter
     * @returns {string} HTML documentation
     */
    generateDocumentation(componentId = null) {
        let html = '<div class="documentation">';
        
        // Header
        html += '<h2>Interactive Space Visualization Documentation</h2>';
        
        // Filter components if needed
        const componentsToShow = componentId 
            ? this.components.filter(c => c.id === componentId)
            : this.components;
            
        // Generate component docs
        html += '<div class="components-container">';
        for (const component of componentsToShow) {
            html += this.generateComponentDoc(component);
        }
        html += '</div>';
        
        // Add performance tips if showing all components
        if (!componentId) {
            html += this.generatePerformanceTips();
        }
        
        // Add shader examples if showing all components or specific shader components
        if (!componentId || ['blackhole', 'nebula', 'postprocessing'].includes(componentId)) {
            html += this.generateShaderExamples(componentId);
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * Generate documentation for a specific component
     * @param {Object} component - Component data
     * @returns {string} HTML for component documentation
     */
    generateComponentDoc(component) {
        let html = `
            <div class="component" id="doc-${component.id}">
                <h3>${component.name}</h3>
                <p>${component.description}</p>
                <h4>Methods</h4>
                <ul class="methods-list">
        `;
        
        // Add methods
        for (const method of component.methods) {
            html += `<li><strong>${method.name}</strong> - ${method.description}</li>`;
        }
        
        html += `
                </ul>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Generate performance tips section
     * @returns {string} HTML for performance tips
     */
    generatePerformanceTips() {
        let html = `
            <div class="performance-tips">
                <h3>Performance Optimization Tips</h3>
                <ul>
        `;
        
        for (const tip of this.performanceTips) {
            html += `<li>${tip}</li>`;
        }
        
        html += `
                </ul>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Generate shader examples section
     * @param {string} componentId - Optional component ID to filter
     * @returns {string} HTML for shader examples
     */
    generateShaderExamples(componentId = null) {
        let html = `
            <div class="shader-examples">
                <h3>Shader Examples</h3>
        `;
        
        // Generic vertex and fragment shader examples
        if (!componentId || ['nebula', 'postprocessing'].includes(componentId)) {
            html += `
                <div class="shader-example">
                    <h4>Vertex Shader</h4>
                    <pre><code>${this.shaderExamples.vertex}</code></pre>
                </div>
                
                <div class="shader-example">
                    <h4>Fragment Shader</h4>
                    <pre><code>${this.shaderExamples.fragment}</code></pre>
                </div>
            `;
        }
        
        // Black hole specific shader
        if (!componentId || componentId === 'blackhole') {
            html += `
                <div class="shader-example">
                    <h4>Black Hole Gravitational Lensing Shader</h4>
                    <pre><code>${this.shaderExamples.blackHole}</code></pre>
                </div>
            `;
        }
        
        html += `
            </div>
        `;
        
        return html;
    }
    
    /**
     * Create and show documentation UI
     * @param {string} componentId - Optional component ID to show
     */
    showDocumentation(componentId = null) {
        // Create documentation overlay if not exists
        let docOverlay = document.getElementById('documentation-overlay');
        
        if (!docOverlay) {
            docOverlay = document.createElement('div');
            docOverlay.id = 'documentation-overlay';
            docOverlay.className = 'documentation-overlay';
            
            // Set styles
            docOverlay.style.position = 'fixed';
            docOverlay.style.top = '0';
            docOverlay.style.left = '0';
            docOverlay.style.width = '100%';
            docOverlay.style.height = '100%';
            docOverlay.style.background = 'rgba(0, 0, 0, 0.9)';
            docOverlay.style.zIndex = '10000';
            docOverlay.style.overflowY = 'auto';
            docOverlay.style.padding = '20px';
            docOverlay.style.boxSizing = 'border-box';
            docOverlay.style.color = '#fff';
            docOverlay.style.display = 'flex';
            docOverlay.style.flexDirection = 'column';
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'fixed';
            closeButton.style.top = '20px';
            closeButton.style.right = '20px';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.color = '#fff';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.zIndex = '10001';
            
            // Add event listener
            closeButton.addEventListener('click', () => {
                document.body.removeChild(docOverlay);
            });
            
            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'documentation-content';
            contentContainer.style.maxWidth = '800px';
            contentContainer.style.margin = '0 auto';
            contentContainer.style.paddingTop = '40px';
            
            // Add components
            docOverlay.appendChild(closeButton);
            docOverlay.appendChild(contentContainer);
            
            // Add to DOM
            document.body.appendChild(docOverlay);
            
            // Add keyboard shortcut to close (Escape)
            document.addEventListener('keydown', function closeDocOnEsc(e) {
                if (e.key === 'Escape') {
                    if (docOverlay.parentNode) {
                        document.body.removeChild(docOverlay);
                    }
                    document.removeEventListener('keydown', closeDocOnEsc);
                }
            });
        }
        
        // Get content container
        const contentContainer = docOverlay.querySelector('.documentation-content');
        
        // Generate and set HTML
        contentContainer.innerHTML = this.generateDocumentation(componentId);
        
        // Add syntax highlighting if prism.js is available
        if (window.Prism) {
            window.Prism.highlightAllUnder(contentContainer);
        }
    }
} 