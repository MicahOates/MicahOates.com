/**
 * WebGLContextManager
 * Manages WebGL context loss and restoration events with intelligent recovery
 */
export class WebGLContextManager {
    constructor(app) {
        this.app = app;
        this.canvas = app.canvas;
        this.renderer = null;
        
        // Context state
        this.isContextLost = false;
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        this.initialized = false;
        
        // Callbacks
        this.onContextLost = this.onContextLost.bind(this);
        this.onContextRestored = this.onContextRestored.bind(this);
        this.checkContextHealth = this.checkContextHealth.bind(this);
        
        // Recovery timeouts
        this.recoveryTimeout = null;
        this.healthCheckInterval = null;
        
        // Initialize if canvas exists
        if (this.canvas) {
            this.init();
        }
    }
    
    /**
     * Initialize the context manager
     */
    init() {
        if (this.initialized) return;
        
        // Register event listeners for context events
        this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);
        this.canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
        
        // Start health check interval
        this.startHealthCheck();
        
        this.initialized = true;
        console.log('WebGLContextManager: Initialized');
    }
    
    /**
     * Set the renderer reference
     * @param {THREE.WebGLRenderer} renderer - The Three.js WebGLRenderer instance
     */
    setRenderer(renderer) {
        this.renderer = renderer;
    }
    
    /**
     * Handle WebGL context loss
     * @param {Event} event - The context loss event
     */
    onContextLost(event) {
        event.preventDefault();
        
        this.isContextLost = true;
        this.recoveryAttempts = 0;
        console.warn('WebGLContextManager: WebGL context lost');
        
        // Show user message if available
        this.showContextLossMessage();
        
        // Clear any existing recovery timeout
        if (this.recoveryTimeout) {
            clearTimeout(this.recoveryTimeout);
        }
        
        // Attempt recovery
        this.scheduleRecovery();
        
        // Notify the app
        if (this.app && this.app.onWebGLContextLost) {
            this.app.onWebGLContextLost();
        }
    }
    
    /**
     * Handle WebGL context restoration
     * @param {Event} event - The context restored event
     */
    onContextRestored(event) {
        this.isContextLost = false;
        console.log('WebGLContextManager: WebGL context restored');
        
        // Hide context loss message
        this.hideContextLossMessage();
        
        // Clear recovery timeout
        if (this.recoveryTimeout) {
            clearTimeout(this.recoveryTimeout);
            this.recoveryTimeout = null;
        }
        
        // Recreate renderer and resources
        if (this.app && this.app.onWebGLContextRestored) {
            // Allow time for the context to be fully restored
            setTimeout(() => {
                this.app.onWebGLContextRestored();
            }, 100);
        }
    }
    
    /**
     * Schedule recovery attempt with exponential backoff
     */
    scheduleRecovery() {
        // Determine backoff time based on attempts (500ms, 1s, 2s, 4s, etc.)
        const backoffTime = Math.min(30000, 500 * Math.pow(2, this.recoveryAttempts));
        
        console.log(`WebGLContextManager: Scheduling recovery attempt in ${backoffTime}ms`);
        
        this.recoveryTimeout = setTimeout(() => {
            this.attemptRecovery();
        }, backoffTime);
    }
    
    /**
     * Attempt to recover the WebGL context
     */
    attemptRecovery() {
        if (!this.isContextLost) return;
        
        this.recoveryAttempts++;
        console.log(`WebGLContextManager: Recovery attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`);
        
        try {
            // Try to trigger context restoration
            if (this.canvas) {
                // Force a new context in some browsers
                const contextAttributes = {
                    powerPreference: 'high-performance',
                    antialias: false,
                    alpha: true,
                    depth: true,
                    stencil: false,
                    desynchronized: false,
                    failIfMajorPerformanceCaveat: false
                };
                
                const gl = this.canvas.getContext('webgl', contextAttributes) ||
                           this.canvas.getContext('experimental-webgl', contextAttributes);
                
                if (gl) {
                    // Try to draw something basic to test the context
                    gl.clearColor(0.0, 0.0, 0.0, 1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    
                    // Context seems to be working
                    if (!this.isContextLost) {
                        console.log('WebGLContextManager: Context recovered manually');
                        this.onContextRestored({});
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('WebGLContextManager: Recovery attempt failed', error);
        }
        
        // If we've reached max attempts, suggest page reload
        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
            console.warn('WebGLContextManager: Max recovery attempts reached');
            this.showMaxAttemptsMessage();
        } else {
            // Schedule another attempt
            this.scheduleRecovery();
        }
    }
    
    /**
     * Start periodic health checks of the WebGL context
     */
    startHealthCheck() {
        // Check context health every 10 seconds
        this.healthCheckInterval = setInterval(this.checkContextHealth, 10000);
    }
    
    /**
     * Check the health of the WebGL context
     */
    checkContextHealth() {
        if (this.isContextLost || !this.renderer) return;
        
        try {
            // Try to access the WebGL context
            const gl = this.renderer.getContext();
            
            // Simple check: try to read a pixel
            if (gl) {
                const pixels = new Uint8Array(4);
                try {
                    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                    // If readPixels didn't throw an error, context is healthy
                } catch (e) {
                    console.warn('WebGLContextManager: Context health check failed', e);
                    this.onContextLost({ preventDefault: () => {} });
                }
            }
        } catch (error) {
            // Any error likely means context is lost
            console.warn('WebGLContextManager: Context health check error', error);
            this.onContextLost({ preventDefault: () => {} });
        }
    }
    
    /**
     * Show a user-friendly message when context is lost
     */
    showContextLossMessage() {
        // Remove existing message if present
        this.hideContextLossMessage();
        
        // Create and show new message
        const message = document.createElement('div');
        message.id = 'webgl-context-loss-message';
        message.style.position = 'absolute';
        message.style.top = '10px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        message.style.color = 'white';
        message.style.padding = '10px 20px';
        message.style.borderRadius = '5px';
        message.style.fontFamily = 'Arial, sans-serif';
        message.style.zIndex = '10000';
        message.style.textAlign = 'center';
        message.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        message.style.backdropFilter = 'blur(4px)';
        message.style.border = '1px solid #555';
        message.style.maxWidth = '400px';
        
        message.innerHTML = `
            <div style="margin-bottom: 8px; color: #ff4466; font-weight: bold;">Graphics Temporarily Unavailable</div>
            <div style="font-size: 14px; margin-bottom: 8px;">Attempting to recover... This may take a few seconds.</div>
            <div style="font-size: 12px; opacity: 0.8;">If the issue persists, try refreshing the page.</div>
        `;
        
        document.body.appendChild(message);
    }
    
    /**
     * Hide the context loss message
     */
    hideContextLossMessage() {
        const message = document.getElementById('webgl-context-loss-message');
        if (message && message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }
    
    /**
     * Show message when max recovery attempts are reached
     */
    showMaxAttemptsMessage() {
        // Update or create message
        this.hideContextLossMessage();
        
        const message = document.createElement('div');
        message.id = 'webgl-context-loss-message';
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        message.style.color = 'white';
        message.style.padding = '20px';
        message.style.borderRadius = '5px';
        message.style.fontFamily = 'Arial, sans-serif';
        message.style.zIndex = '10000';
        message.style.textAlign = 'center';
        message.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
        message.style.backdropFilter = 'blur(8px)';
        message.style.border = '1px solid #555';
        message.style.maxWidth = '500px';
        
        message.innerHTML = `
            <div style="margin-bottom: 15px; color: #ff4466; font-weight: bold; font-size: 18px;">Graphics Recovery Failed</div>
            <div style="font-size: 14px; margin-bottom: 15px; line-height: 1.5;">
                We've been unable to restore the graphics context after multiple attempts. 
                This is typically caused by a driver issue or system resource constraints.
            </div>
            <div style="margin-bottom: 20px; font-size: 14px;">
                <strong>Recommended actions:</strong>
                <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                    <li>Refresh the page</li>
                    <li>Close other browser tabs or applications</li>
                    <li>Update your graphics drivers</li>
                    <li>Try a different browser</li>
                </ul>
            </div>
            <button id="webgl-reload-button" style="background: #44aaff; border: none; color: white; padding: 8px 16px; 
                    border-radius: 4px; cursor: pointer; font-family: inherit;">Reload Page</button>
        `;
        
        document.body.appendChild(message);
        
        // Add reload button event
        const reloadButton = document.getElementById('webgl-reload-button');
        if (reloadButton) {
            reloadButton.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }
    
    /**
     * Force a context reset (useful when application detects problems)
     */
    forceContextReset() {
        console.log('WebGLContextManager: Forcing context reset');
        
        if (this.renderer && this.renderer.getContext()) {
            const gl = this.renderer.getContext();
            
            // Use the WEBGL_lose_context extension to forcibly lose the context
            const extension = gl.getExtension('WEBGL_lose_context');
            if (extension) {
                extension.loseContext();
                
                // Schedule restoration after a delay
                setTimeout(() => {
                    if (this.isContextLost && extension) {
                        extension.restoreContext();
                    }
                }, 1000);
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Clean up event listeners and intervals
     */
    dispose() {
        // Remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
            this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
        }
        
        // Clear intervals and timeouts
        if (this.recoveryTimeout) {
            clearTimeout(this.recoveryTimeout);
            this.recoveryTimeout = null;
        }
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        // Hide any messages
        this.hideContextLossMessage();
        
        this.initialized = false;
        console.log('WebGLContextManager: Disposed');
    }
} 