import * as THREE from 'three';

export class PerformanceMonitor {
    constructor(app) {
        this.app = app;
        this.frameCount = 0;
        this.frameTimes = [];
        this.lastTime = 0;
        this.monitoring = false;
    }
    
    /**
     * Detect device performance and set configuration
     * Returns a promise that resolves when performance detection is complete
     */
    detectPerformance() {
        return new Promise((resolve) => {
            // Check if device is mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Set initial performance level based on device type
            if (isMobile) {
                this.app.config.devicePerformance = 'low';
                resolve();
                return;
            }
            
            // Start measuring FPS for desktop devices
            this.monitoring = true;
            this.frameCount = 0;
            this.frameTimes = [];
            this.lastTime = performance.now();
            
            // Create a test scene with particles to stress the GPU
            this.createTestScene();
            
            // Check FPS after 1 second
            setTimeout(() => {
                this.monitoring = false;
                this.determinePerformanceLevel();
                
                // Clean up test scene
                this.cleanupTestScene();
                
                resolve();
            }, 1000);
            
            // Start animation loop for testing
            this.runTestLoop();
        });
    }
    
    /**
     * Create a simple test scene with many particles
     */
    createTestScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50;
        
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Hide test canvas but keep it in the DOM for accurate performance measurement
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.opacity = '0';
        renderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(renderer.domElement);
        
        // Create a large number of particles to stress the GPU
        const particleCount = 10000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({ size: 1, color: 0xffffff });
        const particleSystem = new THREE.Points(particles, material);
        scene.add(particleSystem);
        
        // Store references for cleanup
        this.testScene = scene;
        this.testCamera = camera;
        this.testRenderer = renderer;
        this.testParticles = particleSystem;
    }
    
    /**
     * Run test animation loop
     */
    runTestLoop() {
        if (!this.monitoring) return;
        
        const time = performance.now();
        const delta = time - this.lastTime;
        this.lastTime = time;
        
        if (delta > 0) {
            this.frameTimes.push(delta);
            this.frameCount++;
        }
        
        // Rotate particles to ensure GPU load
        if (this.testParticles) {
            this.testParticles.rotation.x += 0.01;
            this.testParticles.rotation.y += 0.01;
        }
        
        // Render test scene
        if (this.testRenderer && this.testScene && this.testCamera) {
            this.testRenderer.render(this.testScene, this.testCamera);
        }
        
        // Continue loop if still monitoring
        if (this.monitoring) {
            requestAnimationFrame(() => this.runTestLoop());
        }
    }
    
    /**
     * Determine performance level based on measured FPS
     */
    determinePerformanceLevel() {
        // Calculate average FPS
        const totalTime = this.frameTimes.reduce((sum, time) => sum + time, 0);
        const avgFrameTime = totalTime / this.frameTimes.length;
        const fps = 1000 / avgFrameTime;
        
        // Determine performance level based on FPS
        if (fps < 30) {
            this.app.config.devicePerformance = 'low';
        } else if (fps < 50) {
            this.app.config.devicePerformance = 'medium';
        } else {
            this.app.config.devicePerformance = 'high';
        }
        
        console.log(`Performance detection - FPS: ${fps.toFixed(1)}, Level: ${this.app.config.devicePerformance}`);
    }
    
    /**
     * Clean up test scene
     */
    cleanupTestScene() {
        if (this.testRenderer) {
            if (this.testRenderer.domElement && this.testRenderer.domElement.parentNode) {
                this.testRenderer.domElement.parentNode.removeChild(this.testRenderer.domElement);
            }
            this.testRenderer.dispose();
        }
        
        // Clean up geometries and materials
        if (this.testParticles) {
            if (this.testParticles.geometry) {
                this.testParticles.geometry.dispose();
            }
            if (this.testParticles.material) {
                this.testParticles.material.dispose();
            }
        }
        
        this.testScene = null;
        this.testCamera = null;
        this.testRenderer = null;
        this.testParticles = null;
    }
    
    /**
     * Monitor ongoing performance during regular use
     */
    monitorPerformance() {
        // We'll implement this later if needed
        // This would monitor performance during regular use and 
        // adjust settings dynamically if performance drops
    }
} 