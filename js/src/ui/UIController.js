import * as THREE from 'three';

/**
 * UIController - Handles client-side UI elements and interaction with the 3D UI Manager
 */
export class UIController {
    constructor(app) {
        this.app = app;
        
        // DOM elements
        this.container = null;
        this.navbar = null;
        this.contentPanel = null;
        this.loadingIndicator = null;
        this.infoPanel = null;
        
        // Section content cache
        this.sectionContent = {
            intro: null,
            physics: null,
            visualize: null,
            explore: null
        };
        
        // Current state
        this.currentSection = null;
        this.isTransitioning = false;
        this.isUiVisible = true;
        
        // Bind event handlers
        this.handleSectionChange = this.onSectionChange.bind(this);
        this.handleKeyPress = this.onKeyPress.bind(this);
        this.handleMouseIdle = this.onMouseIdle.bind(this);
        this.handleInfoButtonClick = this.onInfoButtonClick.bind(this);
        
        // Mouse activity tracking
        this.mouseIdleTimer = null;
        this.mouseIdleDelay = 5000; // 5 seconds
        
        // DOM Elements
        this.dataInput = null;
        this.themeToggle = null;
        this.orbsContainer = null;
        
        // State
        this.isInputActive = false;
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        
        // Touch support
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTouchTime = 0;
        this.isTouching = false;
        this.touchTimeout = null;
        
        // Gestures
        this.isGestureInProgress = false;
        this.pinchStartDistance = 0;
        this.lastPinchDistance = 0;
        
        // Mobile detection
        this.isMobile = this.detectMobile();
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    init() {
        this.createDOMElements();
        this.setupEventListeners();
        this.loadInitialContent();
        this.showWelcomeMessage();
        
        // Get DOM elements
        this.dataInput = document.getElementById('data-input');
        this.themeToggle = document.getElementById('theme-toggle');
        this.orbsContainer = document.getElementById('orbs');
        
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Add mobile-specific class if needed
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            this.setupMobileOptimizations();
        }
    }
    
    /**
     * Create DOM elements for UI
     */
    createDOMElements() {
        // Main container for UI elements
        this.container = document.createElement('div');
        this.container.className = 'ui-container';
        document.body.appendChild(this.container);
        
        // Navigation bar
        this.navbar = document.createElement('nav');
        this.navbar.className = 'nav-bar';
        this.container.appendChild(this.navbar);
        
        // Create navigation items
        const navItems = [
            { id: 'intro', label: 'INTRO' },
            { id: 'physics', label: 'PHYSICS' },
            { id: 'visualize', label: 'VISUALIZE' },
            { id: 'explore', label: 'EXPLORE' }
        ];
        
        navItems.forEach(item => {
            const navButton = document.createElement('button');
            navButton.className = 'nav-button';
            navButton.dataset.section = item.id;
            navButton.textContent = item.label;
            navButton.addEventListener('click', () => this.navigateToSection(item.id));
            this.navbar.appendChild(navButton);
        });
        
        // Content panel
        this.contentPanel = document.createElement('div');
        this.contentPanel.className = 'content-panel';
        this.container.appendChild(this.contentPanel);
        
        // Loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'loading-indicator';
        this.loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Loading quantum data...</div>
        `;
        this.container.appendChild(this.loadingIndicator);
        
        // Info button
        this.infoButton = document.createElement('button');
        this.infoButton.className = 'info-button';
        this.infoButton.innerHTML = '<span>i</span>';
        this.container.appendChild(this.infoButton);
        
        // Info panel
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'info-panel';
        this.infoPanel.innerHTML = `
            <div class="info-content">
                <h2>Black Hole Visualization</h2>
                <p>This interactive experience demonstrates the physics of black holes through 3D visualization.</p>
                <h3>Controls:</h3>
                <ul>
                    <li><strong>Mouse:</strong> Look around</li>
                    <li><strong>Click orbs:</strong> Navigate to sections</li>
                    <li><strong>H key:</strong> Toggle UI visibility</li>
                    <li><strong>ESC key:</strong> Return to overview</li>
                </ul>
                <button class="close-button">Close</button>
            </div>
        `;
        this.container.appendChild(this.infoPanel);
        
        // Close button for info panel
        const closeButton = this.infoPanel.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.infoPanel.classList.remove('active');
        });
        
        // Apply initial styles
        this.applyStyles();
    }
    
    /**
     * Apply CSS styles to UI elements
     */
    applyStyles() {
        // Create style element
        const style = document.createElement('style');
        style.textContent = `
            .ui-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
                font-family: 'Arial', sans-serif;
                transition: opacity 0.5s ease;
            }
            
            .nav-bar {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 20px;
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 30px;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                pointer-events: auto;
                z-index: 1001;
            }
            
            .nav-button {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 1px;
                padding: 8px 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-radius: 20px;
                outline: none;
            }
            
            .nav-button:hover {
                color: #ffffff;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .nav-button.active {
                color: #ffffff;
                background: rgba(255, 255, 255, 0.2);
            }
            
            .content-panel {
                position: fixed;
                bottom: 40px;
                left: 40px;
                width: 360px;
                max-height: 70vh;
                overflow-y: auto;
                background: rgba(10, 10, 20, 0.7);
                backdrop-filter: blur(10px);
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.5s ease, transform 0.5s ease;
                pointer-events: auto;
                color: #ffffff;
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
            }
            
            .content-panel.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .content-panel h2 {
                margin-top: 0;
                font-size: 24px;
                margin-bottom: 20px;
                color: #ffffff;
            }
            
            .content-panel p {
                margin-bottom: 15px;
                line-height: 1.6;
                font-size: 16px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .content-panel code {
                background: rgba(30, 30, 50, 0.7);
                padding: 3px 6px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
            }
            
            .content-panel pre {
                background: rgba(30, 30, 50, 0.7);
                padding: 15px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 20px 0;
            }
            
            .loading-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .loading-indicator.visible {
                opacity: 1;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid rgba(255, 255, 255, 1);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .loading-text {
                color: white;
                font-size: 16px;
                letter-spacing: 1px;
            }
            
            .info-button {
                position: fixed;
                bottom: 40px;
                right: 40px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.4);
                color: white;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .info-button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            .info-panel {
                position: fixed;
                bottom: 100px;
                right: 40px;
                width: 320px;
                background: rgba(20, 20, 40, 0.85);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                padding: 25px;
                transform: translateY(20px);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s ease, transform 0.4s ease;
                max-height: 70vh;
                overflow-y: auto;
                color: white;
            }
            
            .info-panel.active {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            
            .info-panel h2 {
                margin-top: 0;
                font-size: 20px;
                margin-bottom: 15px;
            }
            
            .info-panel h3 {
                margin: 15px 0 10px 0;
                font-size: 16px;
            }
            
            .info-panel p {
                margin-bottom: 15px;
                line-height: 1.5;
            }
            
            .info-panel ul {
                margin-left: 20px;
                margin-bottom: 20px;
            }
            
            .info-panel li {
                margin-bottom: 8px;
            }
            
            .close-button {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 15px;
                transition: background 0.3s ease;
            }
            
            .close-button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .ui-hidden {
                opacity: 0;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @media (max-width: 768px) {
                .nav-bar {
                    top: auto;
                    bottom: 20px;
                    gap: 10px;
                    padding: 8px 12px;
                }
                
                .nav-button {
                    font-size: 12px;
                    padding: 6px 10px;
                }
                
                .content-panel {
                    width: calc(100% - 40px);
                    left: 20px;
                    bottom: 80px;
                    max-height: 50vh;
                }
                
                .info-button {
                    bottom: 90px;
                    right: 20px;
                    width: 36px;
                    height: 36px;
                }
                
                .info-panel {
                    bottom: 140px;
                    right: 20px;
                    width: calc(100% - 40px);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for section changes from UI Manager
        window.addEventListener('sectionchange', this.handleSectionChange);
        
        // Keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyPress);
        
        // Mouse activity for UI hiding
        document.addEventListener('mousemove', this.resetMouseIdleTimer.bind(this));
        document.addEventListener('click', this.resetMouseIdleTimer.bind(this));
        document.addEventListener('touchstart', this.resetMouseIdleTimer.bind(this));
        
        // Info button
        this.infoButton.addEventListener('click', this.handleInfoButtonClick);
        
        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Data input field
        if (this.dataInput) {
            this.dataInput.addEventListener('focus', () => this.handleInputFocus());
            this.dataInput.addEventListener('blur', () => this.handleInputBlur());
            this.dataInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }
        
        // Touch events for mobile interactions
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Add double-tap handler for mobile devices
        if (this.isMobile) {
            document.addEventListener('click', this.handleClick.bind(this));
        }
        
        // Listen for keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }
    
    /**
     * Load initial content for sections
     */
    loadInitialContent() {
        // Preload content for each section
        this.loadSectionContent('intro');
        
        // The other sections will be loaded on demand
    }
    
    /**
     * Load content for a specific section
     */
    loadSectionContent(sectionId) {
        if (this.sectionContent[sectionId]) {
            return Promise.resolve(this.sectionContent[sectionId]);
        }
        
        this.showLoading(true);
        
        // Mock loading content from server
        return new Promise(resolve => {
            setTimeout(() => {
                const content = this.generateSectionContent(sectionId);
                this.sectionContent[sectionId] = content;
                this.showLoading(false);
                resolve(content);
            }, 800); // Simulate network delay
        });
    }
    
    /**
     * Generate content for a section (placeholder)
     */
    generateSectionContent(sectionId) {
        // In a real app, this would load content from a server or JSON file
        // This is a placeholder implementation
        const sections = {
            intro: `
                <h2>Introduction to Black Holes</h2>
                <p>Welcome to this interactive visualization of black holes and their effects on spacetime. Black holes are regions of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it.</p>
                <p>This application demonstrates several key phenomena associated with black holes:</p>
                <ul>
                    <li>Gravitational lensing</li>
                    <li>Event horizon</li>
                    <li>Time dilation</li>
                    <li>Accretion disk formation</li>
                </ul>
                <p>Navigate through the different sections using the quantum navigation orbs. Each section explores different aspects of black hole physics and visualization techniques.</p>
                <p>The visualization is built using Three.js and WebGL, allowing real-time simulation of complex gravitational effects.</p>
            `,
            physics: `
                <h2>Black Hole Physics</h2>
                <p>Black holes are described by Einstein's theory of general relativity. A black hole is characterized by its mass, charge, and angular momentum, which determine its effects on surrounding spacetime.</p>
                <p>The boundary of a black hole is called the event horizon, beyond which events cannot affect an outside observer. Light emitted from inside the event horizon can never reach the observer.</p>
                <h3>Key Equations</h3>
                <p>The Schwarzschild radius (Rs) determines the size of a non-rotating black hole:</p>
                <pre><code>Rs = 2GM/c²</code></pre>
                <p>Where G is the gravitational constant, M is the mass, and c is the speed of light.</p>
                <p>The gravitational time dilation near a black hole is given by:</p>
                <pre><code>t' = t × √(1 - Rs/r)</code></pre>
                <p>Where t' is the dilated time, t is the time measured by a distant observer, and r is the distance from the black hole center.</p>
                <p>The simulation implements these equations to create physically accurate visualizations.</p>
            `,
            visualize: `
                <h2>Visualization Techniques</h2>
                <p>This simulation employs several advanced visualization techniques to render the complex physics of black holes:</p>
                <h3>Shader Implementation</h3>
                <p>Custom GLSL shaders are used to calculate gravitational lensing and time dilation effects in real-time on the GPU. This allows for smooth performance even with complex calculations.</p>
                <p>The gravitational lensing shader computes light ray deflection based on the Schwarzschild metric:</p>
                <pre><code>// Simplified lensing calculation
vec3 calculateLensing(vec3 rayDir, vec3 blackHolePos, float mass) {
    float distance = length(blackHolePos);
    float deflection = 2.0 * mass / distance;
    // Apply deflection to ray direction
    // ...
}</code></pre>
                <h3>Rendering Pipeline</h3>
                <p>The rendering pipeline includes several post-processing effects:</p>
                <ul>
                    <li>Gravitational lensing (ray bending)</li>
                    <li>Doppler and gravitational redshift</li>
                    <li>Relativistic beaming</li>
                    <li>Accretion disk simulation</li>
                </ul>
                <p>These effects are composited together to create the final visualization.</p>
            `,
            explore: `
                <h2>Interactive Exploration</h2>
                <p>This interactive simulation allows you to explore different aspects of black hole physics through direct manipulation and parameter adjustments.</p>
                <p>Key interactions include:</p>
                <ul>
                    <li>Changing the black hole mass</li>
                    <li>Adjusting observer distance</li>
                    <li>Modifying accretion disk properties</li>
                    <li>Toggling visualization components</li>
                </ul>
                <p>Future updates will include:</p>
                <ul>
                    <li>Multiple black hole systems</li>
                    <li>Wormhole visualization</li>
                    <li>Interactive particle trajectories</li>
                    <li>VR/AR support for immersive exploration</li>
                </ul>
                <p>Stay tuned for more features as we continue to expand this visualization tool.</p>
            `
        };
        
        return sections[sectionId] || '<p>Content not available</p>';
    }
    
    /**
     * Show loading indicator
     */
    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.add('visible');
        } else {
            this.loadingIndicator.classList.remove('visible');
        }
    }
    
    /**
     * Show welcome message on startup
     */
    showWelcomeMessage() {
        this.contentPanel.innerHTML = `
            <h2>Welcome to Black Hole Explorer</h2>
            <p>Click on the quantum navigation orbs to explore different aspects of black hole physics and visualization.</p>
            <p>Each orb represents a section of the experience:</p>
            <ul>
                <li><strong>INTRO</strong> - Introduction to black holes</li>
                <li><strong>PHYSICS</strong> - The physics behind black holes</li>
                <li><strong>VISUALIZE</strong> - Visualization techniques used</li>
                <li><strong>EXPLORE</strong> - Interactive exploration</li>
            </ul>
            <p>You can navigate using the orbs in 3D space or the navigation bar above.</p>
        `;
        
        setTimeout(() => {
            this.contentPanel.classList.add('visible');
        }, 500);
    }
    
    /**
     * Navigate to a section
     */
    navigateToSection(sectionId) {
        if (this.isTransitioning || sectionId === this.currentSection) return;
        
        this.isTransitioning = true;
        
        // First hide current content
        this.contentPanel.classList.remove('visible');
        
        // Update the 3D UI
        if (this.app.uiManager) {
            this.app.uiManager.activateSection(sectionId);
        }
        
        // Update active button in navbar
        this.updateNavHighlight(sectionId);
        
        // After a short delay, load and show new content
        setTimeout(() => {
            this.loadSectionContent(sectionId)
                .then(content => {
                    this.contentPanel.innerHTML = content;
                    this.contentPanel.scrollTop = 0;
                    
                    setTimeout(() => {
                        this.contentPanel.classList.add('visible');
                        this.currentSection = sectionId;
                        this.isTransitioning = false;
                    }, 100);
                });
        }, 400);
    }
    
    /**
     * Update navigation highlight
     */
    updateNavHighlight(sectionId) {
        // Remove active class from all buttons
        const navButtons = this.navbar.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to current section button
        if (sectionId) {
            const activeButton = this.navbar.querySelector(`.nav-button[data-section="${sectionId}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }
    
    /**
     * Section change event handler
     */
    onSectionChange(event) {
        const sectionId = event.detail.sectionId;
        
        // If null, we're returning to overview
        if (sectionId === null) {
            this.contentPanel.classList.remove('visible');
            this.updateNavHighlight(null);
            this.currentSection = null;
            return;
        }
        
        // Only load new content if we're not already transitioning
        if (!this.isTransitioning && sectionId !== this.currentSection) {
            this.navigateToSection(sectionId);
        }
    }
    
    /**
     * Key press event handler
     */
    onKeyPress(event) {
        switch (event.key) {
            case 'Escape':
                // Return to overview
                if (this.app.uiManager) {
                    this.app.uiManager.deactivateAllSections();
                }
                break;
                
            case 'h':
            case 'H':
                // Toggle UI visibility
                this.toggleUIVisibility();
                break;
        }
    }
    
    /**
     * Toggle UI visibility
     */
    toggleUIVisibility() {
        this.isUiVisible = !this.isUiVisible;
        
        if (this.isUiVisible) {
            this.container.classList.remove('ui-hidden');
        } else {
            this.container.classList.add('ui-hidden');
        }
    }
    
    /**
     * Reset mouse idle timer
     */
    resetMouseIdleTimer() {
        // Clear existing timer
        if (this.mouseIdleTimer) {
            clearTimeout(this.mouseIdleTimer);
        }
        
        // If UI is hidden, show it immediately on mouse movement
        if (!this.isUiVisible) {
            this.toggleUIVisibility();
        }
        
        // Set new timer
        this.mouseIdleTimer = setTimeout(this.handleMouseIdle, this.mouseIdleDelay);
    }
    
    /**
     * Handle mouse idle event
     */
    onMouseIdle() {
        // Hide UI when mouse is idle
        if (this.isUiVisible) {
            this.toggleUIVisibility();
        }
    }
    
    /**
     * Info button click handler
     */
    onInfoButtonClick() {
        this.infoPanel.classList.toggle('active');
    }
    
    /**
     * Update method called on each frame
     */
    update(time) {
        // Update any animations or time-based UI elements
    }
    
    /**
     * Clean up resources and event listeners
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('sectionchange', this.handleSectionChange);
        window.removeEventListener('keydown', this.handleKeyPress);
        document.removeEventListener('mousemove', this.resetMouseIdleTimer);
        document.removeEventListener('click', this.resetMouseIdleTimer);
        document.removeEventListener('touchstart', this.resetMouseIdleTimer);
        
        // Clear timer
        if (this.mouseIdleTimer) {
            clearTimeout(this.mouseIdleTimer);
        }
        
        // Remove DOM elements
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
    
    /**
     * Set up mobile-specific optimizations
     */
    setupMobileOptimizations() {
        // Create mobile menu button if not exists
        if (!document.getElementById('mobile-menu-toggle')) {
            const menuToggle = document.createElement('button');
            menuToggle.id = 'mobile-menu-toggle';
            menuToggle.innerHTML = `<span></span><span></span><span></span>`;
            menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
            document.body.appendChild(menuToggle);
            
            // Add event listener
            menuToggle.addEventListener('click', () => {
                document.body.classList.toggle('menu-open');
                // Create section open sound if available
                if (this.app.audioManager && this.app.audioManager.createSectionOpenSound) {
                    this.app.audioManager.createSectionOpenSound();
                }
            });
        }
        
        // Create touch hint element if not exists
        if (!document.getElementById('touch-hint')) {
            const touchHint = document.createElement('div');
            touchHint.id = 'touch-hint';
            touchHint.className = 'fade-in';
            touchHint.innerHTML = `
                <div class="hint-container">
                    <div class="hint-icon">👆</div>
                    <div class="hint-text">Tap to interact<br>Pinch to zoom</div>
                </div>
            `;
            document.body.appendChild(touchHint);
            
            // Remove after 5 seconds
            setTimeout(() => {
                touchHint.classList.add('fade-out');
                setTimeout(() => {
                    if (touchHint.parentNode) {
                        touchHint.parentNode.removeChild(touchHint);
                    }
                }, 1000);
            }, 5000);
        }
    }
    
    /**
     * Detect if the device is mobile
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            // Single touch - start tracking for gestures
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isTouching = true;
            
            // Check for double tap
            const now = new Date().getTime();
            const timeSinceLastTouch = now - this.lastTouchTime;
            
            if (timeSinceLastTouch < 300) {
                // Double tap detected
                this.handleDoubleTap(e);
            }
            
            this.lastTouchTime = now;
        } else if (e.touches.length === 2) {
            // Pinch zoom gesture start
            this.isGestureInProgress = true;
            this.pinchStartDistance = this.getPinchDistance(e);
            this.lastPinchDistance = this.pinchStartDistance;
            
            // Prevent default to avoid page zooming
            if (!this.isInputElementTarget(e)) {
                e.preventDefault();
            }
        }
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        if (!this.isTouching) return;
        
        if (e.touches.length === 2 && this.isGestureInProgress) {
            // Handle pinch gesture for zooming
            const currentDistance = this.getPinchDistance(e);
            const delta = currentDistance - this.lastPinchDistance;
            
            // Apply zoom if distance changed enough
            if (Math.abs(delta) > 5 && this.app.sceneManager && this.app.sceneManager.controls) {
                const zoomDelta = delta * 0.01;
                const controls = this.app.sceneManager.controls;
                
                // Get current distance
                let distance = controls.getDistance();
                
                // Apply zoom change
                distance -= zoomDelta * distance;
                
                // Clamp to min/max
                distance = Math.max(controls.minDistance, Math.min(controls.maxDistance, distance));
                
                // Apply new distance
                controls.dollyTo(distance, false);
            }
            
            this.lastPinchDistance = currentDistance;
            
            // Prevent default to avoid page zooming
            if (!this.isInputElementTarget(e)) {
                e.preventDefault();
            }
        } else if (e.touches.length === 1 && !this.isGestureInProgress) {
            // Single finger drag - only if not touching an input
            if (!this.isInputElementTarget(e)) {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                
                // Calculate drag distance
                const deltaX = touchX - this.touchStartX;
                const deltaY = touchY - this.touchStartY;
                
                // If dragged far enough, handle rotation
                if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                    if (this.app.sceneManager && this.app.sceneManager.controls) {
                        // Manual orbit control
                        const controls = this.app.sceneManager.controls;
                        controls.rotateLeft(deltaX * 0.002);
                        controls.rotateUp(deltaY * 0.002);
                        
                        // Update touch start position
                        this.touchStartX = touchX;
                        this.touchStartY = touchY;
                    }
                }
            }
        }
    }
    
    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        this.isTouching = false;
        this.isGestureInProgress = false;
        
        // Clear any touch timeout
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
            this.touchTimeout = null;
        }
    }
    
    /**
     * Handle double tap
     * @param {TouchEvent} e - Touch event
     */
    handleDoubleTap(e) {
        // Don't process if touching input elements
        if (this.isInputElementTarget(e)) return;
        
        // Get tap location
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;
        
        // Check if tapping on an orb
        const orbElement = this.findTouchedOrb(x, y);
        if (orbElement) {
            // Simulate a click on the orb
            orbElement.click();
            return;
        }
        
        // Otherwise, reset camera to default position with animation
        if (this.app.sceneManager) {
            this.app.sceneManager.animateCameraTo(
                new THREE.Vector3(0, 0, 40), // Default position
                new THREE.Vector3(0, 0, 0),  // Look at center
                1.0                          // Animation duration
            );
        }
    }
    
    /**
     * Handle normal click (used for detecting double clicks on mobile)
     * @param {MouseEvent} e - Mouse event
     */
    handleClick(e) {
        const now = new Date().getTime();
        const timeSinceLastTouch = now - this.lastTouchTime;
        
        // Not touched recently - update last touch time
        if (timeSinceLastTouch > 500) {
            this.lastTouchTime = now;
        }
    }
    
    /**
     * Find which orb element was touched
     * @param {number} x - Touch X coordinate
     * @param {number} y - Touch Y coordinate
     * @returns {Element|null} - The touched orb element or null
     */
    findTouchedOrb(x, y) {
        if (!this.orbsContainer) return null;
        
        const orbs = this.orbsContainer.querySelectorAll('.orb');
        for (const orb of orbs) {
            const rect = orb.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return orb;
            }
        }
        
        return null;
    }
    
    /**
     * Get distance between two touch points
     * @param {TouchEvent} e - Touch event
     * @returns {number} - Distance between touch points
     */
    getPinchDistance(e) {
        if (e.touches.length < 2) return 0;
        
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check if touch/click is on an input element
     * @param {Event} e - Touch or mouse event
     * @returns {boolean} - True if target is an input element
     */
    isInputElementTarget(e) {
        const target = e.target;
        return target.tagName === 'INPUT' || 
               target.tagName === 'TEXTAREA' || 
               target.tagName === 'SELECT' || 
               target.tagName === 'BUTTON' ||
               target.classList.contains('close-btn');
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ignore if in an input field
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // Theme toggle with 'T' key
        if (e.key === 't' || e.key === 'T') {
            this.toggleTheme();
        }
        
        // ESC key to close active sections
        if (e.key === 'Escape') {
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                const closeBtn = activeSection.querySelector('.close-btn');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        }
        
        // Number keys 1-4 for navigation
        if (e.key >= '1' && e.key <= '4' && this.orbsContainer) {
            const orbs = this.orbsContainer.querySelectorAll('.orb');
            const index = parseInt(e.key) - 1;
            if (orbs[index]) {
                orbs[index].click();
            }
        }
    }
    
    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Store theme preference
        localStorage.setItem('theme', newTheme);
        this.currentTheme = newTheme;
    }
    
    /**
     * Apply theme to DOM and app
     */
    applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        
        // Update app visualization if available
        if (this.app && this.app.updateVisualsForTheme) {
            this.app.updateVisualsForTheme(theme);
        }
    }
    
    /**
     * Handle input field focus
     */
    handleInputFocus() {
        this.isInputActive = true;
        
        // Disable orbit controls temporarily when typing
        if (this.app.sceneManager && this.app.sceneManager.controls) {
            this.app.sceneManager.controls.enabled = false;
        }
    }
    
    /**
     * Handle input field blur
     */
    handleInputBlur() {
        this.isInputActive = false;
        
        // Re-enable orbit controls
        if (this.app.sceneManager && this.app.sceneManager.controls) {
            this.app.sceneManager.controls.enabled = true;
        }
    }
    
    /**
     * Handle keyboard input on data input field
     */
    handleInputKeydown(e) {
        if (e.key === 'Enter' && this.dataInput.value.trim() !== '') {
            const input = this.dataInput.value.trim();
            
            // Process input
            this.processUserInput(input);
            
            // Clear the input field
            this.dataInput.value = '';
        }
    }
    
    /**
     * Process user input from the data field
     */
    processUserInput(input) {
        // Create interactive particle effect if available
        if (this.app.particleSystem && this.app.particleSystem.createDataParticles) {
            this.app.particleSystem.createDataParticles(input);
        }
        
        // Create data input sound if available
        if (this.app.audioManager && this.app.audioManager.createDataInputSound) {
            this.app.audioManager.createDataInputSound(input.length);
        }
    }
} 