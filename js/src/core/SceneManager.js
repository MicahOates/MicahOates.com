import * as THREE from 'three';

export class SceneManager {
    constructor(app) {
        this.app = app;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
    
    /**
     * Initialize the scene, camera, and renderer
     */
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
    }
    
    /**
     * Create Three.js scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
        
        // Store reference in the app
        this.app.scene = this.scene;
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);
        
        // Create cosmic background (starfield)
        this.createCosmicBackground();
    }
    
    /**
     * Create camera
     */
    createCamera() {
        const { width, height } = this.app.sizes;
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 45);
        this.camera.lookAt(0, 0, 0);
        
        // Store reference in the app
        this.app.camera = this.camera;
    }
    
    /**
     * Create renderer
     */
    createRenderer() {
        const { width, height } = this.app.sizes;
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('scene'),
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Store reference in the app
        this.app.renderer = this.renderer;
    }
    
    /**
     * Create cosmic background with stars
     */
    createCosmicBackground() {
        // Create distant stars (static background)
        this.createDistantStars();
        
        // Create gravitational stars (affected by black hole)
        this.createGravitationalStars();
        
        // Create nebula effect
        this.createNebulaEffect();
    }
    
    /**
     * Create distant static stars
     */
    createDistantStars() {
        const particleCount = this.app.config.devicePerformance === 'low' ? 500 : 
                            (this.app.config.devicePerformance === 'medium' ? 1500 : 3000);
        
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        
        // Set random star positions in a spherical distribution
        for (let i = 0; i < particleCount; i++) {
            // Use spherical coordinates for more natural-looking distribution
            const radius = THREE.MathUtils.randFloat(50, 1000);
            const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
            const phi = THREE.MathUtils.randFloat(0, Math.PI);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random star sizes
            sizes[i] = Math.random() * 2.0;
            
            // Star colors (mostly white with some variation)
            const starType = Math.random();
            if (starType > 0.9) {
                // Red giants
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.5;
                colors[i * 3 + 2] = 0.5;
            } else if (starType > 0.8) {
                // Blue giants
                colors[i * 3] = 0.5;
                colors[i * 3 + 1] = 0.6;
                colors[i * 3 + 2] = 1.0;
            } else if (starType > 0.7) {
                // Yellow stars
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 0.7;
            } else {
                // White stars with slight variation
                const brightness = Math.random() * 0.2 + 0.8;
                colors[i * 3] = brightness;
                colors[i * 3 + 1] = brightness;
                colors[i * 3 + 2] = brightness;
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create shader material for stars
        const starsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                
                uniform float time;
                uniform float pixelRatio;
                
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Set point size, scaled by device pixel ratio
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    
                    // Apply slight twinkle effect - using a technique compatible with all WebGL versions
                    float twinkleFactor = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
                    gl_PointSize *= 0.9 + 0.2 * sin(time * 2.0 + twinkleFactor * 10.0);
                    
                    // Set position
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Create a circular point with soft edges
                    float r = 0.5 * 2.0;
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    float dist = dot(cxy, cxy);
                    float alpha = 1.0 - smoothstep(0.5, 1.0, sqrt(dist));
                    
                    // Set the final color with adjusted alpha
                    if (dist > 1.0) discard;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        stars.userData.shader = starsMaterial;
        stars.frustumCulled = false;
        this.scene.add(stars);
    }
    
    /**
     * Create stars affected by gravitational lensing
     */
    createGravitationalStars() {
        // Implementation will be moved to a separate effect class
        // This is a placeholder for module structure
    }
    
    /**
     * Create nebula cloud effect
     */
    createNebulaEffect() {
        // Implementation will be moved to a separate effect class
        // This is a placeholder for module structure
    }
    
    /**
     * Update method called on each frame
     */
    update(time) {
        // Update shaders' time uniform
        this.scene.traverse((object) => {
            if (object.userData && object.userData.shader) {
                object.userData.shader.uniforms.time.value = time;
            }
        });
    }
} 