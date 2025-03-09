/**
 * Web Worker for physics calculations
 * Offloads heavy calculations from the main thread for better performance
 */

// Constants
const G = 6.67430e-11; // Gravitational constant
const c = 299792458; // Speed of light (m/s)

// State for simulation
let simulationState = {
    blackHoleData: {
        position: [0, 0, 0],
        mass: 1e30,
        schwarzschildRadius: 0
    },
    particleData: [],
    lastUpdateTime: 0,
    dt: 1/60
};

/**
 * Initialize the physics simulation
 * @param {Object} params - Initialization parameters
 */
function initSimulation(params) {
    // Set up simulation parameters
    simulationState.blackHoleData = params.blackHoleData || simulationState.blackHoleData;
    simulationState.blackHoleData.schwarzschildRadius = calculateSchwarzschildRadius(simulationState.blackHoleData.mass);
    simulationState.lastUpdateTime = performance.now();
    simulationState.dt = params.dt || 1/60;
    
    // If particles are provided, set them up
    if (params.particleData) {
        simulationState.particleData = params.particleData.map(p => ({
            position: [...p.position],
            velocity: [...p.velocity],
            mass: p.mass || 1,
            charge: p.charge || 0,
            id: p.id
        }));
    }
    
    // Send initialization confirmation
    self.postMessage({
        type: 'init_complete',
        data: {
            particleCount: simulationState.particleData.length,
            schwarzschildRadius: simulationState.blackHoleData.schwarzschildRadius
        }
    });
}

/**
 * Calculate the Schwarzschild radius for a given mass
 * @param {number} mass - Mass in kg
 * @returns {number} - Schwarzschild radius in meters
 */
function calculateSchwarzschildRadius(mass) {
    return (2 * G * mass) / (c * c);
}

/**
 * Update the physics simulation
 * @param {Object} params - Update parameters
 */
function updateSimulation(params) {
    // Update time step
    const now = performance.now();
    const dt = params.dt || simulationState.dt;
    
    // Update black hole if needed
    if (params.blackHoleData) {
        simulationState.blackHoleData = {
            ...simulationState.blackHoleData,
            ...params.blackHoleData
        };
    }
    
    // Update particles
    const updatedParticles = simulationState.particleData.map(particle => {
        // Calculate gravitational forces
        const updatedParticle = calculateGravitationalEffects(particle, simulationState.blackHoleData, dt);
        
        // Apply relativistic effects if close to black hole
        if (params.includeRelativity) {
            applyRelativisticEffects(updatedParticle, simulationState.blackHoleData);
        }
        
        return updatedParticle;
    });
    
    // Remove particles that crossed the event horizon
    const remainingParticles = updatedParticles.filter(particle => {
        const dx = particle.position[0] - simulationState.blackHoleData.position[0];
        const dy = particle.position[1] - simulationState.blackHoleData.position[1];
        const dz = particle.position[2] - simulationState.blackHoleData.position[2];
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Particle survives if outside the Schwarzschild radius
        return distance > simulationState.blackHoleData.schwarzschildRadius;
    });
    
    // Update simulation state
    simulationState.particleData = remainingParticles;
    simulationState.lastUpdateTime = now;
    
    // Return updated data
    self.postMessage({
        type: 'simulation_update',
        data: {
            particles: remainingParticles,
            capturedCount: updatedParticles.length - remainingParticles.length,
            time: now
        }
    });
}

/**
 * Calculate gravitational effects on a particle
 * @param {Object} particle - Particle to update
 * @param {Object} blackHole - Black hole data
 * @param {number} dt - Time step
 * @returns {Object} - Updated particle
 */
function calculateGravitationalEffects(particle, blackHole, dt) {
    // Clone particle to avoid mutations
    const updatedParticle = {
        ...particle,
        position: [...particle.position],
        velocity: [...particle.velocity]
    };
    
    // Calculate distance vector from particle to black hole
    const dx = blackHole.position[0] - particle.position[0];
    const dy = blackHole.position[1] - particle.position[1];
    const dz = blackHole.position[2] - particle.position[2];
    
    // Distance squared and magnitude
    const distSquared = dx*dx + dy*dy + dz*dz;
    const distance = Math.sqrt(distSquared);
    
    // Normalize direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;
    const dirZ = dz / distance;
    
    // Calculate gravitational force (F = G * m1 * m2 / r^2)
    // For simplicity, we'll calculate acceleration directly (a = F/m = G * m2 / r^2)
    const forceMagnitude = G * blackHole.mass / distSquared;
    
    // Calculate acceleration components
    const accX = forceMagnitude * dirX;
    const accY = forceMagnitude * dirY;
    const accZ = forceMagnitude * dirZ;
    
    // Update velocity (v = v0 + a*t)
    updatedParticle.velocity[0] += accX * dt;
    updatedParticle.velocity[1] += accY * dt;
    updatedParticle.velocity[2] += accZ * dt;
    
    // Update position (p = p0 + v*t)
    updatedParticle.position[0] += updatedParticle.velocity[0] * dt;
    updatedParticle.position[1] += updatedParticle.velocity[1] * dt;
    updatedParticle.position[2] += updatedParticle.velocity[2] * dt;
    
    return updatedParticle;
}

/**
 * Apply relativistic effects to particle motion
 * @param {Object} particle - Particle to update
 * @param {Object} blackHole - Black hole data
 */
function applyRelativisticEffects(particle, blackHole) {
    // Calculate distance to black hole
    const dx = blackHole.position[0] - particle.position[0];
    const dy = blackHole.position[1] - particle.position[1];
    const dz = blackHole.position[2] - particle.position[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Calculate relativistic factor (simplified)
    // In reality, relativistic effects are much more complex
    const r = distance;
    const rs = blackHole.schwarzschildRadius;
    
    // Time dilation factor (simplified approximation)
    // t_observed = t_proper * sqrt(1 - rs/r)
    if (r > rs) {
        const timeDilationFactor = Math.sqrt(1 - rs/r);
        
        // Apply time dilation to velocity
        particle.velocity[0] *= timeDilationFactor;
        particle.velocity[1] *= timeDilationFactor;
        particle.velocity[2] *= timeDilationFactor;
        
        // Store relativistic factor for visualization
        particle.relativisticFactor = timeDilationFactor;
    }
}

/**
 * Calculate gravitational lensing effects
 * @param {Array} rays - Array of light ray directions
 * @param {Object} blackHole - Black hole data
 * @returns {Array} - Deflected light ray directions
 */
function calculateGravitationalLensing(rays, blackHole) {
    return rays.map(ray => {
        // Calculate distance to black hole
        const dx = blackHole.position[0] - ray.origin[0];
        const dy = blackHole.position[1] - ray.origin[1];
        const dz = blackHole.position[2] - ray.origin[2];
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Skip rays too close to black hole
        if (distance <= blackHole.schwarzschildRadius * 1.1) {
            return {
                ...ray,
                intensity: 0 // Absorbed by black hole
            };
        }
        
        // Calculate impact parameter
        // This is a simplified model - real lensing is much more complex
        const impactParameter = calculateImpactParameter(ray, blackHole);
        
        // Calculate deflection angle (simplified)
        // In reality, this depends on general relativity equations
        const deflectionAngle = (2 * G * blackHole.mass) / (c * c * impactParameter);
        
        // Apply deflection to ray direction
        const updatedRay = applyDeflection(ray, blackHole, deflectionAngle);
        
        return updatedRay;
    });
}

/**
 * Calculate impact parameter for a light ray
 * @param {Object} ray - Light ray data
 * @param {Object} blackHole - Black hole data
 * @returns {number} - Impact parameter
 */
function calculateImpactParameter(ray, blackHole) {
    // Vector from black hole to ray origin
    const dx = ray.origin[0] - blackHole.position[0];
    const dy = ray.origin[1] - blackHole.position[1];
    const dz = ray.origin[2] - blackHole.position[2];
    
    // Ray direction (normalized)
    const dirX = ray.direction[0];
    const dirY = ray.direction[1];
    const dirZ = ray.direction[2];
    
    // Calculate dot product
    const dot = dx*dirX + dy*dirY + dz*dirZ;
    
    // Calculate square of the impact parameter
    const impactParamSquared = (dx*dx + dy*dy + dz*dz) - dot*dot;
    
    // Return impact parameter (always positive)
    return Math.sqrt(Math.max(0, impactParamSquared));
}

/**
 * Apply deflection to light ray
 * @param {Object} ray - Light ray data
 * @param {Object} blackHole - Black hole data
 * @param {number} angle - Deflection angle
 * @returns {Object} - Updated ray
 */
function applyDeflection(ray, blackHole, angle) {
    // This is a simplified model - real lensing is much more complex
    
    // Vector from black hole to ray origin
    const dx = ray.origin[0] - blackHole.position[0];
    const dy = ray.origin[1] - blackHole.position[1];
    const dz = ray.origin[2] - blackHole.position[2];
    
    // Normalize
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    const normalizedDz = dz / distance;
    
    // Cross product with ray direction to find rotation axis
    const dirX = ray.direction[0];
    const dirY = ray.direction[1];
    const dirZ = ray.direction[2];
    
    const axisX = dirY * normalizedDz - dirZ * normalizedDy;
    const axisY = dirZ * normalizedDx - dirX * normalizedDz;
    const axisZ = dirX * normalizedDy - dirY * normalizedDx;
    
    // Normalize rotation axis
    const axisLength = Math.sqrt(axisX*axisX + axisY*axisY + axisZ*axisZ);
    
    // Check if rotation axis is valid (not zero length)
    if (axisLength < 1e-10) {
        return ray; // No deflection needed
    }
    
    const normAxisX = axisX / axisLength;
    const normAxisY = axisY / axisLength;
    const normAxisZ = axisZ / axisLength;
    
    // Apply rotation around this axis by the deflection angle
    // This uses the Rodrigues rotation formula
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const oneMinusCos = 1 - cosAngle;
    
    // Rodrigues rotation formula
    const newDirX = dirX * cosAngle + 
                   (normAxisY * dirZ - normAxisZ * dirY) * sinAngle + 
                   normAxisX * (normAxisX * dirX + normAxisY * dirY + normAxisZ * dirZ) * oneMinusCos;
                   
    const newDirY = dirY * cosAngle + 
                   (normAxisZ * dirX - normAxisX * dirZ) * sinAngle + 
                   normAxisY * (normAxisX * dirX + normAxisY * dirY + normAxisZ * dirZ) * oneMinusCos;
                   
    const newDirZ = dirZ * cosAngle + 
                   (normAxisX * dirY - normAxisY * dirX) * sinAngle + 
                   normAxisZ * (normAxisX * dirX + normAxisY * dirY + normAxisZ * dirZ) * oneMinusCos;
    
    // Calculate intensity reduction (simplified)
    // In reality, lensing can also increase intensity through focusing
    const distanceRatio = Math.max(1.1, distance / blackHole.schwarzschildRadius);
    const intensityFactor = Math.min(1, 1 / (1 + 1/distanceRatio));
    
    return {
        ...ray,
        direction: [newDirX, newDirY, newDirZ],
        intensity: ray.intensity * intensityFactor
    };
}

/**
 * Add new particles to the simulation
 * @param {Array} newParticles - Array of particles to add
 */
function addParticles(newParticles) {
    if (Array.isArray(newParticles)) {
        simulationState.particleData = [
            ...simulationState.particleData,
            ...newParticles.map(p => ({
                position: [...p.position],
                velocity: [...p.velocity],
                mass: p.mass || 1,
                charge: p.charge || 0,
                id: p.id
            }))
        ];
        
        self.postMessage({
            type: 'particles_added',
            data: {
                count: newParticles.length,
                totalCount: simulationState.particleData.length
            }
        });
    }
}

/**
 * Clear all particles from the simulation
 */
function clearParticles() {
    const previousCount = simulationState.particleData.length;
    simulationState.particleData = [];
    
    self.postMessage({
        type: 'particles_cleared',
        data: {
            previousCount
        }
    });
}

/**
 * Handle messages from main thread
 */
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'init':
            initSimulation(data);
            break;
            
        case 'update':
            updateSimulation(data);
            break;
            
        case 'add_particles':
            addParticles(data.particles);
            break;
            
        case 'clear_particles':
            clearParticles();
            break;
            
        case 'calculate_lensing':
            const lensedRays = calculateGravitationalLensing(data.rays, data.blackHole);
            self.postMessage({
                type: 'lensing_result',
                data: {
                    rays: lensedRays
                }
            });
            break;
            
        default:
            console.warn(`Unknown message type: ${type}`);
    }
}; 