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
     * Show a hint for mobile users about interactive features
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
                touchHint.innerHTML = 'Tap anywhere to interact with particles';
                
                document.body.appendChild(touchHint);
                
                // Hide the hint after first tap or 7 seconds
                const hideHint = () => {
                    touchHint.style.opacity = '0';
                    setTimeout(() => {
                        touchHint.remove();
                    }, 600);
                    this.app.canvas.removeEventListener('touchstart', hideHintOnTouch);
                };
                
                const hideHintOnTouch = () => {
                    // Small delay so user can see the hint and their first tap effect together
                    setTimeout(hideHint, 1500);
                };
                
                // Hide after timeout
                setTimeout(hideHint, 7000);
                
                // Hide after first touch
                this.app.canvas.addEventListener('touchstart', hideHintOnTouch, { once: true });
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
     * Handle single tap to create visual particle effects
     * @param {TouchEvent} event 
     */
    handleSingleTap(event) {
        // Apply throttling to prevent too many particle bursts on mobile
        if (this._lastTapTime && Date.now() - this._lastTapTime < 300) {
            return; // Skip if tapping too quickly
        }
        this._lastTapTime = Date.now();
        
        // Hide the mobile hint when user taps
        const touchHint = document.getElementById('mobile-touch-hint');
        if (touchHint) {
            touchHint.style.opacity = '0';
        }
        
        // Hide any other hints
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
        
        // Create particle effect at the touch position
        if (this.app.particleSystem) {
            // Create visual touch feedback first
            this.createTouchFeedback(clientX, clientY);
            
            // Create a more subtle visual effect
            const particleFactor = this.getDevicePerformanceFactor();
            const particleCount = Math.floor(5 * particleFactor);
            
            // Add particles to the scene with a slight delay for better visual sequence
            setTimeout(() => {
                if (this.app.particleSystem.createVisualEffect) {
                    this.app.particleSystem.createVisualEffect(mouseX, mouseY, particleCount);
                } else if (this.app.particleSystem.createParticlesAtMouse) {
                    // Fallback to existing method if available
                    this.app.particleSystem.createParticlesAtMouse(mouseX, mouseY, null, particleFactor);
                }
                
                // Play a subtle sound effect if available
                if (this.app.createEffectSound) {
                    this.app.createEffectSound(0.4); // Lower volume for subtlety
                }
            }, 50);
        }
    }
    
    /**
     * Get a performance factor based on device capabilities with more detailed detection
     * @returns {number} Performance factor (0.3 to 1.0)
     */
    getDevicePerformanceFactor() {
        // Check if we're on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for device memory if available (Chrome only)
        const lowMemory = navigator.deviceMemory !== undefined && navigator.deviceMemory < 4;
        
        // Check for hardware concurrency (available CPU cores)
        const lowCPU = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4;
        
        // Check if it's a low-end device based on user agent (common budget phones)
        const lowEndDeviceHints = /Android 4|Android 5|iPhone 5|iPhone 6|iPhone 7|iPhone 8|iPad Mini/i.test(navigator.userAgent);
        
        // More granular performance levels
        if (isMobile) {
            if (lowMemory && lowCPU) {
                return 0.25; // Very low-end mobile device
            } else if (lowMemory || lowCPU || lowEndDeviceHints) {
                return 0.4; // Low-end mobile device
            } else if (/iPhone X|iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15|iPad Pro|Galaxy S2|Pixel/i.test(navigator.userAgent)) {
                return 0.8; // High-end mobile device
            }
            return 0.6; // Average mobile device
        }
        
        if (lowMemory && lowCPU) {
            return 0.6; // Low-end desktop
        } else if (lowMemory || lowCPU) {
            return 0.8; // Medium desktop
        }
        
        return 1.0; // High-end desktop
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
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        
        // Set the ripple size based on device performance
        const performanceFactor = this.getDevicePerformanceFactor();
        const baseSize = Math.min(window.innerWidth, window.innerHeight) * 0.15;
        const rippleSize = baseSize * performanceFactor;
        
        ripple.style.width = `${rippleSize}px`;
        ripple.style.height = `${rippleSize}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        document.body.appendChild(ripple);
        
        // Create particles that flow from touch position toward the black hole center
        this.createFlowParticles(x, y);
        
        // Remove the ripple when animation completes
        setTimeout(() => {
            ripple.remove();
        }, 1200);
        
        // Trigger particle creation in the main app if available
        if (this.app.createParticlesAtPosition) {
            // Scale the number of particles based on performance
            const count = Math.floor(10 * performanceFactor);
            this.app.createParticlesAtPosition(x, y, count);
        }
        
        // Trigger haptic feedback if available (iOS 13+, Android)
        this.triggerHapticFeedback('light');
    }
    
    /**
     * Trigger haptic feedback if available on the device
     * @param {string} style - Feedback style: 'light', 'medium', or 'heavy'
     */
    triggerHapticFeedback(style = 'light') {
        try {
            // Try to use the Vibration API (Android)
            if (navigator.vibrate) {
                switch (style) {
                    case 'light':
                        navigator.vibrate(10);
                        break;
                    case 'medium':
                        navigator.vibrate(20);
                        break;
                    case 'heavy':
                        navigator.vibrate([30, 10, 30]);
                        break;
                    default:
                        navigator.vibrate(10);
                }
            }
        } catch (e) {
            console.warn('Haptic feedback not supported', e);
        }
    }
    
    /**
     * Create particles that flow from touch position toward the black hole center
     * @param {number} x - Touch X position
     * @param {number} y - Touch Y position
     */
    createFlowParticles(x, y) {
        // Get center position (black hole position)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate direction vector
        const dirX = centerX - x;
        const dirY = centerY - y;
        
        // Normalize the vector
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normX = dirX / length;
        const normY = dirY / length;
        
        // Get performance based particle count
        const performanceFactor = this.getDevicePerformanceFactor();
        const particleCount = Math.floor(20 * performanceFactor);
        
        // Create particle pool if it doesn't exist
        this.particlePool = this.particlePool || [];
        
        // Add particles
        for (let i = 0; i < particleCount; i++) {
            // Reuse particles from pool when possible
            let particle = this.getParticleFromPool();
            const isNewParticle = !particle;
            
            if (isNewParticle) {
                particle = document.createElement('div');
                particle.className = 'flow-particle';
            }
            
            // Random size for variety
            const size = 2 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position around touch point
            const offsetRadius = 15 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            const offsetX = Math.cos(angle) * offsetRadius;
            const offsetY = Math.sin(angle) * offsetRadius;
            
            particle.style.left = `${x + offsetX}px`;
            particle.style.top = `${y + offsetY}px`;
            
            // Calculate final movement based on black hole center
            const moveDistance = 100 + Math.random() * 150;
            const moveX = normX * moveDistance;
            const moveY = normY * moveDistance;
            
            // Set custom properties for animation
            particle.style.setProperty('--moveX', `${moveX}px`);
            particle.style.setProperty('--moveY', `${moveY}px`);
            
            // Add color variation for visual interest
            const hue = 250 + Math.random() * 30; // Purple to blue range
            const lightness = 60 + Math.random() * 20;
            particle.style.background = `hsla(${hue}, 80%, ${lightness}%, 0.8)`;
            
            // Randomize animation duration
            const duration = 1 + Math.random() * 0.5;
            particle.style.animationDuration = `${duration}s`;
            
            // Add delay for staggered effect
            const delay = Math.random() * 0.3;
            particle.style.animationDelay = `${delay}s`;
            
            // Add to DOM if new particle
            if (isNewParticle) {
                document.body.appendChild(particle);
            }
            
            // Return to pool or remove after animation
            setTimeout(() => {
                this.storeParticleInPool(particle);
            }, (duration + delay) * 1000 + 100);
        }
    }
    
    /**
     * Get a particle from the pool if available
     * @returns {HTMLElement|null} A particle element or null if none available
     */
    getParticleFromPool() {
        if (this.particlePool && this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return null;
    }
    
    /**
     * Store a particle in the pool for reuse
     * @param {HTMLElement} particle - The particle element to store
     */
    storeParticleInPool(particle) {
        // Initialize pool if needed
        this.particlePool = this.particlePool || [];
        
        // Remove from DOM
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
        
        // Limit pool size
        if (this.particlePool.length < 100) {
            this.particlePool.push(particle);
        }
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