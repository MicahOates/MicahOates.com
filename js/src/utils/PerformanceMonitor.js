import * as THREE from 'three';

/**
 * Performance monitoring and adaptive quality adjustment
 */
export class PerformanceMonitor {
    constructor(app) {
        this.app = app;
        
        // Performance metrics
        this.fps = 0;
        this.fpsHistory = [];
        this.fpsHistorySize = 60; // Track last 60 frames
        this.lastTime = 0;
        this.frameTime = 0;
        this.memoryUsage = 0;
        
        // Target performance
        this.targetFPS = 60;
        this.lowFpsThreshold = 30;
        this.criticalFpsThreshold = 20;
        
        // Quality management
        this.currentQualityLevel = this.app.config.devicePerformance;
        this.adaptiveQualityEnabled = true;
        
        // Throttling to avoid rapid quality changes
        this.lastQualityAdjustTime = 0;
        this.qualityAdjustCooldown = 3000; // 3 seconds between adjustments
        
        // Debug
        this.debugEnabled = false;
        this.debugElement = null;
        
        // Init debug element
        this.initDebugOverlay();
    }
    
    /**
     * Initialize debug overlay
     */
    initDebugOverlay() {
        if (!this.debugEnabled) return;
        
        // Create debug overlay if it doesn't exist
        if (!this.debugElement) {
            this.debugElement = document.createElement('div');
            this.debugElement.id = 'performance-debug';
            this.debugElement.style.position = 'fixed';
            this.debugElement.style.top = '10px';
            this.debugElement.style.right = '10px';
            this.debugElement.style.background = 'rgba(0, 0, 0, 0.7)';
            this.debugElement.style.color = '#fff';
            this.debugElement.style.padding = '8px 12px';
            this.debugElement.style.borderRadius = '4px';
            this.debugElement.style.fontFamily = 'monospace';
            this.debugElement.style.fontSize = '12px';
            this.debugElement.style.zIndex = '9999';
            
            // Add graph container
            const graphContainer = document.createElement('div');
            graphContainer.id = 'performance-graph';
            graphContainer.style.width = '250px';
            graphContainer.style.height = '100px';
            graphContainer.style.marginTop = '10px';
            graphContainer.style.position = 'relative';
            graphContainer.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            
            // Add canvas for graph
            const graphCanvas = document.createElement('canvas');
            graphCanvas.width = 250;
            graphCanvas.height = 100;
            graphCanvas.style.width = '100%';
            graphCanvas.style.height = '100%';
            
            // Add thresholds lines container
            const thresholdsContainer = document.createElement('div');
            thresholdsContainer.style.position = 'absolute';
            thresholdsContainer.style.top = '0';
            thresholdsContainer.style.left = '0';
            thresholdsContainer.style.right = '0';
            thresholdsContainer.style.bottom = '0';
            thresholdsContainer.style.pointerEvents = 'none';
            
            // Add target FPS line
            const targetLine = document.createElement('div');
            targetLine.className = 'threshold-line target';
            targetLine.style.position = 'absolute';
            targetLine.style.left = '0';
            targetLine.style.right = '0';
            targetLine.style.borderTop = '1px dashed rgba(0, 255, 0, 0.5)';
            targetLine.style.top = `${100 - (this.targetFPS / 60) * 100}px`;
            thresholdsContainer.appendChild(targetLine);
            
            // Add low FPS line
            const lowLine = document.createElement('div');
            lowLine.className = 'threshold-line low';
            lowLine.style.position = 'absolute';
            lowLine.style.left = '0';
            lowLine.style.right = '0';
            lowLine.style.borderTop = '1px dashed rgba(255, 255, 0, 0.5)';
            lowLine.style.top = `${100 - (this.lowFpsThreshold / 60) * 100}px`;
            thresholdsContainer.appendChild(lowLine);
            
            // Add critical FPS line
            const criticalLine = document.createElement('div');
            criticalLine.className = 'threshold-line critical';
            criticalLine.style.position = 'absolute';
            criticalLine.style.left = '0';
            criticalLine.style.right = '0';
            criticalLine.style.borderTop = '1px dashed rgba(255, 0, 0, 0.5)';
            criticalLine.style.top = `${100 - (this.criticalFpsThreshold / 60) * 100}px`;
            thresholdsContainer.appendChild(criticalLine);
            
            // Add controls for performance settings
            const controlsContainer = document.createElement('div');
            controlsContainer.style.marginTop = '10px';
            controlsContainer.style.display = 'flex';
            controlsContainer.style.flexDirection = 'column';
            controlsContainer.style.gap = '5px';
            
            // Add quality selector
            const qualitySelector = document.createElement('div');
            qualitySelector.style.display = 'flex';
            qualitySelector.style.justifyContent = 'space-between';
            qualitySelector.style.alignItems = 'center';
            
            const qualityLabel = document.createElement('span');
            qualityLabel.textContent = 'Quality:';
            
            const qualitySelect = document.createElement('select');
            qualitySelect.id = 'quality-select';
            qualitySelect.style.background = 'rgba(0, 0, 0, 0.5)';
            qualitySelect.style.color = 'white';
            qualitySelect.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            qualitySelect.style.borderRadius = '3px';
            qualitySelect.style.padding = '2px 5px';
            
            const lowOption = document.createElement('option');
            lowOption.value = 'low';
            lowOption.textContent = 'Low';
            
            const mediumOption = document.createElement('option');
            mediumOption.value = 'medium';
            mediumOption.textContent = 'Medium';
            
            const highOption = document.createElement('option');
            highOption.value = 'high';
            highOption.textContent = 'High';
            
            qualitySelect.appendChild(lowOption);
            qualitySelect.appendChild(mediumOption);
            qualitySelect.appendChild(highOption);
            
            // Set initial value
            qualitySelect.value = this.currentQualityLevel;
            
            // Add event listener
            qualitySelect.addEventListener('change', () => {
                this.setQualityLevel(qualitySelect.value);
            });
            
            qualitySelector.appendChild(qualityLabel);
            qualitySelector.appendChild(qualitySelect);
            
            // Add adaptive toggle
            const adaptiveToggle = document.createElement('div');
            adaptiveToggle.style.display = 'flex';
            adaptiveToggle.style.justifyContent = 'space-between';
            adaptiveToggle.style.alignItems = 'center';
            
            const adaptiveLabel = document.createElement('span');
            adaptiveLabel.textContent = 'Adaptive Quality:';
            
            const adaptiveCheckbox = document.createElement('input');
            adaptiveCheckbox.type = 'checkbox';
            adaptiveCheckbox.id = 'adaptive-toggle';
            adaptiveCheckbox.checked = this.adaptiveQualityEnabled;
            
            adaptiveCheckbox.addEventListener('change', () => {
                this.toggleAdaptiveQuality(adaptiveCheckbox.checked);
            });
            
            adaptiveToggle.appendChild(adaptiveLabel);
            adaptiveToggle.appendChild(adaptiveCheckbox);
            
            // Add all elements to the DOM
            controlsContainer.appendChild(qualitySelector);
            controlsContainer.appendChild(adaptiveToggle);
            
            graphContainer.appendChild(graphCanvas);
            graphContainer.appendChild(thresholdsContainer);
            
            this.debugElement.appendChild(graphContainer);
            this.debugElement.appendChild(controlsContainer);
            document.body.appendChild(this.debugElement);
            
            // Store canvas context for drawing
            this.graphContext = graphCanvas.getContext('2d');
            this.initGraph();
        }
    }
    
    /**
     * Initialize performance graph
     */
    initGraph() {
        if (!this.graphContext) return;
        
        // Clear canvas
        this.graphContext.clearRect(0, 0, 250, 100);
        
        // Draw background
        this.graphContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.graphContext.fillRect(0, 0, 250, 100);
        
        // Draw grid
        this.graphContext.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.graphContext.lineWidth = 1;
        
        // Vertical lines (time)
        for (let x = 0; x < 250; x += 25) {
            this.graphContext.beginPath();
            this.graphContext.moveTo(x, 0);
            this.graphContext.lineTo(x, 100);
            this.graphContext.stroke();
        }
        
        // Horizontal lines (FPS values)
        for (let y = 0; y < 100; y += 20) {
            this.graphContext.beginPath();
            this.graphContext.moveTo(0, y);
            this.graphContext.lineTo(250, y);
            this.graphContext.stroke();
        }
    }
    
    /**
     * Update performance graph with latest FPS data
     */
    updateGraph() {
        if (!this.graphContext || this.fpsHistory.length < 2) return;
        
        // Clear canvas
        this.graphContext.clearRect(0, 0, 250, 100);
        
        // Draw background
        this.graphContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.graphContext.fillRect(0, 0, 250, 100);
        
        // Draw grid
        this.graphContext.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.graphContext.lineWidth = 1;
        
        // Vertical lines (time)
        for (let x = 0; x < 250; x += 25) {
            this.graphContext.beginPath();
            this.graphContext.moveTo(x, 0);
            this.graphContext.lineTo(x, 100);
            this.graphContext.stroke();
        }
        
        // Horizontal lines (FPS values)
        for (let y = 0; y < 100; y += 20) {
            this.graphContext.beginPath();
            this.graphContext.moveTo(0, y);
            this.graphContext.lineTo(250, y);
            this.graphContext.stroke();
        }
        
        // Draw FPS line
        this.graphContext.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        this.graphContext.lineWidth = 2;
        this.graphContext.beginPath();
        
        // Get visible history (max 60 values)
        const visibleHistory = this.fpsHistory.slice(-Math.min(60, this.fpsHistory.length));
        const step = 250 / (visibleHistory.length - 1);
        
        // Plot points
        for (let i = 0; i < visibleHistory.length; i++) {
            const fps = Math.min(visibleHistory[i], 60); // Cap at 60 FPS for display
            const x = i * step;
            const y = 100 - (fps / 60) * 100; // Scale to canvas height
            
            if (i === 0) {
                this.graphContext.moveTo(x, y);
            } else {
                this.graphContext.lineTo(x, y);
            }
        }
        
        this.graphContext.stroke();
        
        // Fill area under the line
        this.graphContext.lineTo(250, 100);
        this.graphContext.lineTo(0, 100);
        this.graphContext.closePath();
        
        // Create gradient fill
        const gradient = this.graphContext.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.05)');
        this.graphContext.fillStyle = gradient;
        this.graphContext.fill();
        
        // Draw current FPS as a circle at the end of the line
        const lastFps = visibleHistory[visibleHistory.length - 1];
        const lastX = (visibleHistory.length - 1) * step;
        const lastY = 100 - (Math.min(lastFps, 60) / 60) * 100;
        
        this.graphContext.beginPath();
        this.graphContext.arc(lastX, lastY, 4, 0, Math.PI * 2);
        
        // Color based on FPS value
        if (lastFps < this.criticalFpsThreshold) {
            this.graphContext.fillStyle = 'rgba(255, 0, 0, 0.8)';
        } else if (lastFps < this.lowFpsThreshold) {
            this.graphContext.fillStyle = 'rgba(255, 255, 0, 0.8)';
        } else {
            this.graphContext.fillStyle = 'rgba(0, 255, 0, 0.8)';
        }
        
        this.graphContext.fill();
    }
    
    /**
     * Start performance monitoring
     */
    start() {
        this.lastTime = performance.now();
        this.updateDebugOverlay();
    }
    
    /**
     * Toggle debug overlay visibility
     */
    toggleDebug(enabled) {
        this.debugEnabled = enabled;
        
        if (enabled) {
            this.initDebugOverlay();
        } else if (this.debugElement) {
            this.debugElement.style.display = 'none';
        }
    }
    
    /**
     * Update FPS calculation
     */
    updateFPS() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Calculate current FPS
        this.frameTime = deltaTime;
        const currentFPS = 1000 / deltaTime;
        
        // Add to history
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > this.fpsHistorySize) {
            this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        this.fps = sum / this.fpsHistory.length;
        
        // Get memory info if available
        if (window.performance && window.performance.memory) {
            this.memoryUsage = window.performance.memory.usedJSHeapSize / 1048576; // Convert to MB
        }
        
        // Check if we need to adjust quality
        this.checkPerformance();
        
        // Update debug overlay
        if (this.debugEnabled) {
            this.updateDebugOverlay();
        }
    }
    
    /**
     * Update debug overlay with current performance metrics
     */
    updateDebugOverlay() {
        if (!this.debugEnabled || !this.debugElement) return;
        
        // Find or create the stats container
        let statsContainer = this.debugElement.querySelector('#stats-container');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'stats-container';
            this.debugElement.insertBefore(statsContainer, this.debugElement.firstChild);
        }
        
        // Update statistics text
        statsContainer.innerHTML = `
            <div>FPS: <span style="color: ${this.getFpsColor()}">${this.fps.toFixed(1)}</span></div>
            <div>Frame Time: ${this.frameTime.toFixed(1)}ms</div>
            <div>Memory: ${this.memoryUsage.toFixed(1)}MB</div>
            <div>Quality: ${this.currentQualityLevel}</div>
            <div>Adaptive: ${this.adaptiveQualityEnabled ? 'ON' : 'OFF'}</div>
        `;
        
        // Update quality select if it exists
        const qualitySelect = this.debugElement.querySelector('#quality-select');
        if (qualitySelect && qualitySelect.value !== this.currentQualityLevel) {
            qualitySelect.value = this.currentQualityLevel;
        }
        
        // Update adaptive checkbox if it exists
        const adaptiveCheckbox = this.debugElement.querySelector('#adaptive-toggle');
        if (adaptiveCheckbox && adaptiveCheckbox.checked !== this.adaptiveQualityEnabled) {
            adaptiveCheckbox.checked = this.adaptiveQualityEnabled;
        }
        
        // Update graph if enabled
        this.updateGraph();
        
        // Schedule next update if not called by updateFPS
        if (this.debugEnabled && !this.fpsHistory.length) {
            requestAnimationFrame(() => this.updateDebugOverlay());
        }
    }
    
    /**
     * Get color for FPS display based on value
     * @returns {string} CSS color value
     */
    getFpsColor() {
        if (this.fps < this.criticalFpsThreshold) {
            return '#ff3333'; // Red for critical
        } else if (this.fps < this.lowFpsThreshold) {
            return '#ffcc33'; // Yellow for low
        } else {
            return '#33ff33'; // Green for good
        }
    }
    
    /**
     * Check performance and adjust quality if needed
     */
    checkPerformance() {
        if (!this.adaptiveQualityEnabled) return;
        
        const now = performance.now();
        if (now - this.lastQualityAdjustTime < this.qualityAdjustCooldown) {
            return; // Don't adjust too frequently
        }
        
        // Check for sustained low FPS
        if (this.fps < this.criticalFpsThreshold && this.currentQualityLevel !== 'low') {
            this.lastQualityAdjustTime = now;
            this.currentQualityLevel = 'low';
            this.applyQualitySettings();
            console.log('Performance critical - Reducing to low quality');
        } else if (this.fps < this.lowFpsThreshold && this.currentQualityLevel === 'high') {
            this.lastQualityAdjustTime = now;
            this.currentQualityLevel = 'medium';
            this.applyQualitySettings();
            console.log('Performance low - Reducing to medium quality');
        } else if (this.fps > this.targetFPS * 0.9 && this.currentQualityLevel === 'low') {
            // If we're running very well on low settings, try medium
            this.lastQualityAdjustTime = now;
            this.currentQualityLevel = 'medium';
            this.applyQualitySettings();
            console.log('Performance improved - Increasing to medium quality');
        } else if (this.fps > this.targetFPS * 0.95 && this.currentQualityLevel === 'medium') {
            // If we're running exceptionally well on medium, try high
            this.lastQualityAdjustTime = now;
            this.currentQualityLevel = 'high';
            this.applyQualitySettings();
            console.log('Performance excellent - Increasing to high quality');
        }
    }
    
    /**
     * Apply current quality settings to all renderers
     */
    applyQualitySettings() {
        // Update app's config
        this.app.config.devicePerformance = this.currentQualityLevel;
        
        // Apply to renderer
        if (this.app.renderer) {
            switch (this.currentQualityLevel) {
                case 'low':
                    this.app.renderer.setPixelRatio(Math.min(1.0, window.devicePixelRatio));
                    break;
                case 'medium':
                    this.app.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
                    break;
                case 'high':
                    this.app.renderer.setPixelRatio(window.devicePixelRatio);
                    break;
            }
        }
        
        // Apply to post-processing
        if (this.app.postProcessingManager) {
            this.app.postProcessingManager.setQualityLevel(this.currentQualityLevel);
        }
        
        // Apply to scene elements that support quality changes
        if (this.app.sceneManager) {
            this.app.sceneManager.setQualityLevel(this.currentQualityLevel);
        }
        
        if (this.app.blackHole) {
            this.app.blackHole.setQualityLevel(this.currentQualityLevel);
        }
        
        if (this.app.nebulaEffect) {
            this.app.nebulaEffect.setQualityLevel(this.currentQualityLevel);
        }
        
        if (this.app.particleSystem) {
            this.app.particleSystem.setQualityLevel(this.currentQualityLevel);
        }
    }
    
    /**
     * Toggle adaptive quality adjustment
     */
    toggleAdaptiveQuality(enabled) {
        this.adaptiveQualityEnabled = enabled;
        console.log(`Adaptive quality: ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Manually set quality level
     */
    setQualityLevel(level) {
        if (['low', 'medium', 'high'].includes(level)) {
            this.currentQualityLevel = level;
            this.applyQualitySettings();
            console.log(`Manually set quality to: ${level}`);
        }
    }
} 