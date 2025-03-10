import * as THREE from 'three';

/**
 * ResourceTracker
 * Tracks and manages Three.js resources to prevent memory leaks
 * 
 * Usage:
 * const resources = new ResourceTracker();
 * const geometry = resources.track(new THREE.BoxGeometry());
 * const material = resources.track(new THREE.MeshBasicMaterial());
 * const mesh = resources.track(new THREE.Mesh(geometry, material));
 * 
 * // When no longer needed:
 * resources.dispose();
 */
export class ResourceTracker {
    constructor() {
        this.resources = new Set();
        this.startTime = Date.now();
        this.disposeCount = 0;
        this.trackingEnabled = true;
        this.debugMode = false;
    }
    
    /**
     * Track a resource or array of resources
     * @param {Object|Array} resource - THREE.js object or array of objects to track
     * @param {String} name - Optional name for debugging
     * @returns {Object} - The tracked object (for chaining)
     */
    track(resource, name = '') {
        if (!this.trackingEnabled) return resource;
        
        if (Array.isArray(resource)) {
            resource.forEach(r => this.track(r));
            return resource;
        }
        
        if (!resource) {
            console.warn('ResourceTracker: Attempted to track null or undefined resource');
            return resource;
        }
        
        // Add metadata for debugging
        if (this.debugMode && name && resource.userData) {
            resource.userData.trackedResourceName = name;
            resource.userData.trackedTimestamp = Date.now();
        }
        
        this.resources.add(resource);
        return resource;
    }
    
    /**
     * Untrack a specific resource without disposing it
     * @param {Object} resource - The resource to untrack
     */
    untrack(resource) {
        this.resources.delete(resource);
    }
    
    /**
     * Dispose a specific tracked resource
     * @param {Object} resource - The resource to dispose and untrack
     */
    disposeResource(resource) {
        this.disposeItem(resource);
        this.untrack(resource);
        this.disposeCount++;
    }
    
    /**
     * Helper method to determine if an object can be disposed
     * @param {Object} obj - Object to check
     * @returns {Boolean} - Whether the object has a dispose method
     */
    isDisposable(obj) {
        return obj && typeof obj.dispose === 'function';
    }
    
    /**
     * Dispose a single item based on its type
     * @param {Object} item - The item to dispose
     */
    disposeItem(item) {
        if (!item) return;
        
        // Skip if already disposed
        if (item.userData && item.userData.__disposed) return;
        
        if (this.debugMode) {
            const name = item.userData?.trackedResourceName || item.type || 'unknown';
            const lifetime = item.userData?.trackedTimestamp ? 
                ((Date.now() - item.userData.trackedTimestamp) / 1000).toFixed(2) + 's' : 'unknown';
            console.log(`Disposing ${name} (lifetime: ${lifetime})`);
        }
        
        // Handle different Three.js object types
        if (item instanceof THREE.Scene) {
            this.disposeScene(item);
        }
        else if (item instanceof THREE.Mesh) {
            this.disposeMesh(item);
        }
        else if (item instanceof THREE.Material) {
            this.disposeMaterial(item);
        }
        else if (item instanceof THREE.Texture) {
            item.dispose();
        }
        else if (item instanceof THREE.BufferGeometry) {
            item.dispose();
        }
        else if (this.isDisposable(item)) {
            item.dispose();
        }
        else if (item.children && Array.isArray(item.children)) {
            // Handle objects with children (like Groups)
            const childrenCopy = [...item.children];
            childrenCopy.forEach(child => this.disposeItem(child));
        }
        
        // Mark as disposed to prevent double disposal attempts
        if (item.userData) {
            item.userData.__disposed = true;
        }
    }
    
    /**
     * Specifically handle Scene disposal
     * @param {THREE.Scene} scene - Scene to dispose
     */
    disposeScene(scene) {
        // Store reference of what we need to process
        const objects = [...scene.children];
        
        // Dispose each object in the scene
        objects.forEach(object => {
            scene.remove(object);
            this.disposeItem(object);
        });
        
        // Clear any other properties
        scene.background = null;
        scene.environment = null;
        
        // Ensure all children are removed
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }
    
    /**
     * Specifically handle Mesh disposal
     * @param {THREE.Mesh} mesh - Mesh to dispose
     */
    disposeMesh(mesh) {
        if (mesh.geometry) {
            mesh.geometry.dispose();
            mesh.geometry = null;
        }
        
        if (mesh.material) {
            this.disposeMaterial(mesh.material);
            mesh.material = null;
        }
        
        // Remove from parent
        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
    }
    
    /**
     * Specifically handle Material disposal
     * @param {THREE.Material|Array} material - Material or array of materials to dispose
     */
    disposeMaterial(material) {
        if (!material) return;
        
        // Handle material arrays
        if (Array.isArray(material)) {
            material.forEach(m => this.disposeMaterial(m));
            return;
        }
        
        // Dispose all textures
        for (const [key, value] of Object.entries(material)) {
            if (value instanceof THREE.Texture) {
                value.dispose();
            }
        }
        
        // Special handling for shader materials
        if (material instanceof THREE.ShaderMaterial) {
            // Null out uniforms that might be holding references
            if (material.uniforms) {
                for (const uniformKey of Object.keys(material.uniforms)) {
                    const uniform = material.uniforms[uniformKey];
                    if (uniform.value instanceof THREE.Texture) {
                        uniform.value.dispose();
                    }
                    uniform.value = null;
                }
            }
        }
        
        // Finally dispose the material itself
        material.dispose();
    }
    
    /**
     * Dispose of all tracked resources
     */
    dispose() {
        const startTime = performance.now();
        const resourceCount = this.resources.size;
        
        if (this.debugMode) {
            console.group('ResourceTracker: Disposing all resources');
            console.log(`Disposing ${resourceCount} tracked resources`);
        }
        
        // Dispose meshes and materials first, then other resources
        const resourceArray = Array.from(this.resources);
        
        // First pass: Dispose meshes
        resourceArray
            .filter(item => item instanceof THREE.Mesh)
            .forEach(item => this.disposeItem(item));
            
        // Second pass: Dispose materials
        resourceArray
            .filter(item => item instanceof THREE.Material || 
                           (Array.isArray(item) && item[0] instanceof THREE.Material))
            .forEach(item => this.disposeItem(item));
            
        // Third pass: Dispose textures
        resourceArray
            .filter(item => item instanceof THREE.Texture)
            .forEach(item => this.disposeItem(item));
            
        // Fourth pass: Dispose geometries
        resourceArray
            .filter(item => item instanceof THREE.BufferGeometry)
            .forEach(item => this.disposeItem(item));
            
        // Final pass: Dispose everything else
        resourceArray
            .filter(item => !(item instanceof THREE.Mesh) && 
                           !(item instanceof THREE.Material) && 
                           !(item instanceof THREE.Texture) &&
                           !(item instanceof THREE.BufferGeometry))
            .forEach(item => this.disposeItem(item));
        
        // Clear the resource set
        this.resources.clear();
        
        const endTime = performance.now();
        
        if (this.debugMode) {
            console.log(`Resources disposed in ${(endTime - startTime).toFixed(2)}ms`);
            console.groupEnd();
        }
        
        return resourceCount;
    }
    
    /**
     * Enable or disable resource tracking
     * @param {Boolean} enabled - Whether tracking should be enabled
     */
    setTrackingEnabled(enabled) {
        this.trackingEnabled = enabled;
    }
    
    /**
     * Enable or disable debug mode
     * @param {Boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * Get the number of currently tracked resources
     * @returns {Number} - Count of tracked resources
     */
    getResourceCount() {
        return this.resources.size;
    }
    
    /**
     * Get a summary of tracked resources by type
     * @returns {Object} - Summary of tracked resources
     */
    getResourceSummary() {
        const summary = {
            meshes: 0,
            materials: 0,
            textures: 0,
            geometries: 0,
            other: 0,
            total: this.resources.size
        };
        
        this.resources.forEach(resource => {
            if (resource instanceof THREE.Mesh) {
                summary.meshes++;
            } else if (resource instanceof THREE.Material) {
                summary.materials++;
            } else if (resource instanceof THREE.Texture) {
                summary.textures++;
            } else if (resource instanceof THREE.BufferGeometry) {
                summary.geometries++;
            } else {
                summary.other++;
            }
        });
        
        return summary;
    }
} 