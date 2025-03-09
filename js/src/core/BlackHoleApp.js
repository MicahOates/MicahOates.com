// Import Three.js and required modules
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Import custom modules
import { SceneManager } from './SceneManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';
import { BlackHole } from './BlackHole.js';
import { ParticleSystem } from './ParticleSystem.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { PostProcessingManager } from './PostProcessingManager.js';

export class BlackHoleApp {
    constructor() {
        // Core properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.composer = null;
        
        // Component managers
        this.sceneManager = null;
        this.audioManager = null;
        this.uiManager = null;
        this.performanceMonitor = null;
        this.postProcessingManager = null;
        
        // Scene elements
        this.blackHole = null;
        this.particleSystem = null;
        
        // State
        this.initialized = false;
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.mouse = { x: 0, y: 0 };
        this.config = {
            particleCount: 2000,
            blackHoleRadius: 10,
            accretionDiskRadius: 15,
            bloom: true,
            devicePerformance: 'high' // Default, will be detected
        };
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.showLoader();
        
        // Create performance monitor first to detect device capabilities
        this.performanceMonitor = new PerformanceMonitor(this);
        this.performanceMonitor.detectPerformance().then(() => {
            // Initialize core components
            this.sceneManager = new SceneManager(this);
            this.sceneManager.init();
            
            // Post-processing
            this.postProcessingManager = new PostProcessingManager(this);
            this.postProcessingManager.init();
            
            // Create main scene elements
            this.blackHole = new BlackHole(this);
            this.blackHole.init();
            
            this.particleSystem = new ParticleSystem(this);
            this.particleSystem.init();
            
            // Initialize UI and audio last
            this.uiManager = new UIManager(this);
            this.uiManager.init();
            
            this.audioManager = new AudioManager(this);
            this.audioManager.init();
            
            // Set up event listeners
            this.initEventListeners();
            
            // Start animation loop
            this.initialized = true;
            this.animate();
            
            // Hide loader when everything is ready
            this.hideLoader();
        });
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            // Update sizes
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;
            
            // Update camera
            this.sceneManager.camera.aspect = this.sizes.width / this.sizes.height;
            this.sceneManager.camera.updateProjectionMatrix();
            
            // Update renderer and composer
            this.sceneManager.renderer.setSize(this.sizes.width, this.sizes.height);
            this.postProcessingManager.composer.setSize(this.sizes.width, this.sizes.height);
        });
        
        // Mouse move
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
            this.mouse.y = -(event.clientY / this.sizes.height) * 2 + 1;
            
            // Update quantum state based on mouse position
            if (this.uiManager) {
                this.uiManager.updateQuantumState(this.mouse.x, this.mouse.y);
            }
        });
    }
    
    /**
     * Main animation loop
     */
    animate() {
        if (!this.initialized) return;
        
        const time = this.clock.getElapsedTime();
        
        // Update components
        if (this.blackHole) this.blackHole.update(time);
        if (this.particleSystem) this.particleSystem.update(time);
        if (this.uiManager) this.uiManager.update(time);
        
        // Render
        this.postProcessingManager.composer.render();
        
        // Continue animation loop
        requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Show loading screen
     */
    showLoader() {
        // Implementation will be moved to UIManager later
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-title">Initializing Singularity</div>
                <div class="loader-progress-container">
                    <div class="loader-progress-bar"></div>
                </div>
                <div class="loader-status">Warping space-time matrix...</div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    /**
     * Hide loading screen
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.remove();
            }, 1000);
        }
    }
    
    /**
     * Get theme color
     */
    getThemeColor(colorName) {
        const colors = {
            primary: '#c233e3',
            secondary: '#2e003c',
            tertiary: '#5d54ff',
            accent: '#a3ff54',
            background: '#000000',
            text: '#ffffff'
        };
        return colors[colorName] || colors.primary;
    }
} 