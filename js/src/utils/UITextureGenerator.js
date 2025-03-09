import * as THREE from 'three';

/**
 * Utility class to generate textures for UI elements
 */
export class UITextureGenerator {
    /**
     * Generate a texture for data fragments
     * @param {string} type - Type of fragment ('code', 'data', 'image', 'text')
     * @param {number} size - Texture size
     * @returns {THREE.Texture} - Generated texture
     */
    static generateFragmentTexture(type = 'data', size = 64) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw based on type
        switch (type) {
            case 'code':
                this.drawCodeFragment(ctx, size);
                break;
            case 'image':
                this.drawImageFragment(ctx, size);
                break;
            case 'text':
                this.drawTextFragment(ctx, size);
                break;
            case 'data':
            default:
                this.drawDataFragment(ctx, size);
                break;
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a texture for navigation orbs
     * @param {string} label - Label to display on orb
     * @param {string} color - Color in hex format
     * @param {number} size - Texture size
     * @returns {THREE.Texture} - Generated texture
     */
    static generateOrbTexture(label = '', color = '#ffffff', size = 128) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw orb background
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw label if provided
        if (label) {
            ctx.font = `bold ${size / 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, size / 2, size / 2);
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a connection texture
     * @param {number} size - Texture size
     * @returns {THREE.Texture} - Generated texture
     */
    static generateConnectionTexture(size = 32) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw connection dot
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Draw a code fragment
     * @private
     */
    static drawCodeFragment(ctx, size) {
        // Background
        ctx.fillStyle = 'rgba(40, 40, 60, 0.9)';
        this.roundRect(ctx, 0, 0, size, size, size / 8);
        
        // Draw code lines
        const lineCount = 6;
        const lineSpacing = size / (lineCount + 2);
        const lineWidth = size * 0.8;
        
        ctx.fillStyle = 'rgba(120, 220, 255, 0.9)';
        
        for (let i = 0; i < lineCount; i++) {
            const y = lineSpacing * (i + 1);
            const lineLength = lineWidth * (0.5 + Math.random() * 0.5);
            const height = lineSpacing * 0.6;
            
            this.roundRect(ctx, size * 0.1, y, lineLength, height, height / 4);
        }
        
        // Add syntax highlight elements
        ctx.fillStyle = 'rgba(255, 220, 0, 0.9)';
        this.roundRect(ctx, size * 0.1, lineSpacing, size * 0.2, lineSpacing * 0.6, lineSpacing * 0.15);
        
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        this.roundRect(ctx, size * 0.6, lineSpacing * 3, size * 0.25, lineSpacing * 0.6, lineSpacing * 0.15);
    }
    
    /**
     * Draw a data fragment
     * @private
     */
    static drawDataFragment(ctx, size) {
        // Background
        ctx.fillStyle = 'rgba(40, 60, 40, 0.9)';
        this.roundRect(ctx, 0, 0, size, size, size / 8);
        
        // Draw data grid
        const cellSize = size / 8;
        
        for (let x = 0; x < 6; x++) {
            for (let y = 0; y < 6; y++) {
                if (Math.random() > 0.6) {
                    const brightness = 100 + Math.floor(Math.random() * 155);
                    ctx.fillStyle = `rgba(${brightness}, 255, ${brightness}, 0.9)`;
                    this.roundRect(
                        ctx, 
                        size / 8 + x * cellSize, 
                        size / 8 + y * cellSize, 
                        cellSize * 0.8, 
                        cellSize * 0.8, 
                        cellSize * 0.2
                    );
                }
            }
        }
    }
    
    /**
     * Draw an image fragment
     * @private
     */
    static drawImageFragment(ctx, size) {
        // Background
        ctx.fillStyle = 'rgba(60, 40, 60, 0.9)';
        this.roundRect(ctx, 0, 0, size, size, size / 8);
        
        // Draw image icon
        ctx.fillStyle = 'rgba(200, 150, 255, 0.9)';
        
        // Mountains
        ctx.beginPath();
        ctx.moveTo(size * 0.2, size * 0.7);
        ctx.lineTo(size * 0.4, size * 0.4);
        ctx.lineTo(size * 0.6, size * 0.6);
        ctx.lineTo(size * 0.8, size * 0.3);
        ctx.lineTo(size * 0.8, size * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Sun
        ctx.beginPath();
        ctx.arc(size * 0.7, size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a text fragment
     * @private
     */
    static drawTextFragment(ctx, size) {
        // Background
        ctx.fillStyle = 'rgba(60, 60, 40, 0.9)';
        this.roundRect(ctx, 0, 0, size, size, size / 8);
        
        // Draw text lines
        const lineCount = 4;
        const lineSpacing = size / (lineCount + 2);
        const lineWidth = size * 0.8;
        
        ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
        
        for (let i = 0; i < lineCount; i++) {
            const y = lineSpacing * (i + 1);
            const lineLength = lineWidth * (0.6 + Math.random() * 0.4);
            const height = lineSpacing * 0.6;
            
            this.roundRect(ctx, size * 0.1, y, lineLength, height, height / 4);
        }
    }
    
    /**
     * Helper to draw a rounded rectangle
     * @private
     */
    static roundRect(ctx, x, y, width, height, radius) {
        radius = Math.min(radius, width / 2, height / 2);
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
} 