import * as THREE from 'three';

/**
 * Utility class to generate noise textures for various effects
 */
export class NoiseTextureGenerator {
    /**
     * Generate a 3D noise texture
     * @param {number} size - Texture size (size x size)
     * @param {boolean} smooth - Whether to use smooth gradients
     * @returns {THREE.DataTexture} The generated noise texture
     */
    static generateNoiseTexture(size = 256, smooth = true) {
        // Create data array for the texture
        const data = new Uint8Array(size * size * 4);
        
        // Fill with noise
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = (i * size + j) * 4;
                
                // Generate noise value
                let noiseValue;
                
                if (smooth) {
                    // Smooth gradient noise
                    noiseValue = this.smoothNoise(i / size, j / size);
                } else {
                    // Random noise
                    noiseValue = Math.random();
                }
                
                // Convert to 0-255 range
                const value = Math.floor(noiseValue * 255);
                
                // Fill all channels with the same value for grayscale
                data[index] = value;
                data[index + 1] = value;
                data[index + 2] = value;
                data[index + 3] = 255; // Alpha - fully opaque
            }
        }
        
        // Create texture from data
        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.RepeatWrapping,
            THREE.RepeatWrapping,
            THREE.LinearFilter,
            THREE.LinearMipmapLinearFilter
        );
        
        // Ensure texture gets updated
        texture.needsUpdate = true;
        texture.generateMipmaps = true;
        
        return texture;
    }
    
    /**
     * Generate a cloud-like noise texture
     * @param {number} size - Texture size (size x size)
     * @returns {THREE.DataTexture} The generated cloud texture
     */
    static generateCloudTexture(size = 256) {
        // Create data array for the texture
        const data = new Uint8Array(size * size * 4);
        
        // Generate base noise
        const baseNoise = [];
        for (let i = 0; i < size; i++) {
            baseNoise[i] = [];
            for (let j = 0; j < size; j++) {
                baseNoise[i][j] = Math.random();
            }
        }
        
        // Apply multiple passes of smoothing for cloud-like effect
        const smoothedNoise = this.smoothNoiseArray(baseNoise, size, 3);
        
        // Apply fractal pattern for more natural clouds
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = (i * size + j) * 4;
                
                // Generate fractal cloud pattern
                let noiseValue = 0;
                let amplitude = 1.0;
                let frequency = 1.0;
                let maxValue = 0;
                
                // Add multiple octaves of noise
                for (let k = 0; k < 4; k++) {
                    const sampleX = (i * frequency) % size;
                    const sampleY = (j * frequency) % size;
                    const sampleI = Math.floor(sampleX);
                    const sampleJ = Math.floor(sampleY);
                    
                    // Sample from smoothed noise with bilinear interpolation
                    const value = this.bilinearSample(smoothedNoise, sampleI, sampleJ, size);
                    
                    noiseValue += value * amplitude;
                    maxValue += amplitude;
                    
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                
                // Normalize
                noiseValue /= maxValue;
                
                // Apply threshold and contrast
                noiseValue = Math.pow(noiseValue, 1.5); // Increase contrast
                
                // Convert to 0-255 range
                const value = Math.floor(noiseValue * 255);
                
                // Fill all channels with the same value for grayscale
                data[index] = value;
                data[index + 1] = value;
                data[index + 2] = value;
                data[index + 3] = value; // Alpha - based on density
            }
        }
        
        // Create texture from data
        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.RepeatWrapping,
            THREE.RepeatWrapping,
            THREE.LinearFilter,
            THREE.LinearMipmapLinearFilter
        );
        
        // Ensure texture gets updated
        texture.needsUpdate = true;
        texture.generateMipmaps = true;
        
        return texture;
    }
    
    /**
     * Generate a particle texture for nebula dust
     * @param {number} size - Texture size (size x size)
     * @returns {THREE.DataTexture} The generated particle texture
     */
    static generateParticleTexture(size = 64) {
        // Create data array for the texture
        const data = new Uint8Array(size * size * 4);
        
        // Calculate center and radius
        const center = size / 2;
        const radius = size / 2;
        
        // Fill with a soft circular gradient
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = (i * size + j) * 4;
                
                // Distance from center (0 to 1)
                const dx = (i - center) / radius;
                const dy = (j - center) / radius;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Soft falloff from center
                let alpha;
                if (distance > 1.0) {
                    alpha = 0;
                } else {
                    // Smooth falloff
                    alpha = 1.0 - Math.pow(distance, 2.0);
                }
                
                // Set color (white) and alpha
                data[index] = 255;
                data[index + 1] = 255;
                data[index + 2] = 255;
                data[index + 3] = Math.floor(alpha * 255);
            }
        }
        
        // Create texture from data
        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.LinearFilter,
            THREE.LinearFilter
        );
        
        // Ensure texture gets updated
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Helper method to generate smooth gradient noise
     * @private
     */
    static smoothNoise(x, y) {
        // Get integer and fractional parts
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = (x0 + 1);
        const y1 = (y0 + 1);
        
        // Get fractional parts
        const sx = x - x0;
        const sy = y - y0;
        
        // Smoothing function
        const smoothX = sx * sx * (3 - 2 * sx);
        const smoothY = sy * sy * (3 - 2 * sy);
        
        // Generate random values at corners
        const n00 = this.hash(x0, y0);
        const n01 = this.hash(x0, y1);
        const n10 = this.hash(x1, y0);
        const n11 = this.hash(x1, y1);
        
        // Bilinear interpolation
        const nx0 = this.lerp(n00, n10, smoothX);
        const nx1 = this.lerp(n01, n11, smoothX);
        
        return this.lerp(nx0, nx1, smoothY);
    }
    
    /**
     * Helper method to hash coordinates to a random value
     * @private
     */
    static hash(x, y) {
        return this.fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
    }
    
    /**
     * Helper method for fractional part
     * @private
     */
    static fract(x) {
        return x - Math.floor(x);
    }
    
    /**
     * Helper method for linear interpolation
     * @private
     */
    static lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    /**
     * Apply multiple smoothing passes to a noise array
     * @private
     */
    static smoothNoiseArray(noise, size, passes = 1) {
        let result = [...noise];
        
        for (let pass = 0; pass < passes; pass++) {
            const temp = [];
            
            // Initialize temp array
            for (let i = 0; i < size; i++) {
                temp[i] = [];
                for (let j = 0; j < size; j++) {
                    temp[i][j] = 0;
                }
            }
            
            // Apply box filter
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    let sum = 0;
                    let count = 0;
                    
                    // 3x3 kernel
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = (i + di + size) % size;
                            const nj = (j + dj + size) % size;
                            
                            sum += result[ni][nj];
                            count++;
                        }
                    }
                    
                    temp[i][j] = sum / count;
                }
            }
            
            result = temp;
        }
        
        return result;
    }
    
    /**
     * Bilinear sampling from a 2D array with wrapping
     * @private
     */
    static bilinearSample(array, x, y, size) {
        // Get integer and fractional parts
        const x0 = Math.floor(x) % size;
        const y0 = Math.floor(y) % size;
        const x1 = (x0 + 1) % size;
        const y1 = (y0 + 1) % size;
        
        // Get fractional parts
        const sx = x - Math.floor(x);
        const sy = y - Math.floor(y);
        
        // Bilinear interpolation
        const n00 = array[x0][y0];
        const n01 = array[x0][y1];
        const n10 = array[x1][y0];
        const n11 = array[x1][y1];
        
        const nx0 = this.lerp(n00, n10, sx);
        const nx1 = this.lerp(n01, n11, sx);
        
        return this.lerp(nx0, nx1, sy);
    }
} 