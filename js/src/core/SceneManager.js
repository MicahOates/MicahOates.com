import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { starfieldVertexShader, starfieldFragmentShader, nebulaBackgroundVertexShader, nebulaBackgroundFragmentShader } from '../shaders/StarfieldShader.js';

export class SceneManager {
    constructor(app) {
        this.app = app;
        
        // Scene elements
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Background elements
        this.starfield = null;
        this.nebulaBackground = null;
        
        // Options
        this.options = {
            cameraDistance: 30,
            cameraFov: 60,
            cameraNear: 0.1,
            cameraFar: 1000,
            enableOrbitControls: true,
            starDensity: 1.0,
            enableNebulaBackground: true
        };
        
        // Viewport size
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    /**
     * Initialize the scene
     */
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createStarfield();
        this.createNebulaBackground();
        
        // Attach event listeners
        window.addEventListener('resize', this.resize.bind(this));
        
        // Store references in the app
        this.app.scene = this.scene;
        this.app.camera = this.camera;
        this.app.renderer = this.renderer;
        this.app.controls = this.controls;
    }
    
    /**
     * Create THREE.js scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        
        // Set a base color for the background (will be mostly covered by nebula)
        this.scene.background = new THREE.Color(0x000510);
    }
    
    /**
     * Create camera
     */
    createCamera() {
        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            this.options.cameraFov,
            this.sizes.width / this.sizes.height,
            this.options.cameraNear,
            this.options.cameraFar
        );
        
        // Set initial position
        this.camera.position.z = this.options.cameraDistance;
    }
    
    /**
     * Create WebGL renderer
     */
    createRenderer() {
        // Create WebGL renderer with antialiasing
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.app.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        // Set renderer pixel ratio and size
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        
        // Enable shadow mapping if needed
        this.renderer.shadowMap.enabled = false;
        
        // Set tone mapping for better color reproduction
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Set output encoding
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    /**
     * Create orbit controls
     */
    createControls() {
        if (!this.options.enableOrbitControls) return;
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.7;
        this.controls.zoomSpeed = 0.7;
        
        // Limit zoom range
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        
        // Tilt limits
        this.controls.minPolarAngle = Math.PI * 0.1; // Limit up angle
        this.controls.maxPolarAngle = Math.PI * 0.9; // Limit down angle
        
        // Set initial control target (center of scene)
        this.controls.target.set(0, 0, 0);
    }
    
    /**
     * Create starfield background
     */
    createStarfield() {
        // Calculate star count based on screen size and density setting
        const baseStarCount = 2000;
        const density = this.options.starDensity;
        
        // Adjust star count based on device performance
        let starCount;
        switch (this.app.config.devicePerformance) {
            case 'low':
                starCount = baseStarCount * 0.3 * density;
                break;
            case 'medium':
                starCount = baseStarCount * 0.7 * density;
                break;
            case 'high':
            default:
                starCount = baseStarCount * density;
                break;
        }
        
        // Round to integer
        starCount = Math.round(starCount);
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const brightness = new Float32Array(starCount);
        const twinkleSpeeds = new Float32Array(starCount);
        
        // Create stars with random positions in a large sphere
        for (let i = 0; i < starCount; i++) {
            // Use spherical distribution for more realistic star field
            const radius = 50 + Math.random() * 50; // Between 50-100 units away
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Star size - most stars are small, few are large
            const sizeDistribution = Math.random();
            if (sizeDistribution > 0.995) {
                // Very large, bright stars (rare)
                sizes[i] = 0.5 + Math.random() * 0.5;
                brightness[i] = 0.8 + Math.random() * 0.2;
            } else if (sizeDistribution > 0.95) {
                // Medium-large stars (uncommon)
                sizes[i] = 0.3 + Math.random() * 0.2;
                brightness[i] = 0.6 + Math.random() * 0.3;
            } else if (sizeDistribution > 0.7) {
                // Medium stars (common)
                sizes[i] = 0.15 + Math.random() * 0.15;
                brightness[i] = 0.4 + Math.random() * 0.3;
            } else {
                // Small, dim stars (very common)
                sizes[i] = 0.05 + Math.random() * 0.1;
                brightness[i] = 0.2 + Math.random() * 0.3;
            }
            
            // Random twinkle speed
            twinkleSpeeds[i] = 0.3 + Math.random() * 2.0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
        geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
        
        // Create shader material with colors from theme
        const primaryColor = new THREE.Color(this.app.getThemeColor('primary') || '#8844ff');
        const starBaseColor = new THREE.Color(0x80a0ff); // Slight blue tint for stars
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                baseColor: { value: starBaseColor }
            },
            vertexShader: starfieldVertexShader,
            fragmentShader: starfieldFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.starfield = new THREE.Points(geometry, material);
        this.starfield.userData.shader = material;
        this.scene.add(this.starfield);
    }
    
    /**
     * Create nebula background
     */
    createNebulaBackground() {
        if (!this.options.enableNebulaBackground) return;
        
        // Create large plane for nebula background
        const geometry = new THREE.PlaneGeometry(200, 200);
        
        // Use theme colors for nebula
        const primaryColor = new THREE.Color(this.app.getThemeColor('primary') || '#8844ff');
        const secondaryColor = new THREE.Color(this.app.getThemeColor('secondary') || '#44aaff');
        const tertiaryColor = new THREE.Color(this.app.getThemeColor('tertiary') || '#ff44aa');
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorA: { value: primaryColor.clone().multiplyScalar(0.3) }, // Dimmer for background
                colorB: { value: secondaryColor.clone().multiplyScalar(0.25) },
                colorC: { value: tertiaryColor.clone().multiplyScalar(0.2) }
            },
            vertexShader: nebulaBackgroundVertexShader,
            fragmentShader: nebulaBackgroundFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.nebulaBackground = new THREE.Mesh(geometry, material);
        this.nebulaBackground.userData.shader = material;
        
        // Position far behind everything else
        this.nebulaBackground.position.z = -80;
        
        // Make it face the camera
        this.nebulaBackground.lookAt(0, 0, 0);
        
        this.scene.add(this.nebulaBackground);
    }
    
    /**
     * Handle window resize
     */
    resize() {
        // Update sizes
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        
        // Update camera aspect ratio
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Store sizes in app
        this.app.sizes = this.sizes;
    }
    
    /**
     * Set camera position and target
     */
    setCameraPosition(x, y, z, lookAtX = 0, lookAtY = 0, lookAtZ = 0) {
        // Set new camera position
        this.camera.position.set(x, y, z);
        
        // Update controls target if available
        if (this.controls) {
            this.controls.target.set(lookAtX, lookAtY, lookAtZ);
            this.controls.update();
        } else {
            // Otherwise just look at target
            this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
        }
    }
    
    /**
     * Move camera to position with animation
     */
    animateCameraTo(targetPosition, targetLookAt, duration = 2.0) {
        const startPosition = this.camera.position.clone();
        const startTime = this.app.clock.getElapsedTime();
        const startLookAt = this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0);
        
        const updateCamera = () => {
            const currentTime = this.app.clock.getElapsedTime();
            const elapsed = currentTime - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            
            // Use easing function for smoother animation
            const easeProgress = this.easeInOutCubic(progress);
            
            // Interpolate position
            const newX = startPosition.x + (targetPosition.x - startPosition.x) * easeProgress;
            const newY = startPosition.y + (targetPosition.y - startPosition.y) * easeProgress;
            const newZ = startPosition.z + (targetPosition.z - startPosition.z) * easeProgress;
            
            // Interpolate look target
            const newLookAtX = startLookAt.x + (targetLookAt.x - startLookAt.x) * easeProgress;
            const newLookAtY = startLookAt.y + (targetLookAt.y - startLookAt.y) * easeProgress;
            const newLookAtZ = startLookAt.z + (targetLookAt.z - startLookAt.z) * easeProgress;
            
            // Update camera
            this.setCameraPosition(newX, newY, newZ, newLookAtX, newLookAtY, newLookAtZ);
            
            // Continue animation if not complete
            if (progress < 1.0) {
                requestAnimationFrame(updateCamera);
            }
        };
        
        // Start animation
        updateCamera();
    }
    
    /**
     * Cubic easing function for smooth camera movement
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Update scene elements
     */
    update(time) {
        // Update controls if available
        if (this.controls) {
            this.controls.update();
        }
        
        // Update starfield
        if (this.starfield && this.starfield.userData.shader) {
            this.starfield.userData.shader.uniforms.time.value = time;
        }
        
        // Update nebula background
        if (this.nebulaBackground && this.nebulaBackground.userData.shader) {
            this.nebulaBackground.userData.shader.uniforms.time.value = time;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Clean up event listeners
        window.removeEventListener('resize', this.resize);
        
        // Dispose of controls
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Dispose of starfield
        if (this.starfield) {
            this.scene.remove(this.starfield);
            this.starfield.geometry.dispose();
            this.starfield.material.dispose();
        }
        
        // Dispose of nebula background
        if (this.nebulaBackground) {
            this.scene.remove(this.nebulaBackground);
            this.nebulaBackground.geometry.dispose();
            this.nebulaBackground.material.dispose();
        }
    }
} 