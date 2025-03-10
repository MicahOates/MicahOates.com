import * as THREE from 'three';

/**
 * TouchInteractionManager
 * Enhanced touch controls for mobile devices with support for pinch zoom, rotation, and double taps
 */
export class TouchInteractionManager {
    constructor(app) {
        this.app = app;
        
        // Touch state
        this.touchStartPosition = { x: 0, y: 0 };
        this.touchEndPosition = { x: 0, y: 0 };
        this.pinchStartDistance = 0;
        this.isActive = true;
        
        // Options
        this.orbitEnabled = true;
        this.zoomEnabled = true;
        
        // Touch event flags
        this.isTouching = false;
        this.isPinching = false;
        
        // Double tap detection
        this.lastTap = 0;
        this.doubleTapDelay = 300; // ms
        
        // Inertia system for smoother rotations
        this.useInertia = true;
        this.inertia = { x: 0, y: 0 };
        this.inertiaDecay = 0.95;
        this.inertiaThreshold = 0.001;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize touch event listeners
     */
    init() {
        if (!this.app.canvas) {
            console.warn('TouchInteractionManager: No canvas found in app');
            return;
        }
        
        const canvas = this.app.canvas;
        
        // Add touch event listeners
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        
        // Add animation loop hook if using inertia
        if (this.useInertia) {
            this.inertiaFrameId = null;
            this.startInertiaLoop();
        }
        
        console.log('TouchInteractionManager initialized');
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} event
     */
    onTouchStart(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        this.isTouching = true;
        
        // Record initial touch position
        if (event.touches.length === 1) {
            this.touchStartPosition.x = event.touches[0].clientX;
            this.touchStartPosition.y = event.touches[0].clientY;
            this.isPinching = false;
            
            // Reset inertia when starting a new touch
            this.inertia = { x: 0, y: 0 };
            
            // Create visual feedback for touch
            this.createTouchFeedback(event.touches[0].clientX, event.touches[0].clientY);
        }
        // Handle pinch start with two fingers
        else if (event.touches.length === 2 && this.zoomEnabled) {
            this.isPinching = true;
            this.pinchStartDistance = this.getPinchDistance(event);
        }
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} event
     */
    onTouchMove(event) {
        if (!this.isActive || !this.isTouching) return;
        
        event.preventDefault();
        
        // Handle orbit (one finger)
        if (event.touches.length === 1 && this.orbitEnabled && !this.isPinching) {
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;
            
            const deltaX = touchX - this.touchStartPosition.x;
            const deltaY = touchY - this.touchStartPosition.y;
            
            if (this.app.controls && Math.abs(deltaX) + Math.abs(deltaY) > 2) {
                // Adjust rotation speed based on screen size
                const screenFactor = Math.min(window.innerWidth, window.innerHeight) / 1000;
                const rotationSpeed = 0.15 * screenFactor;
                
                this.app.controls.rotateLeft(deltaX * rotationSpeed);
                this.app.controls.rotateUp(deltaY * rotationSpeed);
                this.app.controls.update();
                
                // Set inertia values for smooth deceleration
                if (this.useInertia) {
                    const momentumFactor = 0.2;
                    this.inertia.x = deltaX * rotationSpeed * momentumFactor;
                    this.inertia.y = deltaY * rotationSpeed * momentumFactor;
                }
            }
            
            this.touchStartPosition.x = touchX;
            this.touchStartPosition.y = touchY;
        }
        // Handle pinch zoom (two fingers)
        else if (event.touches.length === 2 && this.zoomEnabled) {
            const currentDistance = this.getPinchDistance(event);
            const distanceDelta = currentDistance - this.pinchStartDistance;
            
            if (this.app.controls) {
                // Adjust zoom speed based on screen size
                const screenFactor = Math.min(window.innerWidth, window.innerHeight) / 1000;
                const zoomSpeed = 0.01 * screenFactor;
                
                if (Math.abs(distanceDelta) > 5) {
                    const zoomFactor = 1 - distanceDelta * zoomSpeed;
                    this.app.controls.dollyIn(zoomFactor);
                    this.app.controls.update();
                }
            }
            
            this.pinchStartDistance = currentDistance;
        }
    }
    
    /**
     * Handle touch end event
     * @param {TouchEvent} event
     */
    onTouchEnd(event) {
        // Check for double tap
        this.checkDoubleTap(event);
        
        // Reset touch state if all fingers are lifted
        if (event.touches.length === 0) {
            this.isTouching = false;
            this.isPinching = false;
        }
        // Update for remaining touch points
        else if (event.touches.length === 1) {
            this.isPinching = false;
            this.touchStartPosition.x = event.touches[0].clientX;
            this.touchStartPosition.y = event.touches[0].clientY;
        }
    }
    
    /**
     * Check for double tap gesture
     * @param {TouchEvent} event 
     */
    checkDoubleTap(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        
        if (tapLength < this.doubleTapDelay && tapLength > 0) {
            // Double tap detected
            if (!this.isPinching && event.target === this.app.canvas) {
                this.handleDoubleTap(event);
                event.preventDefault();
            }
        }
        
        this.lastTap = currentTime;
    }
    
    /**
     * Handle double tap action
     * @param {TouchEvent} event 
     */
    handleDoubleTap(event) {
        // Reset camera position
        if (this.app.sceneManager && this.app.sceneManager.resetCameraPosition) {
            this.app.sceneManager.resetCameraPosition();
            
            // Play feedback sound if available
            if (this.app.audioManager && this.app.audioManager.playUISound) {
                this.app.audioManager.playUISound('tap');
            }
            
            console.log('Double tap: Reset camera position');
        }
    }
    
    /**
     * Calculate the distance between two touch points
     * @param {TouchEvent} event 
     * @returns {number} Distance between touches
     */
    getPinchDistance(event) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Create visual feedback for touch
     * @param {number} x - Touch X position
     * @param {number} y - Touch Y position
     */
    createTouchFeedback(x, y) {
        // If already defined in app, use that instead
        if (this.app.createTouchRipple) {
            this.app.createTouchRipple(x, y);
            return;
        }
        
        // Create minimal touch feedback if not already implemented
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.position = 'absolute';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        ripple.style.left = `${x - 10}px`;
        ripple.style.top = `${y - 10}px`;
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9999';
        
        document.body.appendChild(ripple);
        
        // Start animation
        setTimeout(() => {
            ripple.style.transform = 'scale(3)';
            ripple.style.opacity = '0';
        }, 10);
        
        // Remove element after animation
        setTimeout(() => {
            document.body.removeChild(ripple);
        }, 300);
    }
    
    /**
     * Start the inertia animation loop
     */
    startInertiaLoop() {
        const updateInertia = () => {
            // Apply inertia to controls if not currently touching
            if (!this.isTouching && this.app.controls) {
                // Apply inertia with decay
                if (Math.abs(this.inertia.x) > this.inertiaThreshold ||
                    Math.abs(this.inertia.y) > this.inertiaThreshold) {
                    
                    this.app.controls.rotateLeft(this.inertia.x);
                    this.app.controls.rotateUp(this.inertia.y);
                    this.app.controls.update();
                    
                    // Decay inertia
                    this.inertia.x *= this.inertiaDecay;
                    this.inertia.y *= this.inertiaDecay;
                }
            }
            
            this.inertiaFrameId = requestAnimationFrame(updateInertia);
        };
        
        this.inertiaFrameId = requestAnimationFrame(updateInertia);
    }
    
    /**
     * Set touch interaction state
     * @param {boolean} enabled - Whether touch interactions are enabled
     */
    setEnabled(enabled) {
        this.isActive = enabled;
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        if (!this.app.canvas) return;
        
        const canvas = this.app.canvas;
        
        // Remove event listeners
        canvas.removeEventListener('touchstart', this.onTouchStart);
        canvas.removeEventListener('touchmove', this.onTouchMove);
        canvas.removeEventListener('touchend', this.onTouchEnd);
        
        // Stop inertia animation loop
        if (this.inertiaFrameId) {
            cancelAnimationFrame(this.inertiaFrameId);
            this.inertiaFrameId = null;
        }
        
        console.log('TouchInteractionManager disposed');
    }
} 