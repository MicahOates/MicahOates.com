import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { SceneManager } from './core/SceneManager.js';
import { BlackHole } from './core/BlackHole.js';
import { ParticleSystem } from './core/ParticleSystem.js';
import { PostProcessingManager } from './core/PostProcessingManager.js';
import { GravitationalLensing } from './effects/GravitationalLensing.js';
import { TimeDilation } from './effects/TimeDilation.js';
import { NebulaEffect } from './effects/NebulaEffect.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { TouchInteractionManager } from './utils/TouchInteractionManager.js';
import { DebugPanel } from './utils/DebugPanel.js';
import { AccessibilityManager } from './utils/AccessibilityManager.js';
import { WebGLDetector } from './utils/WebGLDetector.js';
import { ResourceTracker } from './utils/ResourceTracker.js';
import { WebGLContextManager } from './utils/WebGLContextManager.js';

/**
 * BlackHoleApp - Main application class that manages the 3D visualization
 */
class BlackHoleApp {
    constructor(options = {}) {
        // Canvas element
        this.canvas = options.canvas || document.getElementById('blackhole-canvas');
        
        // Initialize configuration
        this.config = {
            devicePerformance: 'medium', // Default, will be detected
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : true,
            showFPS: options.showFPS !== undefined ? options.showFPS : false,
            blackHoleRadius: options.blackHoleRadius || 10,
            accretionDiskRadius: options.accretionDiskRadius || 15,
            enableBloom: options.enableBloom !== undefined ? options.enableBloom : true,
            enableFilmGrain: options.enableFilmGrain !== undefined ? options.enableFilmGrain : true,
            enableGravitationalLensing: options.enableGravitationalLensing !== undefined ? options.enableGravitationalLensing : true,
            enableTimeDilation: options.enableTimeDilation !== undefined ? options.enableTimeDilation : true,
            enableNebula: options.enableNebula !== undefined ? options.enableNebula : true,
            debug: options.debug !== undefined ? options.debug : false, // Debug mode flag
            theme: options.theme || {
                primary: '#8844ff',   // Purple
                secondary: '#44aaff', // Blue
                tertiary: '#ff44aa',  // Pink
                background: '#000000' // Black
            }
        };
        
        // Setup
        this.clock = new THREE.Clock();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.time = 0;
        this.stats = null;
        this.isPaused = false; // Pause flag for context loss
        
        // Core components
        this.sceneManager = null;
        this.blackHole = null;
        this.particleSystem = null;
        this.postProcessingManager = null;
        
        // Utility managers
        this.performanceMonitor = null;
        this.resources = null;
        this.contextManager = null;
        this.touchInteraction = null;
        this.debugPanel = null;
        this.accessibilityManager = null;
        
        // Advanced effects
        this.gravitationalLensing = null;
        this.timeDilation = null;
        this.nebulaEffect = null;
        
        // Initialize the app
        this.detectPerformance();
        this.init();
    }
    
    /**
     * Detect device performance to adjust quality settings
     */
    detectPerformance() {
        // Simple performance detection based on device info
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Mobile devices default to low quality
            this.config.devicePerformance = 'low';
            return;
        }
        
        // For desktops, check memory, CPU cores or GPU if available
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory < 4) {
                this.config.devicePerformance = 'low';
            } else if (navigator.deviceMemory < 8) {
                this.config.devicePerformance = 'medium';
            } else {
                this.config.devicePerformance = 'high';
            }
        } else if (navigator.hardwareConcurrency) {
            if (navigator.hardwareConcurrency < 4) {
                this.config.devicePerformance = 'low';
            } else if (navigator.hardwareConcurrency < 8) {
                this.config.devicePerformance = 'medium';
            } else {
                this.config.devicePerformance = 'high';
            }
        } else {
            // Default to medium when detection fails
            this.config.devicePerformance = 'medium';
        }
        
        // Log the detected performance level
        console.log(`Detected performance level: ${this.config.devicePerformance}`);
    }
    
    /**
     * Initialize the application
     */
    init() {
        // Check for WebGL support before proceeding
        this.checkWebGLSupport();
        
        // Create fps counter if enabled
        if (this.config.showFPS) {
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
        }
        
        // Initialize resource tracker
        this.initResourceTracker();
        
        // Initialize WebGL context manager
        this.initWebGLContextManager();
        
        // Initialize core systems
        this.initSceneManager();
        this.initBlackHole();
        this.initParticleSystem();
        this.initAdvancedEffects();
        this.initPostProcessing();
        
        // Initialize performance monitor
        this.initPerformanceMonitor();
        
        // Initialize enhanced mobile touch controls
        this.initTouchInteraction();
        
        // Initialize debug panel (hidden by default)
        this.initDebugPanel();
        
        // Initialize accessibility features
        this.initAccessibility();
        
        // Start animation loop
        this.animate();
        
        // Add event listeners
        window.addEventListener('resize', this.onResize.bind(this));
    }
    
    /**
     * Initialize scene manager
     */
    initSceneManager() {
        this.sceneManager = new SceneManager(this);
        this.sceneManager.init();
    }
    
    /**
     * Initialize black hole
     */
    initBlackHole() {
        this.blackHole = new BlackHole(this);
        this.blackHole.init();
    }
    
    /**
     * Initialize particle system
     */
    initParticleSystem() {
        this.particleSystem = new ParticleSystem(this);
        this.particleSystem.init();
    }
    
    /**
     * Initialize advanced effects
     */
    initAdvancedEffects() {
        // Initialize gravitational lensing if enabled
        if (this.config.enableGravitationalLensing) {
            this.gravitationalLensing = new GravitationalLensing(this);
            this.gravitationalLensing.init();
        }
        
        // Initialize time dilation if enabled
        if (this.config.enableTimeDilation) {
            this.timeDilation = new TimeDilation(this);
            this.timeDilation.init();
        }
        
        // Initialize nebula effect if enabled
        if (this.config.enableNebula) {
            this.nebulaEffect = new NebulaEffect(this);
            this.nebulaEffect.init();
        }
    }
    
    /**
     * Initialize post-processing effects
     */
    initPostProcessing() {
        try {
            // Create post-processing manager
            this.postProcessingManager = new PostProcessingManager(this);
            
            // Initialize post-processing
            const initSuccess = this.postProcessingManager.init();
            
            // Only proceed with configuration if initialization was successful
            if (initSuccess && this.postProcessingManager.initialized) {
                // Apply configuration options to effects
                this.postProcessingManager.toggleBloom(this.config.enableBloom);
                this.postProcessingManager.toggleFilmGrain(this.config.enableFilmGrain);
                
                // Register gravitational lensing with post-processing manager
                if (this.gravitationalLensing) {
                    this.postProcessingManager.registerGravitationalLensing(this.gravitationalLensing);
                    this.postProcessingManager.toggleGravitationalLensing(this.config.enableGravitationalLensing);
                }
                
                // Set quality based on device performance
                this.postProcessingManager.setQualityLevel();
                
                console.log('Post-processing configuration applied successfully');
            } else {
                console.warn('Post-processing initialization failed, effects will not be available');
                // Set the postProcessingManager to null to prevent further access attempts
                if (!initSuccess) {
                    this.postProcessingManager = null;
                }
            }
        } catch (error) {
            console.error('Error initializing post-processing:', error);
            this.postProcessingManager = null;
        }
    }
    
    /**
     * Initialize performance monitor
     */
    initPerformanceMonitor() {
        this.performanceMonitor = new PerformanceMonitor(this);
        this.performanceMonitor.start();
    }
    
    /**
     * Initialize enhanced touch interaction for mobile devices
     */
    initTouchInteraction() {
        this.touchInteraction = new TouchInteractionManager(this);
    }
    
    /**
     * Initialize debug panel
     */
    initDebugPanel() {
        // Only enable debug panel in development or when debug flag is set
        const isDebugMode = this.config.debug || 
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true');
        
        this.debugPanel = new DebugPanel(this, {
            visible: isDebugMode
        });
    }
    
    /**
     * Initialize accessibility features
     */
    initAccessibility() {
        this.accessibilityManager = new AccessibilityManager(this);
    }
    
    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        const result = WebGLDetector.isWebGLSupported(true);
        
        if (!result.supported) {
            // Show error element when WebGL is not supported
            const errorElement = WebGLDetector.createErrorElement(result);
            document.getElementById('container').appendChild(errorElement);
            
            // Throw error to stop initialization
            throw new Error('WebGL not supported: ' + (result.errorMessage || 'Unknown error'));
        }
        
        // Store WebGL capabilities for later use
        this.webglCapabilities = result;
        
        // Show warnings if there are any performance concerns
        if (result.warnings && result.warnings.length > 0) {
            const warningElement = WebGLDetector.createWarningElement(result.warnings);
            if (warningElement) {
                document.body.appendChild(warningElement);
            }
            
            // Adjust quality settings based on warnings
            if (result.warnings.some(w => w.includes('older') || w.includes('Mobile'))) {
                this.config.devicePerformance = 'low';
                console.log('Reducing quality settings due to WebGL capability warnings');
            }
        }
        
        // Log WebGL capabilities
        console.log('WebGL Capabilities:', {
            renderer: result.renderer,
            version: result.version,
            webgl2: result.webgl2,
            maxTextureSize: result.maxTextureSize
        });
    }
    
    /**
     * Initialize the resource tracker
     */
    initResourceTracker() {
        this.resources = new ResourceTracker();
        
        // Enable debug mode in development
        if (this.config.debug) {
            this.resources.setDebugMode(true);
        }
    }
    
    /**
     * Initialize WebGL context manager
     */
    initWebGLContextManager() {
        this.contextManager = new WebGLContextManager(this);
        
        // Handle context loss/restoration
        this.onWebGLContextLost = () => {
            console.warn('Application: WebGL context lost');
            
            // Pause animations and interactivity
            this.isPaused = true;
            
            // Notify other components if needed
            if (this.sceneManager) {
                this.sceneManager.onContextLost();
            }
        };
        
        this.onWebGLContextRestored = () => {
            console.log('Application: WebGL context restored');
            
            // Recreate renderer and resources
            this.recreateRenderer();
            
            // Resume animations
            this.isPaused = false;
        };
    }
    
    /**
     * Recreate the renderer after context loss
     */
    recreateRenderer() {
        // Only proceed if we have a scene manager
        if (!this.sceneManager) return;
        
        console.log('Recreating renderer and resources');
        
        try {
            // Recreate the renderer
            this.sceneManager.createRenderer();
            
            // Set the renderer in the context manager
            if (this.contextManager) {
                this.contextManager.setRenderer(this.renderer);
            }
            
            // Notify components to reinitialize resources
            if (this.blackHole) {
                this.blackHole.onContextRestored();
            }
            
            if (this.particleSystem) {
                this.particleSystem.onContextRestored();
            }
            
            if (this.postProcessingManager) {
                this.postProcessingManager.onContextRestored();
            }
            
            // Resize to ensure correct dimensions
            this.onResize();
            
            console.log('Renderer and resources recreated successfully');
        } catch (error) {
            console.error('Failed to recreate renderer:', error);
            
            // Show a reload message if recovery fails
            this.showFallbackContent('Graphics context could not be restored. Please refresh the page.');
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        // Skip updates if paused (context lost)
        if (this.isPaused) return;
        
        // Update time
        this.time = this.clock.getElapsedTime();
        
        // Start FPS measurement
        if (this.stats) this.stats.begin();
        
        // Update FPS tracking in performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.updateFPS();
        }
        
        // Update components
        this.update();
        
        // Render the scene
        this.render();
        
        // End FPS measurement
        if (this.stats) this.stats.end();
    }
    
    /**
     * Update all components
     */
    update() {
        // Update scene
        if (this.sceneManager) {
            this.sceneManager.update(this.time);
        }
        
        // Update black hole
        if (this.blackHole) {
            this.blackHole.update(this.time);
        }
        
        // Update particle system
        if (this.particleSystem) {
            this.particleSystem.update(this.time);
        }
        
        // Update gravitational lensing
        if (this.gravitationalLensing) {
            this.gravitationalLensing.update(this.time);
        }
        
        // Update time dilation
        if (this.timeDilation) {
            this.timeDilation.update(this.time);
        }
        
        // Update nebula effect
        if (this.nebulaEffect) {
            this.nebulaEffect.update(this.time);
        }
    }
    
    /**
     * Render the scene
     */
    render() {
        try {
            if (this.postProcessingManager && this.postProcessingManager.composer) {
                // Render with post-processing
                this.postProcessingManager.update(this.time);
                this.postProcessingManager.render();
            } else if (this.scene && this.camera && this.renderer) {
                // Fallback to standard rendering
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('Error during rendering:', error);
            
            // Fallback to standard rendering on error
            if (this.scene && this.camera && this.renderer) {
                try {
                    this.renderer.render(this.scene, this.camera);
                } catch (fallbackError) {
                    console.error('Failed to use fallback rendering:', fallbackError);
                }
            }
            
            // Disable post-processing on recurring errors
            if (this._renderErrorCount === undefined) {
                this._renderErrorCount = 0;
            }
            
            this._renderErrorCount++;
            
            // After a couple of errors, try to reinitialize the post-processing
            if (this._renderErrorCount === 3) {
                console.warn('Attempting to reinitialize post-processing due to errors');
                try {
                    this.postProcessingManager = new PostProcessingManager(this);
                    this.postProcessingManager.init();
                    
                    // Apply default configuration
                    this.postProcessingManager.toggleBloom(this.config.enableBloom);
                    this.postProcessingManager.toggleFilmGrain(this.config.enableFilmGrain);
                    
                    if (this.gravitationalLensing) {
                        this.postProcessingManager.registerGravitationalLensing(this.gravitationalLensing);
                        this.postProcessingManager.toggleGravitationalLensing(this.config.enableGravitationalLensing);
                    }
                    
                    // Set quality based on device performance
                    this.postProcessingManager.setQualityLevel();
                } catch (reinitError) {
                    console.error('Failed to reinitialize post-processing:', reinitError);
                }
            }
            
            // After multiple errors, disable post-processing permanently for this session
            if (this._renderErrorCount > 5) {
                console.warn('Disabling post-processing due to recurring errors');
                this.postProcessingManager = null;
            }
        }
    }
    
    /**
     * Handle window resize
     */
    onResize() {
        // Update sizes
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        
        // Resize scene manager (handles camera and renderer)
        if (this.sceneManager) {
            this.sceneManager.resize();
        }
        
        // Resize post-processing
        if (this.postProcessingManager) {
            this.postProcessingManager.resize(this.sizes.width, this.sizes.height);
        }
    }
    
    /**
     * Get theme color by name
     */
    getThemeColor(name) {
        return this.config.theme[name] || null;
    }
    
    /**
     * Create a sound effect when an orb is highlighted
     */
    createOrbHighlightSound() {
        // Create a simple audio effect using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1); // Ramp up to A5
            
            // Configure gain (volume)
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play and stop
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Could not create audio effect:', error);
        }
    }
    
    /**
     * Create a sound effect when a section is opened
     */
    createSectionOpenSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // E4 note
            oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.2); // Ramp up to E5
            
            // Configure gain (volume)
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play and stop
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not create audio effect:', error);
        }
    }
    
    /**
     * Create a sound effect when a section is closed
     */
    createSectionCloseSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5 note
            oscillator.frequency.exponentialRampToValueAtTime(330, audioContext.currentTime + 0.2); // Ramp down to E4
            
            // Configure gain (volume)
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play and stop
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch (error) {
            console.warn('Could not create audio effect:', error);
        }
    }
    
    /**
     * Create a sound effect for data input
     */
    createDataInputSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(220 + Math.random() * 220, audioContext.currentTime);
            
            // Configure gain (volume)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play and stop
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('Could not create audio effect:', error);
        }
    }
    
    /**
     * Toggle time dilation effect
     */
    toggleTimeDilation(enabled) {
        if (this.timeDilation) {
            this.timeDilation.setActive(enabled);
            this.config.enableTimeDilation = enabled;
        }
    }
    
    /**
     * Set time dilation visualization type
     */
    setTimeDilationVisualization(type) {
        if (this.timeDilation) {
            this.timeDilation.setVisualizationType(type);
        }
    }
    
    /**
     * Toggle nebula effect
     */
    toggleNebula(enabled) {
        if (this.nebulaEffect) {
            this.nebulaEffect.setActive(enabled);
            this.config.enableNebula = enabled;
        }
    }
    
    /**
     * Set nebula intensity
     */
    setNebulaIntensity(intensity) {
        if (this.nebulaEffect) {
            this.nebulaEffect.setIntensity(intensity);
        }
    }
    
    /**
     * Show fallback content when WebGL fails
     * @param {string} message - Error message to display
     */
    showFallbackContent(message) {
        // Create fallback container
        const fallback = document.createElement('div');
        fallback.className = 'webgl-error';
        fallback.style.position = 'absolute';
        fallback.style.top = '0';
        fallback.style.left = '0';
        fallback.style.width = '100%';
        fallback.style.height = '100%';
        fallback.style.display = 'flex';
        fallback.style.flexDirection = 'column';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        fallback.style.backgroundColor = '#0a0a14';
        fallback.style.color = '#ffffff';
        fallback.style.padding = '2rem';
        fallback.style.textAlign = 'center';
        fallback.style.zIndex = '1000';
        
        // Add message
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        fallback.appendChild(messageEl);
        
        // Add reload button
        const reloadBtn = document.createElement('button');
        reloadBtn.textContent = 'Refresh Page';
        reloadBtn.style.marginTop = '1rem';
        reloadBtn.style.padding = '0.5rem 1rem';
        reloadBtn.style.backgroundColor = '#44aaff';
        reloadBtn.style.border = 'none';
        reloadBtn.style.borderRadius = '4px';
        reloadBtn.style.color = 'white';
        reloadBtn.style.cursor = 'pointer';
        reloadBtn.addEventListener('click', () => window.location.reload());
        fallback.appendChild(reloadBtn);
        
        // Add to container
        const container = document.getElementById('container');
        if (container) {
            container.appendChild(fallback);
        } else {
            document.body.appendChild(fallback);
        }
    }
    
    /**
     * Track a resource with the ResourceTracker
     * @param {Object} resource - Resource to track
     * @param {string} name - Optional name for debugging
     * @returns {Object} - The tracked resource
     */
    track(resource, name = '') {
        return this.resources ? this.resources.track(resource, name) : resource;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Stop animation loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        
        // Dispose WebGL context manager
        if (this.contextManager) {
            this.contextManager.dispose();
        }
        
        // Use ResourceTracker to dispose of Three.js resources
        if (this.resources) {
            const count = this.resources.dispose();
            console.log(`Disposed ${count} tracked resources`);
        }
        
        // Dispose core systems
        if (this.sceneManager) this.sceneManager.dispose();
        if (this.blackHole) this.blackHole.dispose();
        if (this.particleSystem) this.particleSystem.dispose();
        if (this.postProcessingManager) this.postProcessingManager.dispose();
        
        // Dispose effects
        if (this.gravitationalLensing) this.gravitationalLensing.dispose();
        if (this.timeDilation) this.timeDilation.dispose();
        if (this.nebulaEffect) this.nebulaEffect.dispose();
        
        // Dispose utility managers
        if (this.performanceMonitor) this.performanceMonitor.dispose();
        if (this.touchInteraction) this.touchInteraction.dispose();
        if (this.debugPanel) this.debugPanel.dispose();
        if (this.accessibilityManager) this.accessibilityManager.dispose();
        
        // Remove stats if enabled
        if (this.stats && this.stats.dom.parentElement) {
            this.stats.dom.parentElement.removeChild(this.stats.dom);
        }
        
        console.log('BlackHoleApp disposed');
    }
}

// Create and export the app instance
let app = null;

// Initialize application when DOM is loaded
function initApp() {
    app = new BlackHoleApp({
        canvas: document.getElementById('blackhole-canvas'),
        autoRotate: true,
        showFPS: false,
        enableGravitationalLensing: true,
        enableTimeDilation: true,
        enableNebula: true,
        theme: {
            primary: '#8844ff',
            secondary: '#44aaff',
            tertiary: '#ff44aa',
            background: '#000000'
        }
    });
    
    // Make app globally accessible for debugging
    window.blackHoleApp = app;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

export { app }; 