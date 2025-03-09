import * as THREE from 'three';

/**
 * Performance monitor to track FPS and adjust quality settings dynamically
 */
export class PerformanceMonitor {
    constructor(app) {
        this.app = app;
        
        // Keep track of FPS
        this.fpsValues = [];
        this.frameTimes = [];
        this.maxFrameValues = 60; // Store the last 60 frames (about 1 second)
        this.previousTime = 0;
        
        // Performance thresholds
        this.thresholds = {
            highFPS: 55,  // Above this is considered high performance
            mediumFPS: 40, // Between this and highFPS is medium performance
            lowFPS: 25     // Below this is considered low performance
        };
        
        // Current quality level (low, medium, high)
        this.currentQuality = this.app.config.devicePerformance;
        
        // Adjustment settings
        this.settings = {
            enabled: true,
            measurementInterval: 2000, // Check performance every 2 seconds
            stabilizationTime: 5000,   // Wait 5 seconds before first adjustment
            adjustmentCooldown: 10000  // Wait 10 seconds between adjustments
        };
        
        // Performance monitoring state
        this.state = {
            isMonitoring: false,
            lastAdjustmentTime: 0,
            startTime: 0,
            memoryUsage: {
                jsHeapSizeLimit: 0,
                totalJSHeapSize: 0,
                usedJSHeapSize: 0
            }
        };
        
        // Available performance-related settings to adjust
        this.qualitySettings = {
            low: {
                particleDensity: 0.3,
                bloom: {
                    strength: 0.6,
                    radius: 0.5,
                    threshold: 0.3
                },
                filmGrain: {
                    intensity: 0.02
                },
                colorCorrection: {
                    noiseIntensity: 0.01,
                    chromaticAberration: 0.001
                }
            },
            medium: {
                particleDensity: 0.7,
                bloom: {
                    strength: 0.8,
                    radius: 0.7,
                    threshold: 0.2
                },
                filmGrain: {
                    intensity: 0.03
                },
                colorCorrection: {
                    noiseIntensity: 0.02,
                    chromaticAberration: 0.002
                }
            },
            high: {
                particleDensity: 1.0,
                bloom: {
                    strength: 1.0,
                    radius: 0.75,
                    threshold: 0.15
                },
                filmGrain: {
                    intensity: 0.05
                },
                colorCorrection: {
                    noiseIntensity: 0.03,
                    chromaticAberration: 0.003
                }
            }
        };
    }
    
    /**
     * Start performance monitoring
     */
    start() {
        if (this.settings.enabled) {
            this.state.isMonitoring = true;
            this.state.startTime = performance.now();
            this.state.lastAdjustmentTime = performance.now();
            
            // Start the measurement interval
            this.monitoringInterval = setInterval(() => {
                this.checkPerformance();
            }, this.settings.measurementInterval);
            
            console.log('Performance monitoring started');
        }
    }
    
    /**
     * Stop performance monitoring
     */
    stop() {
        this.state.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        console.log('Performance monitoring stopped');
    }
    
    /**
     * Update FPS counter
     */
    updateFPS() {
        if (!this.state.isMonitoring) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.previousTime;
        
        if (this.previousTime > 0) {
            // Calculate FPS
            const currentFPS = 1000 / elapsed;
            
            // Store frame time
            this.frameTimes.push(elapsed);
            this.fpsValues.push(currentFPS);
            
            // Keep only the last n values
            if (this.fpsValues.length > this.maxFrameValues) {
                this.fpsValues.shift();
                this.frameTimes.shift();
            }
        }
        
        this.previousTime = currentTime;
    }
    
    /**
     * Get average FPS
     */
    getAverageFPS() {
        if (this.fpsValues.length === 0) return 60; // Default to 60 if no data yet
        
        const sum = this.fpsValues.reduce((a, b) => a + b, 0);
        return sum / this.fpsValues.length;
    }
    
    /**
     * Get average frame time in milliseconds
     */
    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 16.66; // Default to 16.66ms (60 FPS) if no data yet
        
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }
    
    /**
     * Get memory usage if available
     */
    getMemoryUsage() {
        // Check if performance.memory is available (Chrome only)
        if (performance && performance.memory) {
            this.state.memoryUsage = {
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize
            };
        }
        
        return this.state.memoryUsage;
    }
    
    /**
     * Check if performance is good enough for given quality level
     */
    checkPerformance() {
        // Get current performance metrics
        const avgFPS = this.getAverageFPS();
        const avgFrameTime = this.getAverageFrameTime();
        const memoryUsage = this.getMemoryUsage();
        
        console.log(`Performance: ${avgFPS.toFixed(1)} FPS, ${avgFrameTime.toFixed(1)}ms/frame`);
        
        // Wait for stabilization period before first adjustment
        const currentTime = performance.now();
        if (currentTime - this.state.startTime < this.settings.stabilizationTime) {
            return;
        }
        
        // Check if we should adjust quality based on cooldown
        if (currentTime - this.state.lastAdjustmentTime < this.settings.adjustmentCooldown) {
            return;
        }
        
        // Determine if we need to adjust quality
        let newQuality = this.currentQuality;
        
        if (avgFPS < this.thresholds.lowFPS) {
            // Performance is poor, lower quality
            newQuality = 'low';
        } else if (avgFPS < this.thresholds.mediumFPS) {
            // Performance is okay, use medium quality
            newQuality = 'medium';
        } else if (avgFPS > this.thresholds.highFPS) {
            // Performance is good, can use high quality
            newQuality = 'high';
        }
        
        // Only change if needed
        if (newQuality !== this.currentQuality) {
            this.adjustQuality(newQuality);
            this.state.lastAdjustmentTime = currentTime;
        }
    }
    
    /**
     * Adjust quality based on detected performance level
     */
    adjustQuality(qualityLevel) {
        console.log(`Adjusting quality to: ${qualityLevel}`);
        
        // Update app config
        this.app.config.devicePerformance = qualityLevel;
        this.currentQuality = qualityLevel;
        
        // Get settings for this quality level
        const settings = this.qualitySettings[qualityLevel];
        
        // Apply post-processing settings
        if (this.app.postProcessingManager) {
            this.app.postProcessingManager.setBloomParams(settings.bloom);
            this.app.postProcessingManager.setFilmGrain(settings.filmGrain);
            this.app.postProcessingManager.setColorCorrection(settings.colorCorrection);
        }
        
        // Don't recreate particle systems, as that would be disruptive
        // Just adjust their properties
        // For a real implementation, we would need custom methods for each
        // component to adjust without full recreation
        
        // Event for other systems
        this.onQualityChanged(qualityLevel);
    }
    
    /**
     * Quality change event for other systems to listen to
     */
    onQualityChanged(newQualityLevel) {
        // This would typically dispatch an event or call quality adjustment
        // methods on various components
        console.log(`Quality level changed to ${newQualityLevel}`);
        
        // Here we could implement custom behavior for different components
        // based on quality level
    }
    
    /**
     * Manually set quality level
     */
    setQualityLevel(level) {
        if (['low', 'medium', 'high'].includes(level)) {
            this.adjustQuality(level);
        } else {
            console.error(`Invalid quality level: ${level}`);
        }
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        this.stop();
        this.fpsValues = [];
        this.frameTimes = [];
    }
} 