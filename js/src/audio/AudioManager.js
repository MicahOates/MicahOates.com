export class AudioManager {
    constructor(app) {
        this.app = app;
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        
        // Audio nodes
        this.ambientSound = null;
        this.interactionSounds = {};
        
        // Noise generator for complex sound synthesis
        this.noiseBuffer = null;
    }
    
    /**
     * Initialize audio system
     */
    init() {
        // Create audio context on user interaction
        this.setupAudioContext();
        
        // Add audio controls to UI
        this.addAudioControls();
    }
    
    /**
     * Set up audio context (must be triggered by user interaction)
     */
    setupAudioContext() {
        const initializeAudioOnInteraction = () => {
            // Remove event listeners once audio is initialized
            document.removeEventListener('click', initializeAudioOnInteraction);
            document.removeEventListener('keydown', initializeAudioOnInteraction);
            
            // Create audio context
            this.createAudioContext();
            
            // Create ambient sound
            this.setupAmbientSound();
            
            // Create interactive sound effects
            this.setupInteractionSounds();
            
            // Generate noise buffer for sound synthesis
            this.createNoiseGenerator();
            
            // Schedule ambient variations
            this.scheduleAmbientVariations();
        };
        
        // Set up event listeners for user interaction
        document.addEventListener('click', initializeAudioOnInteraction);
        document.addEventListener('keydown', initializeAudioOnInteraction);
    }
    
    /**
     * Create Web Audio API context
     */
    createAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.7; // Default volume at 70%
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Audio context initialized');
        } catch (e) {
            console.error('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    /**
     * Set up ambient background sound
     */
    setupAmbientSound() {
        if (!this.audioContext || !this.enabled) return;
        
        // Create a low frequency oscillator for bass drone
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Very slow modulation
        
        // Create a bass oscillator
        const bassOsc = this.audioContext.createOscillator();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = 55; // Low A note
        
        // Create a pad oscillator for ambient wash
        const padOsc = this.audioContext.createOscillator();
        padOsc.type = 'sine';
        padOsc.frequency.value = 220; // A3
        
        // Create gain nodes for each source
        const bassGain = this.audioContext.createGain();
        bassGain.gain.value = 0.15;
        
        const padGain = this.audioContext.createGain();
        padGain.gain.value = 0.05;
        
        // Connect LFO to oscillator frequencies for subtle modulation
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 2; // Modulation amount
        lfo.connect(lfoGain);
        lfoGain.connect(bassOsc.frequency);
        
        const lfoGain2 = this.audioContext.createGain();
        lfoGain2.gain.value = 1;
        lfo.connect(lfoGain2);
        lfoGain2.connect(padOsc.frequency);
        
        // Create filters
        const bassFilter = this.audioContext.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 0.7;
        
        const padFilter = this.audioContext.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 800;
        padFilter.Q.value = 2;
        
        // Connect oscillators to their respective gain and filter nodes
        bassOsc.connect(bassGain);
        bassGain.connect(bassFilter);
        bassFilter.connect(this.masterGain);
        
        padOsc.connect(padGain);
        padGain.connect(padFilter);
        padFilter.connect(this.masterGain);
        
        // Create reverb effect
        this.createReverb(3.0).then(reverb => {
            // Add reverb to pad sound
            const reverbGain = this.audioContext.createGain();
            reverbGain.gain.value = 0.5;
            
            padGain.connect(reverbGain);
            reverbGain.connect(reverb);
            reverb.connect(this.masterGain);
            
            console.log('Reverb added to ambient sound');
        });
        
        // Start oscillators
        lfo.start();
        bassOsc.start();
        padOsc.start();
        
        // Store references to control later
        this.ambientSound = {
            lfo, bassOsc, padOsc,
            bassGain, padGain,
            bassFilter, padFilter
        };
        
        console.log('Ambient sound initialized');
    }
    
    /**
     * Set up interactive sound effects
     */
    setupInteractionSounds() {
        if (!this.audioContext || !this.enabled) return;
        
        // Create sound for orb hover
        this.interactionSounds.orbHover = {
            play: () => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 440;
                
                const gain = this.audioContext.createGain();
                gain.gain.value = 0;
                
                // Short envelope
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                // Filter for softer sound
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1000;
                filter.Q.value = 1;
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.3);
            }
        };
        
        // Create sound for data entry
        this.interactionSounds.dataEntry = {
            play: () => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = 220 + Math.random() * 100;
                
                const gain = this.audioContext.createGain();
                gain.gain.value = 0;
                
                // Short click-like envelope
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.1);
            }
        };
        
        // Create sound for data absorption
        this.interactionSounds.dataAbsorption = {
            play: () => {
                // Use noise for more complex sound
                if (!this.noiseBuffer) return;
                
                const source = this.audioContext.createBufferSource();
                source.buffer = this.noiseBuffer;
                
                const gain = this.audioContext.createGain();
                gain.gain.value = 0;
                
                // Low pass filter sweep
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 1000;
                filter.Q.value = 5;
                
                // Sweep filter frequency down
                filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
                filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 1.0);
                
                // Envelope
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.0);
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                
                source.start();
                source.stop(this.audioContext.currentTime + 1.0);
            }
        };
        
        console.log('Interaction sounds initialized');
    }
    
    /**
     * Create noise buffer for sound synthesis
     */
    createNoiseGenerator() {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 2.0; // 2 seconds of noise
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Fill the buffer with noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        this.noiseBuffer = buffer;
    }
    
    /**
     * Create reverb effect
     */
    createReverb(duration = 2.0) {
        return new Promise((resolve) => {
            if (!this.audioContext) return resolve(null);
            
            // Create impulse response buffer
            const sampleRate = this.audioContext.sampleRate;
            const length = sampleRate * duration;
            const impulse = this.audioContext.createBuffer(2, length, sampleRate);
            const impulseL = impulse.getChannelData(0);
            const impulseR = impulse.getChannelData(1);
            
            // Generate impulse response (simple exponential decay)
            for (let i = 0; i < length; i++) {
                const n = i / length;
                // Exponential decay
                const decay = Math.exp(-n * 5);
                // Add some randomness for a more natural sound
                impulseL[i] = (Math.random() * 2 - 1) * decay;
                impulseR[i] = (Math.random() * 2 - 1) * decay;
            }
            
            // Create convolver node
            const convolver = this.audioContext.createConvolver();
            convolver.buffer = impulse;
            
            resolve(convolver);
        });
    }
    
    /**
     * Create distortion effect
     */
    makeDistortionCurve(amount = 50) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        
        for (let i = 0; i < n_samples; i++) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * Math.PI / (Math.PI + k * Math.abs(x));
        }
        
        return curve;
    }
    
    /**
     * Schedule variations in ambient sound
     */
    scheduleAmbientVariations() {
        if (!this.audioContext || !this.ambientSound) return;
        
        const changeParameters = () => {
            if (!this.ambientSound) return;
            
            // Helper function for random value in range
            const rand = (min, max) => Math.random() * (max - min) + min;
            
            // Slowly change pad filter frequency
            const { padFilter, bassFilter, padGain } = this.ambientSound;
            
            if (padFilter) {
                const currentFreq = padFilter.frequency.value;
                const targetFreq = rand(400, 1200);
                
                padFilter.frequency.linearRampToValueAtTime(
                    targetFreq,
                    this.audioContext.currentTime + 5
                );
            }
            
            // Schedule next change
            setTimeout(changeParameters, rand(10000, 20000));
        };
        
        // Start the variation cycle
        changeParameters();
    }
    
    /**
     * Add audio controls to UI
     */
    addAudioControls() {
        // Create audio toggle button
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'audio-controls';
        
        const audioToggle = document.createElement('button');
        audioToggle.className = 'audio-toggle';
        audioToggle.innerHTML = '<span>♫</span>';
        audioToggle.setAttribute('aria-label', 'Toggle audio');
        audioToggle.addEventListener('click', () => this.toggleAudio(audioToggle));
        
        controlsContainer.appendChild(audioToggle);
        document.body.appendChild(controlsContainer);
    }
    
    /**
     * Toggle audio on/off
     */
    toggleAudio(audioToggle) {
        if (!this.audioContext) return;
        
        this.enabled = !this.enabled;
        
        if (this.masterGain) {
            // Smoothly fade volume
            const now = this.audioContext.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            
            if (this.enabled) {
                this.masterGain.gain.linearRampToValueAtTime(0.7, now + 0.5);
                audioToggle.classList.remove('muted');
            } else {
                this.masterGain.gain.linearRampToValueAtTime(0.0, now + 0.5);
                audioToggle.classList.add('muted');
            }
        }
    }
    
    /**
     * Play a sound effect
     */
    playSound(soundName, options = {}) {
        if (!this.enabled || !this.audioContext || !this.interactionSounds[soundName]) return;
        
        this.interactionSounds[soundName].play(options);
    }
    
    /**
     * Create a temporary sound
     */
    createTempSound(options = {}) {
        if (!this.enabled || !this.audioContext) return;
        
        const { 
            frequency = 440, 
            type = 'sine',
            attack = 0.05,
            decay = 0.2,
            sustain = 0.3,
            release = 0.5,
            volume = 0.2,
            pan = 0
        } = options;
        
        // Create oscillator
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = frequency;
        
        // Create envelope
        const env = this.audioContext.createGain();
        env.gain.value = 0;
        
        // Create panner
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = pan;
        
        // Connect nodes
        osc.connect(env);
        env.connect(panner);
        panner.connect(this.masterGain);
        
        // Apply envelope
        const now = this.audioContext.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(volume, now + attack);
        env.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
        env.gain.setValueAtTime(volume * sustain, now + attack + decay);
        env.gain.exponentialRampToValueAtTime(0.001, now + attack + decay + release);
        
        // Start and stop oscillator
        osc.start(now);
        osc.stop(now + attack + decay + release + 0.1);
        
        return {
            oscillator: osc,
            envelope: env,
            panner: panner
        };
    }
    
    /**
     * Dispose of audio resources
     */
    dispose() {
        if (!this.audioContext) return;
        
        // Stop all sounds
        if (this.ambientSound) {
            // Stop oscillators
            if (this.ambientSound.lfo) {
                this.ambientSound.lfo.stop();
                this.ambientSound.lfo.disconnect();
            }
            
            if (this.ambientSound.bassOsc) {
                this.ambientSound.bassOsc.stop();
                this.ambientSound.bassOsc.disconnect();
            }
            
            if (this.ambientSound.padOsc) {
                this.ambientSound.padOsc.stop();
                this.ambientSound.padOsc.disconnect();
            }
            
            // Disconnect other nodes
            if (this.ambientSound.bassGain) this.ambientSound.bassGain.disconnect();
            if (this.ambientSound.padGain) this.ambientSound.padGain.disconnect();
            if (this.ambientSound.bassFilter) this.ambientSound.bassFilter.disconnect();
            if (this.ambientSound.padFilter) this.ambientSound.padFilter.disconnect();
            
            this.ambientSound = null;
        }
        
        // Clean up interaction sounds
        for (const soundName in this.interactionSounds) {
            if (this.interactionSounds[soundName].dispose) {
                this.interactionSounds[soundName].dispose();
            }
        }
        this.interactionSounds = {};
        
        // Disconnect master gain
        if (this.masterGain) {
            this.masterGain.disconnect();
            this.masterGain = null;
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            if (this.audioContext.close) {
                this.audioContext.close().catch(e => console.error('Error closing audio context:', e));
            }
            this.audioContext = null;
        }
        
        // Remove UI elements
        const audioControls = document.querySelector('.audio-controls');
        if (audioControls) {
            audioControls.remove();
        }
        
        console.log('Audio Manager disposed');
    }
} 