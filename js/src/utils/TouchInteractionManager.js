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
        this.touchMoved = false; // New flag to track if touch moved
        
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
        
        // Add "Touch to feed" hint for mobile users
        this.showMobileTouchHint();
        
        // Add class to body for CSS targeting
        this.detectTouchDevice();
    }
    
    /**
     * Detect if the device is touch-capable and add appropriate class to body
     */
    detectTouchDevice() {
        // Multiple checks to detect touch capability
        const isTouchDevice = (
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0) ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            console.log('Touch device detected');
        } else {
            document.body.classList.add('non-touch-device');
            console.log('Non-touch device detected');
        }
        
        return isTouchDevice;
    }
    
    /**
     * Show a hint for mobile users that they can tap to feed the singularity
     */
    showMobileTouchHint() {
        // Check if we're on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Create a hint element if it doesn't exist
            let touchHint = document.getElementById('mobile-touch-hint');
            if (!touchHint) {
                touchHint = document.createElement('div');
                touchHint.id = 'mobile-touch-hint';
                touchHint.className = 'mobile-hint';
                touchHint.innerHTML = 'Tap to feed the singularity';
                touchHint.style.position = 'absolute';
                touchHint.style.bottom = '20px';
                touchHint.style.left = '50%';
                touchHint.style.transform = 'translateX(-50%)';
                touchHint.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                touchHint.style.color = 'white';
                touchHint.style.padding = '10px 15px';
                touchHint.style.borderRadius = '20px';
                touchHint.style.fontSize = '14px';
                touchHint.style.zIndex = '1000';
                touchHint.style.pointerEvents = 'none';
                touchHint.style.opacity = '1';
                touchHint.style.transition = 'opacity 0.5s ease-in-out';
                
                document.body.appendChild(touchHint);
                
                // Hide the hint after 5 seconds or after first tap
                setTimeout(() => {
                    touchHint.style.opacity = '0';
                }, 5000);
            }
        }
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} event
     */
    onTouchStart(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        this.isTouching = true;
        this.touchMoved = false; // Reset touch moved flag
        
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
                // Mark that the touch has moved significantly
                this.touchMoved = true;
                
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
            this.touchMoved = true; // Mark that the touch has moved
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
        // Check for double tap first
        const isDoubleTap = this.checkDoubleTap(event);
        
        // Check for single tap if touch didn't move much and it's not a double tap
        if (this.isTouching && !this.touchMoved && !isDoubleTap && event.touches.length === 0) {
            this.handleSingleTap(event);
        }
        
        // Reset touch state if all fingers are lifted
        if (event.touches.length === 0) {
            this.isTouching = false;
            this.isPinching = false;
            this.touchMoved = false;
        }
        // Update for remaining touch points
        else if (event.touches.length === 1) {
            this.isPinching = false;
            this.touchStartPosition.x = event.touches[0].clientX;
            this.touchStartPosition.y = event.touches[0].clientY;
        }
    }
    
    /**
     * Handle single tap to create particles (similar to right-click)
     * @param {TouchEvent} event 
     */
    handleSingleTap(event) {
        // Hide the mobile hint when user taps
        const touchHint = document.getElementById('mobile-touch-hint');
        if (touchHint) {
            touchHint.style.opacity = '0';
        }
        
        // Also hide the desktop hint
        document.body.classList.add('hint-hidden');
        
        // Get touch position
        let clientX, clientY;
        if (event.changedTouches && event.changedTouches.length > 0) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            return; // No touch information available
        }
        
        // Get canvas to calculate normalized device coordinates
        const canvas = this.app.canvas;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;
        
        // Calculate normalized device coordinates with better precision
        const mouseX = ((clientX - rect.left) / canvasWidth) * 2 - 1;
        const mouseY = -((clientY - rect.top) / canvasHeight) * 2 + 1;
        
        // Generate a random string to simulate the input text
        const randomStrings = [
            "stardust", "cosmos", "galaxy", "nebula", "supernova",
            "quantum", "space", "time", "gravity", "relativity",
            "universe", "dimension", "matter", "energy", "infinity",
            "quasar", "pulsar", "neutron", "wormhole", "singularity",
            "interstellar", "fusion", "entropy", "photon", "neutrino",
            "eclipse", "orbit", "comet", "vacuum", "celestial"
        ];
        const randomText = randomStrings[Math.floor(Math.random() * randomStrings.length)];
        
        // Determine appropriate particle count based on device performance
        const particleFactor = this.getDevicePerformanceFactor();
        
        // Create particle effect at the touch position with custom options
        if (this.app.particleSystem) {
            // Create visual touch feedback first
            this.createTouchFeedback(clientX, clientY);
            
            // Add a slight delay for better visual sequence
            setTimeout(() => {
                this.app.particleSystem.createParticlesAtMouse(mouseX, mouseY, randomText, particleFactor);
                
                // Play sound effect with optimized loading
                if (this.app.createDataInputSound) {
                    this.app.createDataInputSound(0.7); // Reduce volume slightly on mobile
                }
            }, 50);
        }
    }
    
    /**
     * Get a performance factor based on device capabilities
     * Lower values reduce particle count for better performance on weaker devices
     * @returns {number} Performance factor (0.3 to 1.0)
     */
    getDevicePerformanceFactor() {
        // Check if we're on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for device memory if available (Chrome only)
        const lowMemory = navigator.deviceMemory !== undefined && navigator.deviceMemory < 4;
        
        // Check for hardware concurrency (available CPU cores)
        const lowCPU = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4;
        
        // Lower factor for less capable devices
        if (isMobile) {
            if (lowMemory || lowCPU) {
                return 0.3; // Significantly reduce particles for weak mobile devices
            }
            return 0.5; // Reduce particles for average mobile devices
        }
        
        if (lowMemory || lowCPU) {
            return 0.7; // Slightly reduce particles for weaker desktop devices
        }
        
        return 1.0; // Full particle count for powerful devices
    }
    
    /**
     * Check for double tap gesture
     * @param {TouchEvent} event 
     */
    checkDoubleTap(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        
        // Only check for double tap if the touch didn't move much
        if (!this.touchMoved && tapLength < this.doubleTapDelay && tapLength > 0) {
            // Double tap detected
            if (!this.isPinching && event.target === this.app.canvas) {
                this.handleDoubleTap(event);
                event.preventDefault();
                
                // If double tap is detected, don't process as single tap
                return true;
            }
        }
        
        this.lastTap = currentTime;
        return false;
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
        // Create ripple element
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        
        // Size based on screen dimensions for better scaling
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        const size = screenSize * 0.15; // 15% of the smaller screen dimension
        
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        // Add to DOM
        document.body.appendChild(ripple);
        
        // Add a smaller, faster secondary ripple for enhanced effect
        const secondaryRipple = document.createElement('div');
        secondaryRipple.className = 'touch-ripple';
        secondaryRipple.style.width = `${size * 0.7}px`;
        secondaryRipple.style.height = `${size * 0.7}px`;
        secondaryRipple.style.left = `${x}px`;
        secondaryRipple.style.top = `${y}px`;
        secondaryRipple.style.animationDuration = '0.6s';
        
        // Add to DOM with slight delay
        setTimeout(() => {
            document.body.appendChild(secondaryRipple);
        }, 150);
        
        // Trigger haptic feedback if available
        if (window.navigator && window.navigator.vibrate) {
            // Gentle vibration for 50ms
            window.navigator.vibrate(50);
        }
        
        // Clean up ripples after animation completes
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1000);
        
        setTimeout(() => {
            if (secondaryRipple.parentNode) {
                secondaryRipple.parentNode.removeChild(secondaryRipple);
            }
        }, 800);
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