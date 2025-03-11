/**
 * AccessibilityManager
 * Enhances application accessibility with keyboard navigation and screen reader support
 */
import * as THREE from 'three';

export class AccessibilityManager {
    constructor(app) {
        this.app = app;
        
        // State
        this.announcer = null;
        this.keyboardControlsEnabled = true;
        this.focusedElementBeforeCanvas = null;
        
        // Key bindings configuration
        this.keyBindings = {
            // Camera controls
            ArrowUp: { action: 'rotate-up', description: 'Rotate camera up' },
            ArrowDown: { action: 'rotate-down', description: 'Rotate camera down' },
            ArrowLeft: { action: 'rotate-left', description: 'Rotate camera left' },
            ArrowRight: { action: 'rotate-right', description: 'Rotate camera right' },
            '+': { action: 'zoom-in', description: 'Zoom in' },
            '=': { action: 'zoom-in', description: 'Zoom in' },
            '-': { action: 'zoom-out', description: 'Zoom out' },
            '_': { action: 'zoom-out', description: 'Zoom out' },
            
            // Special commands
            Home: { action: 'reset-camera', description: 'Reset camera position' },
            r: { action: 'toggle-rotation', description: 'Toggle auto-rotation' },
            
            // With modifier keys
            'Shift+ArrowUp': { action: 'move-up', description: 'Move camera up' },
            'Shift+ArrowDown': { action: 'move-down', description: 'Move camera down' },
            'Shift+ArrowLeft': { action: 'move-left', description: 'Move camera left' },
            'Shift+ArrowRight': { action: 'move-right', description: 'Move camera right' }
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize accessibility features
     */
    init() {
        // Create screen reader announcer
        this.createAnnouncer();
        
        // Add keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Make canvas focusable and add accessibility attributes
        this.enhanceCanvasAccessibility();
        
        // Add help text for keyboard controls
        this.createKeyboardHelpText();
        
        // Announce initial state
        this.announce('Black hole visualization loaded. Use arrow keys to navigate, plus and minus to zoom.');
        
        console.log('AccessibilityManager initialized');
    }
    
    /**
     * Create announcer element for screen readers
     */
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('role', 'status');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.className = 'sr-only';
        
        // Style for screen reader only (visually hidden)
        this.announcer.style.position = 'absolute';
        this.announcer.style.width = '1px';
        this.announcer.style.height = '1px';
        this.announcer.style.padding = '0';
        this.announcer.style.margin = '-1px';
        this.announcer.style.overflow = 'hidden';
        this.announcer.style.clip = 'rect(0, 0, 0, 0)';
        this.announcer.style.whiteSpace = 'nowrap';
        this.announcer.style.border = '0';
        
        document.body.appendChild(this.announcer);
    }
    
    /**
     * Enhance canvas with accessibility attributes
     */
    enhanceCanvasAccessibility() {
        if (!this.app.canvas) {
            console.warn('AccessibilityManager: No canvas found in app');
            return;
        }
        
        const canvas = this.app.canvas;
        
        // Make canvas focusable
        canvas.setAttribute('tabindex', '0');
        
        // Add accessibility attributes
        canvas.setAttribute('role', 'application');
        canvas.setAttribute('aria-label', 'Interactive black hole visualization. Use arrow keys to rotate, plus/minus to zoom.');
        
        // Add focus indicator
        canvas.addEventListener('focus', () => {
            this.onCanvasFocus();
        });
        
        canvas.addEventListener('blur', () => {
            this.onCanvasBlur();
        });
        
        // Add keyboard help tooltip
        canvas.setAttribute('title', 'Arrow keys: rotate | +/-: zoom | Home: reset view | R: toggle rotation');
        
        // Add visual focus indicator via CSS
        const style = document.createElement('style');
        style.textContent = `
            #${canvas.id}:focus {
                outline: 2px solid #44aaff;
                outline-offset: 2px;
            }
            
            .keyboard-controls-help {
                position: absolute;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: sans-serif;
                font-size: 12px;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1000;
            }
            
            .keyboard-controls-help.visible {
                opacity: 1;
            }
            
            .keyboard-controls-help kbd {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                padding: 1px 4px;
                margin: 0 2px;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Create help text for keyboard controls
     */
    createKeyboardHelpText() {
        const helpElement = document.createElement('div');
        helpElement.className = 'keyboard-controls-help';
        helpElement.innerHTML = `
            <div><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Rotate camera</div>
            <div><kbd>+</kbd><kbd>-</kbd> Zoom in/out</div>
            <div><kbd>Home</kbd> Reset view</div>
            <div><kbd>R</kbd> Toggle rotation</div>
            <div><kbd>Shift</kbd>+<kbd>Arrows</kbd> Move camera</div>
        `;
        document.body.appendChild(helpElement);
        
        this.helpElement = helpElement;
    }
    
    /**
     * Handle canvas focus
     */
    onCanvasFocus() {
        // Store currently focused element
        this.focusedElementBeforeCanvas = document.activeElement !== this.app.canvas ? 
            document.activeElement : null;
        
        // Show keyboard help
        if (this.helpElement) {
            this.helpElement.classList.add('visible');
            
            // Hide after a delay
            setTimeout(() => {
                this.helpElement.classList.remove('visible');
            }, 3000);
        }
        
        // Announce controls to screen readers
        this.announce('Canvas focused. Use arrow keys to rotate, plus/minus to zoom, Home to reset view.');
    }
    
    /**
     * Handle canvas blur
     */
    onCanvasBlur() {
        // Hide keyboard help
        if (this.helpElement) {
            this.helpElement.classList.remove('visible');
        }
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event 
     */
    handleKeyDown(event) {
        // Skip if keyboard controls are disabled
        if (!this.keyboardControlsEnabled) return;
        
        // Only handle when canvas or body has focus, or no interactive elements are focused
        const activeElement = document.activeElement;
        const isInteractiveElement = activeElement && 
            (activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             activeElement.tagName === 'SELECT' || 
             activeElement.tagName === 'BUTTON' ||
             activeElement.isContentEditable);
        
        if (isInteractiveElement) return;
        
        // Don't capture keys if any modal dialogs are open
        const modalOpen = document.querySelector('.modal.active, .dialog.active, [role="dialog"][aria-hidden="false"]');
        if (modalOpen) return;
        
        // Get key identifier with any modifiers
        let keyId = event.key;
        if (event.shiftKey) keyId = `Shift+${keyId}`;
        if (event.ctrlKey) keyId = `Ctrl+${keyId}`;
        if (event.altKey) keyId = `Alt+${keyId}`;
        
        // Find matching key binding
        const binding = this.keyBindings[keyId];
        if (!binding) return;
        
        // Process the action
        this.processKeyAction(binding.action, event, binding.description);
    }
    
    /**
     * Process a key action
     * @param {string} action - Action identifier
     * @param {KeyboardEvent} event - Original key event
     * @param {string} description - Action description for screen reader
     */
    processKeyAction(action, event, description) {
        if (!this.app.controls || !this.app.camera) return;
        
        const controls = this.app.controls;
        const camera = this.app.camera;
        
        // Movement/rotation amounts
        const moveStep = 0.5;
        const rotateStep = 0.1;
        const zoomStep = 1.1;
        
        let actionPerformed = true;
        
        switch(action) {
            case 'rotate-up':
                // Manual rotation by adjusting the camera position
                const currentDistance = camera.position.length();
                controls._spherical = controls._spherical || new THREE.Spherical().setFromVector3(camera.position);
                controls._spherical.phi = Math.max(
                    controls.minPolarAngle,
                    Math.min(controls.maxPolarAngle, controls._spherical.phi - rotateStep)
                );
                camera.position.setFromSpherical(controls._spherical).multiplyScalar(currentDistance);
                controls.update();
                break;
                
            case 'rotate-down':
                // Manual rotation by adjusting the camera position
                const currentDistDown = camera.position.length();
                controls._spherical = controls._spherical || new THREE.Spherical().setFromVector3(camera.position);
                controls._spherical.phi = Math.max(
                    controls.minPolarAngle,
                    Math.min(controls.maxPolarAngle, controls._spherical.phi + rotateStep)
                );
                camera.position.setFromSpherical(controls._spherical).multiplyScalar(currentDistDown);
                controls.update();
                break;
                
            case 'rotate-left':
                // Manual rotation by adjusting the camera position
                const currentDistLeft = camera.position.length();
                controls._spherical = controls._spherical || new THREE.Spherical().setFromVector3(camera.position);
                controls._spherical.theta += rotateStep;
                camera.position.setFromSpherical(controls._spherical).multiplyScalar(currentDistLeft);
                controls.update();
                break;
                
            case 'rotate-right':
                // Manual rotation by adjusting the camera position
                const currentDistRight = camera.position.length();
                controls._spherical = controls._spherical || new THREE.Spherical().setFromVector3(camera.position);
                controls._spherical.theta -= rotateStep;
                camera.position.setFromSpherical(controls._spherical).multiplyScalar(currentDistRight);
                controls.update();
                break;
                
            case 'zoom-in':
                // Use a simpler approach for zooming - adjust distance directly
                const zoomInVector = new THREE.Vector3().subVectors(camera.position, controls.target);
                zoomInVector.multiplyScalar(1 / zoomStep);
                camera.position.copy(controls.target).add(zoomInVector);
                controls.update();
                break;
                
            case 'zoom-out':
                // Use a simpler approach for zooming - adjust distance directly
                const zoomOutVector = new THREE.Vector3().subVectors(camera.position, controls.target);
                zoomOutVector.multiplyScalar(zoomStep);
                camera.position.copy(controls.target).add(zoomOutVector);
                controls.update();
                break;
                
            case 'move-up':
                camera.position.y += moveStep;
                controls.update();
                break;
                
            case 'move-down':
                camera.position.y -= moveStep;
                controls.update();
                break;
                
            case 'move-left':
                camera.position.x -= moveStep;
                controls.update();
                break;
                
            case 'move-right':
                camera.position.x += moveStep;
                controls.update();
                break;
                
            case 'reset-camera':
                // Use the controls.reset() method if available, otherwise set default camera position
                if (controls.reset) {
                    controls.reset();
                } else {
                    // Set default camera position and target
                    camera.position.set(0, 0, 40);
                    controls.target.set(0, 0, 0);
                    controls.update();
                }
                break;
                
            case 'toggle-rotation':
                // Safely toggle autoRotate if supported by the controls
                if (this.app.config && controls) {
                    // Initialize autoRotate if it doesn't exist yet
                    if (typeof controls.autoRotate === 'undefined') {
                        controls.autoRotate = false;
                    }
                    
                    // Toggle the value
                    controls.autoRotate = !controls.autoRotate;
                    
                    // Update app config if it exists
                    if (this.app.config) {
                        this.app.config.autoRotate = controls.autoRotate;
                    }
                    
                    // Update description for screen reader
                    description = controls.autoRotate ? 'Auto-rotation enabled' : 'Auto-rotation disabled';
                }
                break;
                
            default:
                actionPerformed = false;
                break;
        }
        
        if (actionPerformed) {
            // Prevent default behavior like scrolling
            event.preventDefault();
            
            // Announce action to screen readers
            this.announce(description);
            
            // Play feedback sound if available
            if (this.app.audioManager && this.app.audioManager.playUISound) {
                this.app.audioManager.playUISound('navigation');
            }
        }
    }
    
    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announce(message) {
        if (!this.announcer) return;
        
        // Set the message
        this.announcer.textContent = message;
        
        // Clear after a delay (improves screen reader behavior)
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 1000);
    }
    
    /**
     * Enable or disable keyboard controls
     * @param {boolean} enabled - Whether keyboard controls should be enabled
     */
    setKeyboardControlsEnabled(enabled) {
        this.keyboardControlsEnabled = enabled;
        
        // Announce change to screen readers
        if (enabled) {
            this.announce('Keyboard controls enabled');
        } else {
            this.announce('Keyboard controls disabled');
        }
    }
    
    /**
     * Show keyboard help overlay
     */
    showKeyboardHelp() {
        if (this.helpElement) {
            this.helpElement.classList.add('visible');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.helpElement.classList.remove('visible');
            }, 5000);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Remove DOM elements
        if (this.announcer && this.announcer.parentNode) {
            this.announcer.parentNode.removeChild(this.announcer);
        }
        
        if (this.helpElement && this.helpElement.parentNode) {
            this.helpElement.parentNode.removeChild(this.helpElement);
        }
        
        // Reset canvas attributes if it exists
        if (this.app.canvas) {
            this.app.canvas.removeAttribute('tabindex');
            this.app.canvas.removeAttribute('role');
            this.app.canvas.removeAttribute('aria-label');
            this.app.canvas.removeEventListener('focus', this.onCanvasFocus);
            this.app.canvas.removeEventListener('blur', this.onCanvasBlur);
        }
        
        console.log('AccessibilityManager disposed');
    }
} 