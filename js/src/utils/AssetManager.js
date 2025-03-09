import * as THREE from 'three';

/**
 * Asset Manager for efficient resource loading and management
 * Provides centralized control over textures, models, and other assets
 */
export class AssetManager {
    constructor(app) {
        this.app = app;
        
        // Loaders
        this.textureLoader = new THREE.TextureLoader();
        this.cubeTextureLoader = new THREE.CubeTextureLoader();
        
        // Asset caches
        this.textures = new Map();
        this.cubemaps = new Map();
        this.models = new Map();
        this.shaders = new Map();
        this.fonts = new Map();
        
        // Loading state
        this.loadingQueue = [];
        this.loadingCount = 0;
        this.loadingTotal = 0;
        this.loadingProgress = 0;
        this.loadingCompleted = 0;
        
        // Loading UI elements
        this.loadingOverlay = null;
        this.progressBar = null;
        this.progressText = null;
    }
    
    /**
     * Initialize the asset manager
     */
    init() {
        // Create loading UI if it doesn't exist
        this.createLoadingUI();
        
        // Set default texture options
        this.textureLoader.crossOrigin = 'anonymous';
        this.cubeTextureLoader.crossOrigin = 'anonymous';
        
        // Add event listeners for context lost/restored events
        if (this.app.renderer && this.app.renderer.domElement) {
            this.app.renderer.domElement.addEventListener('webglcontextlost', () => {
                console.warn('WebGL context lost - textures may need to be reloaded');
            });
            
            this.app.renderer.domElement.addEventListener('webglcontextrestored', () => {
                console.log('WebGL context restored - reloading textures');
                this.reloadTextures();
            });
        }
    }
    
    /**
     * Create loading UI overlay
     */
    createLoadingUI() {
        // Create loading overlay if not exists
        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'loading-overlay';
            this.loadingOverlay.style.position = 'fixed';
            this.loadingOverlay.style.top = '0';
            this.loadingOverlay.style.left = '0';
            this.loadingOverlay.style.width = '100%';
            this.loadingOverlay.style.height = '100%';
            this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            this.loadingOverlay.style.display = 'flex';
            this.loadingOverlay.style.flexDirection = 'column';
            this.loadingOverlay.style.alignItems = 'center';
            this.loadingOverlay.style.justifyContent = 'center';
            this.loadingOverlay.style.zIndex = '10000';
            this.loadingOverlay.style.opacity = '0';
            this.loadingOverlay.style.transition = 'opacity 0.5s ease';
            
            // Create loading content container
            const loadingContent = document.createElement('div');
            loadingContent.style.textAlign = 'center';
            
            // Create loading title
            const loadingTitle = document.createElement('h2');
            loadingTitle.textContent = 'Loading Assets';
            loadingTitle.style.color = '#ffffff';
            loadingTitle.style.fontFamily = "'Orbitron', sans-serif";
            loadingTitle.style.fontSize = '24px';
            loadingTitle.style.marginBottom = '20px';
            
            // Create progress container
            const progressContainer = document.createElement('div');
            progressContainer.style.width = '300px';
            progressContainer.style.height = '4px';
            progressContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            progressContainer.style.borderRadius = '2px';
            progressContainer.style.overflow = 'hidden';
            progressContainer.style.marginBottom = '15px';
            
            // Create progress bar
            this.progressBar = document.createElement('div');
            this.progressBar.style.height = '100%';
            this.progressBar.style.width = '0%';
            this.progressBar.style.backgroundColor = '#8844ff';
            this.progressBar.style.transition = 'width 0.3s ease';
            
            // Create progress text
            this.progressText = document.createElement('div');
            this.progressText.textContent = 'Preparing...';
            this.progressText.style.color = 'rgba(255, 255, 255, 0.7)';
            this.progressText.style.fontSize = '14px';
            this.progressText.style.fontFamily = "'Orbitron', sans-serif";
            
            // Add all elements to DOM
            progressContainer.appendChild(this.progressBar);
            loadingContent.appendChild(loadingTitle);
            loadingContent.appendChild(progressContainer);
            loadingContent.appendChild(this.progressText);
            this.loadingOverlay.appendChild(loadingContent);
            
            // Add to DOM but keep hidden
            document.body.appendChild(this.loadingOverlay);
        }
    }
    
    /**
     * Show the loading overlay
     */
    showLoadingUI() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
            
            // Force a reflow before changing opacity for transition
            void this.loadingOverlay.offsetWidth;
            
            this.loadingOverlay.style.opacity = '1';
        }
    }
    
    /**
     * Hide the loading overlay
     */
    hideLoadingUI() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            
            // Remove from DOM after transition completes
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
            }, 500);
        }
    }
    
    /**
     * Update the loading progress UI
     */
    updateLoadingProgress() {
        if (this.loadingTotal === 0) {
            this.loadingProgress = 1.0;
        } else {
            this.loadingProgress = this.loadingCompleted / this.loadingTotal;
        }
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${this.loadingProgress * 100}%`;
        }
        
        // Update progress text
        if (this.progressText) {
            this.progressText.textContent = `Loading assets: ${Math.round(this.loadingProgress * 100)}%`;
        }
        
        // Hide UI when complete
        if (this.loadingProgress >= 1.0) {
            setTimeout(() => {
                this.hideLoadingUI();
            }, 500);
        }
    }
    
    /**
     * Load multiple assets in a batch with UI
     * @param {Object} assets - Dictionary of assets to load, keyed by type
     * @returns {Promise} - Resolves when all assets are loaded
     */
    loadAssets(assets) {
        // Reset loading counters
        this.loadingCompleted = 0;
        this.loadingTotal = 0;
        
        // Count total assets to load
        if (assets.textures) this.loadingTotal += assets.textures.length;
        if (assets.cubemaps) this.loadingTotal += assets.cubemaps.length;
        if (assets.models) this.loadingTotal += assets.models.length;
        if (assets.shaders) this.loadingTotal += assets.shaders.length;
        if (assets.fonts) this.loadingTotal += assets.fonts.length;
        
        // Show loading UI if we have assets to load
        if (this.loadingTotal > 0) {
            this.showLoadingUI();
            this.updateLoadingProgress();
        }
        
        // Create promises array
        const promises = [];
        
        // Load textures
        if (assets.textures) {
            const texturePromises = assets.textures.map(texture => {
                return this.loadTexture(texture.name, texture.url, texture.options);
            });
            promises.push(...texturePromises);
        }
        
        // Load cubemaps
        if (assets.cubemaps) {
            const cubemapPromises = assets.cubemaps.map(cubemap => {
                return this.loadCubemap(cubemap.name, cubemap.urls, cubemap.options);
            });
            promises.push(...cubemapPromises);
        }
        
        // Load shaders
        if (assets.shaders) {
            const shaderPromises = assets.shaders.map(shader => {
                return this.loadShader(shader.name, shader.url);
            });
            promises.push(...shaderPromises);
        }
        
        // Track completion of all assets
        return Promise.allSettled(promises)
            .then(results => {
                // Count successful loads
                const successful = results.filter(r => r.status === 'fulfilled').length;
                console.log(`Asset loading complete. ${successful}/${results.length} assets loaded successfully.`);
                
                // Hide loading UI
                this.hideLoadingUI();
                
                // Return results
                return results;
            });
    }
    
    /**
     * Load a single texture with caching
     * @param {string} name - Unique identifier for the texture
     * @param {string} url - URL to the texture file
     * @param {Object} options - Texture options (filtering, wrapping, etc.)
     * @returns {Promise<THREE.Texture>} - Promise that resolves with the loaded texture
     */
    loadTexture(name, url, options = {}) {
        // Check cache first
        if (this.textures.has(name)) {
            console.log(`Texture ${name} loaded from cache`);
            this.loadingCompleted++;
            this.updateLoadingProgress();
            return Promise.resolve(this.textures.get(name));
        }
        
        // Apply texture default options
        const textureOptions = {
            ...{
                minFilter: THREE.LinearMipmapLinearFilter,
                magFilter: THREE.LinearFilter,
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping,
                anisotropy: this.app.renderer ? this.app.renderer.capabilities.getMaxAnisotropy() : 1
            },
            ...options
        };
        
        // Use explicit promise instead of TextureLoader.loadAsync for progress tracking
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // Apply options
                    texture.minFilter = textureOptions.minFilter;
                    texture.magFilter = textureOptions.magFilter;
                    texture.wrapS = textureOptions.wrapS;
                    texture.wrapT = textureOptions.wrapT;
                    texture.anisotropy = textureOptions.anisotropy;
                    
                    // Generate mipmaps if needed
                    texture.generateMipmaps = textureOptions.minFilter !== THREE.NearestFilter &&
                                              textureOptions.minFilter !== THREE.LinearFilter;
                    
                    // Apply transformations if any
                    if (textureOptions.flipY !== undefined) texture.flipY = textureOptions.flipY;
                    if (textureOptions.rotation) texture.rotation = textureOptions.rotation;
                    if (textureOptions.offset) texture.offset.copy(textureOptions.offset);
                    if (textureOptions.repeat) texture.repeat.copy(textureOptions.repeat);
                    
                    // Cache the texture
                    this.textures.set(name, texture);
                    
                    // Update progress
                    this.loadingCompleted++;
                    this.updateLoadingProgress();
                    
                    resolve(texture);
                },
                (progressEvent) => {
                    // Handle progress (not used much as most browsers don't report texture progress)
                },
                (error) => {
                    console.error(`Error loading texture ${name}:`, error);
                    
                    // Update progress even on failure
                    this.loadingCompleted++;
                    this.updateLoadingProgress();
                    
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Load a cubemap texture with caching
     * @param {string} name - Unique identifier for the cubemap
     * @param {Array<string>} urls - Array of URLs for the cubemap faces [px, nx, py, ny, pz, nz]
     * @param {Object} options - Cubemap options
     * @returns {Promise<THREE.CubeTexture>} - Promise that resolves with the loaded cubemap
     */
    loadCubemap(name, urls, options = {}) {
        // Check cache first
        if (this.cubemaps.has(name)) {
            console.log(`Cubemap ${name} loaded from cache`);
            this.loadingCompleted++;
            this.updateLoadingProgress();
            return Promise.resolve(this.cubemaps.get(name));
        }
        
        // Apply default options
        const cubemapOptions = {
            ...{
                path: '',
                minFilter: THREE.LinearMipmapLinearFilter,
                magFilter: THREE.LinearFilter
            },
            ...options
        };
        
        return new Promise((resolve, reject) => {
            this.cubeTextureLoader.setPath(cubemapOptions.path);
            
            this.cubeTextureLoader.load(
                urls,
                (cubemap) => {
                    // Apply options
                    cubemap.minFilter = cubemapOptions.minFilter;
                    cubemap.magFilter = cubemapOptions.magFilter;
                    
                    // Cache the cubemap
                    this.cubemaps.set(name, cubemap);
                    
                    // Update progress
                    this.loadingCompleted++;
                    this.updateLoadingProgress();
                    
                    resolve(cubemap);
                },
                (progressEvent) => {
                    // Handle progress
                },
                (error) => {
                    console.error(`Error loading cubemap ${name}:`, error);
                    
                    // Update progress even on failure
                    this.loadingCompleted++;
                    this.updateLoadingProgress();
                    
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Load a shader from a URL
     * @param {string} name - Unique identifier for the shader
     * @param {string} url - URL to the shader file
     * @returns {Promise<string>} - Promise that resolves with the shader code
     */
    loadShader(name, url) {
        // Check cache first
        if (this.shaders.has(name)) {
            console.log(`Shader ${name} loaded from cache`);
            this.loadingCompleted++;
            this.updateLoadingProgress();
            return Promise.resolve(this.shaders.get(name));
        }
        
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(shaderCode => {
                // Cache the shader
                this.shaders.set(name, shaderCode);
                
                // Update progress
                this.loadingCompleted++;
                this.updateLoadingProgress();
                
                return shaderCode;
            })
            .catch(error => {
                console.error(`Error loading shader ${name}:`, error);
                
                // Update progress even on failure
                this.loadingCompleted++;
                this.updateLoadingProgress();
                
                throw error;
            });
    }
    
    /**
     * Get a texture from the cache
     * @param {string} name - Texture identifier
     * @returns {THREE.Texture|null} - The texture or null if not found
     */
    getTexture(name) {
        return this.textures.get(name) || null;
    }
    
    /**
     * Get a cubemap from the cache
     * @param {string} name - Cubemap identifier
     * @returns {THREE.CubeTexture|null} - The cubemap or null if not found
     */
    getCubemap(name) {
        return this.cubemaps.get(name) || null;
    }
    
    /**
     * Get a shader from the cache
     * @param {string} name - Shader identifier
     * @returns {string|null} - The shader code or null if not found
     */
    getShader(name) {
        return this.shaders.get(name) || null;
    }
    
    /**
     * Reload all textures (after context loss)
     */
    reloadTextures() {
        // Get all cached texture entries
        const textureEntries = Array.from(this.textures.entries());
        const cubemapEntries = Array.from(this.cubemaps.entries());
        
        // Clear caches
        this.textures.clear();
        this.cubemaps.clear();
        
        // Set loading counters
        this.loadingTotal = textureEntries.length + cubemapEntries.length;
        this.loadingCompleted = 0;
        
        // Show loading UI
        if (this.loadingTotal > 0) {
            this.showLoadingUI();
        }
        
        // Reload each texture
        const texturePromises = textureEntries.map(([name, texture]) => {
            // Extract URL from texture source
            const url = texture.source.data?.src || texture.image?.src;
            if (!url) {
                console.warn(`Cannot reload texture ${name}: URL not found`);
                this.loadingCompleted++;
                return Promise.resolve(null);
            }
            
            // Extract options from texture
            const options = {
                minFilter: texture.minFilter,
                magFilter: texture.magFilter,
                wrapS: texture.wrapS,
                wrapT: texture.wrapT,
                anisotropy: texture.anisotropy,
                flipY: texture.flipY,
                rotation: texture.rotation,
                offset: texture.offset,
                repeat: texture.repeat
            };
            
            // Reload texture
            return this.loadTexture(name, url, options);
        });
        
        // Wait for all textures to reload
        return Promise.all(texturePromises)
            .then(() => {
                console.log('All textures reloaded successfully');
                this.hideLoadingUI();
            })
            .catch(error => {
                console.error('Error reloading textures:', error);
                this.hideLoadingUI();
            });
    }
    
    /**
     * Dispose of textures to free memory
     * @param {Array<string>} textureNames - Optional array of texture names to dispose, or all if not specified
     */
    disposeTextures(textureNames) {
        const texturesToDispose = textureNames || Array.from(this.textures.keys());
        
        for (const name of texturesToDispose) {
            const texture = this.textures.get(name);
            if (texture) {
                texture.dispose();
                this.textures.delete(name);
                console.log(`Disposed texture: ${name}`);
            }
        }
    }
    
    /**
     * Dispose of all resources to free memory
     */
    dispose() {
        // Dispose of all textures
        for (const texture of this.textures.values()) {
            texture.dispose();
        }
        this.textures.clear();
        
        // Dispose of all cubemaps
        for (const cubemap of this.cubemaps.values()) {
            cubemap.dispose();
        }
        this.cubemaps.clear();
        
        // Clear shader cache
        this.shaders.clear();
        
        // Remove loading UI
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
        
        console.log('AssetManager disposed');
    }
} 