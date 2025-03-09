/**
 * Physics Controller
 * Manages interactions with the physics web worker, providing a clean API
 * for the main thread to interact with simulated physics
 */
export class PhysicsController {
    constructor(app) {
        this.app = app;
        this.worker = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        // Callbacks for worker messages
        this.callbacks = {
            simulationUpdate: null,
            lensingResult: null
        };
        
        // Default simulation parameters
        this.params = {
            blackHoleData: {
                position: [0, 0, 0],
                mass: 1e30
            },
            particleData: [],
            dt: 1/60,
            includeRelativity: true
        };
        
        // Particle counter for unique IDs
        this.particleIdCounter = 0;
        
        // Performance tracking
        this.lastUpdateTime = 0;
        this.updateInterval = 16; // ms (approximately 60fps)
        this.updateCount = 0;
    }
    
    /**
     * Initialize the physics controller and worker
     */
    init() {
        if (this.isInitialized) {
            console.warn('Physics controller already initialized');
            return;
        }
        
        try {
            // Create web worker
            this.worker = new Worker('js/src/workers/PhysicsWorker.js');
            
            // Set up message handler
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
            
            // Initialize the worker with default params
            this.worker.postMessage({
                type: 'init',
                data: this.params
            });
            
            // Set error handler
            this.worker.onerror = (error) => {
                console.error('Physics worker error:', error);
                this.handleWorkerError(error);
            };
            
            this.isInitialized = true;
            console.log('Physics controller initialized');
        } catch (error) {
            console.error('Failed to initialize physics worker:', error);
            this.handleWorkerInitFailure();
        }
    }
    
    /**
     * Handle worker messages
     * @param {MessageEvent} event - Worker message event
     */
    handleWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'init_complete':
                console.log(`Physics simulation initialized with ${data.particleCount} particles`);
                console.log(`Black hole Schwarzschild radius: ${data.schwarzschildRadius}`);
                this.isRunning = true;
                break;
                
            case 'simulation_update':
                // Update particle positions in the main thread
                if (this.callbacks.simulationUpdate) {
                    this.callbacks.simulationUpdate(data);
                }
                this.updateCount++;
                break;
                
            case 'particles_added':
                console.log(`Added ${data.count} particles. Total: ${data.totalCount}`);
                break;
                
            case 'particles_cleared':
                console.log(`Cleared ${data.previousCount} particles`);
                break;
                
            case 'lensing_result':
                if (this.callbacks.lensingResult) {
                    this.callbacks.lensingResult(data.rays);
                }
                break;
                
            default:
                console.warn(`Unknown message type from physics worker: ${type}`);
        }
    }
    
    /**
     * Handle worker initialization failure
     */
    handleWorkerInitFailure() {
        console.log('Falling back to main thread physics simulation...');
        
        // Create a dummy simulation object that will run on main thread
        this.isRunning = true;
        this.useFallback = true;
        
        // We'll still provide the same API but implement it in the main thread
    }
    
    /**
     * Handle worker error
     * @param {Error} error - Worker error
     */
    handleWorkerError(error) {
        console.error('Physics worker encountered an error. Attempting recovery...');
        
        // Try to restart the worker
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        // Reinitialize after a short delay
        setTimeout(() => {
            this.isInitialized = false;
            this.init();
        }, 1000);
    }
    
    /**
     * Start the physics simulation
     */
    start() {
        if (!this.isInitialized) {
            console.warn('Physics controller not initialized. Call init() first.');
            return;
        }
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        
        // Start the update loop
        this.update();
    }
    
    /**
     * Stop the physics simulation
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * Update the physics simulation
     */
    update() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastUpdateTime;
        
        // Only send update to worker if enough time has passed
        if (elapsed >= this.updateInterval) {
            this.lastUpdateTime = currentTime;
            
            // Update the worker
            if (this.worker && !this.useFallback) {
                this.worker.postMessage({
                    type: 'update',
                    data: {
                        dt: elapsed / 1000, // Convert to seconds
                        blackHoleData: this.params.blackHoleData,
                        includeRelativity: this.params.includeRelativity
                    }
                });
            } else if (this.useFallback) {
                // Call the fallback physics implementation
                this.updateFallbackPhysics(elapsed / 1000);
            }
        }
        
        // Schedule next update if running
        if (this.isRunning) {
            requestAnimationFrame(() => this.update());
        }
    }
    
    /**
     * Update physics on main thread (fallback mode)
     * @param {number} dt - Time step in seconds
     */
    updateFallbackPhysics(dt) {
        // Simplified physics for fallback mode
        // This will run on the main thread and is much less sophisticated
        
        // Grab a local copy to avoid modifying the array while iterating
        const particles = [...this.params.particleData];
        const blackHole = this.params.blackHoleData;
        
        // Update each particle
        const updatedParticles = particles.map(particle => {
            // Simplified gravitational effect
            const dx = blackHole.position[0] - particle.position[0];
            const dy = blackHole.position[1] - particle.position[1];
            const dz = blackHole.position[2] - particle.position[2];
            
            const distSquared = dx*dx + dy*dy + dz*dz;
            const distance = Math.sqrt(distSquared);
            
            // Skip very distant particles for performance
            if (distance > 100) {
                return particle;
            }
            
            // Normalize
            const dirX = dx / distance;
            const dirY = dy / distance;
            const dirZ = dz / distance;
            
            // Very simplified gravity
            const force = 10 / distSquared;
            
            // Clone particle to avoid mutations
            const updatedParticle = {
                ...particle,
                position: [...particle.position],
                velocity: [...particle.velocity]
            };
            
            // Update velocity
            updatedParticle.velocity[0] += dirX * force * dt;
            updatedParticle.velocity[1] += dirY * force * dt;
            updatedParticle.velocity[2] += dirZ * force * dt;
            
            // Update position
            updatedParticle.position[0] += updatedParticle.velocity[0] * dt;
            updatedParticle.position[1] += updatedParticle.velocity[1] * dt;
            updatedParticle.position[2] += updatedParticle.velocity[2] * dt;
            
            return updatedParticle;
        });
        
        // Remove particles that get too close to black hole
        const remainingParticles = updatedParticles.filter(particle => {
            const dx = blackHole.position[0] - particle.position[0];
            const dy = blackHole.position[1] - particle.position[1];
            const dz = blackHole.position[2] - particle.position[2];
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Approximate event horizon
            return distance > 2.0;
        });
        
        // Update internal state
        this.params.particleData = remainingParticles;
        
        // Call update callback
        if (this.callbacks.simulationUpdate) {
            this.callbacks.simulationUpdate({
                particles: remainingParticles,
                capturedCount: updatedParticles.length - remainingParticles.length,
                time: performance.now()
            });
        }
    }
    
    /**
     * Set the simulation parameters
     * @param {Object} params - Simulation parameters
     */
    setParameters(params) {
        // Update local parameters
        this.params = {
            ...this.params,
            ...params
        };
        
        // If black hole parameters changed, update the worker
        if (params.blackHoleData && this.worker && this.isInitialized) {
            this.worker.postMessage({
                type: 'update',
                data: {
                    blackHoleData: params.blackHoleData
                }
            });
        }
    }
    
    /**
     * Add particles to the simulation
     * @param {Array|Object} particles - Particle or array of particles to add
     */
    addParticles(particles) {
        // Convert single particle to array
        const particleArray = Array.isArray(particles) ? particles : [particles];
        
        // Assign IDs to particles
        const particlesWithIds = particleArray.map(p => ({
            ...p,
            id: p.id || `p${this.particleIdCounter++}`
        }));
        
        // Add to local state
        this.params.particleData = [
            ...this.params.particleData,
            ...particlesWithIds
        ];
        
        // Send to worker
        if (this.worker && this.isInitialized && !this.useFallback) {
            this.worker.postMessage({
                type: 'add_particles',
                data: {
                    particles: particlesWithIds
                }
            });
        }
        
        return particlesWithIds;
    }
    
    /**
     * Clear all particles from the simulation
     */
    clearParticles() {
        // Clear local state
        this.params.particleData = [];
        
        // Send to worker
        if (this.worker && this.isInitialized && !this.useFallback) {
            this.worker.postMessage({
                type: 'clear_particles'
            });
        }
    }
    
    /**
     * Calculate gravitational lensing effects
     * @param {Array} rays - Array of light rays
     * @param {Function} callback - Callback function for results
     */
    calculateLensing(rays, callback) {
        this.callbacks.lensingResult = callback;
        
        if (this.worker && this.isInitialized && !this.useFallback) {
            this.worker.postMessage({
                type: 'calculate_lensing',
                data: {
                    rays,
                    blackHole: this.params.blackHoleData
                }
            });
        } else {
            // Fallback lensing calculation (simplified)
            const lensedRays = this.calculateFallbackLensing(rays);
            
            // Simulate async for consistent API
            setTimeout(() => {
                if (callback) callback(lensedRays);
            }, 0);
        }
    }
    
    /**
     * Calculate lensing on main thread (fallback)
     * @param {Array} rays - Array of light rays
     * @returns {Array} - Lensed rays
     */
    calculateFallbackLensing(rays) {
        // This is a very simplified model for fallbacks
        return rays.map(ray => {
            // Calculate distance to black hole
            const blackHole = this.params.blackHoleData;
            const dx = blackHole.position[0] - ray.origin[0];
            const dy = blackHole.position[1] - ray.origin[1];
            const dz = blackHole.position[2] - ray.origin[2];
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Skip rays too close to black hole
            if (distance < 2.0) {
                return {
                    ...ray,
                    intensity: 0
                };
            }
            
            // Simple deflection model
            const deflectionFactor = 1.0 / Math.max(1.0, distance);
            const newDir = [
                ray.direction[0] + dx * deflectionFactor * 0.1,
                ray.direction[1] + dy * deflectionFactor * 0.1,
                ray.direction[2] + dz * deflectionFactor * 0.1
            ];
            
            // Normalize direction
            const dirLength = Math.sqrt(newDir[0]*newDir[0] + newDir[1]*newDir[1] + newDir[2]*newDir[2]);
            
            return {
                ...ray,
                direction: [
                    newDir[0] / dirLength,
                    newDir[1] / dirLength,
                    newDir[2] / dirLength
                ],
                intensity: ray.intensity * (1.0 - deflectionFactor * 0.5)
            };
        });
    }
    
    /**
     * Set callback for simulation updates
     * @param {Function} callback - Update callback function
     */
    onUpdate(callback) {
        this.callbacks.simulationUpdate = callback;
    }
    
    /**
     * Get performance metrics
     * @returns {Object} - Performance metrics object
     */
    getPerformanceMetrics() {
        return {
            updateCount: this.updateCount,
            particleCount: this.params.particleData.length,
            usingWorker: !this.useFallback,
            isRunning: this.isRunning
        };
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        // Stop the simulation
        this.stop();
        
        // Terminate the worker
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        // Clear all callbacks
        this.callbacks = {
            simulationUpdate: null,
            lensingResult: null
        };
        
        // Reset state
        this.isInitialized = false;
        this.isRunning = false;
        
        console.log('Physics controller disposed');
    }
} 