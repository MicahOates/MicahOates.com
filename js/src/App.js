import * as THREE from 'three';
import { PostProcessingManager } from './effects/PostProcessingManager.js';
import { SceneManager } from './scene/SceneManager.js';
import { BlackHoleEffect } from './effects/BlackHoleEffect.js';
import { NebulaEffect } from './effects/NebulaEffect.js';

// Import UI systems
import { UIManager } from './ui/UIManager.js';
import { UIController } from './ui/UIController.js';
// Import Audio system
import { AudioManager } from './audio/AudioManager.js';

// Import utility systems
import { Documentation } from './utils/Documentation.js';
import { AssetManager } from './utils/AssetManager.js';
import { PhysicsController } from './utils/PhysicsController.js';

/**
 * Main application class
 */
export class App {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Managers
        this.sceneManager = null;
        this.postProcessingManager = null;
        this.assetManager = null;
        this.physicsController = null;
        
        // Effects
        this.blackHoleEffect = null;
        this.nebulaEffect = null;
        
        // UI systems
        this.uiManager = null;
        this.uiController = null;
        
        // Audio system
        this.audioManager = null;
        
        // Utilities
        this.documentation = null;
        
        // Animation
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        // Configuration
        this.config = {
            devicePerformance: 'medium',
            debug: {
                showFPS: false,
                showControls: false
            },
            physics: {
                enabled: true,
                useWebWorker: true
            }
        };
        
        // Resize handler bound to this instance
        this.handleResize = this.onResize.bind(this);
    }
    
    /**
     * Initialize the application with error handling
     */
    init() {
        try {
            // Check for WebGL support
            if (!this.checkWebGLSupport()) {
                this.showFallbackContent('WebGL is not supported by your browser or graphics card. Please try a different browser or device.');
                return;
            }
            
            // Initialize asset manager first
            this.initAssetManager();
            
            // Initialize physics controller
            this.initPhysicsController();
            
            // Load essential assets before continuing
            this.loadEssentialAssets().then(() => {
                // Create renderer with error handling
                this.createRenderer();
                
                // Initialize scene with error handling
                this.initScene();
                
                // Initialize effects
                try {
                    this.initEffects();
                } catch (effectError) {
                    console.error('Failed to initialize effects:', effectError);
                    // Continue without effects
                }
                
                // Initialize UI
                try {
                    this.initUIManager();
                    this.initUIController();
                } catch (uiError) {
                    console.error('Failed to initialize UI:', uiError);
                    // Continue without UI elements
                }
                
                // Initialize Audio
                try {
                    this.initAudioManager();
                } catch (audioError) {
                    console.error('Failed to initialize audio:', audioError);
                    // Continue without audio
                }
                
                // Initialize Documentation
                this.initDocumentation();
                
                // Set up resize handler
                window.addEventListener('resize', this.handleResize, false);
                
                // Set up error handler for unhandled errors
                window.addEventListener('error', this.handleGlobalError.bind(this));
                
                // Set up GPU hang detection
                this.setupGPUHangDetection();
                
                // Initialize and start the physics simulation
                this.startPhysicsSimulation();
                
                // Start animation loop
                this.isRunning = true;
                this.animate();
                
                // Log initialization success
                console.log('Application initialized successfully');
                
                // Load non-essential assets after initialization
                this.loadNonEssentialAssets();
            }).catch(error => {
                console.error('Failed to load essential assets:', error);
                this.showFallbackContent('Failed to load required assets. Please check your connection and try again.');
            });
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showFallbackContent('There was a problem initializing the visualization. Please try refreshing the page or using a different browser.');
        }
    }
    
    /**
     * Initialize asset manager
     */
    initAssetManager() {
        this.assetManager = new AssetManager(this);
        this.assetManager.init();
    }
    
    /**
     * Load essential assets required for initial display
     * @returns {Promise} - Resolves when essential assets are loaded
     */
    loadEssentialAssets() {
        // Define essential assets that must be loaded before rendering
        const essentialAssets = {
            textures: [
                {
                    name: 'particle',
                    url: 'assets/textures/particle.png',
                    options: {
                        wrapS: THREE.ClampToEdgeWrapping,
                        wrapT: THREE.ClampToEdgeWrapping
                    }
                },
                {
                    name: 'noise',
                    url: 'assets/textures/noise.png',
                    options: {
                        wrapS: THREE.RepeatWrapping,
                        wrapT: THREE.RepeatWrapping
                    }
                }
            ],
            shaders: [
                {
                    name: 'blackHoleVertex',
                    url: 'assets/shaders/blackhole.vert'
                },
                {
                    name: 'blackHoleFragment',
                    url: 'assets/shaders/blackhole.frag'
                }
            ]
        };
        
        return this.assetManager.loadAssets(essentialAssets);
    }
    
    /**
     * Load non-essential assets after initialization
     */
    loadNonEssentialAssets() {
        // Define non-essential assets to load after app is initialized
        const nonEssentialAssets = {
            textures: [
                {
                    name: 'stars',
                    url: 'assets/textures/stars.jpg',
                    options: {
                        wrapS: THREE.RepeatWrapping,
                        wrapT: THREE.RepeatWrapping
                    }
                },
                {
                    name: 'dust',
                    url: 'assets/textures/dust.png',
                    options: {
                        wrapS: THREE.RepeatWrapping,
                        wrapT: THREE.RepeatWrapping
                    }
                }
            ],
            cubemaps: [
                {
                    name: 'spaceSkybox',
                    path: 'assets/cubemaps/space/',
                    urls: ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']
                }
            ],
            shaders: [
                {
                    name: 'nebulaVertex',
                    url: 'assets/shaders/nebula.vert'
                },
                {
                    name: 'nebulaFragment',
                    url: 'assets/shaders/nebula.frag'
                }
            ]
        };
        
        return this.assetManager.loadAssets(nonEssentialAssets)
            .then(results => {
                console.log('Non-essential assets loaded');
                
                // Update components with loaded assets
                if (this.sceneManager && this.sceneManager.updateAssets) {
                    this.sceneManager.updateAssets();
                }
                
                if (this.blackHoleEffect && this.blackHoleEffect.updateAssets) {
                    this.blackHoleEffect.updateAssets();
                }
                
                if (this.nebulaEffect && this.nebulaEffect.updateAssets) {
                    this.nebulaEffect.updateAssets();
                }
            })
            .catch(error => {
                console.warn('Failed to load some non-essential assets:', error);
                // Continue anyway as these are non-essential
            });
    }
    
    /**
     * Create the WebGL renderer with error handling
     */
    createRenderer() {
        try {
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                failIfMajorPerformanceCaveat: false
            });
            
            // Set properties with error checking
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            try {
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                this.renderer.toneMappingExposure = 1.0;
            } catch (tonemappingError) {
                console.warn('Advanced tone mapping not supported:', tonemappingError);
                // Continue without tone mapping
            }
            
            // Test if rendering works by rendering a simple scene
            this.testRenderer();
            
            // Append to DOM
            const canvas = document.getElementById('scene');
            if (canvas) {
                canvas.appendChild(this.renderer.domElement);
            } else {
                document.body.appendChild(this.renderer.domElement);
            }
        } catch (error) {
            console.error('Failed to create renderer:', error);
            throw new Error('Could not initialize WebGL renderer');
        }
    }
    
    /**
     * Test if the renderer can render a simple scene
     */
    testRenderer() {
        try {
            // Create a minimal test scene
            const testScene = new THREE.Scene();
            const testCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
            testCamera.position.z = 5;
            
            // Create a simple mesh
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const cube = new THREE.Mesh(geometry, material);
            testScene.add(cube);
            
            // Try to render
            this.renderer.render(testScene, testCamera);
            
            // Clean up test objects
            geometry.dispose();
            material.dispose();
        } catch (error) {
            console.error('Renderer test failed:', error);
            throw new Error('WebGL rendering test failed');
        }
    }
    
    /**
     * Check if WebGL is supported
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            const isWebGLSupported = !!gl;
            const contextLostWarning = gl && gl.getExtension('WEBGL_lose_context');
            
            if (isWebGLSupported) {
                // Check for required extensions
                const requiredExtensions = [
                    'OES_texture_float',
                    'OES_texture_float_linear'
                ];
                
                const supportedExtensions = {};
                const missingExtensions = [];
                
                for (const ext of requiredExtensions) {
                    supportedExtensions[ext] = !!gl.getExtension(ext);
                    if (!supportedExtensions[ext]) {
                        missingExtensions.push(ext);
                    }
                }
                
                // Log missing extensions but don't fail (use fallbacks instead)
                if (missingExtensions.length > 0) {
                    console.warn('Missing WebGL extensions:', missingExtensions);
                }
                
                // Get max texture size for future reference
                this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('Max texture size:', this.maxTextureSize);
                
                // Clean up WebGL context
                if (contextLostWarning) {
                    contextLostWarning.loseContext();
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking WebGL support:', error);
            return false;
        }
    }
    
    /**
     * Set up detection for GPU hangs and freezes
     */
    setupGPUHangDetection() {
        this.lastFrameTime = performance.now();
        this.frameGapWarningThreshold = 500; // ms
        this.frameGapErrorThreshold = 2000; // ms
        this.consecutiveSlowFrames = 0;
        this.maxConsecutiveSlowFrames = 5;
        
        // We already have a check in animate() that measures frame time
    }
    
    /**
     * Check for GPU hangs based on frame timing
     */
    checkGPUHang() {
        const currentTime = performance.now();
        const frameGap = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Check for abnormally long frame gaps
        if (frameGap > this.frameGapErrorThreshold) {
            console.error(`Possible GPU hang detected: ${frameGap.toFixed(2)}ms between frames`);
            this.consecutiveSlowFrames++;
            
            // If we have too many consecutive slow frames, try recovery
            if (this.consecutiveSlowFrames > this.maxConsecutiveSlowFrames) {
                console.warn('Multiple GPU hangs detected, attempting recovery...');
                this.attemptRecovery();
            }
        } else if (frameGap > this.frameGapWarningThreshold) {
            console.warn(`Slow frame detected: ${frameGap.toFixed(2)}ms`);
            this.consecutiveSlowFrames++;
            
            // If several consecutive slow frames, reduce quality
            if (this.consecutiveSlowFrames > 3) {
                this.reduceQualityForPerformance();
            }
        } else {
            // Reset consecutive slow frames counter
            this.consecutiveSlowFrames = 0;
        }
    }
    
    /**
     * Attempt to recover from a GPU hang
     */
    attemptRecovery() {
        // Reduce quality drastically
        this.reduceQualityForPerformance(true);
        
        // Recreate renderer as a last resort if needed
        if (this.consecutiveSlowFrames > this.maxConsecutiveSlowFrames * 2) {
            console.warn('Severe performance issues detected, recreating renderer...');
            
            try {
                // Dispose old renderer
                const oldCanvas = this.renderer.domElement;
                const parentElement = oldCanvas.parentElement;
                this.renderer.dispose();
                
                // Create new renderer
                this.renderer = new THREE.WebGLRenderer({
                    antialias: false, // Disable antialiasing for performance
                    alpha: true,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false
                });
                
                this.renderer.setPixelRatio(1); // Use lowest pixel ratio
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                
                // Replace canvas in DOM
                if (parentElement) {
                    parentElement.replaceChild(this.renderer.domElement, oldCanvas);
                } else {
                    document.body.appendChild(this.renderer.domElement);
                }
                
                // Reset postprocessing with minimal effects
                if (this.postProcessingManager) {
                    this.postProcessingManager.dispose();
                    this.postProcessingManager.init(true); // Initialize with minimal effects
                }
                
                // Reset consecutive slow frames counter
                this.consecutiveSlowFrames = 0;
                console.log('Renderer recreated successfully');
            } catch (error) {
                console.error('Failed to recreate renderer:', error);
                // As last resort, show fallback and stop animation
                this.showFallbackContent('Performance issues detected. Please try refreshing the page or using a different device.');
                this.isRunning = false;
            }
        }
    }
    
    /**
     * Reduce quality settings for performance
     * @param {boolean} drastic - Whether to make drastic reductions
     */
    reduceQualityForPerformance(drastic = false) {
        console.warn(`Reducing quality for performance (${drastic ? 'drastic' : 'moderate'})`);
        
        // Reduce pixel ratio
        if (this.renderer) {
            const currentPixelRatio = this.renderer.getPixelRatio();
            const newPixelRatio = drastic ? 1.0 : Math.max(1.0, currentPixelRatio - 0.5);
            this.renderer.setPixelRatio(newPixelRatio);
        }
        
        // Reduce post-processing quality
        if (this.postProcessingManager) {
            this.postProcessingManager.setQualityLevel(drastic ? 'low' : 'medium');
            
            // Disable some effects in drastic mode
            if (drastic) {
                this.postProcessingManager.disableNonEssentialEffects();
            }
        }
        
        // Update app config
        this.config.devicePerformance = drastic ? 'low' : 'medium';
        
        // Apply to all components
        if (this.sceneManager && this.sceneManager.setQualityLevel) {
            this.sceneManager.setQualityLevel(this.config.devicePerformance);
        }
        
        if (this.blackHoleEffect && this.blackHoleEffect.setQualityLevel) {
            this.blackHoleEffect.setQualityLevel(this.config.devicePerformance);
        }
        
        if (this.nebulaEffect && this.nebulaEffect.setQualityLevel) {
            this.nebulaEffect.setQualityLevel(this.config.devicePerformance);
        }
    }
    
    /**
     * Handle global error event
     * @param {ErrorEvent} event - The error event
     */
    handleGlobalError(event) {
        console.error('Global error:', event.error || event.message);
        
        // Check if it's a WebGL context lost error
        if (event.message && event.message.includes('WebGL context')) {
            this.handleContextLoss();
        }
    }
    
    /**
     * Handle WebGL context loss
     */
    handleContextLoss() {
        console.warn('WebGL context lost, attempting to recover...');
        
        // Stop animation loop temporarily
        this.isRunning = false;
        
        // Show a message to the user
        const contextLossMessage = document.createElement('div');
        contextLossMessage.id = 'context-loss-message';
        contextLossMessage.style.position = 'fixed';
        contextLossMessage.style.top = '50%';
        contextLossMessage.style.left = '50%';
        contextLossMessage.style.transform = 'translate(-50%, -50%)';
        contextLossMessage.style.background = 'rgba(0, 0, 0, 0.8)';
        contextLossMessage.style.color = 'white';
        contextLossMessage.style.padding = '20px';
        contextLossMessage.style.borderRadius = '5px';
        contextLossMessage.style.zIndex = '10000';
        contextLossMessage.innerHTML = 'Visualizer paused. Attempting to recover... <div class="spinner"></div>';
        document.body.appendChild(contextLossMessage);
        
        // Listen for context restored event
        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            
            // Remove message
            if (contextLossMessage.parentNode) {
                contextLossMessage.parentNode.removeChild(contextLossMessage);
            }
            
            // Reinitialize scene and effects
            try {
                this.initScene();
                this.initEffects();
                
                // Restart animation loop
                this.isRunning = true;
                this.animate();
            } catch (error) {
                console.error('Failed to recover from context loss:', error);
                this.showFallbackContent('Unable to recover visualization. Please refresh the page.');
            }
        }, { once: true });
    }
    
    /**
     * Show fallback content when WebGL fails
     * @param {string} message - Error message to display
     */
    showFallbackContent(message) {
        // Create fallback container
        const fallback = document.createElement('div');
        fallback.className = 'webgl-fallback';
        fallback.style.position = 'fixed';
        fallback.style.top = '0';
        fallback.style.left = '0';
        fallback.style.width = '100%';
        fallback.style.height = '100%';
        fallback.style.display = 'flex';
        fallback.style.flexDirection = 'column';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        fallback.style.backgroundColor = '#111';
        fallback.style.color = '#fff';
        fallback.style.textAlign = 'center';
        fallback.style.padding = '20px';
        fallback.style.zIndex = '1000';
        
        // Add fallback content
        fallback.innerHTML = `
            <h2 style="font-family: 'Orbitron', sans-serif; margin-bottom: 20px;">Visualization Not Available</h2>
            <p style="max-width: 600px; margin-bottom: 30px;">${message}</p>
            <div style="margin-bottom: 30px;">
                <button id="fallback-retry" style="background: #8844ff; border: none; color: white; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-family: 'Orbitron', sans-serif;">Retry</button>
            </div>
            <p style="opacity: 0.7; max-width: 600px;">You can still explore the site content using the links below:</p>
            <div style="display: flex; gap: 20px; margin-top: 20px;">
                <a href="#about" style="color: #44aaff; text-decoration: none; padding: 10px;">About</a>
                <a href="#projects" style="color: #44aaff; text-decoration: none; padding: 10px;">Projects</a>
                <a href="#contact" style="color: #44aaff; text-decoration: none; padding: 10px;">Contact</a>
                <a href="#blog" style="color: #44aaff; text-decoration: none; padding: 10px;">Blog</a>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(fallback);
        
        // Add retry button listener
        const retryButton = document.getElementById('fallback-retry');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                // Remove fallback
                document.body.removeChild(fallback);
                
                // Try to initialize again
                this.init();
            });
        }
    }
    
    /**
     * Animation loop with error handling and performance monitoring
     */
    animate() {
        if (!this.isRunning) return;
        
        try {
            // Check for GPU hangs
            this.checkGPUHang();
            
            // Schedule next frame
            requestAnimationFrame(this.animate.bind(this));
            
            // Update components
            this.update();
            
            // Render scene
            this.render();
            
            // Periodically check memory usage (every 100 frames)
            if (Math.random() < 0.01) { // ~1% chance per frame
                this.checkMemoryUsage();
            }
        } catch (error) {
            console.error('Animation loop error:', error);
            
            // Increment error counter
            this.animationErrors = (this.animationErrors || 0) + 1;
            
            // If too many errors, stop animation
            if (this.animationErrors > 10) {
                console.error('Too many animation errors, stopping animation loop');
                this.isRunning = false;
                this.showFallbackContent('The visualization encountered too many errors. Please refresh the page.');
                return;
            }
            
            // Try to continue animation despite the error
            requestAnimationFrame(this.animate.bind(this));
        }
    }
    
    /**
     * Initialize scene and camera
     */
    initScene() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 40;
        
        // Initialize scene manager
        this.sceneManager = new SceneManager(this);
        this.sceneManager.init();
    }
    
    /**
     * Initialize visual effects
     */
    initEffects() {
        // Create black hole effect
        this.blackHoleEffect = new BlackHoleEffect(this);
        this.blackHoleEffect.init();
        
        // Create nebula effect
        this.nebulaEffect = new NebulaEffect(this);
        this.nebulaEffect.init();
        
        // Setup post-processing
        this.postProcessingManager = new PostProcessingManager(this);
        this.postProcessingManager.init();
    }
    
    /**
     * Initialize the UI Manager for 3D user interface
     */
    initUIManager() {
        this.uiManager = new UIManager(this);
        this.uiManager.init();
    }
    
    /**
     * Initialize the UI Controller for 2D DOM interface
     */
    initUIController() {
        this.uiController = new UIController(this);
        this.uiController.init();
    }
    
    /**
     * Initialize the Audio Manager system
     */
    initAudioManager() {
        this.audioManager = new AudioManager(this);
        this.audioManager.init();
    }
    
    /**
     * Initialize documentation system
     */
    initDocumentation() {
        this.documentation = new Documentation(this);
        
        // Create a help button if it doesn't exist
        if (!document.getElementById('help-button')) {
            const helpButton = document.createElement('button');
            helpButton.id = 'help-button';
            helpButton.innerHTML = '?';
            helpButton.title = 'Show Documentation';
            helpButton.setAttribute('aria-label', 'Show Documentation');
            
            // Style the button
            helpButton.style.position = 'fixed';
            helpButton.style.bottom = '20px';
            helpButton.style.left = '20px';
            helpButton.style.width = '40px';
            helpButton.style.height = '40px';
            helpButton.style.borderRadius = '50%';
            helpButton.style.backgroundColor = 'rgba(136, 68, 255, 0.2)';
            helpButton.style.border = '1px solid rgba(136, 68, 255, 0.5)';
            helpButton.style.color = '#8844ff';
            helpButton.style.fontSize = '18px';
            helpButton.style.fontWeight = 'bold';
            helpButton.style.cursor = 'pointer';
            helpButton.style.zIndex = '1000';
            helpButton.style.display = 'flex';
            helpButton.style.alignItems = 'center';
            helpButton.style.justifyContent = 'center';
            helpButton.style.transition = 'all 0.3s ease';
            
            // Add hover effects
            helpButton.addEventListener('mouseenter', () => {
                helpButton.style.backgroundColor = 'rgba(136, 68, 255, 0.4)';
                helpButton.style.transform = 'scale(1.1)';
            });
            
            helpButton.addEventListener('mouseleave', () => {
                helpButton.style.backgroundColor = 'rgba(136, 68, 255, 0.2)';
                helpButton.style.transform = 'scale(1)';
            });
            
            // Add click handler
            helpButton.addEventListener('click', () => {
                this.showDocumentation();
            });
            
            // Add to DOM
            document.body.appendChild(helpButton);
            
            // Add keyboard shortcut ('?' key)
            document.addEventListener('keydown', (e) => {
                if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
                    e.preventDefault();
                    this.showDocumentation();
                }
            });
        }
    }
    
    /**
     * Show documentation
     * @param {string} componentId - Optional component ID to show
     */
    showDocumentation(componentId = null) {
        if (this.documentation) {
            this.documentation.showDocumentation(componentId);
        }
    }
    
    /**
     * Update called on each frame
     */
    update() {
        const time = this.clock.getElapsedTime();
        
        // Update components
        if (this.sceneManager) {
            this.sceneManager.update(time);
        }
        
        if (this.blackHoleEffect) {
            this.blackHoleEffect.update(time);
        }
        
        if (this.nebulaEffect) {
            this.nebulaEffect.update(time);
        }
        
        // Update UI
        if (this.uiManager) {
            this.uiManager.update(time);
        }
        
        if (this.uiController) {
            this.uiController.update(time);
        }
        
        // Update physics (handled by PhysicsController independently)
        
        // Update audio visualization if needed
        if (this.audioManager && this.audioManager.enabled) {
            // The AudioManager doesn't have an update method yet, but we can add it if needed
            // this.audioManager.update(time);
        }
    }
    
    /**
     * Render the scene
     */
    render() {
        if (this.postProcessingManager) {
            this.postProcessingManager.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Resize handler
     */
    onResize() {
        if (!this.camera || !this.renderer) return;
        
        // Update camera aspect ratio and projection matrix
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update post-processing
        if (this.postProcessingManager) {
            this.postProcessingManager.resize();
        }
    }
    
    /**
     * Get theme color from CSS variables
     * @param {string} colorName - The name of the theme color to retrieve
     * @return {string} - The color value in hex format
     */
    getThemeColor(colorName) {
        // Default theme colors
        const defaultColors = {
            primary: '#8844ff',
            secondary: '#44aaff',
            tertiary: '#ff44aa',
            background: '#111122',
            text: '#ffffff'
        };
        
        // Try to get color from CSS variables
        const root = document.documentElement;
        const cssVar = getComputedStyle(root).getPropertyValue(`--color-${colorName}`).trim();
        
        return cssVar || defaultColors[colorName] || '#ffffff';
    }
    
    /**
     * Dispose of all resources to prevent memory leaks
     */
    dispose() {
        console.log('Disposing application resources');
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Stop animation loop
        this.isRunning = false;
        
        // Dispose physics controller
        if (this.physicsController) {
            console.log('Disposing physics controller');
            this.physicsController.dispose();
            this.physicsController = null;
        }
        
        // Dispose asset manager first (this will dispose all textures)
        if (this.assetManager) {
            console.log('Disposing asset manager');
            this.assetManager.dispose();
            this.assetManager = null;
        }
        
        // Dispose renderer
        if (this.renderer) {
            console.log('Disposing renderer');
            this.renderer.dispose();
            
            // Remove canvas from DOM
            const canvas = this.renderer.domElement;
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
        
        // Dispose scene manager
        if (this.sceneManager) {
            console.log('Disposing scene manager');
            this.sceneManager.dispose();
        }
        
        // Dispose post processing
        if (this.postProcessingManager) {
            console.log('Disposing post processing');
            this.postProcessingManager.dispose();
        }
        
        // Dispose effects
        if (this.blackHoleEffect) {
            console.log('Disposing black hole effect');
            this.blackHoleEffect.dispose();
        }
        
        if (this.nebulaEffect) {
            console.log('Disposing nebula effect');
            this.nebulaEffect.dispose();
        }
        
        // Dispose UI
        if (this.uiManager) {
            console.log('Disposing UI manager');
            this.uiManager.dispose();
        }
        
        if (this.uiController) {
            console.log('Disposing UI controller');
            this.uiController.dispose();
        }
        
        // Dispose audio
        if (this.audioManager) {
            console.log('Disposing audio manager');
            this.audioManager.dispose();
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.sceneManager = null;
        this.postProcessingManager = null;
        this.blackHoleEffect = null;
        this.nebulaEffect = null;
        this.uiManager = null;
        this.uiController = null;
        this.audioManager = null;
        this.documentation = null;
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
    
    /**
     * Memory management - call this periodically to check for leaks
     */
    checkMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory;
            const memoryUsageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
            const totalHeapMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
            const percentUsed = (memoryUsageMB / totalHeapMB) * 100;
            
            console.log(`Memory usage: ${memoryUsageMB.toFixed(2)}MB / ${totalHeapMB.toFixed(2)}MB (${percentUsed.toFixed(2)}%)`);
            
            // Check if memory usage is getting too high (over 80% of available heap)
            if (percentUsed > 80) {
                console.warn('Memory usage is high - consider calling dispose() when the app is not in use');
            }
        }
    }
    
    /**
     * Create and play a sound for section opening
     */
    createSectionOpenSound() {
        if (this.audioManager) {
            this.audioManager.createUISwitchSound(true);
        }
    }
    
    /**
     * Create and play a sound for section closing
     */
    createSectionCloseSound() {
        if (this.audioManager) {
            this.audioManager.createUISwitchSound(false);
        }
    }
    
    /**
     * Update visuals based on theme
     * @param {string} theme - 'dark' or 'light'
     */
    updateVisualsForTheme(theme) {
        // Update color palette based on theme
        let colors = {
            primary: '#8844ff',     // Purple base
            secondary: '#44aaff',   // Blue accent
            tertiary: '#ff44aa',    // Pink accent
            background: '#111122',  // Dark background
            text: '#ffffff'         // White text
        };
        
        // Adjust for light theme
        if (theme === 'light') {
            colors = {
                primary: '#6622dd',     // Darker purple for light mode
                secondary: '#2288dd',   // Darker blue for light mode
                tertiary: '#dd2288',    // Darker pink for light mode
                background: '#f0f0f8',  // Light bluish background
                text: '#1a1a2e'         // Dark text
            };
        }
        
        // Apply to effects if available
        if (this.blackHoleEffect && this.blackHoleEffect.updateColors) {
            this.blackHoleEffect.updateColors(colors);
        }
        
        if (this.nebulaEffect && this.nebulaEffect.updateColors) {
            this.nebulaEffect.updateColors(colors);
        }
        
        if (this.sceneManager && this.sceneManager.updateColors) {
            this.sceneManager.updateColors(colors);
        }
        
        if (this.postProcessingManager && this.postProcessingManager.updateColors) {
            this.postProcessingManager.updateColors(colors);
        }
        
        if (this.uiManager && this.uiManager.updateColors) {
            this.uiManager.updateColors(colors);
        }
    }
    
    /**
     * Initialize physics controller
     */
    initPhysicsController() {
        if (!this.config.physics.enabled) {
            console.log('Physics system disabled by configuration');
            return;
        }
        
        try {
            this.physicsController = new PhysicsController(this);
            this.physicsController.init();
            console.log('Physics controller initialized');
        } catch (error) {
            console.error('Failed to initialize physics controller:', error);
            console.log('Continuing without physics simulation');
        }
    }
    
    /**
     * Start the physics simulation with initial parameters
     */
    startPhysicsSimulation() {
        if (!this.physicsController || !this.config.physics.enabled) return;
        
        // Set initial parameters
        const blackHoleData = {
            position: [0, 0, 0],
            mass: 1e30 // 1 solar mass in kg
        };
        
        // Set simulation parameters
        this.physicsController.setParameters({
            blackHoleData,
            includeRelativity: true
        });
        
        // Create initial particle cloud
        this.createInitialParticles();
        
        // Set up the update callback
        this.physicsController.onUpdate(this.handlePhysicsUpdate.bind(this));
        
        // Start the simulation
        this.physicsController.start();
    }
    
    /**
     * Create initial particles for the physics simulation
     */
    createInitialParticles() {
        if (!this.physicsController) return;
        
        // Create 500 particles in an orbit
        const particles = [];
        const count = 500;
        
        for (let i = 0; i < count; i++) {
            // Create particles in a disk
            const angle = (i / count) * Math.PI * 2;
            const radius = 20 + Math.random() * 30;
            
            // Position on a flat orbit
            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * 2; // Slight vertical distribution
            const z = Math.sin(angle) * radius;
            
            // Orbital velocity (perpendicular to position)
            const speed = 0.5 + Math.random() * 0.3;
            const vx = -Math.sin(angle) * speed;
            const vy = 0;
            const vz = Math.cos(angle) * speed;
            
            // Add particle
            particles.push({
                position: [x, y, z],
                velocity: [vx, vy, vz],
                mass: 1,
                charge: 0
            });
        }
        
        // Add particles to simulation
        this.physicsController.addParticles(particles);
    }
    
    /**
     * Handle physics update from simulation
     * @param {Object} data - Physics update data
     */
    handlePhysicsUpdate(data) {
        // Update visualization components with new particle positions
        if (this.blackHoleEffect && this.blackHoleEffect.updateParticles) {
            this.blackHoleEffect.updateParticles(data.particles);
        }
        
        // Update UI if needed
        if (this.uiController && this.uiController.updatePhysicsData) {
            this.uiController.updatePhysicsData({
                particleCount: data.particles.length,
                capturedCount: data.capturedCount
            });
        }
    }
    
    /**
     * Add particles to the physics simulation
     * @param {Array|Object} particles - Particle or array of particles to add
     */
    addParticles(particles) {
        if (this.physicsController && this.config.physics.enabled) {
            return this.physicsController.addParticles(particles);
        }
    }
    
    /**
     * Clear all particles from the physics simulation
     */
    clearParticles() {
        if (this.physicsController && this.config.physics.enabled) {
            this.physicsController.clearParticles();
        }
    }
    
    /**
     * Calculate gravitational lensing effects
     * @param {Array} rays - Array of light rays
     * @param {Function} callback - Callback function for results
     */
    calculateLensing(rays, callback) {
        if (this.physicsController && this.config.physics.enabled) {
            this.physicsController.calculateLensing(rays, callback);
        } else {
            // No physics controller available, return rays unmodified
            setTimeout(() => {
                if (callback) callback(rays);
            }, 0);
        }
    }
} 