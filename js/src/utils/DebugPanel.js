import * as THREE from 'three';

/**
 * DebugPanel
 * Interactive debugging panel with performance monitoring, scene information, and quality controls
 */
export class DebugPanel {
    constructor(app, options = {}) {
        this.app = app;
        
        // State
        this.visible = options.visible || false;
        this.position = options.position || 'top-right';
        this.panel = null;
        
        // Performance monitoring
        this.fpsHistory = [];
        this.fpsHistorySize = 60; // 60 frames history
        this.memoryHistory = [];
        this.lastUpdateTime = 0;
        this.updateInterval = 500; // Update every 500ms
        
        // Capture original material states for wireframe toggle
        this.originalMaterials = new Map();
        this.wireframeEnabled = false;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the debug panel
     */
    init() {
        // Create debug panel container
        this.panel = document.createElement('div');
        this.panel.className = `debug-panel ${this.position}`;
        this.panel.style.display = this.visible ? 'block' : 'none';
        
        // Create header with toggle button
        const header = document.createElement('div');
        header.className = 'debug-header';
        header.innerHTML = `
            <h3>Debug Panel</h3>
            <button class="debug-close">×</button>
        `;
        this.panel.appendChild(header);
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'debug-content';
        this.panel.appendChild(content);
        
        // Add sections
        this.addPerfSection(content);
        this.addControlsSection(content);
        this.addSceneInfoSection(content);
        
        // Add toggle button to document
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'debug-toggle';
        toggleBtn.textContent = 'Debug';
        toggleBtn.setAttribute('aria-label', 'Toggle debug panel');
        toggleBtn.addEventListener('click', () => this.toggleVisibility());
        
        // Apply styles for toggle button
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '10px';
        toggleBtn.style.right = '10px';
        toggleBtn.style.background = 'rgba(0, 0, 0, 0.7)';
        toggleBtn.style.color = '#fff';
        toggleBtn.style.border = '1px solid #44aaff';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.fontFamily = 'monospace';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.zIndex = '9998';
        
        // Add to document
        document.body.appendChild(this.panel);
        document.body.appendChild(toggleBtn);
        
        // Add event listeners
        header.querySelector('.debug-close').addEventListener('click', () => this.toggleVisibility(false));
        
        // Add keyboard shortcut (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                this.toggleVisibility();
            }
        });
        
        // Apply panel styles
        this.applyStyles();
        
        // Update panel when visible
        this.updateLoop();
        
        console.log('DebugPanel initialized');
    }
    
    /**
     * Apply CSS styles to the panel
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .debug-panel {
                position: fixed;
                width: 280px;
                background: rgba(0, 5, 20, 0.85);
                border: 1px solid #44aaff;
                border-radius: 4px;
                color: #ffffff;
                font-family: monospace;
                box-shadow: 0 0 20px rgba(68, 170, 255, 0.3);
                z-index: 9999;
                backdrop-filter: blur(5px);
                transition: all 0.3s ease;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .debug-panel.top-right {
                top: 10px;
                right: 10px;
            }
            
            .debug-panel.top-left {
                top: 10px;
                left: 10px;
            }
            
            .debug-panel.bottom-right {
                bottom: 10px;
                right: 10px;
            }
            
            .debug-panel.bottom-left {
                bottom: 10px;
                left: 10px;
            }
            
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid #44aaff;
                background: rgba(68, 170, 255, 0.2);
            }
            
            .debug-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: normal;
            }
            
            .debug-close {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 16px;
                cursor: pointer;
                padding: 0 4px;
            }
            
            .debug-content {
                padding: 10px;
            }
            
            .debug-section {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(68, 170, 255, 0.2);
            }
            
            .debug-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            
            .debug-section h4 {
                margin: 0 0 8px 0;
                font-size: 13px;
                color: #44aaff;
            }
            
            .debug-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                font-size: 12px;
            }
            
            .debug-stats div {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .control-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 12px;
            }
            
            .control-row button, 
            .control-row select {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(68, 170, 255, 0.5);
                color: white;
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 11px;
                font-family: monospace;
                cursor: pointer;
            }
            
            .control-row select {
                padding-right: 15px;
            }
            
            .control-row button:hover {
                background: rgba(68, 170, 255, 0.2);
            }
            
            .debug-scene-info {
                font-size: 12px;
                line-height: 1.4;
            }
            
            #debug-fps-graph {
                margin-top: 8px;
                width: 100%;
                height: 60px;
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .debug-buttons {
                display: flex;
                gap: 5px;
                margin-top: 8px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Add performance monitoring section
     * @param {HTMLElement} parent 
     */
    addPerfSection(parent) {
        const section = document.createElement('div');
        section.className = 'debug-section';
        section.innerHTML = `
            <h4>Performance</h4>
            <div class="debug-stats">
                <div>FPS: <span id="debug-fps">0</span></div>
                <div>Draw calls: <span id="debug-drawcalls">0</span></div>
                <div>Triangles: <span id="debug-triangles">0</span></div>
                <div>Memory: <span id="debug-memory">0</span> MB</div>
            </div>
            <canvas id="debug-fps-graph" width="260" height="60"></canvas>
        `;
        parent.appendChild(section);
        
        // Initialize the FPS graph
        this.setupFpsGraph();
    }
    
    /**
     * Add controls section
     * @param {HTMLElement} parent 
     */
    addControlsSection(parent) {
        const section = document.createElement('div');
        section.className = 'debug-section';
        section.innerHTML = `
            <h4>Controls</h4>
            <div class="debug-controls">
                <div class="control-row">
                    <label for="debug-quality">Quality Level</label>
                    <select id="debug-quality">
                        <option value="low" ${this.app.config.devicePerformance === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${this.app.config.devicePerformance === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${this.app.config.devicePerformance === 'high' ? 'selected' : ''}>High</option>
                    </select>
                </div>
                <div class="control-row">
                    <label for="debug-wireframe">Wireframe</label>
                    <input type="checkbox" id="debug-wireframe" ${this.wireframeEnabled ? 'checked' : ''}>
                </div>
                <div class="control-row">
                    <label for="debug-rotation">Auto-Rotation</label>
                    <input type="checkbox" id="debug-rotation" ${this.app.config.autoRotate ? 'checked' : ''}>
                </div>
                <div class="control-row">
                    <label for="debug-adaptive">Adaptive Quality</label>
                    <input type="checkbox" id="debug-adaptive" ${this.app.performanceMonitor?.adaptiveQualityEnabled ? 'checked' : ''}>
                </div>
            </div>
        `;
        parent.appendChild(section);
        
        // Add event listeners
        this.setupControlListeners(section);
    }
    
    /**
     * Add scene information section
     * @param {HTMLElement} parent 
     */
    addSceneInfoSection(parent) {
        const section = document.createElement('div');
        section.className = 'debug-section';
        section.innerHTML = `
            <h4>Scene Info</h4>
            <div class="debug-scene-info">
                <div>Camera Position: <span id="debug-camera-pos">0,0,0</span></div>
                <div>Camera Target: <span id="debug-camera-target">0,0,0</span></div>
                <div>Objects: <span id="debug-object-count">0</span></div>
                <div>Lights: <span id="debug-light-count">0</span></div>
            </div>
            <div class="debug-buttons">
                <button id="debug-reset-camera">Reset Camera</button>
                <button id="debug-screenshot">Screenshot</button>
            </div>
        `;
        parent.appendChild(section);
        
        // Add event listeners
        section.querySelector('#debug-reset-camera').addEventListener('click', () => {
            if (this.app.sceneManager && this.app.sceneManager.resetCameraPosition) {
                this.app.sceneManager.resetCameraPosition();
            }
        });
        
        section.querySelector('#debug-screenshot').addEventListener('click', () => {
            this.captureScreenshot();
        });
    }
    
    /**
     * Setup FPS graph
     */
    setupFpsGraph() {
        const canvas = document.getElementById('debug-fps-graph');
        if (!canvas) return;
        
        this.fpsContext = canvas.getContext('2d');
        
        // Initialize with empty values
        this.fpsHistory = Array(canvas.width).fill(0);
    }
    
    /**
     * Setup control listeners
     * @param {HTMLElement} container 
     */
    setupControlListeners(container) {
        // Quality selector
        const qualitySelect = container.querySelector('#debug-quality');
        qualitySelect.addEventListener('change', () => {
            const quality = qualitySelect.value;
            this.app.config.devicePerformance = quality;
            
            // Update quality in app components
            if (this.app.sceneManager && this.app.sceneManager.setQualityLevel) {
                this.app.sceneManager.setQualityLevel(quality);
            }
            
            // Update quality in effect managers if they exist
            if (this.app.blackHoleEffect && this.app.blackHoleEffect.setQualityLevel) {
                this.app.blackHoleEffect.setQualityLevel(quality);
            }
            
            if (this.app.nebulaEffect && this.app.nebulaEffect.setQualityLevel) {
                this.app.nebulaEffect.setQualityLevel(quality);
            }
            
            console.log(`Quality set to: ${quality}`);
        });
        
        // Wireframe toggle
        const wireframeToggle = container.querySelector('#debug-wireframe');
        wireframeToggle.addEventListener('change', () => {
            this.toggleWireframe(wireframeToggle.checked);
        });
        
        // Auto-rotation toggle
        const rotationToggle = container.querySelector('#debug-rotation');
        rotationToggle.addEventListener('change', () => {
            this.app.config.autoRotate = rotationToggle.checked;
            
            if (this.app.controls) {
                this.app.controls.autoRotate = rotationToggle.checked;
            }
        });
        
        // Adaptive quality toggle
        const adaptiveToggle = container.querySelector('#debug-adaptive');
        if (adaptiveToggle && this.app.performanceMonitor) {
            adaptiveToggle.addEventListener('change', () => {
                this.app.performanceMonitor.adaptiveQualityEnabled = adaptiveToggle.checked;
            });
        }
    }
    
    /**
     * Toggle wireframe mode for scene meshes
     * @param {boolean} enabled 
     */
    toggleWireframe(enabled) {
        if (!this.app.scene) return;
        
        this.wireframeEnabled = enabled;
        
        this.app.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                // Handle arrays of materials
                if (Array.isArray(object.material)) {
                    for (let i = 0; i < object.material.length; i++) {
                        this.setWireframe(object.material[i], enabled);
                    }
                } else {
                    this.setWireframe(object.material, enabled);
                }
            }
        });
    }
    
    /**
     * Set wireframe mode for a material
     * @param {THREE.Material} material 
     * @param {boolean} enabled 
     */
    setWireframe(material, enabled) {
        // Store original state on first toggle
        if (!this.originalMaterials.has(material.uuid)) {
            this.originalMaterials.set(material.uuid, {
                wireframe: material.wireframe,
                opacity: material.opacity,
                transparent: material.transparent
            });
        }
        
        // Set wireframe
        material.wireframe = enabled;
        
        // Adjust transparency for better wireframe visibility
        if (enabled) {
            if (!material.wireframe) {
                material.opacity = 0.7;
                material.transparent = true;
            }
        } else {
            const original = this.originalMaterials.get(material.uuid);
            if (original) {
                material.opacity = original.opacity;
                material.transparent = original.transparent;
            }
        }
    }
    
    /**
     * Capture screenshot of the canvas
     */
    captureScreenshot() {
        if (!this.app.renderer) return;
        
        // Temporarily hide debug panel for clean screenshot
        const wasVisible = this.visible;
        if (wasVisible) {
            this.toggleVisibility(false);
        }
        
        // Wait for next frame to ensure UI is hidden
        requestAnimationFrame(() => {
            // Force a render pass
            if (this.app.scene && this.app.camera) {
                this.app.renderer.render(this.app.scene, this.app.camera);
                
                try {
                    // Get image from canvas
                    const dataURL = this.app.renderer.domElement.toDataURL('image/png');
                    
                    // Create link for download
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = `blackhole-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                    link.click();
                    
                    console.log('Screenshot captured');
                } catch (error) {
                    console.error('Failed to capture screenshot:', error);
                }
                
                // Restore debug panel if it was visible
                if (wasVisible) {
                    setTimeout(() => {
                        this.toggleVisibility(true);
                    }, 100);
                }
            }
        });
    }
    
    /**
     * Toggle debug panel visibility
     * @param {boolean|null} visible 
     */
    toggleVisibility(visible = null) {
        this.visible = visible !== null ? visible : !this.visible;
        this.panel.style.display = this.visible ? 'block' : 'none';
    }
    
    /**
     * Update loop for the debug panel
     */
    updateLoop() {
        const update = () => {
            // Update stats if visible
            if (this.visible) {
                const now = performance.now();
                
                // Update at intervals to avoid performance impact
                if (now - this.lastUpdateTime > this.updateInterval) {
                    this.updateStats();
                    this.lastUpdateTime = now;
                }
            }
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }
    
    /**
     * Update performance statistics
     */
    updateStats() {
        if (!this.visible) return;
        
        // Get FPS from performance monitor if available
        let fps = 0;
        if (this.app.performanceMonitor && this.app.performanceMonitor.getFPS) {
            fps = Math.round(this.app.performanceMonitor.getFPS());
        } else {
            // Calculate rough FPS based on requestAnimationFrame
            fps = Math.round(1000 / (performance.now() - this.lastUpdateTime) * (1000 / this.updateInterval));
        }
        
        // Update FPS display
        const fpsElement = document.getElementById('debug-fps');
        if (fpsElement) {
            fpsElement.textContent = fps;
            
            // Color code based on performance
            if (fps >= 50) {
                fpsElement.style.color = '#00ff00';
            } else if (fps >= 30) {
                fpsElement.style.color = '#ffff00';
            } else {
                fpsElement.style.color = '#ff0000';
            }
        }
        
        // Update FPS history
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > this.fpsHistorySize) {
            this.fpsHistory.shift();
        }
        
        // Update the FPS graph
        this.updateFpsGraph();
        
        // Update renderer stats
        if (this.app.renderer && this.app.renderer.info) {
            const info = this.app.renderer.info;
            
            // Update draw calls
            const drawCallsElement = document.getElementById('debug-drawcalls');
            if (drawCallsElement) {
                drawCallsElement.textContent = info.render.calls;
            }
            
            // Update triangles
            const trianglesElement = document.getElementById('debug-triangles');
            if (trianglesElement) {
                trianglesElement.textContent = info.render.triangles.toLocaleString();
            }
        }
        
        // Update memory usage if available
        if (window.performance && window.performance.memory) {
            const memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
            const memoryElement = document.getElementById('debug-memory');
            if (memoryElement) {
                memoryElement.textContent = memoryUsage;
            }
            
            // Track memory history
            this.memoryHistory.push(memoryUsage);
            if (this.memoryHistory.length > this.fpsHistorySize) {
                this.memoryHistory.shift();
            }
        }
        
        // Update camera position
        if (this.app.camera) {
            const pos = this.app.camera.position;
            const posElement = document.getElementById('debug-camera-pos');
            if (posElement) {
                posElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
            }
            
            // Get camera target if available
            if (this.app.controls && this.app.controls.target) {
                const target = this.app.controls.target;
                const targetElement = document.getElementById('debug-camera-target');
                if (targetElement) {
                    targetElement.textContent = `${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}`;
                }
            }
        }
        
        // Update object counts
        if (this.app.scene) {
            let objectCount = 0;
            let lightCount = 0;
            
            this.app.scene.traverse((object) => {
                if (object.isMesh) objectCount++;
                if (object.isLight) lightCount++;
            });
            
            const objectElement = document.getElementById('debug-object-count');
            if (objectElement) objectElement.textContent = objectCount;
            
            const lightElement = document.getElementById('debug-light-count');
            if (lightElement) lightElement.textContent = lightCount;
        }
    }
    
    /**
     * Update FPS graph
     */
    updateFpsGraph() {
        if (!this.fpsContext || this.fpsHistory.length < 2) return;
        
        const ctx = this.fpsContext;
        const canvas = ctx.canvas;
        const maxFps = 70; // Maximum FPS to display
        
        // Get graph dimensions
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw horizontal grid lines (FPS values)
        const gridSteps = 7; // Draw 7 grid lines
        for (let i = 0; i <= gridSteps; i++) {
            const y = Math.round(height * (i / gridSteps));
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // Draw FPS value
            const fpsValue = Math.round(maxFps * (1 - (i / gridSteps)));
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '8px monospace';
            ctx.fillText(`${fpsValue}`, 2, y + 8);
        }
        
        // Map the FPS history to graph points
        const points = this.fpsHistory.map((fps, i) => {
            const x = width - (this.fpsHistory.length - i);
            const y = height - (fps / maxFps) * height;
            return { x, y };
        }).filter(point => point.x >= 0);
        
        // Draw FPS line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill area under the line
        ctx.lineTo(points[points.length - 1].x, height);
        ctx.lineTo(points[0].x, height);
        ctx.fillStyle = 'rgba(68, 170, 255, 0.1)';
        ctx.fill();
        
        // Draw critical lines
        const drawThresholdLine = (fps, color) => {
            const y = height - (fps / maxFps) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
        };
        
        // Draw 60 FPS line
        drawThresholdLine(60, 'rgba(0, 255, 0, 0.5)');
        
        // Draw 30 FPS line
        drawThresholdLine(30, 'rgba(255, 255, 0, 0.5)');
        
        // Draw 20 FPS line (critical)
        drawThresholdLine(20, 'rgba(255, 0, 0, 0.5)');
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        // Remove panel from DOM
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
        
        // Remove toggle button
        const toggleBtn = document.querySelector('.debug-toggle');
        if (toggleBtn && toggleBtn.parentNode) {
            toggleBtn.parentNode.removeChild(toggleBtn);
        }
        
        // Restore original material states
        this.toggleWireframe(false);
        
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        
        console.log('DebugPanel disposed');
    }
} 