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
        
        // Effects
        this.blackHoleEffect = null;
        this.nebulaEffect = null;
        
        // UI systems
        this.uiManager = null;
        this.uiController = null;
        
        // Audio system
        this.audioManager = null;
        
        // Animation
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        // Resize handler bound to this instance
        this.handleResize = this.onResize.bind(this);
    }
    
    /**
     * Initialize the application
     */
    init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Append to DOM
        const canvas = document.getElementById('scene');
        if (canvas) {
            canvas.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }
        
        // Initialize scene
        this.initScene();
        
        // Initialize effects
        this.initEffects();
        
        // Initialize UI
        this.initUIManager();
        this.initUIController();
        
        // Initialize Audio
        this.initAudioManager();
        
        // Set up resize handler
        window.addEventListener('resize', this.handleResize, false);
        
        // Start animation loop
        this.isRunning = true;
        this.animate();
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
     * Animation loop
     */
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate.bind(this));
        this.update();
        this.render();
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
     * Dispose and clean up resources
     */
    dispose() {
        // Stop animation loop
        this.isRunning = false;
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose UI
        if (this.uiManager) {
            this.uiManager.dispose();
            this.uiManager = null;
        }
        
        if (this.uiController) {
            this.uiController.dispose();
            this.uiController = null;
        }
        
        // Dispose audio
        if (this.audioManager) {
            this.audioManager.dispose();
            this.audioManager = null;
        }
        
        // Dispose effects
        if (this.blackHoleEffect) {
            this.blackHoleEffect.dispose();
            this.blackHoleEffect = null;
        }
        
        if (this.nebulaEffect) {
            this.nebulaEffect.dispose();
            this.nebulaEffect = null;
        }
        
        // Dispose scene
        if (this.sceneManager) {
            this.sceneManager.dispose();
            this.sceneManager = null;
        }
        
        // Dispose post-processing
        if (this.postProcessingManager) {
            this.postProcessingManager.dispose();
            this.postProcessingManager = null;
        }
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        console.log('Application disposed');
    }
} 