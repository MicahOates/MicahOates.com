import * as THREE from 'three';

export class UIManager {
    constructor(app) {
        this.app = app;
        this.orbs = [];
        this.orbData = [];
        this.connections = [];
        this.currentSection = null;
        this.fragments = [];
    }
    
    /**
     * Initialize UI elements
     */
    init() {
        this.initOrbs();
        this.setupEventListeners();
        this.updateOrbPositions();
    }
    
    /**
     * Initialize navigation orbs
     */
    initOrbs() {
        // Get orb elements from DOM
        const orbElements = document.querySelectorAll('.orb');
        
        // Create orb data structure
        this.orbData = Array.from(orbElements).map((el, index) => {
            const position = new THREE.Vector3();
            const targetPosition = new THREE.Vector3();
            const velocity = new THREE.Vector3();
            
            return {
                element: el,
                label: el.getAttribute('data-label') || el.textContent,
                href: el.getAttribute('href'),
                position,
                targetPosition,
                velocity,
                size: 1,
                index,
                active: false
            };
        });
        
        // Create quantum connections between orbs
        for (let i = 0; i < this.orbData.length; i++) {
            for (let j = i + 1; j < this.orbData.length; j++) {
                this.createQuantumConnection(this.orbData[i], this.orbData[j]);
            }
        }
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Orb hover effects
        this.orbData.forEach(orb => {
            orb.element.addEventListener('mouseenter', () => {
                orb.active = true;
                orb.element.classList.add('active');
                
                // Create quantum fluctuation effect
                this.app.particleSystem.increaseParticleActivity(0.3);
            });
            
            orb.element.addEventListener('mouseleave', () => {
                orb.active = false;
                orb.element.classList.remove('active');
            });
            
            orb.element.addEventListener('click', (event) => {
                event.preventDefault();
                
                // Navigate to section
                const target = orb.href;
                this.navigateToSection(target.replace('#', ''));
                
                // Create quantum fluctuation effect
                if (this.app.particleSystem && orb.position) {
                    const worldPos = new THREE.Vector3(
                        orb.position.x,
                        orb.position.y,
                        10
                    );
                    this.app.particleSystem.createQuantumFluctuationEffect(worldPos, 1.0);
                }
            });
        });
        
        // Data input field
        const dataInput = document.getElementById('data-input');
        if (dataInput) {
            dataInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && dataInput.value.trim() !== '') {
                    this.createDataFragment(dataInput.value);
                    dataInput.value = '';
                }
            });
            
            // Create subtle key press effect on any key
            dataInput.addEventListener('keyup', () => {
                this.createKeyPressEffect();
            });
        }
    }
    
    /**
     * Update orb positions on window resize or animation
     */
    updateOrbPositions() {
        const containerRect = document.getElementById('container').getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        // Determine layout based on orb count and screen size
        const radius = Math.min(containerRect.width, containerRect.height) * 0.3;
        const angleStep = (Math.PI * 2) / this.orbData.length;
        
        // Position orbs in a circle around the center
        this.orbData.forEach((orb, index) => {
            const angle = angleStep * index;
            
            // Set target positions
            orb.targetPosition.x = centerX + Math.cos(angle) * radius;
            orb.targetPosition.y = centerY + Math.sin(angle) * radius;
            orb.targetPosition.z = 0;
            
            // Convert from screen coordinates to normalized device coordinates (NDC)
            const ndcX = (orb.targetPosition.x / containerRect.width) * 2 - 1;
            const ndcY = -(orb.targetPosition.y / containerRect.height) * 2 + 1;
            
            // Project NDC coordinates to world space
            const worldPos = new THREE.Vector3(ndcX * 20, ndcY * 20, 0);
            
            // Update orb element position
            orb.element.style.left = `${orb.targetPosition.x}px`;
            orb.element.style.top = `${orb.targetPosition.y}px`;
            
            // Store world position for 3D effects
            orb.position.copy(worldPos);
        });
        
        // Update connection lines
        this.updateQuantumConnections();
    }
    
    /**
     * Create a quantum connection between two orbs
     */
    createQuantumConnection(orb1, orb2) {
        // Create connection line element
        const connection = document.createElement('div');
        connection.classList.add('quantum-connection');
        document.getElementById('orbs').appendChild(connection);
        
        // Store connection data
        const connectionData = {
            element: connection,
            orb1,
            orb2,
            active: false,
            opacity: 0.5,
            width: 1
        };
        
        this.connections.push(connectionData);
        
        // Update connection
        this.updateQuantumConnection(connectionData);
    }
    
    /**
     * Update a quantum connection line based on orb positions
     */
    updateQuantumConnection(connection) {
        const { orb1, orb2, element } = connection;
        
        // Calculate line position and length
        const x1 = orb1.targetPosition.x;
        const y1 = orb1.targetPosition.y;
        const x2 = orb2.targetPosition.x;
        const y2 = orb2.targetPosition.y;
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        // Apply styles to the connection line
        element.style.width = `${length}px`;
        element.style.left = `${x1}px`;
        element.style.top = `${y1}px`;
        element.style.transform = `rotate(${angle}deg)`;
        
        // Adjust opacity based on orb activity
        const baseOpacity = 0.2;
        const activeOpacity = 0.8;
        
        if (orb1.active || orb2.active) {
            connection.active = true;
            connection.opacity = activeOpacity;
        } else {
            connection.active = false;
            connection.opacity = baseOpacity;
        }
        
        element.style.opacity = connection.opacity;
    }
    
    /**
     * Update all quantum connections
     */
    updateQuantumConnections() {
        this.connections.forEach(connection => {
            this.updateQuantumConnection(connection);
        });
    }
    
    /**
     * Navigate to a section
     */
    navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show requested section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            this.currentSection = sectionId;
            
            // Lazy load section content if needed
            this.handleSectionLazyLoad(section);
        }
    }
    
    /**
     * Handle lazy loading of section content
     */
    handleSectionLazyLoad(section) {
        // Load any lazy images in the section
        section.querySelectorAll('[data-src]').forEach(element => {
            const src = element.getAttribute('data-src');
            if (src) {
                if (element.tagName === 'IMG') {
                    element.src = src;
                } else {
                    element.style.backgroundImage = `url(${src})`;
                }
                element.removeAttribute('data-src');
            }
        });
        
        // Execute any lazyload scripts
        section.querySelectorAll('script[data-lazy]').forEach(script => {
            const newScript = document.createElement('script');
            Array.from(script.attributes).forEach(attr => {
                if (attr.name !== 'data-lazy') {
                    newScript.setAttribute(attr.name, attr.value);
                }
            });
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
    }
    
    /**
     * Update quantum state based on mouse position
     */
    updateQuantumState(mouseX, mouseY) {
        // Convert from normalized device coordinates to screen coordinates
        const containerRect = document.getElementById('container').getBoundingClientRect();
        const screenX = ((mouseX + 1) / 2) * containerRect.width;
        const screenY = ((1 - mouseY) / 2) * containerRect.height;
        
        // Calculate distance from each orb to mouse position
        this.orbData.forEach(orb => {
            const dx = screenX - orb.targetPosition.x;
            const dy = screenY - orb.targetPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Apply subtle attraction/repulsion based on distance
            const threshold = 200;
            const maxForce = 50;
            const force = maxForce * (1 - Math.min(distance, threshold) / threshold);
            
            if (distance < threshold) {
                // Apply slight force away from mouse (quantum repulsion)
                const angle = Math.atan2(dy, dx);
                orb.velocity.x -= Math.cos(angle) * force * 0.01;
                orb.velocity.y -= Math.sin(angle) * force * 0.01;
            }
        });
    }
    
    /**
     * Create data fragment from user input
     */
    createDataFragment(text) {
        if (!text || text.trim() === '') return;
        
        // Create data fragment object
        const fragment = {
            id: Date.now(),
            text: text.trim(),
            position: new THREE.Vector3(0, -10, 0),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() + 0.5) * 0.5,
                (Math.random() - 0.5) * 0.2
            ),
            element: null,
            active: true,
            opacity: 1,
            size: 1,
            age: 0,
            lifetime: 8 + Math.random() * 4,
            absorbed: false
        };
        
        // Create DOM element for fragment
        fragment.element = this.createTextSprite(fragment.text);
        document.getElementById('container').appendChild(fragment.element);
        
        // Create data stream effect
        this.createDataStreamEffect(fragment);
        
        // Add fragment to collection
        this.fragments.push(fragment);
        
        // Increase particle activity
        if (this.app.particleSystem) {
            this.app.particleSystem.increaseParticleActivity(0.5);
        }
        
        // Create absorption effect when fragment reaches the center
        setTimeout(() => {
            if (fragment.active && !fragment.absorbed) {
                this.createAbsorptionEffect(fragment);
            }
        }, 3000);
    }
    
    /**
     * Create text sprite element for data fragment
     */
    createTextSprite(text) {
        const element = document.createElement('div');
        element.className = 'data-fragment';
        element.textContent = text;
        
        // Apply random rotation for visual interest
        const rotation = -15 + Math.random() * 30;
        element.style.transform = `rotate(${rotation}deg)`;
        
        return element;
    }
    
    /**
     * Create visual effect for data stream
     */
    createDataStreamEffect(fragment) {
        // Implementation would create a particle trail behind the fragment
        // Placeholder for module structure
    }
    
    /**
     * Create effect for when data is absorbed by the black hole
     */
    createAbsorptionEffect(fragment) {
        // Mark as absorbed
        fragment.absorbed = true;
        
        // Display absorption effect
        fragment.element.classList.add('absorbed');
        
        // Remove fragment after animation
        setTimeout(() => {
            this.removeFragment(fragment);
        }, 1500);
    }
    
    /**
     * Create subtle effect on key press
     */
    createKeyPressEffect() {
        // Implementation would create a ripple or particle effect
        // Placeholder for module structure
    }
    
    /**
     * Remove a fragment from the scene
     */
    removeFragment(fragment) {
        // Remove from DOM
        if (fragment.element && fragment.element.parentNode) {
            fragment.element.parentNode.removeChild(fragment.element);
        }
        
        // Remove from collection
        const index = this.fragments.indexOf(fragment);
        if (index !== -1) {
            this.fragments.splice(index, 1);
        }
    }
    
    /**
     * Update fragments
     */
    updateFragments(time) {
        this.fragments.forEach(fragment => {
            if (!fragment.active) return;
            
            // Update age
            fragment.age += 0.016; // Approx. time step
            
            // Remove if past lifetime and not absorbed
            if (fragment.age > fragment.lifetime && !fragment.absorbed) {
                fragment.element.classList.add('fading');
                
                setTimeout(() => {
                    this.removeFragment(fragment);
                }, 1000);
                
                fragment.active = false;
                return;
            }
            
            // Update position
            fragment.position.add(fragment.velocity);
            
            // Apply gravity towards center (black hole)
            const blackHolePos = new THREE.Vector3(0, 0, 0);
            const dirToCenter = blackHolePos.clone().sub(fragment.position).normalize();
            const distToCenter = fragment.position.distanceTo(blackHolePos);
            
            // Stronger pull as it gets closer
            const gravityStrength = Math.max(0.0001, 0.01 / Math.max(1, distToCenter));
            fragment.velocity.add(dirToCenter.multiplyScalar(gravityStrength));
            
            // Apply slight damping to prevent excessive speed
            fragment.velocity.multiplyScalar(0.99);
            
            // Convert 3D position to screen space
            const containerRect = document.getElementById('container').getBoundingClientRect();
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;
            
            // Position is relative to center
            const screenX = centerX + fragment.position.x * 20; // Scale factor for screen space
            const screenY = centerY + fragment.position.y * 20;
            
            // Update DOM element
            fragment.element.style.left = `${screenX}px`;
            fragment.element.style.top = `${screenY}px`;
            
            // Scale based on distance to center
            const scale = Math.max(0.2, Math.min(1, 1 - distToCenter * 0.1));
            fragment.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
            
            // Update opacity
            fragment.opacity = Math.min(1, Math.max(0, 1 - fragment.age / fragment.lifetime));
            fragment.element.style.opacity = fragment.opacity;
        });
    }
    
    /**
     * Update method called on each frame
     */
    update(time) {
        // Update orb positions with physics
        this.orbData.forEach(orb => {
            // Apply velocity to position
            orb.position.x += orb.velocity.x;
            orb.position.y += orb.velocity.y;
            
            // Apply spring force to return to target position
            orb.velocity.x += (orb.targetPosition.x - orb.position.x) * 0.1;
            orb.velocity.y += (orb.targetPosition.y - orb.position.y) * 0.1;
            
            // Apply damping
            orb.velocity.multiplyScalar(0.9);
        });
        
        // Update quantum connections
        this.updateQuantumConnections();
        
        // Update data fragments
        this.updateFragments(time);
    }
} 