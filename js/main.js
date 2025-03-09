// Three.js setup - using modern ES6 architecture
const app = {
    scene: null,
    camera: null,
    renderer: null,
    blackHole: null,
    particles: null,
    composer: null,
    clock: new THREE.Clock(),
    sizes: {
        width: window.innerWidth,
        height: window.innerHeight
    },
    mouse: { x: 0, y: 0 },
    orbData: [],
    fragments: [],
    initialized: false,
    config: {
        particleCount: 2000,
        blackHoleRadius: 10,
        accretionDiskRadius: 15,
        bloom: true,
        devicePerformance: 'high' // New property to track device performance
    },
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
        this.camera.position.z = 50;
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('scene'),
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance' 
        });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Initialize audio
        this.initAudio();
        
        // Add loading indicator
        this.showLoader();
        
        // Detect performance to adjust settings
        this.detectPerformance();
        
        // Initialize components
        this.initBlackHole();
        this.initParticles();
        this.initPostProcessing();
        this.initOrbs();
        this.initEventListeners();
        this.initTouchControls();
        
        // Hide loader when everything is ready
        setTimeout(() => {
            this.hideLoader();
            this.initialized = true;
            
            // Start ambient sound
            this.playAmbientSound();
        }, 1500);
        
        // Start animation loop
        this.animate();
    },
    
    // Audio initialization and effects
    initAudio() {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Master volume control
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5; // Start at 50% volume
        this.masterGain.connect(this.audioContext.destination);
        
        // Create oscillators for ambient sound
        this.setupAmbientSound();
        
        // Create effects for interactions
        this.setupInteractionSounds();
        
        // Add mute toggle button
        this.addAudioControls();
    },
    
    setupAmbientSound() {
        // Create a complex ambient soundscape for the black hole
        
        // Bass drone oscillator
        this.bassOscillator = this.audioContext.createOscillator();
        this.bassOscillator.type = 'sine';
        this.bassOscillator.frequency.value = 55; // A1 note
        
        // Bass gain node with very low volume
        this.bassGain = this.audioContext.createGain();
        this.bassGain.gain.value = 0.04;
        
        // Mid tone oscillator for cosmic hum
        this.midOscillator = this.audioContext.createOscillator();
        this.midOscillator.type = 'sine';
        this.midOscillator.frequency.value = 110; // A2 note
        
        // Mid gain node
        this.midGain = this.audioContext.createGain();
        this.midGain.gain.value = 0.02;
        
        // High atmospheric oscillator
        this.highOscillator = this.audioContext.createOscillator();
        this.highOscillator.type = 'triangle';
        this.highOscillator.frequency.value = 220; // A3 note
        
        // High gain node
        this.highGain = this.audioContext.createGain();
        this.highGain.gain.value = 0.01;
        
        // Create LFO to modulate the mid oscillator for movement
        this.lfo = this.audioContext.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = 0.1; // Very slow modulation
        
        this.lfoGain = this.audioContext.createGain();
        this.lfoGain.gain.value = 2;
        
        // Connect the LFO to modulate the mid oscillator frequency
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.midOscillator.frequency);
        
        // Create a noise generator for cosmic background radiation
        this.noiseNode = this.createNoiseGenerator();
        this.noiseGain = this.audioContext.createGain();
        this.noiseGain.gain.value = 0.008;
        this.noiseNode.connect(this.noiseGain);
        
        // Filter the noise to make it less harsh
        this.noiseFilter = this.audioContext.createBiquadFilter();
        this.noiseFilter.type = 'bandpass';
        this.noiseFilter.frequency.value = 800;
        this.noiseFilter.Q.value = 0.5;
        
        this.noiseGain.connect(this.noiseFilter);
        
        // Connect everything to master gain
        this.bassOscillator.connect(this.bassGain);
        this.midOscillator.connect(this.midGain);
        this.highOscillator.connect(this.highGain);
        
        this.bassGain.connect(this.masterGain);
        this.midGain.connect(this.masterGain);
        this.highGain.connect(this.masterGain);
        this.noiseFilter.connect(this.masterGain);
        
        // Add spacial reverb
        this.reverb = this.createReverb(3.5);
        this.bassGain.connect(this.reverb);
        this.midGain.connect(this.reverb);
        this.highGain.connect(this.reverb);
        this.reverb.connect(this.masterGain);
        
        // Don't start the oscillators until user interacts
    },
    
    playAmbientSound() {
        // Only start if audio context is not running
        if (this.audioContext.state !== 'running') return;
        
        const now = this.audioContext.currentTime;
        
        // Start the oscillators with fade in
        this.bassOscillator.start(now);
        this.midOscillator.start(now);
        this.highOscillator.start(now);
        this.lfo.start(now);
        
        // Slowly fade in each element
        this.bassGain.gain.setValueAtTime(0, now);
        this.bassGain.gain.exponentialRampToValueAtTime(0.04, now + 4);
        
        this.midGain.gain.setValueAtTime(0, now);
        this.midGain.gain.exponentialRampToValueAtTime(0.02, now + 6);
        
        this.highGain.gain.setValueAtTime(0, now);
        this.highGain.gain.exponentialRampToValueAtTime(0.01, now + 8);
        
        this.noiseGain.gain.setValueAtTime(0, now);
        this.noiseGain.gain.exponentialRampToValueAtTime(0.008, now + 10);
        
        // Schedule subtle variations in the soundscape
        this.scheduleAmbientVariations();
    },
    
    setupInteractionSounds() {
        // Create sound buffers for different interactions
        this.interactionSounds = {
            orbHighlight: null,
            dataInput: null,
            sectionOpen: null,
            sectionClose: null,
            blackHoleEffect: null
        };
        
        // Synthesize these sounds rather than loading samples
        
        // Orb highlight sound
        this.createOrbHighlightSound = () => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = 440;
            
            const gain = this.audioContext.createGain();
            gain.gain.value = 0;
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 2;
            filter.frequency.value = 1200;
            
            oscillator.connect(gain);
            gain.connect(filter);
            filter.connect(this.masterGain);
            
            const now = this.audioContext.currentTime;
            oscillator.start(now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            
            // Clean up
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gain.disconnect();
                filter.disconnect();
            }, 500);
        };
        
        // Data input sound
        this.createDataInputSound = () => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'triangle';
            
            const gain = this.audioContext.createGain();
            gain.gain.value = 0;
            
            oscillator.connect(gain);
            gain.connect(this.masterGain);
            
            const now = this.audioContext.currentTime;
            oscillator.start(now);
            
            // Random frequency for each keypess
            const baseFreq = 300 + Math.random() * 600;
            oscillator.frequency.setValueAtTime(baseFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.1);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.03, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            // Clean up
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gain.disconnect();
            }, 200);
        };
        
        // Section open sound
        this.createSectionOpenSound = () => {
            const sweepOsc = this.audioContext.createOscillator();
            sweepOsc.type = 'sine';
            
            const sweepGain = this.audioContext.createGain();
            sweepGain.gain.value = 0;
            
            const sweepFilter = this.audioContext.createBiquadFilter();
            sweepFilter.type = 'lowpass';
            sweepFilter.frequency.value = 800;
            
            sweepOsc.connect(sweepGain);
            sweepGain.connect(sweepFilter);
            sweepFilter.connect(this.masterGain);
            
            const now = this.audioContext.currentTime;
            sweepOsc.start(now);
            sweepOsc.frequency.setValueAtTime(200, now);
            sweepOsc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
            
            sweepGain.gain.setValueAtTime(0, now);
            sweepGain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            sweepGain.gain.linearRampToValueAtTime(0, now + 0.5);
            
            // Add a complimentary high sound
            const highOsc = this.audioContext.createOscillator();
            highOsc.type = 'sine';
            
            const highGain = this.audioContext.createGain();
            highGain.gain.value = 0;
            
            highOsc.connect(highGain);
            highGain.connect(this.masterGain);
            
            highOsc.start(now + 0.1);
            highOsc.frequency.setValueAtTime(1200, now + 0.1);
            highOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
            
            highGain.gain.setValueAtTime(0, now + 0.1);
            highGain.gain.linearRampToValueAtTime(0.05, now + 0.15);
            highGain.gain.linearRampToValueAtTime(0, now + 0.4);
            
            // Clean up
            setTimeout(() => {
                sweepOsc.stop();
                highOsc.stop();
                sweepOsc.disconnect();
                sweepGain.disconnect();
                sweepFilter.disconnect();
                highOsc.disconnect();
                highGain.disconnect();
            }, 600);
        };
        
        // Section close sound
        this.createSectionCloseSound = () => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'triangle';
            
            const gain = this.audioContext.createGain();
            gain.gain.value = 0;
            
            oscillator.connect(gain);
            gain.connect(this.masterGain);
            
            const now = this.audioContext.currentTime;
            oscillator.start(now);
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            
            // Clean up
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gain.disconnect();
            }, 400);
        };
        
        // Black hole effect sound (for dramatic moments)
        this.createBlackHoleEffectSound = () => {
            // Create a deep rumble
            const lowOsc = this.audioContext.createOscillator();
            lowOsc.type = 'sine';
            
            const lowGain = this.audioContext.createGain();
            lowGain.gain.value = 0;
            
            // Add distortion
            const distortion = this.audioContext.createWaveShaper();
            distortion.curve = this.makeDistortionCurve(100);
            
            lowOsc.connect(lowGain);
            lowGain.connect(distortion);
            distortion.connect(this.masterGain);
            
            const now = this.audioContext.currentTime;
            lowOsc.start(now);
            lowOsc.frequency.setValueAtTime(30, now);
            lowOsc.frequency.exponentialRampToValueAtTime(80, now + 1.5);
            
            lowGain.gain.setValueAtTime(0, now);
            lowGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
            lowGain.gain.linearRampToValueAtTime(0, now + 2.5);
            
            // Add higher frequency sweep for contrast
            const highOsc = this.audioContext.createOscillator();
            highOsc.type = 'sawtooth';
            
            const highGain = this.audioContext.createGain();
            highGain.gain.value = 0;
            
            const highFilter = this.audioContext.createBiquadFilter();
            highFilter.type = 'highpass';
            highFilter.frequency.value = 3000;
            
            highOsc.connect(highGain);
            highGain.connect(highFilter);
            highFilter.connect(this.masterGain);
            
            highOsc.start(now + 0.25);
            highOsc.frequency.setValueAtTime(200, now + 0.25);
            highOsc.frequency.exponentialRampToValueAtTime(8000, now + 1);
            highOsc.frequency.exponentialRampToValueAtTime(200, now + 2);
            
            highGain.gain.setValueAtTime(0, now + 0.25);
            highGain.gain.linearRampToValueAtTime(0.04, now + 0.5);
            highGain.gain.linearRampToValueAtTime(0, now + 2);
            
            // Clean up
            setTimeout(() => {
                lowOsc.stop();
                highOsc.stop();
                lowOsc.disconnect();
                lowGain.disconnect();
                distortion.disconnect();
                highOsc.disconnect();
                highGain.disconnect();
                highFilter.disconnect();
            }, 3000);
        };
    },
    
    // Helper methods for audio processing
    createNoiseGenerator() {
        // Create buffer for white noise
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Fill the buffer with noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        // Create noise source from buffer
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);
        
        return whiteNoise;
    },
    
    createReverb(duration) {
        // Create reverb effect for spacious sound
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        // Fill impulse with decay
        for (let i = 0; i < length; i++) {
            const n = i / length;
            const t = (i / sampleRate);
            
            // Exponential decay
            const envelope = Math.exp(-t * 2);
            
            // Random values for more natural reverb
            impulseL[i] = (Math.random() * 2 - 1) * envelope;
            impulseR[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        const convolver = this.audioContext.createConvolver();
        convolver.buffer = impulse;
        
        // Create gain for reverb level
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.value = 0.2;
        
        convolver.connect(reverbGain);
        
        return reverbGain;
    },
    
    makeDistortionCurve(amount) {
        // Create distortion curve for audio effect
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < n_samples; i++) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        
        return curve;
    },
    
    scheduleAmbientVariations() {
        // Schedule subtle variations in ambient sound
        const changeParameters = () => {
            const now = this.audioContext.currentTime;
            
            // Random value generator
            const rand = (min, max) => Math.random() * (max - min) + min;
            
            // Gradually change parameters
            this.bassOscillator.frequency.exponentialRampToValueAtTime(
                rand(50, 65), now + 10
            );
            
            this.midOscillator.frequency.exponentialRampToValueAtTime(
                rand(100, 130), now + 15
            );
            
            this.lfo.frequency.exponentialRampToValueAtTime(
                rand(0.05, 0.2), now + 20
            );
            
            // Schedule next change
            setTimeout(changeParameters, 15000);
        };
        
        // Start the variations
        changeParameters();
    },
    
    addAudioControls() {
        // Add audio controls to the UI
        const audioToggle = document.createElement('div');
        audioToggle.id = 'audio-toggle';
        audioToggle.title = 'Toggle audio';
        audioToggle.setAttribute('role', 'button');
        audioToggle.setAttribute('tabindex', '0');
        audioToggle.setAttribute('aria-label', 'Toggle audio on or off');
        
        // Add audio wave visualization
        const audioWaves = document.createElement('div');
        audioWaves.id = 'audio-waves';
        
        // Create 5 wave bars for the visualization
        for (let i = 0; i < 5; i++) {
            const waveBar = document.createElement('div');
            waveBar.className = 'wave-bar';
            audioWaves.appendChild(waveBar);
        }
        
        audioToggle.appendChild(audioWaves);
        
        // Check if audio is muted in localStorage
        const audioMuted = localStorage.getItem('audioMuted') === 'true';
        if (audioMuted) {
            this.masterGain.gain.value = 0;
            audioToggle.classList.add('muted');
        }
        
        // Add the toggle button to the UI
        document.getElementById('container').appendChild(audioToggle);
        
        // Add event listeners
        audioToggle.addEventListener('click', () => {
            this.toggleAudio(audioToggle);
        });
        
        audioToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleAudio(audioToggle);
            }
        });
        
        // Handle audio context resume
        document.addEventListener('click', () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                    if (!audioMuted && !this.bassOscillator.started) {
                        this.playAmbientSound();
                    }
                });
            }
        }, { once: true });
    },
    
    toggleAudio(audioToggle) {
        // Toggle audio mute/unmute
        const isMuted = audioToggle.classList.contains('muted');
        
        if (isMuted) {
            // Unmute
            audioToggle.classList.remove('muted');
            this.masterGain.gain.value = 0.5;
            localStorage.setItem('audioMuted', 'false');
            
            // Start audio if it hasn't started yet
            if (this.audioContext.state === 'running' && !this.bassOscillator.started) {
                this.playAmbientSound();
                this.bassOscillator.started = true;
            }
        } else {
            // Mute
            audioToggle.classList.add('muted');
            this.masterGain.gain.value = 0;
            localStorage.setItem('audioMuted', 'true');
        }
    },
    
    showLoader() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div class="spinner"></div>
            <div class="loader-text">Initializing Singularity...</div>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
        `;
        document.body.appendChild(loader);
        
        // Simulate loading progress
        this.updateLoadingProgress();
    },
    
    updateLoadingProgress() {
        let progress = 0;
        const progressBar = document.querySelector('.progress-bar');
        const loaderText = document.querySelector('.loader-text');
        const loadingTexts = [
            'Initializing Singularity...',
            'Generating Quantum Field...',
            'Calibrating Visual Matrix...',
            'Stabilizing Particle System...',
            'Almost Ready...'
        ];
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            
            // Update progress bar width
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            // Update loading text based on progress
            if (loaderText) {
                const textIndex = Math.min(Math.floor(progress / 20), loadingTexts.length - 1);
                loaderText.textContent = loadingTexts[textIndex];
            }
        }, 400);
    },
    
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 500);
        }
    },
    
    initBlackHole() {
        // Core black hole geometry
        const blackHoleGeometry = new THREE.SphereGeometry(this.config.blackHoleRadius, 32, 32);
        
        // Create a custom shader material for gravitational lensing effect
        const blackHoleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                radius: { value: this.config.blackHoleRadius },
                intensity: { value: 1.5 },
                distortion: { value: 2.5 },
                colorPrimary: { value: new THREE.Color(this.getThemeColor('primary') || '#ff00ff') },
                colorSecondary: { value: new THREE.Color(this.getThemeColor('secondary') || '#00ffff') }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float radius;
                uniform float intensity;
                uniform float distortion;
                uniform vec3 colorPrimary;
                uniform vec3 colorSecondary;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Calculate distance from center
                    float dist = length(vPosition) / radius;
                    
                    // Gravitational lensing effect
                    float lensEffect = 1.0 - exp(-dist * intensity);
                    
                    // Event horizon (perfectly black at the core)
                    float eventHorizon = smoothstep(0.0, 0.85, dist);
                    
                    // Swirling energy patterns
                    float swirl = sin(dist * 10.0 + time * 0.5);
                    float energyPattern = abs(swirl * cos(time * 0.2));
                    
                    // Edge glow
                    float edgeGlow = smoothstep(0.85, 1.0, dist) * smoothstep(1.15, 1.0, dist) * 1.5;
                    
                    // Mix colors based on position and time
                    vec3 color = mix(colorPrimary, colorSecondary, sin(dist * 5.0 + time * 0.2) * 0.5 + 0.5);
                    
                    // Apply lensing darkness with edge glow
                    color = mix(vec3(0.0), color, eventHorizon * lensEffect + edgeGlow * energyPattern);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        this.scene.add(this.blackHole);
        
        // Create accretion disk
        this.createAccretionDisk();
        
        // Create event horizon particles
        this.createEventHorizonParticles();
        
        // Create magnetic field lines
        this.createMagneticFieldLines();
    },
    
    createAccretionDisk() {
        const diskGeometry = new THREE.RingGeometry(
            this.config.blackHoleRadius + 1, 
            this.config.accretionDiskRadius, 
            64, 4
        );
        
        // Create a custom shader material for the accretion disk
        const diskMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                innerRadius: { value: this.config.blackHoleRadius + 1 },
                outerRadius: { value: this.config.accretionDiskRadius },
                colorPrimary: { value: new THREE.Color(this.getThemeColor('primary') || '#ff00ff') },
                colorSecondary: { value: new THREE.Color(this.getThemeColor('secondary') || '#00ffff') }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vDistance;
                
                void main() {
                    vUv = uv;
                    vDistance = length(position.xy);
                    
                    // Add some vertical displacement for thickness
                    float angle = atan(position.y, position.x);
                    float displacement = sin(angle * 8.0) * cos(angle * 3.0) * 0.2;
                    
                    // Create a slightly warped disk
                    vec3 newPosition = position;
                    newPosition.z += displacement;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float innerRadius;
                uniform float outerRadius;
                uniform vec3 colorPrimary;
                uniform vec3 colorSecondary;
                
                varying vec2 vUv;
                varying float vDistance;
                
                void main() {
                    // Normalize distance for gradient
                    float normalizedDist = (vDistance - innerRadius) / (outerRadius - innerRadius);
                    
                    // Create swirling patterns
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float swirl = sin(angle * 20.0 + normalizedDist * 15.0 - time * 2.0) * 0.5 + 0.5;
                    
                    // Hot spots that move around the disk
                    float hotSpot1 = 0.6 + 0.4 * sin(angle * 3.0 + time * 0.7);
                    float hotSpot2 = 0.5 + 0.5 * sin(angle * 2.0 - time * 0.5 + 1.5);
                    float hotSpots = max(hotSpot1, hotSpot2);
                    
                    // Color gradient from inner to outer
                    vec3 baseColor = mix(colorPrimary, colorSecondary, swirl);
                    
                    // Brightness falls off toward outer edge
                    float brightness = mix(1.0, 0.3, pow(normalizedDist, 0.5));
                    
                    // Apply hot spots and brightness
                    vec3 finalColor = baseColor * brightness * hotSpots;
                    
                    // Edge fade for smooth transition
                    float edgeFade = smoothstep(1.0, 0.8, normalizedDist);
                    float innerFade = smoothstep(0.0, 0.1, normalizedDist);
                    
                    gl_FragColor = vec4(finalColor, edgeFade * innerFade);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
        this.accretionDisk.rotation.x = Math.PI / 4; // Tilt the disk
        this.scene.add(this.accretionDisk);
    },
    
    createEventHorizonParticles() {
        const particleCount = 300;
        const horizonRadius = this.config.blackHoleRadius * 1.1;
        
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const primaryColor = new THREE.Color(this.getThemeColor('primary') || '#ff00ff');
        const secondaryColor = new THREE.Color(this.getThemeColor('secondary') || '#00ffff');
        
        for (let i = 0; i < particleCount; i++) {
            // Create particles on a sphere around the event horizon
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = horizonRadius * Math.sin(phi) * Math.cos(theta);
            const y = horizonRadius * Math.sin(phi) * Math.sin(theta);
            const z = horizonRadius * Math.cos(phi);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random color between primary and secondary
            const mixAmount = Math.random();
            const color = new THREE.Color().lerpColors(primaryColor, secondaryColor, mixAmount);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Varied particle sizes
            sizes[i] = Math.random() * 0.5 + 0.1;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particlesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                
                uniform float time;
                uniform float pixelRatio;
                
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    
                    // Add subtle movement
                    vec3 pos = position;
                    float angle = time * 0.2 + length(position);
                    pos.x += sin(angle) * 0.1;
                    pos.y += cos(angle) * 0.1;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Circular particle with soft edge
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    // Soft edge fade
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.eventHorizonParticles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.eventHorizonParticles);
    },
    
    createMagneticFieldLines() {
        const lineCount = 12;
        const pointsPerLine = 50;
        
        const primaryColor = new THREE.Color(this.getThemeColor('primary') || '#ff00ff');
        const secondaryColor = new THREE.Color(this.getThemeColor('secondary') || '#00ffff');
        
        this.magneticFieldLines = [];
        
        for (let i = 0; i < lineCount; i++) {
            const lineGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(pointsPerLine * 3);
            
            // Create a randomized starting position around the black hole
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const startRadius = this.config.blackHoleRadius * 1.2;
            const startX = startRadius * Math.sin(phi) * Math.cos(theta);
            const startY = startRadius * Math.sin(phi) * Math.sin(theta);
            const startZ = startRadius * Math.cos(phi);
            
            // Create the field line points
            for (let j = 0; j < pointsPerLine; j++) {
                const t = j / (pointsPerLine - 1);
                
                // Create a spiraling path
                const radius = startRadius + t * 15;
                const spiralAngle = theta + t * 10 + i * (Math.PI * 2 / lineCount);
                const spiralHeight = startZ + (Math.random() - 0.5) * 5;
                
                const x = radius * Math.cos(spiralAngle);
                const y = radius * Math.sin(spiralAngle);
                const z = spiralHeight * (1 - t); // Field lines flatten out
                
                positions[j * 3] = x;
                positions[j * 3 + 1] = y;
                positions[j * 3 + 2] = z;
            }
            
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            // Create a gradient material that changes over the line
            const lineMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    colorStart: { value: primaryColor },
                    colorEnd: { value: secondaryColor }
                },
                vertexShader: `
                    uniform float time;
                    
                    varying float vProgress;
                    
                    void main() {
                        vProgress = position.y / 15.0; // Normalize based on max size
                        
                        vec3 pos = position;
                        
                        // Animate the field lines with subtle movement
                        float angle = time * 0.5 + float(gl_VertexID) * 0.1;
                        pos.x += sin(angle) * 0.2;
                        pos.y += cos(angle) * 0.2;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 colorStart;
                    uniform vec3 colorEnd;
                    
                    varying float vProgress;
                    
                    void main() {
                        // Blend between start and end colors
                        vec3 color = mix(colorStart, colorEnd, vProgress);
                        
                        // Fade out intensity along the line
                        float alpha = (1.0 - vProgress) * 0.8;
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(line);
            this.magneticFieldLines.push(line);
        }
    },
    
    initParticles() {
        // Improved particle system using buffer geometry
        const particleCount = this.getOptimalParticleCount();
        const particleGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = []; // For animation, not part of buffer
        
        const diskRadius = this.config.accretionDiskRadius;
        const diskThickness = 2.5;
        const colorOptions = [
            new THREE.Color(0xff00ff), // Magenta
            new THREE.Color(0x00ffff), // Cyan
            new THREE.Color(0xffffff), // White
            new THREE.Color(0x9900ff)  // Purple
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Create spiral distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = diskRadius + (Math.random() - 0.5) * 10;
            const spiralOffset = Math.random() * Math.PI * 20;
            const armOffset = Math.random() < 0.5 ? 0 : Math.PI;
            
            const x = Math.cos(angle + spiralOffset + armOffset) * radius;
            const y = Math.sin(angle + spiralOffset + armOffset) * radius;
            const z = (Math.random() - 0.5) * diskThickness * (radius / diskRadius);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random particle size variation
            sizes[i] = Math.random() * 0.5 + 0.1;
            
            // Random colors from palette
            const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Store velocities for animation
            const speed = (0.05 + Math.random() * 0.03) * (radius < diskRadius ? 1.2 : 0.8);
            velocities.push({
                vx: Math.sin(angle) * speed,
                vy: -Math.cos(angle) * speed,
                vz: 0,
                turbulence: Math.random() * 0.01
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Use custom shader for better particles
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                uniform float time;
                uniform float pixelRatio;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Calculate distance from center of point
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float r = length(xy);
                    
                    // Discard pixels outside of circle
                    if (r > 0.5) discard;
                    
                    // Create soft edge
                    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        
        this.particles = {
            points: new THREE.Points(particleGeometry, particleMaterial),
            geometry: particleGeometry,
            velocities: velocities
        };
        
        this.scene.add(this.particles.points);
    },
    
    getOptimalParticleCount() {
        // Improved performance detection
        const performance = this.detectPerformance();
        
        // Adjust particle count based on performance level and screen size
        const base = this.sizes.width * this.sizes.height;
        
        if (performance === 'low') {
            this.config.devicePerformance = 'low';
            return Math.min(800, Math.floor(base / 8000));
        } else if (performance === 'medium') {
            this.config.devicePerformance = 'medium';
            return Math.min(1500, Math.floor(base / 4000));
        } else {
            this.config.devicePerformance = 'high';
            return Math.min(2500, Math.floor(base / 2000));
        }
    },
    
    detectPerformance() {
        // FPS detection
        let lastTime = 0;
        let frames = 0;
        let fpsArray = [];
        
        const checkFps = (time) => {
            frames++;
            
            if (time > lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (time - lastTime));
                fpsArray.push(fps);
                frames = 0;
                lastTime = time;
                
                // After collecting 5 samples, decide performance level
                if (fpsArray.length >= 5) {
                    const avgFps = fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length;
                    
                    // Determine device performance
                    if (avgFps < 30) {
                        this.config.devicePerformance = 'low';
                        this.config.particleCount = 500; // Reduce particles for low-end devices
                        this.config.bloom = false; // Disable bloom effect
                    } else if (avgFps < 50) {
                        this.config.devicePerformance = 'medium';
                        this.config.particleCount = 1200;
                    } else {
                        this.config.devicePerformance = 'high';
                    }
                    
                    console.log(`Device performance: ${this.config.devicePerformance} (${Math.round(avgFps)} FPS)`);
                    
                    // Also check for mobile devices via screen size rather than UA sniffing
                    const isMobile = window.innerWidth < 768;
                    if (isMobile && this.config.devicePerformance !== 'high') {
                        this.config.particleCount = Math.min(this.config.particleCount, 800);
                        this.config.bloom = false;
                    }
                    
                    // Remove our animation frame callback after we've determined performance
                    return true;
                }
            }
            
            requestAnimationFrame(checkFps);
            return false;
        };
        
        requestAnimationFrame(checkFps);
    },
    
    initPostProcessing() {
        // Create composer
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Only add bloom if device can handle it
        if (this.config.bloom && this.config.devicePerformance !== 'low') {
            // Add bloom pass with optimized settings based on performance
            const bloomStrength = this.config.devicePerformance === 'high' ? 1.5 : 1.0;
            const bloomRadius = this.config.devicePerformance === 'high' ? 0.7 : 0.5;
            const bloomThreshold = 0.2;
            
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.sizes.width, this.sizes.height),
                bloomStrength,
                bloomRadius,
                bloomThreshold
            );
            this.composer.addPass(bloomPass);
        }
    },
    
    initOrbs() {
        const orbs = document.querySelectorAll('.orb');
        this.orbData = Array.from(orbs).map((orb, index) => {
            // Calculate starting positions in a circle
            const totalOrbs = orbs.length;
            const angle = (index / totalOrbs) * Math.PI * 2;
            const radius = Math.min(this.sizes.width, this.sizes.height) * 0.3;
            
            return {
                element: orb,
                x: this.sizes.width / 2 + Math.cos(angle) * radius,
                y: this.sizes.height / 2 + Math.sin(angle) * radius,
                targetX: 0,
                targetY: 0,
                vx: 0,
                vy: 0,
                radius: radius,
                angle: angle,
                baseAngle: angle,
                speed: 0.005 + Math.random() * 0.005,
                entangled: false,
                hoverState: false,
                pulsePhase: Math.random() * Math.PI * 2
            };
        });
        
        // Position orbs initially
        this.updateOrbPositions();
    },
    
    initEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            // Update composer
            if (this.composer) {
                this.composer.setSize(this.sizes.width, this.sizes.height);
            }
            this.updateOrbPositions();
        });
        
        // Mouse move handler
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / this.sizes.width) * 2 - 1;
            this.mouse.y = -(e.clientY / this.sizes.height) * 2 + 1;
            this.updateQuantumState(e.clientX, e.clientY);
        });
        
        // Touch move handler
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = (e.touches[0].clientX / this.sizes.width) * 2 - 1;
                this.mouse.y = -(e.touches[0].clientY / this.sizes.height) * 2 + 1;
                this.updateQuantumState(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        
        // Input field handler
        const dataInput = document.getElementById('data-input');
        dataInput.addEventListener('focus', () => {
            this.increaseParticleActivity(true);
        });
        
        dataInput.addEventListener('blur', () => {
            this.increaseParticleActivity(false);
        });
        
        let keyPressTimeout;
        dataInput.addEventListener('keydown', (e) => {
            clearTimeout(keyPressTimeout);
            
            if (e.key === 'Enter' && dataInput.value.trim() !== '') {
                this.createDataFragment(dataInput.value);
                dataInput.value = '';
            } else {
                this.createKeyPressEffect();
                
                keyPressTimeout = setTimeout(() => {
                    this.updateParticles();
                }, 3000);
            }
        });
        
        // Orb hover effects
        document.querySelectorAll('.orb').forEach((orb, index) => {
            orb.addEventListener('mouseenter', () => {
                if (this.orbData[index]) {
                    this.orbData[index].hoverState = true;
                    orb.classList.add('hovered');
                }
            });
            
            orb.addEventListener('mouseleave', () => {
                if (this.orbData[index]) {
                    this.orbData[index].hoverState = false;
                    orb.classList.remove('hovered');
                }
            });
        });
        
        // Theme toggle handler
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
            this.updateVisualsForTheme(theme);
        });
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            this.updateVisualsForTheme('light');
        } else if (!localStorage.getItem('theme')) {
            // Check system preference if no saved preference
            const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (!prefersDarkMode) {
                document.body.classList.add('light-mode');
                this.updateVisualsForTheme('light');
            }
        }
        
        // Lazy loading for section content
        window.addEventListener('hashchange', this.handleSectionLazyLoad.bind(this));
        // Initial check for section content
        this.handleSectionLazyLoad();
    },
    
    handleSectionLazyLoad() {
        const hash = window.location.hash;
        if (hash && hash !== '#') {
            const targetSection = document.querySelector(hash);
            if (targetSection && !targetSection.dataset.loaded) {
                // Mark as loaded
                targetSection.dataset.loaded = 'true';
                
                // Load high-resolution images if any
                const lazyImages = targetSection.querySelectorAll('img[data-src]');
                lazyImages.forEach(img => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                });
                
                // Load other resources or initialize components
                if (hash === '#projects') {
                    // We could load project-specific resources here
                    console.log('Projects section loaded');
                } else if (hash === '#blog') {
                    // We could fetch blog posts dynamically here
                    console.log('Blog section loaded');
                }
            }
        }
    },
    
    updateVisualsForTheme(theme) {
        // Update background color of scene
        this.scene.background = new THREE.Color(theme === 'light' ? 0xf5f5f5 : 0x000000);
        
        // Update particle colors if they exist
        if (this.particles && this.particles.geometry.attributes.color) {
            const colors = this.particles.geometry.attributes.color.array;
            const count = colors.length / 3;
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                
                if (theme === 'light') {
                    // More subdued colors for light mode
                    colors[i3]     *= 0.7; // r
                    colors[i3 + 1] *= 0.7; // g
                    colors[i3 + 2] *= 0.7; // b
                } else {
                    // Brighter colors for dark mode
                    colors[i3]     /= 0.7; // r
                    colors[i3 + 1] /= 0.7; // g
                    colors[i3 + 2] /= 0.7; // b
                }
            }
            
            this.particles.geometry.attributes.color.needsUpdate = true;
        }
        
        // Update post-processing if active
        if (this.composer && this.composer.passes.length > 1) {
            const bloomPass = this.composer.passes.find(pass => pass.constructor.name === 'UnrealBloomPass');
            if (bloomPass) {
                bloomPass.strength = theme === 'light' ? 0.8 : 1.5;
            }
        }
    },
    
    updateQuantumState(mouseX, mouseY) {
        // Only update occasionally for quantum "jumps"
        if (Math.random() > 0.01) return;
        
        // Find closest orb to mouse
        let closestOrb = null;
        let minDistance = Infinity;
        
        this.orbData.forEach(orb => {
            const dx = mouseX - orb.x;
            const dy = mouseY - orb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestOrb = orb;
            }
        });
        
        // Quantum entanglement between closest orb and random other orb
        if (closestOrb && minDistance < 150 && Math.random() > 0.7) {
            closestOrb.entangled = true;
            
            // Find another random orb to entangle with
            const otherOrbs = this.orbData.filter(orb => orb !== closestOrb);
            if (otherOrbs.length > 0) {
                const randomOrb = otherOrbs[Math.floor(Math.random() * otherOrbs.length)];
                randomOrb.entangled = true;
                
                // Create temporary connection line
                this.createQuantumConnection(closestOrb, randomOrb);
                
                // Reset after a short time
                setTimeout(() => {
                    closestOrb.entangled = false;
                    randomOrb.entangled = false;
                }, 2000);
            }
        }
    },
    
    createQuantumConnection(orb1, orb2) {
        const connection = document.createElement('div');
        connection.className = 'quantum-connection';
        document.getElementById('ui').appendChild(connection);
        
        // Animate connection line
        const duration = 2000;
        const startTime = Date.now();
        
        const updateLine = () => {
            const dx = orb2.x - orb1.x;
            const dy = orb2.y - orb1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Calculate elapsed percentage
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Animate line length
            connection.style.width = `${distance * progress}px`;
            connection.style.left = `${orb1.x}px`;
            connection.style.top = `${orb1.y}px`;
            connection.style.transform = `rotate(${angle}rad)`;
            connection.style.opacity = Math.sin(progress * Math.PI);
            
            if (progress < 1) {
                requestAnimationFrame(updateLine);
            } else {
                connection.remove();
            }
        };
        
        updateLine();
    },
    
    createDataFragment(text) {
        // Visualize the input text as data being absorbed by the black hole
        
        // Create a TextGeometry for 3D text
        const loader = new THREE.FontLoader();
        const fontPath = 'https://cdn.jsdelivr.net/npm/three@0.174.0/examples/fonts/helvetiker_regular.typeface.json';
        
        // Create a temporary sprite while loading the font
        const tempSprite = this.createTextSprite(text);
        this.scene.add(tempSprite);
        
        // Add to fragments array
        const fragment = {
            mesh: tempSprite,
            text: text,
            createdAt: Date.now(),
            position: new THREE.Vector3().copy(tempSprite.position),
            speed: Math.random() * 0.5 + 0.2,
            size: text.length * 0.1 + 0.5,
            rotation: {
                x: Math.random() * 0.02 - 0.01,
                y: Math.random() * 0.02 - 0.01,
                z: Math.random() * 0.02 - 0.01
            },
            absorbed: false,
            absorptionStartTime: 0,
            glitchIntensity: 0
        };
        
        this.fragments.push(fragment);
        
        // Play a data input sound
        if (this.audioContext && this.audioContext.state === 'running') {
            this.createDataInputSound();
        }
        
        // Create a dramatic visual effect
        this.createDataStreamEffect(fragment);
        
        // Load the font and replace with 3D text when ready
        loader.load(fontPath, (font) => {
            // Remove temporary sprite
            this.scene.remove(tempSprite);
            
            // Create 3D text geometry
            const textGeometry = new THREE.TextGeometry(text, {
                font: font,
                size: fragment.size,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });
            
            // Center the text
            textGeometry.computeBoundingBox();
            textGeometry.center();
            
            // Create glowing material with animated effects
            const textMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    glitchIntensity: { value: 0 },
                    color: { value: new THREE.Color(this.getThemeColor('primary') || '#ff00ff') },
                    secondaryColor: { value: new THREE.Color(this.getThemeColor('secondary') || '#00ffff') }
                },
                vertexShader: `
                    uniform float time;
                    uniform float glitchIntensity;
                    
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        vPosition = position;
                        vUv = uv;
                        
                        // Add subtle movement
                        vec3 pos = position;
                        
                        // Add glitch effect as text gets closer to black hole
                        if (glitchIntensity > 0.0) {
                            float glitchAmount = glitchIntensity * 0.1;
                            if (sin(position.x * 100.0 + time * 5.0) > 0.8) {
                                pos.x += sin(time * 20.0) * glitchAmount;
                            }
                            if (cos(position.y * 80.0 + time * 3.0) > 0.7) {
                                pos.y += cos(time * 30.0) * glitchAmount;
                            }
                        }
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float glitchIntensity;
                    uniform vec3 color;
                    uniform vec3 secondaryColor;
                    
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        // Create a data-like effect with scan lines
                        float scanLine = sin(vPosition.y * 50.0 + time * 10.0) * 0.1 + 0.9;
                        
                        // Color pulsing effect
                        float pulse = sin(time * 2.0) * 0.5 + 0.5;
                        vec3 pulseColor = mix(color, secondaryColor, pulse);
                        
                        // Edge glow effect
                        float edgeGlow = min(1.0, 3.0 * abs(vUv.x - 0.5));
                        
                        // Apply glitch as fragment moves toward black hole
                        float glitchEffect = 1.0;
                        if (glitchIntensity > 0.0) {
                            // Create digital noise/corruption effect
                            float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233)) * 43758.5453));
                            glitchEffect = mix(1.0, noise, glitchIntensity * 0.5);
                            
                            // Create horizontal displacement lines
                            if (sin(vPosition.y * 100.0 + time * 5.0) > 0.95) {
                                pulseColor = mix(pulseColor, secondaryColor, 0.8);
                            }
                        }
                        
                        vec3 finalColor = pulseColor * scanLine * glitchEffect;
                        
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,
                side: THREE.DoubleSide
            });
            
            // Create mesh and position it in 3D space
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            // Position text at a random location around the scene
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 15 + 20;
            
            textMesh.position.x = Math.cos(angle) * radius;
            textMesh.position.y = (Math.random() - 0.5) * 15;
            textMesh.position.z = Math.sin(angle) * radius;
            
            // Add slight random rotation
            textMesh.rotation.x = Math.random() * 0.2 - 0.1;
            textMesh.rotation.y = Math.random() * 0.2 - 0.1;
            textMesh.rotation.z = Math.random() * 0.2 - 0.1;
            
            // Look at black hole
            textMesh.lookAt(0, 0, 0);
            
            // Add to scene
            this.scene.add(textMesh);
            
            // Update fragment with actual mesh
            fragment.mesh = textMesh;
            fragment.position = new THREE.Vector3().copy(textMesh.position);
        });
    },
    
    createTextSprite(text) {
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw the text on the canvas
        context.fillStyle = '#00000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 24px Orbitron, Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add a glow effect
        context.shadowColor = this.getThemeColor('primary') || '#ff00ff';
        context.shadowBlur = 15;
        context.fillStyle = '#ffffff';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create a sprite material using the texture
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        // Create and position the sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Position sprite at a random location
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 20;
        
        sprite.position.x = Math.cos(angle) * radius;
        sprite.position.y = (Math.random() - 0.5) * 15;
        sprite.position.z = Math.sin(angle) * radius;
        
        sprite.scale.set(10, 5, 1);
        
        return sprite;
    },
    
    createDataStreamEffect(fragment) {
        // Create a particle stream that flows from input to the fragment, then to the black hole
        const streamGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        
        // Create positions for the stream particles
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const startColor = new THREE.Color(this.getThemeColor('primary') || '#ff00ff');
        const endColor = new THREE.Color(this.getThemeColor('secondary') || '#00ffff');
        
        // Input field position in 3D space
        const inputPos = new THREE.Vector3(0, -5, 30);
        
        // Create curved trail of particles from input to text fragment
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            
            // Create a curved path
            const xCurve = this.quadraticCurve(inputPos.x, fragment.position.x, t);
            const yCurve = this.quadraticCurve(inputPos.y, fragment.position.y, t);
            const zCurve = this.quadraticCurve(inputPos.z, fragment.position.z, t);
            
            positions[i * 3] = xCurve;
            positions[i * 3 + 1] = yCurve; 
            positions[i * 3 + 2] = zCurve;
            
            // Blend from primary to secondary color
            const color = new THREE.Color().lerpColors(startColor, endColor, t);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Particles get smaller as they approach the fragment
            sizes[i] = 0.5 * (1 - t) + 0.1;
        }
        
        streamGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        streamGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        streamGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create shader material for particles
        const streamMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                
                uniform float time;
                uniform float pixelRatio;
                
                varying vec3 vColor;
                varying float vProgress;
                
                void main() {
                    vColor = color;
                    vProgress = float(gl_VertexID) / 100.0;
                    
                    // Add motion along the stream
                    float waveOffset = sin(vProgress * 10.0 + time * 5.0) * 0.2;
                    vec3 pos = position;
                    pos.x += waveOffset * (1.0 - vProgress);
                    pos.y += cos(vProgress * 8.0 + time * 3.0) * 0.2 * (1.0 - vProgress);
                    
                    // Animate the particles along the path
                    float speedFactor = mod(time * 0.5 + vProgress, 1.0);
                    
                    // Make particles move from input to fragment
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vProgress;
                
                uniform float time;
                
                void main() {
                    // Create a glowing, pulsing particle
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    // Pulse effect
                    float pulse = sin(vProgress * 20.0 + time * 3.0) * 0.1 + 0.9;
                    
                    // Fade particles at the beginning and end of the stream
                    float fade = sin(vProgress * 3.14159) * pulse;
                    
                    gl_FragColor = vec4(vColor, fade * (1.0 - dist * 2.0));
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create the particle system
        const streamParticles = new THREE.Points(streamGeometry, streamMaterial);
        this.scene.add(streamParticles);
        
        // Create timeline for stream effect
        const startTime = Date.now();
        const duration = 2000; // 2 seconds
        
        // Create and play the black hole effect sound
        if (this.audioContext && this.audioContext.state === 'running') {
            this.createBlackHoleEffectSound();
        }
        
        // Update and remove the stream over time
        const updateStream = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Update the time uniform for animation
            streamMaterial.uniforms.time.value = elapsed / 1000;
            
            if (progress < 1) {
                requestAnimationFrame(updateStream);
            } else {
                // Remove the stream after the animation is complete
                this.scene.remove(streamParticles);
                streamGeometry.dispose();
                streamMaterial.dispose();
            }
        };
        
        // Start the update loop
        updateStream();
    },
    
    quadraticCurve(start, end, t) {
        // Create a control point to bend the curve
        const controlPoint = (start + end) / 2 + (Math.random() - 0.5) * 10;
        
        // Quadratic Bezier curve formula
        return (1 - t) * (1 - t) * start + 2 * (1 - t) * t * controlPoint + t * t * end;
    },
    
    updateOrbPositions() {
        this.orbData.forEach(orb => {
            // Update orbit angle with individual speeds
            orb.angle = orb.baseAngle + this.clock.getElapsedTime() * orb.speed;
            
            // Calculate base position
            orb.targetX = this.sizes.width / 2 + Math.cos(orb.angle) * orb.radius;
            orb.targetY = this.sizes.height / 2 + Math.sin(orb.angle) * orb.radius;
            
            // Apply mouse repulsion
            if (this.mouse.x !== 0 || this.mouse.y !== 0) {
                const mouseWorldX = this.mouse.x * this.sizes.width / 2;
                const mouseWorldY = this.mouse.y * this.sizes.height / 2;
                
                const dx = orb.targetX - (this.sizes.width / 2 + mouseWorldX);
                const dy = orb.targetY - (this.sizes.height / 2 + mouseWorldY);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const force = 100 / Math.max(distance, 50);
                    orb.vx += dx * 0.001 * force;
                    orb.vy += dy * 0.001 * force;
                }
            }
            
            // Apply velocities with damping
            orb.vx *= 0.95;
            orb.vy *= 0.95;
            
            // Smooth transitioning to target position
            orb.x = THREE.MathUtils.lerp(orb.x, orb.targetX + orb.vx * 30, 0.1);
            orb.y = THREE.MathUtils.lerp(orb.y, orb.targetY + orb.vy * 30, 0.1);
            
            // Quantum effects - subtle random jumps
            if (Math.random() < 0.001) {
                orb.x += (Math.random() - 0.5) * 20;
                orb.y += (Math.random() - 0.5) * 20;
            }
            
            // Update DOM element
            const size = orb.hoverState ? 70 : 60;
            orb.element.style.left = `${orb.x - size/2}px`;
            orb.element.style.top = `${orb.y - size/2}px`;
            orb.element.style.width = `${size}px`;
            orb.element.style.height = `${size}px`;
            
            // Update visual state
            if (orb.entangled) {
                orb.element.style.background = 'radial-gradient(circle, #00ffff 20%, #ff00ff 80%)';
                orb.element.style.boxShadow = '0 0 20px #00ffff';
            } else if (orb.hoverState) {
                orb.element.style.background = 'radial-gradient(circle, #ffffff 20%, #ff00ff 80%)';
                orb.element.style.boxShadow = '0 0 15px #ff00ff';
            } else {
                // Pulsing effect
                const pulse = Math.sin(this.clock.getElapsedTime() * 3 + orb.pulsePhase) * 0.1 + 0.9;
                orb.element.style.background = 'radial-gradient(circle, #fff 20%, #ff00ff 80%)';
                orb.element.style.boxShadow = `0 0 ${10 * pulse}px #ff00ff`;
                orb.element.style.transform = `scale(${pulse})`;
            }
        });
    },
    
    updateFragments() {
        // Update the data fragments to move toward the black hole
        const now = Date.now();
        
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            
            if (fragment.mesh) {
                // Calculate distance to black hole center
                const distanceToCenter = fragment.position.length();
                
                if (!fragment.absorbed) {
                    // Move fragments toward the black hole center
                    const direction = new THREE.Vector3(0, 0, 0).sub(fragment.position).normalize();
                    const speed = fragment.speed * (1 + (20 - distanceToCenter) * 0.1);
                    
                    // Update position
                    fragment.position.add(direction.multiplyScalar(speed));
                    fragment.mesh.position.copy(fragment.position);
                    
                    // Apply rotation
                    fragment.mesh.rotation.x += fragment.rotation.x;
                    fragment.mesh.rotation.y += fragment.rotation.y;
                    fragment.mesh.rotation.z += fragment.rotation.z;
                    
                    // Increase rotation speed as it gets closer to the black hole
                    const rotationFactor = Math.max(0.5, 10 / distanceToCenter);
                    fragment.rotation.x *= rotationFactor;
                    fragment.rotation.y *= rotationFactor;
                    fragment.rotation.z *= rotationFactor;
                    
                    // Apply glitch effect as it approaches the black hole
                    if (distanceToCenter < 15) {
                        fragment.glitchIntensity = (15 - distanceToCenter) / 15;
                        
                        // Ensure the material has the right uniform
                        if (fragment.mesh.material && fragment.mesh.material.uniforms && fragment.mesh.material.uniforms.glitchIntensity) {
                            fragment.mesh.material.uniforms.glitchIntensity.value = fragment.glitchIntensity;
                        }
                    }
                    
                    // Start absorption when close enough
                    if (distanceToCenter < 3) {
                        fragment.absorbed = true;
                        fragment.absorptionStartTime = now;
                        
                        // Trigger the black hole absorption effect
                        this.createAbsorptionEffect(fragment);
                    }
                } else {
                    // Fragment is being absorbed
                    const absorptionTime = now - fragment.absorptionStartTime;
                    const absorptionDuration = 1500; // 1.5 seconds
                    const absorptionProgress = Math.min(1, absorptionTime / absorptionDuration);
                    
                    // Spiral fragment into the black hole
                    const angle = absorptionProgress * Math.PI * 4;
                    const radius = 3 * (1 - absorptionProgress);
                    
                    fragment.mesh.position.x = Math.cos(angle) * radius;
                    fragment.mesh.position.y = Math.sin(angle) * radius;
                    fragment.mesh.position.z = (1 - absorptionProgress) * 2;
                    
                    // Scale down as it gets absorbed
                    const scale = 1 - absorptionProgress;
                    fragment.mesh.scale.set(scale, scale, scale);
                    
                    // Increase rotation speed during absorption
                    fragment.mesh.rotation.x += 0.1;
                    fragment.mesh.rotation.y += 0.15;
                    fragment.mesh.rotation.z += 0.2;
                    
                    // Remove completely absorbed fragments
                    if (absorptionProgress >= 1) {
                        // Remove the mesh from the scene
                        this.scene.remove(fragment.mesh);
                        
                        // Dispose of geometry and material
                        if (fragment.mesh.geometry) fragment.mesh.geometry.dispose();
                        if (fragment.mesh.material) {
                            if (Array.isArray(fragment.mesh.material)) {
                                fragment.mesh.material.forEach(material => material.dispose());
                            } else {
                                fragment.mesh.material.dispose();
                            }
                        }
                        
                        // Remove from fragments array
                        this.fragments.splice(i, 1);
                    }
                }
            }
        }
    },
    
    createAbsorptionEffect(fragment) {
        // Create a dramatic effect when a fragment is absorbed by the black hole
        
        // Play the black hole effect sound
        if (this.audioContext && this.audioContext.state === 'running') {
            this.createBlackHoleEffectSound();
        }
        
        // Create a bright flash of energy
        const flashGeometry = new THREE.SphereGeometry(2, 32, 32);
        const flashMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(this.getThemeColor('primary') || '#ff00ff') },
                secondaryColor: { value: new THREE.Color(this.getThemeColor('secondary') || '#00ffff') }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform vec3 secondaryColor;
                
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                    // Create a pulsing flash effect
                    float pulse = sin(time * 20.0) * 0.5 + 0.5;
                    
                    // Color shift based on time
                    vec3 finalColor = mix(color, secondaryColor, pulse);
                    
                    // Edge glow
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
                    
                    gl_FragColor = vec4(finalColor, fresnel);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.scene.add(flash);
        
        // Create energy particles that emerge from the absorption point
        const particleCount = 150;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        const particleColors = new Float32Array(particleCount * 3);
        
        const primaryColor = new THREE.Color(this.getThemeColor('primary') || '#ff00ff');
        const secondaryColor = new THREE.Color(this.getThemeColor('secondary') || '#00ffff');
        
        for (let i = 0; i < particleCount; i++) {
            // Initial positions at the absorption point
            particlePositions[i * 3] = 0;
            particlePositions[i * 3 + 1] = 0;
            particlePositions[i * 3 + 2] = 0;
            
            // Random velocities in all directions
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = Math.random() * 0.3 + 0.1;
            
            particleVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            particleVelocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            particleVelocities[i * 3 + 2] = Math.cos(phi) * speed;
            
            // Random sizes
            particleSizes[i] = Math.random() * 0.4 + 0.1;
            
            // Colors between primary and secondary
            const colorMix = Math.random();
            const color = new THREE.Color().lerpColors(primaryColor, secondaryColor, colorMix);
            particleColors[i * 3] = color.r;
            particleColors[i * 3 + 1] = color.g;
            particleColors[i * 3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute vec3 velocity;
                attribute float size;
                attribute vec3 color;
                
                uniform float time;
                uniform float pixelRatio;
                
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    
                    // Simple physics for particle movement
                    vec3 pos = position + velocity * time;
                    
                    // Add some swirling effect
                    float swirl = sin(time * 3.0 + length(position) * 5.0) * 0.2;
                    pos.x += swirl;
                    pos.y += swirl;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Circular particles with soft edges
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    // Fade out at the edges
                    float opacity = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, opacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Animate particles and flash
        const startTime = Date.now();
        const duration = 1500; // 1.5 seconds
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Update time uniform for animations
                flashMaterial.uniforms.time.value = elapsed / 1000;
                particleMaterial.uniforms.time.value = elapsed / 1000;
                
                // Scale flash based on progress
                const flashScale = Math.sin(progress * Math.PI) * 2;
                flash.scale.set(flashScale, flashScale, flashScale);
                
                requestAnimationFrame(animateParticles);
            } else {
                // Remove the effects when animation is complete
                this.scene.remove(flash);
                this.scene.remove(particles);
                
                // Dispose of geometries and materials
                flashGeometry.dispose();
                flashMaterial.dispose();
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };
        
        // Start animation
        animateParticles();
        
        // Create a ripple in the accretion disk
        if (this.accretionDisk) {
            const diskScale = { value: 1 };
            const originalScale = this.accretionDisk.scale.clone();
            
            // Simple ripple animation
            const animateDisk = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                if (progress < 1) {
                    const pulseScale = 1 + 0.1 * Math.sin(progress * Math.PI * 4);
                    this.accretionDisk.scale.set(
                        originalScale.x * pulseScale,
                        originalScale.y * pulseScale,
                        originalScale.z * pulseScale
                    );
                    
                    requestAnimationFrame(animateDisk);
                } else {
                    // Restore original scale
                    this.accretionDisk.scale.copy(originalScale);
                }
            };
            
            animateDisk();
        }
    },
    
    createKeyPressEffect() {
        // Only create effect if particles exist
        if (!this.particles || !this.initialized) return;
        
        // Get input position
        const input = document.getElementById('data-input');
        const rect = input.getBoundingClientRect();
        const inputCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        // Convert to normalized device coordinates (-1 to +1)
        const ndc = {
            x: (inputCenter.x / this.sizes.width) * 2 - 1,
            y: -(inputCenter.y / this.sizes.height) * 2 + 1
        };
        
        // Convert to world coordinates
        const worldPos = new THREE.Vector3(ndc.x, ndc.y, 0);
        worldPos.unproject(this.camera);
        
        // Create 5-10 particles that move outward from input
        const particleCount = 5 + Math.floor(Math.random() * 5);
        const colors = this.particles.geometry.attributes.color.array;
        const positions = this.particles.geometry.attributes.position.array;
        
        // Find particles closest to input and give them velocity away from input
        const particleIndices = [];
        const distances = [];
        
        // Find distances to all particles
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            const particlePos = new THREE.Vector3(
                positions[i3],
                positions[i3 + 1],
                positions[i3 + 2]
            );
            
            const distance = particlePos.distanceTo(worldPos);
            distances.push({ index: i, distance });
        }
        
        // Sort by distance and take the closest ones
        distances.sort((a, b) => a.distance - b.distance);
        
        // Affect the closest particles
        for (let i = 0; i < Math.min(particleCount, distances.length); i++) {
            const particleIndex = distances[i].index;
            const i3 = particleIndex * 3;
            
            // Brighten the particle
            colors[i3] = Math.min(1, colors[i3] * 1.5);
            colors[i3 + 1] = Math.min(1, colors[i3 + 1] * 1.5);
            colors[i3 + 2] = Math.min(1, colors[i3 + 2] * 1.5);
            
            // Store the index for velocity updates
            particleIndices.push(particleIndex);
        }
        
        // Update colors
        this.particles.geometry.attributes.color.needsUpdate = true;
        
        // Store affected particles for animation
        this.keyPressParticles = {
            indices: particleIndices,
            origin: worldPos,
            time: 0
        };
    },
    
    increaseParticleActivity(active) {
        // Store the state
        this.particlesActive = active;
        
        // We'll use this state in the updateParticles method
    },
    
    updateParticles() {
        if (!this.particles) return;
        
        const time = this.clock.getElapsedTime();
        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;
        
        // Update keypress particles if they exist
        if (this.keyPressParticles) {
            this.keyPressParticles.time += 0.016; // Approximately 60fps
            
            // Animate for 1 second
            if (this.keyPressParticles.time < 1) {
                const origin = this.keyPressParticles.origin;
                
                for (const index of this.keyPressParticles.indices) {
                    const i3 = index * 3;
                    
                    // Get current position
                    const particlePos = new THREE.Vector3(
                        positions[i3],
                        positions[i3 + 1],
                        positions[i3 + 2]
                    );
                    
                    // Calculate direction away from origin
                    const direction = new THREE.Vector3().subVectors(particlePos, origin).normalize();
                    
                    // Move particle outward
                    const speed = 0.1 * (1 - this.keyPressParticles.time);
                    positions[i3] += direction.x * speed;
                    positions[i3 + 1] += direction.y * speed;
                    positions[i3 + 2] += direction.z * speed;
                    
                    // Fade the brightness back to normal
                    const fadeRate = 0.98;
                    colors[i3] = Math.max(0.1, colors[i3] * fadeRate);
                    colors[i3 + 1] = Math.max(0.1, colors[i3 + 1] * fadeRate);
                    colors[i3 + 2] = Math.max(0.1, colors[i3 + 2] * fadeRate);
                }
                
                // Update the attributes
                this.particles.geometry.attributes.position.needsUpdate = true;
                this.particles.geometry.attributes.color.needsUpdate = true;
            } else {
                // Clear the keypress particles after animation
                this.keyPressParticles = null;
            }
        }
        
        // Regular particle updates
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Basic particle movement
            positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.01;
            
            // If particles are active (input focused), make them more energetic
            if (this.particlesActive) {
                positions[i3] += Math.sin(time * 2 + i * 0.3) * 0.02;
                positions[i3 + 2] += Math.cos(time * 2 + i * 0.2) * 0.02;
                
                // Slightly brighten all particles
                if (Math.random() > 0.95) {
                    colors[i3] = Math.min(1, colors[i3] * 1.05);
                    colors[i3 + 1] = Math.min(1, colors[i3 + 1] * 1.05);
                    colors[i3 + 2] = Math.min(1, colors[i3 + 2] * 1.05);
                }
            }
        }
        
        // Update the attributes
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.color.needsUpdate = true;
    },
    
    updateShaders(time) {
        // Update black hole shader
        if (this.blackHole && this.blackHole.material.uniforms) {
            this.blackHole.material.uniforms.time.value = time;
            
            // Rotate the black hole slowly
            this.blackHole.rotation.z = time * 0.05;
        }
        
        // Update post-processing uniforms if available
        if (this.composer) {
            const passes = this.composer.passes;
            for (let i = 0; i < passes.length; i++) {
                if (passes[i].uniforms && passes[i].uniforms.time) {
                    passes[i].uniforms.time.value = time;
                }
            }
        }
    },
    
    animate() {
        // Update delta time and elapsed time
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update black hole and effects
        if (this.blackHole && this.blackHole.material.uniforms) {
            this.blackHole.material.uniforms.time.value = elapsedTime;
        }
        
        // Update accretion disk
        if (this.accretionDisk && this.accretionDisk.material.uniforms) {
            this.accretionDisk.material.uniforms.time.value = elapsedTime;
        }
        
        // Update event horizon particles
        if (this.eventHorizonParticles && this.eventHorizonParticles.material.uniforms) {
            this.eventHorizonParticles.material.uniforms.time.value = elapsedTime;
        }
        
        // Update magnetic field lines
        if (this.magneticFieldLines) {
            this.magneticFieldLines.forEach(line => {
                if (line.material.uniforms) {
                    line.material.uniforms.time.value = elapsedTime;
                }
            });
        }
        
        // Update particles
        this.updateParticles();
        
        // Update orb positions
        this.updateOrbPositions();
        
        // Update data fragments
        this.updateFragments();
        
        // Update shaders
        this.updateShaders(elapsedTime);
        
        // Rotate the black hole
        if (this.blackHole) {
            this.blackHole.rotation.y = elapsedTime * 0.1;
        }
        
        // Render the scene
        if (this.config.bloom && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Continue animation loop
        requestAnimationFrame(() => this.animate());
    },
    
    // Mobile touch support
    initTouchControls() {
        // Use Pointer Events when available for better cross-device support
        const canvas = document.getElementById('scene');
        
        // Track touch start position for swipe detection
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTouchTime = 0;
        let isTouching = false;
        
        // Handle pointer down (touch start or mouse down)
        canvas.addEventListener('pointerdown', (e) => {
            // Prevent default behavior to avoid scrolling/zooming on mobile
            e.preventDefault();
            
            touchStartX = e.clientX;
            touchStartY = e.clientY;
            lastTouchTime = Date.now();
            isTouching = true;
            
            // Create a ripple effect at touch point
            this.createTouchRipple(e.clientX, e.clientY);
        }, { passive: false });
        
        // Handle pointer move (touch move or mouse move)
        window.addEventListener('pointermove', (e) => {
            if (!isTouching) return;
            
            // Update the camera rotation based on touch/pointer movement
            const deltaX = (e.clientX - touchStartX) * 0.005;
            const deltaY = (e.clientY - touchStartY) * 0.005;
            
            // Only rotate based on significant movement to avoid jitter
            if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
                this.camera.rotation.y += deltaX;
                this.camera.rotation.x += deltaY;
                
                // Limit vertical rotation to avoid flipping
                this.camera.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, this.camera.rotation.x));
                
                // Update touch start for incremental movement
                touchStartX = e.clientX;
                touchStartY = e.clientY;
            }
        });
        
        // Handle pointer up (touch end or mouse up)
        window.addEventListener('pointerup', () => {
            const touchDuration = Date.now() - lastTouchTime;
            isTouching = false;
            
            // Detect tap (quick touch) vs drag
            if (touchDuration < 300) {
                // This was a tap - maybe trigger a special effect
                this.createPulsarEffect();
            }
        });
        
        // Handle pinch-to-zoom gestures
        let initialDistance = 0;
        
        // Track multiple touch points
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });
        
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                if (initialDistance > 0) {
                    const delta = currentDistance - initialDistance;
                    initialDistance = currentDistance;
                    
                    // Adjust camera FOV or Z position based on pinch
                    this.camera.position.z = Math.max(20, Math.min(80, this.camera.position.z - delta * 0.1));
                }
            }
        });
    },
    
    createTouchRipple(x, y) {
        // Create a ripple effect at the touch point
        const rippleCount = 8;
        const rippleRadius = 2;
        const rippleGeometry = new THREE.CircleGeometry(rippleRadius, 16);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.getThemeColor('primary')),
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Convert screen coordinates to normalized device coordinates (NDC)
        const ndcX = (x / this.sizes.width) * 2 - 1;
        const ndcY = -(y / this.sizes.height) * 2 + 1;
        
        // Convert NDC to world space
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        // Create ripple effect
        for (let i = 0; i < rippleCount; i++) {
            const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial.clone());
            ripple.position.copy(pos);
            ripple.rotation.x = Math.PI / 2;
            this.scene.add(ripple);
            
            // Animate the ripple
            const delay = i * 100;
            const duration = 1000;
            const startTime = Date.now() + delay;
            
            const updateRipple = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                
                if (elapsed >= 0 && elapsed < duration) {
                    const progress = elapsed / duration;
                    const scale = 1 + progress * 5;
                    ripple.scale.set(scale, scale, scale);
                    ripple.material.opacity = 0.7 * (1 - progress);
                    
                    requestAnimationFrame(updateRipple);
                } else if (elapsed >= duration) {
                    this.scene.remove(ripple);
                    ripple.geometry.dispose();
                    ripple.material.dispose();
                } else {
                    requestAnimationFrame(updateRipple);
                }
            };
            
            requestAnimationFrame(updateRipple);
        }
    },
    
    createPulsarEffect() {
        // Create a dramatic pulse effect when tapping (without dragging)
        const pulseLight = new THREE.PointLight(
            new THREE.Color(this.getThemeColor('primary')),
            2,
            50
        );
        pulseLight.position.set(0, 0, 5);
        this.scene.add(pulseLight);
        
        // Animate the pulse
        const startTime = Date.now();
        const duration = 600;
        
        const animatePulse = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const intensity = 2 * Math.sin(progress * Math.PI);
                pulseLight.intensity = intensity;
                
                requestAnimationFrame(animatePulse);
            } else {
                this.scene.remove(pulseLight);
            }
        };
        
        requestAnimationFrame(animatePulse);
    },
    
    getThemeColor(colorName) {
        // Get CSS variable color values for use in Three.js
        const isDarkMode = !document.body.classList.contains('light-mode');
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue(`--${colorName}`).trim();
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Load any polyfills or dependencies first
    if (!THREE.EffectComposer) {
        // Create simple replacements if full Three.js post-processing not available
        THREE.EffectComposer = function(renderer) {
            this.renderer = renderer;
            this.passes = [];
            this.render = function() { renderer.render(app.scene, app.camera); };
            this.addPass = function(pass) { this.passes.push(pass); };
            this.setSize = function(w, h) { /* no-op */ };
        };
        
        THREE.RenderPass = function(scene, camera) { this.uniforms = {}; };
        THREE.ShaderPass = function(shader) { this.uniforms = shader.uniforms || {}; };
        THREE.UnrealBloomPass = function() { this.uniforms = {}; };
    }
    
    // Initialize app
    app.init();
});