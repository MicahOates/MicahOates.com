import * as THREE from 'three';
import { 
    navigationOrbVertexShader, 
    navigationOrbFragmentShader,
    quantumConnectionVertexShader,
    quantumConnectionFragmentShader,
    dataFragmentVertexShader,
    dataFragmentFragmentShader,
    sectionBackgroundVertexShader,
    sectionBackgroundFragmentShader
} from '../shaders/UIShader.js';
import { UITextureGenerator } from '../utils/UITextureGenerator.js';

/**
 * UIManager - Handles the user interface components including navigation orbs and data visualizations
 */
export class UIManager {
    constructor(app) {
        this.app = app;
        
        // Settings
        this.settings = {
            orbRadius: 2.5,
            orbSegments: 32,
            orbCount: 4,
            connectionParticles: 100,
            fragmentCount: 30,
            navOrbDistance: 30, // Distance from center
            activeSection: null
        };
        
        // UI elements
        this.navigationOrbs = [];
        this.connections = [];
        this.dataFragments = [];
        this.sections = [];
        
        // Navigation data
        this.navData = [
            {
                id: 'intro',
                label: 'INTRO',
                position: new THREE.Vector3(0, 0, this.settings.navOrbDistance),
                color: this.app.getThemeColor('primary') || '#8844ff',
                glowColor: new THREE.Color(0xaaaaff),
                fragments: 3,
                fragmentTypes: ['text', 'code', 'data']
            },
            {
                id: 'physics',
                label: 'PHYSICS',
                position: new THREE.Vector3(this.settings.navOrbDistance, 0, 0),
                color: this.app.getThemeColor('secondary') || '#44aaff',
                glowColor: new THREE.Color(0x44ffff),
                fragments: 4,
                fragmentTypes: ['text', 'code', 'data', 'image']
            },
            {
                id: 'visualize',
                label: 'VISUALIZE',
                position: new THREE.Vector3(0, 0, -this.settings.navOrbDistance),
                color: this.app.getThemeColor('tertiary') || '#ff44aa',
                glowColor: new THREE.Color(0xffaa77),
                fragments: 3,
                fragmentTypes: ['code', 'image', 'data']
            },
            {
                id: 'explore',
                label: 'EXPLORE',
                position: new THREE.Vector3(-this.settings.navOrbDistance, 0, 0),
                color: '#55dd99',
                glowColor: new THREE.Color(0xaaffaa),
                fragments: 2,
                fragmentTypes: ['text', 'data']
            }
        ];
        
        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredOrb = null;
        this.interactionEnabled = true;
        
        // Group to hold all UI elements
        this.uiGroup = new THREE.Group();
        
        // Fragment textures
        this.fragmentTextures = {
            code: null,
            data: null,
            image: null,
            text: null
        };
        
        // Event handlers bound to this instance
        this.handleMouseMove = this.onMouseMove.bind(this);
        this.handleMouseClick = this.onClick.bind(this);
        this.handleTouchStart = this.onTouchStart.bind(this);
    }
    
    /**
     * Initialize the UI system
     */
    init() {
        // Generate fragment textures
        this.generateTextures();
        
        // Create UI elements
        this.createNavigationOrbs();
        this.createConnections();
        
        // Add UI group to scene
        this.app.scene.add(this.uiGroup);
        
        // Add event listeners
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('click', this.handleMouseClick);
        window.addEventListener('touchstart', this.handleTouchStart);
    }
    
    /**
     * Generate textures for UI elements
     */
    generateTextures() {
        // Generate fragment textures
        this.fragmentTextures = {
            code: UITextureGenerator.generateFragmentTexture('code'),
            data: UITextureGenerator.generateFragmentTexture('data'),
            image: UITextureGenerator.generateFragmentTexture('image'),
            text: UITextureGenerator.generateFragmentTexture('text')
        };
    }
    
    /**
     * Create navigation orbs
     */
    createNavigationOrbs() {
        // Clear any existing orbs
        if (this.navigationOrbs.length > 0) {
            this.navigationOrbs.forEach(orb => {
                if (orb.mesh) {
                    this.uiGroup.remove(orb.mesh);
                    orb.mesh.geometry.dispose();
                    orb.mesh.material.dispose();
                }
            });
            this.navigationOrbs = [];
        }
        
        // Create orbs for each navigation item
        this.navData.forEach(navItem => {
            this.createOrb(navItem);
        });
    }
    
    /**
     * Create a single navigation orb
     */
    createOrb(navItem) {
        // Create geometry
        const geometry = new THREE.SphereGeometry(
            this.settings.orbRadius, 
            this.settings.orbSegments, 
            this.settings.orbSegments
        );
        
        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                orbColor: { value: new THREE.Color(navItem.color) },
                glowColor: { value: navItem.glowColor || new THREE.Color(0xffffff) },
                time: { value: 0 },
                hoverState: { value: 0 },
                activeState: { value: 0 },
                opacity: { value: 0.9 }
            },
            vertexShader: navigationOrbVertexShader,
            fragmentShader: navigationOrbFragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(navItem.position);
        mesh.userData.id = navItem.id;
        mesh.userData.type = 'navigationOrb';
        mesh.userData.label = navItem.label;
        
        // Add to group
        this.uiGroup.add(mesh);
        
        // Create data fragments for this orb
        const fragments = this.createDataFragments(navItem);
        
        // Store orb data
        this.navigationOrbs.push({
            id: navItem.id,
            label: navItem.label,
            position: navItem.position.clone(),
            color: navItem.color,
            mesh: mesh,
            fragments: fragments,
            active: false,
            hoverProgress: 0
        });
        
        // Create section for this orb
        this.createSection(navItem);
    }
    
    /**
     * Create data fragments around an orb
     */
    createDataFragments(navItem) {
        const fragments = [];
        const fragmentCount = navItem.fragments || Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < fragmentCount; i++) {
            // Determine fragment type
            let fragmentType = 'data';
            if (navItem.fragmentTypes && navItem.fragmentTypes.length > 0) {
                fragmentType = navItem.fragmentTypes[i % navItem.fragmentTypes.length];
            }
            
            // Get fragment texture
            const texture = this.fragmentTextures[fragmentType];
            
            // Create fragment
            const fragment = this.createFragment(
                navItem.position, 
                navItem.color, 
                fragmentType,
                texture
            );
            
            fragments.push(fragment);
            this.dataFragments.push(fragment);
        }
        
        return fragments;
    }
    
    /**
     * Create a single data fragment
     */
    createFragment(centerPosition, color, type, texture) {
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        
        // Create position - randomly distributed around center
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 5;
        const height = (Math.random() - 0.5) * 6;
        
        const x = centerPosition.x + Math.cos(angle) * radius;
        const y = centerPosition.y + height;
        const z = centerPosition.z + Math.sin(angle) * radius;
        
        const positions = new Float32Array([x, y, z]);
        const sizes = new Float32Array([2 + Math.random() * 3]);
        const colors = new Float32Array([
            new THREE.Color(color).r,
            new THREE.Color(color).g,
            new THREE.Color(color).b
        ]);
        const normals = new Float32Array([0, 1, 0]); // Up vector for movement
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        
        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                activeState: { value: 0 },
                fragmentTexture: { value: texture }
            },
            vertexShader: dataFragmentVertexShader,
            fragmentShader: dataFragmentFragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        // Create points
        const points = new THREE.Points(geometry, material);
        points.userData.type = 'dataFragment';
        points.userData.fragmentType = type;
        
        // Add to group
        this.uiGroup.add(points);
        
        return {
            type: type,
            centerPosition: centerPosition.clone(),
            mesh: points,
            active: false
        };
    }
    
    /**
     * Create section background for navigation item
     */
    createSection(navItem) {
        // Create geometry - large plane facing the camera
        const geometry = new THREE.PlaneGeometry(100, 60);
        
        // Color gradient based on theme
        const colorA = new THREE.Color(navItem.color).multiplyScalar(0.2); // Darker version
        const colorB = new THREE.Color(navItem.color).multiplyScalar(0.1); // Even darker
        
        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                colorA: { value: colorA },
                colorB: { value: colorB },
                activeState: { value: 0 },
                time: { value: 0 }
            },
            vertexShader: sectionBackgroundVertexShader,
            fragmentShader: sectionBackgroundFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position mesh - aligned with orb but behind it
        mesh.position.copy(navItem.position);
        mesh.lookAt(0, 0, 0); // Face center
        mesh.position.add(mesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(-10)); // Move behind
        
        mesh.visible = false; // Start hidden
        mesh.userData.id = navItem.id;
        mesh.userData.type = 'sectionBackground';
        
        // Add to group
        this.uiGroup.add(mesh);
        
        // Store section data
        this.sections.push({
            id: navItem.id,
            position: mesh.position.clone(),
            mesh: mesh,
            active: false
        });
    }
    
    /**
     * Create quantum connections between orbs
     */
    createConnections() {
        // Clear any existing connections
        if (this.connections.length > 0) {
            this.connections.forEach(connection => {
                if (connection.particles) {
                    this.uiGroup.remove(connection.particles);
                    connection.particles.geometry.dispose();
                    connection.particles.material.dispose();
                }
            });
            this.connections = [];
        }
        
        // Create connections between each pair of orbs
        for (let i = 0; i < this.navigationOrbs.length; i++) {
            for (let j = i + 1; j < this.navigationOrbs.length; j++) {
                this.createConnection(this.navigationOrbs[i], this.navigationOrbs[j]);
            }
        }
    }
    
    /**
     * Create a quantum connection between two orbs
     */
    createConnection(orb1, orb2) {
        // Create geometry for particles along the connection
        const geometry = new THREE.BufferGeometry();
        const particleCount = this.settings.connectionParticles;
        
        // Create arrays for attributes
        const positions = new Float32Array(particleCount * 3);
        const progress = new Float32Array(particleCount);
        
        // Fill arrays
        for (let i = 0; i < particleCount; i++) {
            // Progress along the line (0-1)
            progress[i] = i / (particleCount - 1);
            
            // Position will be set in update method
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        
        // Set attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
        
        // Create material
        const connectionColor = new THREE.Color()
            .addColors(new THREE.Color(orb1.color), new THREE.Color(orb2.color))
            .multiplyScalar(0.5);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                connectionStrength: { value: 0.3 }, // Default connection strength
                connectionColor: { value: connectionColor },
                startPoint: { value: orb1.position.clone() },
                endPoint: { value: orb2.position.clone() }
            },
            vertexShader: quantumConnectionVertexShader,
            fragmentShader: quantumConnectionFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create points
        const particles = new THREE.Points(geometry, material);
        particles.frustumCulled = false; // Prevent culling of particles
        
        // Add to group
        this.uiGroup.add(particles);
        
        // Store connection data
        this.connections.push({
            orb1: orb1.id,
            orb2: orb2.id,
            particles: particles,
            active: false
        });
    }
    
    /**
     * Mouse move handler for raycasting
     */
    onMouseMove(event) {
        if (!this.interactionEnabled) return;
        
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.checkIntersections();
    }
    
    /**
     * Mouse click handler for selecting orbs
     */
    onClick(event) {
        if (!this.interactionEnabled || !this.hoveredOrb) return;
        
        // Activate the hovered orb
        this.activateSection(this.hoveredOrb.userData.id);
    }
    
    /**
     * Touch start handler for mobile
     */
    onTouchStart(event) {
        if (!this.interactionEnabled || event.touches.length === 0) return;
        
        const touch = event.touches[0];
        
        // Calculate touch position in normalized device coordinates (-1 to +1)
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        this.checkIntersections();
        
        // If we're over an orb, activate it
        if (this.hoveredOrb) {
            this.activateSection(this.hoveredOrb.userData.id);
        }
    }
    
    /**
     * Check for intersections with raycaster
     */
    checkIntersections() {
        if (!this.app.camera) return;
        
        // Update raycaster with mouse position
        this.raycaster.setFromCamera(this.mouse, this.app.camera);
        
        // Get all orb meshes
        const orbMeshes = this.navigationOrbs.map(orb => orb.mesh);
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(orbMeshes);
        
        // Reset hover state on all orbs
        this.navigationOrbs.forEach(orb => {
            if (orb.mesh && orb.mesh !== this.hoveredOrb) {
                this.setOrbHoverState(orb.mesh, false);
            }
        });
        
        // Set hover state on intersected orb
        if (intersects.length > 0) {
            const intersectedOrb = intersects[0].object;
            this.hoveredOrb = intersectedOrb;
            this.setOrbHoverState(intersectedOrb, true);
            document.body.style.cursor = 'pointer';
        } else {
            this.hoveredOrb = null;
            document.body.style.cursor = 'default';
        }
    }
    
    /**
     * Set hover state on an orb
     */
    setOrbHoverState(orbMesh, hovered) {
        if (!orbMesh || !orbMesh.material || !orbMesh.material.uniforms) return;
        
        // Smoothly transition hover state
        const targetValue = hovered ? 1.0 : 0.0;
        const currentValue = orbMesh.material.uniforms.hoverState.value;
        
        // Find the orb data
        const orbData = this.navigationOrbs.find(orb => orb.mesh === orbMesh);
        if (orbData) {
            orbData.hoverTarget = targetValue;
        }
    }
    
    /**
     * Activate a section by ID
     */
    activateSection(sectionId) {
        // If already active, deactivate
        if (this.settings.activeSection === sectionId) {
            this.deactivateAllSections();
            return;
        }
        
        // Deactivate current section
        this.deactivateAllSections();
        
        // Activate new section
        this.settings.activeSection = sectionId;
        
        // Set active state on orb
        const orbData = this.navigationOrbs.find(orb => orb.id === sectionId);
        if (orbData && orbData.mesh) {
            orbData.active = true;
            orbData.mesh.material.uniforms.activeState.value = 1.0;
            
            // Activate fragments for this orb
            orbData.fragments.forEach(fragment => {
                fragment.active = true;
                fragment.mesh.material.uniforms.activeState.value = 1.0;
            });
        }
        
        // Set active state on section background
        const sectionData = this.sections.find(section => section.id === sectionId);
        if (sectionData && sectionData.mesh) {
            sectionData.active = true;
            sectionData.mesh.visible = true;
            sectionData.mesh.material.uniforms.activeState.value = 1.0;
        }
        
        // Strengthen connections to active orb
        this.connections.forEach(connection => {
            if (connection.orb1 === sectionId || connection.orb2 === sectionId) {
                connection.active = true;
                connection.particles.material.uniforms.connectionStrength.value = 1.0;
            }
        });
        
        // Move camera to focus on this section
        this.moveToSection(sectionId);
        
        // Dispatch custom event for section change
        const event = new CustomEvent('sectionchange', { detail: { sectionId } });
        window.dispatchEvent(event);
    }
    
    /**
     * Deactivate all sections
     */
    deactivateAllSections() {
        // Reset active section
        this.settings.activeSection = null;
        
        // Reset orbs
        this.navigationOrbs.forEach(orb => {
            orb.active = false;
            if (orb.mesh) {
                orb.mesh.material.uniforms.activeState.value = 0.0;
            }
            
            // Reset fragments
            orb.fragments.forEach(fragment => {
                fragment.active = false;
                fragment.mesh.material.uniforms.activeState.value = 0.0;
            });
        });
        
        // Reset sections
        this.sections.forEach(section => {
            section.active = false;
            if (section.mesh) {
                section.mesh.visible = false;
                section.mesh.material.uniforms.activeState.value = 0.0;
            }
        });
        
        // Reset connections
        this.connections.forEach(connection => {
            connection.active = false;
            connection.particles.material.uniforms.connectionStrength.value = 0.3;
        });
        
        // Move camera back to default position
        this.resetCamera();
        
        // Dispatch custom event for section change
        const event = new CustomEvent('sectionchange', { detail: { sectionId: null } });
        window.dispatchEvent(event);
    }
    
    /**
     * Move camera to focus on a section
     */
    moveToSection(sectionId) {
        if (!this.app.sceneManager) return;
        
        // Find orb position
        const orbData = this.navigationOrbs.find(orb => orb.id === sectionId);
        if (!orbData) return;
        
        // Calculate camera position
        const direction = orbData.position.clone().normalize();
        const cameraDistance = 40; // Distance from origin
        const targetPosition = direction.multiplyScalar(cameraDistance);
        
        // Look at orb position
        const targetLookAt = orbData.position.clone();
        
        // Animate camera
        this.app.sceneManager.animateCameraTo(targetPosition, targetLookAt, 2.0);
    }
    
    /**
     * Reset camera to default position
     */
    resetCamera() {
        if (!this.app.sceneManager) return;
        
        // Default position
        const defaultPosition = new THREE.Vector3(0, 0, 40);
        const defaultLookAt = new THREE.Vector3(0, 0, 0);
        
        // Animate camera
        this.app.sceneManager.animateCameraTo(defaultPosition, defaultLookAt, 2.0);
    }
    
    /**
     * Update UI elements
     */
    update(time) {
        // Update navigation orbs
        this.navigationOrbs.forEach(orb => {
            if (!orb.mesh) return;
            
            // Update time uniform
            orb.mesh.material.uniforms.time.value = time;
            
            // Smoothly transition hover state
            if (orb.hoverTarget !== undefined) {
                const current = orb.mesh.material.uniforms.hoverState.value;
                const target = orb.hoverTarget;
                const newValue = THREE.MathUtils.lerp(current, target, 0.15);
                orb.mesh.material.uniforms.hoverState.value = newValue;
                
                // If we're close enough to target, remove the target
                if (Math.abs(newValue - target) < 0.01) {
                    orb.hoverTarget = undefined;
                }
            }
        });
        
        // Update connections
        this.connections.forEach(connection => {
            if (!connection.particles) return;
            
            // Update time uniform
            connection.particles.material.uniforms.time.value = time;
            
            // Get orb positions
            const orb1 = this.navigationOrbs.find(orb => orb.id === connection.orb1);
            const orb2 = this.navigationOrbs.find(orb => orb.id === connection.orb2);
            
            if (orb1 && orb2) {
                // Update start and end points
                connection.particles.material.uniforms.startPoint.value.copy(orb1.position);
                connection.particles.material.uniforms.endPoint.value.copy(orb2.position);
            }
        });
        
        // Update data fragments
        this.dataFragments.forEach(fragment => {
            if (!fragment.mesh) return;
            
            // Update time uniform
            fragment.mesh.material.uniforms.time.value = time;
        });
        
        // Update section backgrounds
        this.sections.forEach(section => {
            if (!section.mesh) return;
            
            // Update time uniform
            section.mesh.material.uniforms.time.value = time;
        });
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('click', this.handleMouseClick);
        window.removeEventListener('touchstart', this.handleTouchStart);
        
        // Dispose orbs
        this.navigationOrbs.forEach(orb => {
            if (orb.mesh) {
                orb.mesh.geometry.dispose();
                orb.mesh.material.dispose();
                this.uiGroup.remove(orb.mesh);
            }
        });
        
        // Dispose connections
        this.connections.forEach(connection => {
            if (connection.particles) {
                connection.particles.geometry.dispose();
                connection.particles.material.dispose();
                this.uiGroup.remove(connection.particles);
            }
        });
        
        // Dispose fragments
        this.dataFragments.forEach(fragment => {
            if (fragment.mesh) {
                fragment.mesh.geometry.dispose();
                fragment.mesh.material.dispose();
                this.uiGroup.remove(fragment.mesh);
            }
        });
        
        // Dispose sections
        this.sections.forEach(section => {
            if (section.mesh) {
                section.mesh.geometry.dispose();
                section.mesh.material.dispose();
                this.uiGroup.remove(section.mesh);
            }
        });
        
        // Dispose textures
        Object.values(this.fragmentTextures).forEach(texture => {
            if (texture) texture.dispose();
        });
        
        // Remove UI group from scene
        if (this.uiGroup) {
            this.app.scene.remove(this.uiGroup);
        }
        
        // Reset arrays
        this.navigationOrbs = [];
        this.connections = [];
        this.dataFragments = [];
        this.sections = [];
    }
} 