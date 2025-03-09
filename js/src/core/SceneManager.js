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
     * Animate camera to a new position with smooth transitions
     * @param {THREE.Vector3} targetPosition - Target camera position
     * @param {THREE.Vector3} targetLookAt - Target look-at point
     * @param {number} duration - Animation duration in seconds
     * @param {string} easing - Easing function to use (default: 'easeInOutCubic')
     * @param {boolean} followPath - Whether to follow a curved path instead of linear
     */
    animateCameraTo(targetPosition, targetLookAt, duration = 2.0, easing = 'easeInOutCubic', followPath = true) {
        if (!this.camera || !this.controls) return;
        
        // Store animation state
        const startTime = performance.now();
        const endTime = startTime + duration * 1000;
        
        // Store initial positions
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        
        // Create middle point for curved path if requested
        let middlePosition = null;
        if (followPath) {
            // Create a midpoint by averaging positions and adding some height
            middlePosition = new THREE.Vector3().addVectors(startPosition, targetPosition).multiplyScalar(0.5);
            
            // Add some height/offset to create an arc
            const distance = startPosition.distanceTo(targetPosition);
            middlePosition.y += distance * 0.2; // Arc height based on distance
            
            // Add slight offset to avoid perfectly straight lines
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * distance * 0.1,
                0,
                (Math.random() - 0.5) * distance * 0.1
            );
            middlePosition.add(offset);
        }
        
        // Animation update function
        const updateCamera = () => {
            const now = performance.now();
            
            // Calculate progress ratio (0 to 1)
            let progress = (now - startTime) / (endTime - startTime);
            
            // Clamp to 0-1 range
            progress = Math.max(0, Math.min(1, progress));
            
            // Apply easing function
            let easedProgress;
            switch (easing) {
                case 'linear':
                    easedProgress = progress;
                    break;
                case 'easeInQuad':
                    easedProgress = progress * progress;
                    break;
                case 'easeOutQuad':
                    easedProgress = progress * (2 - progress);
                    break;
                case 'easeOutCubic':
                    easedProgress = 1 - Math.pow(1 - progress, 3);
                    break;
                case 'easeInOutCubic':
                default:
                    easedProgress = this.easeInOutCubic(progress);
                    break;
            }
            
            // Calculate new camera position
            if (followPath && middlePosition) {
                // Quadratic Bezier curve interpolation for smooth arc
                const p0 = startPosition;
                const p1 = middlePosition;
                const p2 = targetPosition;
                
                // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
                const t = easedProgress;
                const oneMinusT = 1 - t;
                
                this.camera.position.x = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
                this.camera.position.y = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
                this.camera.position.z = oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z;
            } else {
                // Simple linear interpolation
                this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
            }
            
            // Calculate new look-at point
            this.controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);
            
            // Update controls and camera
            this.controls.update();
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(updateCamera);
            }
        };
        
        // Start animation
        updateCamera();
    }
    
    /**
     * Ease in-out cubic function
     * @param {number} t - Input between 0 and 1
     * @returns {number} Eased value
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Orbit camera around a point
     * @param {THREE.Vector3} center - Point to orbit around
     * @param {number} radius - Orbit radius
     * @param {number} duration - Orbit duration in seconds (full circle)
     * @param {number} height - Height relative to center
     * @param {boolean} clockwise - Orbit direction
     */
    orbitCamera(center = new THREE.Vector3(0, 0, 0), radius = 40, duration = 20, height = 5, clockwise = true) {
        if (!this.camera || !this.controls) return;
        
        // Check if there's an existing orbit animation
        if (this.orbitAnimation) {
            cancelAnimationFrame(this.orbitAnimation.id);
            this.orbitAnimation = null;
        }
        
        // Calculate angular velocity (radians per second)
        const angularSpeed = (Math.PI * 2) / duration * (clockwise ? -1 : 1);
        
        // Store initial angle based on current position
        const startPos = this.camera.position.clone().sub(center);
        const initialAngle = Math.atan2(startPos.z, startPos.x);
        
        // Store animation state
        const startTime = performance.now() / 1000; // Convert to seconds
        
        // Create orbit animation object
        this.orbitAnimation = {
            center: center.clone(),
            radius: radius,
            height: height,
            active: true
        };
        
        // Animation update function
        const updateOrbit = () => {
            if (!this.orbitAnimation || !this.orbitAnimation.active) return;
            
            // Calculate elapsed time in seconds
            const elapsed = performance.now() / 1000 - startTime;
            
            // Calculate current angle
            const angle = initialAngle + angularSpeed * elapsed;
            
            // Calculate new camera position
            const x = center.x + radius * Math.cos(angle);
            const z = center.z + radius * Math.sin(angle);
            const y = center.y + height;
            
            // Update camera position
            this.camera.position.set(x, y, z);
            
            // Look at the center point
            this.controls.target.copy(center);
            this.controls.update();
            
            // Continue animation loop
            this.orbitAnimation.id = requestAnimationFrame(updateOrbit);
        };
        
        // Start animation
        updateOrbit();
    }
    
    /**
     * Stop any ongoing camera orbit animation
     */
    stopCameraOrbit() {
        if (this.orbitAnimation) {
            this.orbitAnimation.active = false;
            if (this.orbitAnimation.id) {
                cancelAnimationFrame(this.orbitAnimation.id);
            }
            this.orbitAnimation = null;
        }
    }
    
    /**
     * Create a smooth cinematic fly-through of key points
     * @param {Array<Object>} waypoints - Array of waypoints with position, lookAt, and duration properties
     * @param {boolean} loop - Whether to loop the fly-through
     */
    createCameraFlythrough(waypoints, loop = false) {
        if (!waypoints || waypoints.length < 2) return;
        
        // Clone waypoints to prevent modification of original
        const points = waypoints.map(wp => ({
            position: new THREE.Vector3().copy(wp.position || new THREE.Vector3(0, 0, 40)),
            lookAt: new THREE.Vector3().copy(wp.lookAt || new THREE.Vector3(0, 0, 0)),
            duration: wp.duration || 2.0,
            pause: wp.pause || 0
        }));
        
        let currentIndex = 0;
        let paused = false;
        let pauseEndTime = 0;
        
        // Advance to next waypoint
        const goToNextWaypoint = () => {
            currentIndex++;
            
            // Check if we've completed the sequence
            if (currentIndex >= points.length) {
                if (loop) {
                    // Start over for looping
                    currentIndex = 0;
                    startNextTransition();
                } else {
                    // End the sequence
                    return;
                }
            } else {
                startNextTransition();
            }
        };
        
        // Start transition to current waypoint
        const startNextTransition = () => {
            const current = points[currentIndex];
            
            // Check if there's a pause before this waypoint
            if (current.pause > 0) {
                paused = true;
                pauseEndTime = performance.now() + current.pause * 1000;
                
                // Schedule end of pause
                setTimeout(() => {
                    paused = false;
                    
                    // Get next waypoint (or wrap around if looping)
                    const nextIndex = (currentIndex + 1) % points.length;
                    
                    // Start camera transition
                    this.animateCameraTo(
                        current.position,
                        current.lookAt,
                        current.duration,
                        'easeInOutCubic',
                        true
                    );
                    
                    // Schedule next waypoint
                    setTimeout(goToNextWaypoint, current.duration * 1000);
                }, current.pause * 1000);
            } else {
                // No pause, start transition immediately
                this.animateCameraTo(
                    current.position,
                    current.lookAt,
                    current.duration,
                    'easeInOutCubic',
                    true
                );
                
                // Schedule next waypoint
                setTimeout(goToNextWaypoint, current.duration * 1000);
            }
        };
        
        // Start the sequence
        startNextTransition();
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
    
    /**
     * Set quality level for scene elements
     * @param {string} qualityLevel - 'low', 'medium', or 'high'
     */
    setQualityLevel(qualityLevel) {
        // Update starfield density based on quality
        if (this.starfield) {
            const baseStarCount = 2000;
            let starMultiplier;
            
            switch (qualityLevel) {
                case 'low':
                    starMultiplier = 0.3;
                    break;
                case 'medium':
                    starMultiplier = 0.7;
                    break;
                case 'high':
                default:
                    starMultiplier = 1.0;
                    break;
            }
            
            const density = this.options.starDensity * starMultiplier;
            
            // If star count would change significantly, recreate starfield
            const newStarCount = Math.round(baseStarCount * density);
            const currentStarCount = this.starfield.geometry.attributes.position.count;
            
            // Only recreate if significant difference to avoid performance spikes
            if (Math.abs(newStarCount - currentStarCount) / currentStarCount > 0.25) {
                // Store current starfield properties
                const oldStarfield = this.starfield;
                
                // Remove old starfield
                this.scene.remove(this.starfield);
                
                // Store current shader material uniforms
                const uniforms = oldStarfield.userData.shader.uniforms;
                
                // Recreate with new density
                this.options.starDensity = density;
                this.createStarfield();
                
                // Copy time uniform from old material to maintain animation
                this.starfield.userData.shader.uniforms.time.value = uniforms.time.value;
                
                // Dispose old geometry and material
                oldStarfield.geometry.dispose();
                oldStarfield.material.dispose();
            }
        }
        
        // Adjust nebula quality if it exists
        if (this.nebulaBackground && this.nebulaBackground.userData.shader) {
            const material = this.nebulaBackground.userData.shader;
            
            switch (qualityLevel) {
                case 'low':
                    material.uniforms.detailLevel.value = 2; // Fewer detail iterations
                    material.uniforms.cloudDensity.value = 0.4; // Reduce density
                    break;
                case 'medium':
                    material.uniforms.detailLevel.value = 3;
                    material.uniforms.cloudDensity.value = 0.6;
                    break;
                case 'high':
                    material.uniforms.detailLevel.value = 5; // More detail iterations
                    material.uniforms.cloudDensity.value = 0.8; // Higher density
                    break;
            }
        }
        
        // Adjust camera settings based on quality
        if (this.controls) {
            switch (qualityLevel) {
                case 'low':
                    this.controls.enableDamping = false; // Disable damping on low-end devices
                    break;
                case 'medium':
                case 'high':
                    this.controls.enableDamping = true;
                    this.controls.dampingFactor = qualityLevel === 'high' ? 0.05 : 0.1;
                    break;
            }
        }
    }
    
    /**
     * Update colors based on theme
     * @param {Object} colors - Color palette 
     */
    updateColors(colors) {
        // Update scene background color
        if (this.scene) {
            this.scene.background = new THREE.Color(colors.background);
        }
        
        // Update starfield colors
        if (this.starfield && this.starfield.userData.shader) {
            const material = this.starfield.userData.shader;
            const primaryColor = new THREE.Color(colors.primary);
            const secondaryColor = new THREE.Color(colors.secondary);
            
            // Calculate a blended star color (slightly blueish)
            const starColor = new THREE.Color().lerpColors(
                new THREE.Color(0x80a0ff), // Base blue star color
                primaryColor,
                0.3 // Blend amount
            );
            
            // Update color uniforms
            material.uniforms.baseColor.value = starColor;
        }
        
        // Update nebula background colors
        if (this.nebulaBackground && this.nebulaBackground.userData.shader) {
            const material = this.nebulaBackground.userData.shader;
            
            // Update nebula colors with theme colors
            material.uniforms.colorPrimary.value = new THREE.Color(colors.primary);
            material.uniforms.colorSecondary.value = new THREE.Color(colors.secondary);
            material.uniforms.colorTertiary.value = new THREE.Color(colors.tertiary);
            material.uniforms.colorBackground.value = new THREE.Color(colors.background);
        }
    }
} 