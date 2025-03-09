import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { SceneManager } from './core/SceneManager.js';
import { BlackHole } from './core/BlackHole.js';
import { ParticleSystem } from './core/ParticleSystem.js';
import { PostProcessingManager } from './core/PostProcessingManager.js';

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
            theme: options.theme || {
                primary: '#8844ff',   // Purple
                secondary: '#44aaff', // Blue
                tertiary: '#ff44aa',  // Pink
                background: '#000000' // Black
            }
        };
        
        // Viewport size
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Time and clock
        this.clock = new THREE.Clock();
        this.time = 0;
        
        // Performance monitoring
        this.stats = null;
        
        // Core components
        this.sceneManager = null;
        this.blackHole = null;
        this.particleSystem = null;
        this.postProcessingManager = null;
        
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
        // Create fps counter if enabled
        if (this.config.showFPS) {
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
        }
        
        // Initialize core systems
        this.initSceneManager();
        this.initBlackHole();
        this.initParticleSystem();
        this.initPostProcessing();
        
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
     * Initialize post-processing effects
     */
    initPostProcessing() {
        this.postProcessingManager = new PostProcessingManager(this);
        this.postProcessingManager.init();
        
        // Apply configuration options to effects
        this.postProcessingManager.toggleBloom(this.config.enableBloom);
        this.postProcessingManager.toggleFilmGrain(this.config.enableFilmGrain);
        
        // Set quality based on device performance
        this.postProcessingManager.setQualityLevel();
    }
    
    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update time
        this.time = this.clock.getElapsedTime();
        
        // Start FPS measurement
        if (this.stats) this.stats.begin();
        
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
    }
    
    /**
     * Render the scene
     */
    render() {
        if (this.postProcessingManager && this.postProcessingManager.composer) {
            // Render with post-processing
            this.postProcessingManager.update(this.time);
            this.postProcessingManager.composer.render();
        } else if (this.scene && this.camera && this.renderer) {
            // Fallback to standard rendering
            this.renderer.render(this.scene, this.camera);
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
     * Clean up resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        
        // Dispose of components
        if (this.postProcessingManager) this.postProcessingManager.dispose();
        if (this.particleSystem) this.particleSystem.dispose();
        if (this.sceneManager) this.sceneManager.dispose();
        
        // Remove stats if enabled
        if (this.stats && this.stats.dom.parentElement) {
            this.stats.dom.parentElement.removeChild(this.stats.dom);
        }
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