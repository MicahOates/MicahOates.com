/**
 * TutorialManager
 * Handles the interactive tutorial overlay for first-time users
 */
export class TutorialManager {
    constructor(app) {
        this.app = app;
        this.steps = [];
        this.currentStep = 0;
        this.tutorialShown = false;
        this.tutorialKey = 'micahoates_tutorial_shown';
        
        // DOM elements
        this.overlay = null;
        this.content = null;
        
        this.init();
    }
    
    /**
     * Initialize the tutorial manager
     */
    init() {
        // Check if tutorial has been shown before
        const tutorialShown = localStorage.getItem(this.tutorialKey);
        
        // Only show tutorial for new users or if it's been reset
        if (!tutorialShown) {
            // Create overlay if it doesn't exist
            this.createTutorialOverlay();
            
            // Create tutorial steps
            this.createTutorialSteps();
            
            // Delay showing tutorial to let the experience load first
            setTimeout(() => {
                this.showTutorial();
            }, 3000);
        }
    }
    
    /**
     * Create the tutorial overlay structure
     */
    createTutorialOverlay() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        
        // Create content container
        this.content = document.createElement('div');
        this.content.className = 'tutorial-content';
        this.overlay.appendChild(this.content);
        
        // Add to DOM
        document.body.appendChild(this.overlay);
    }
    
    /**
     * Create all tutorial step content
     */
    createTutorialSteps() {
        // Step 1: Introduction
        this.steps.push({
            title: 'Welcome to the Cosmic Singularity',
            description: 'This interactive experience lets you explore a digital black hole. Learn how to interact with it in this quick guide.',
            animation: this.createIntroAnimation()
        });
        
        // Step 2: Tap interaction
        this.steps.push({
            title: 'Feed the Singularity',
            description: 'Tap anywhere on the screen to create particles that will flow into the black hole. Try tapping in different locations!',
            animation: this.createTapAnimation()
        });
        
        // Step 3: Navigation
        this.steps.push({
            title: 'Cosmic Navigation',
            description: 'Use the orbital controls to rotate and zoom around the scene. Explore different perspectives of the black hole.',
            animation: this.createNavigationAnimation()
        });
        
        // Step 4: Sections
        this.steps.push({
            title: 'Explore the Sections',
            description: 'Use the navigation orbs to explore different sections of this cosmic experience, like Projects, About, and Contact.',
            animation: this.createSectionsAnimation()
        });
    }
    
    /**
     * Create animation for the introduction step
     * @returns {HTMLElement} The animation container
     */
    createIntroAnimation() {
        const animContainer = document.createElement('div');
        animContainer.className = 'tutorial-animation';
        
        const blackhole = document.createElement('div');
        blackhole.className = 'tutorial-blackhole';
        animContainer.appendChild(blackhole);
        
        return animContainer;
    }
    
    /**
     * Create animation for the tap interaction step
     * @returns {HTMLElement} The animation container
     */
    createTapAnimation() {
        const animContainer = document.createElement('div');
        animContainer.className = 'tutorial-animation';
        
        const blackhole = document.createElement('div');
        blackhole.className = 'tutorial-blackhole';
        animContainer.appendChild(blackhole);
        
        const finger = document.createElement('img');
        finger.className = 'tutorial-finger';
        finger.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAuNSAzMS4yNUMyMy4zNDQ4IDMxLjI1IDI1Ljc1IDI4Ljg0NDggMjUuNzUgMjZDMjUuNzUgMjMuMTU1MiAyMy4zNDQ4IDIwLjc1IDIwLjUgMjAuNzVDMTcuNjU1MiAyMC43NSAxNS4yNSAyMy4xNTUyIDE1LjI1IDI2QzE1LjI1IDI4Ljg0NDggMTcuNjU1MiAzMS4yNSAyMC41IDMxLjI1WiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMzUgMTIuNUMzNS44Mjg0IDEyLjUgMzYuNSAxMS44Mjg0IDM2LjUgMTFDMzYuNSAxMC4xNzE2IDM1LjgyODQgOS41IDM1IDkuNUMzNC4xNzE2IDkuNSAzMy41IDEwLjE3MTYgMzMuNSAxMUMzMy41IDExLjgyODQgMzQuMTcxNiAxMi41IDM1IDEyLjVaIiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0yOC41MSAxOS40MjI1QzMwLjY5ODYgMTguNDE2NSAzMi4yNSAxNi4yMSAzMi4yNSAxMy42MjVDMzIuMjUgMTAuMDMyIDI5LjM0MyA3LjEyNSAyNS43NSA3LjEyNUMyMi4xNTcgNy4xMjUgMTkuMjUgMTAuMDMyIDE5LjI1IDEzLjYyNUMxOS4yNSAxNi4wNjM1IDIwLjY2MjUgMTguMTU0IDIyLjY5MzUgMTkuMjExNUwyMC45OTIgMjQuNzgwNUMxNy4zMzU1IDI1LjY3MyAxNC41IDI5LjAxMyAxNC41IDMzQzE0LjUgMzcuNzA2NSAxOC4zNjggNDEuNSAyMy4xNDUgNDEuNUMyNi42Mjk1IDQxLjUgMjkuNjU3NSAzOS41MzM1IDMxLjA3MzUgMzYuNjNMMzQuMDQ2IDM3LjgwMzVDMzQuMjcgMzcuOTAwNSAzNC40OTc1IDM3Ljk1IDM0LjcyNSAzNy45NUMzNS40NzMgMzcuOTUgMzYuMTc2IDM3LjUyIDM2LjQ5OTUgMzYuODIyNUMzNi45NDUgMzUuOTAyNSAzNi40ODcgMzQuODA3NSAzNS41Njc1IDM0LjM2MkwzMi41OTY1IDMzLjE4OUMzMi42MDc1IDMzLjEyNyAzMi42MTI1IDMzLjA2MzUgMzIuNjIgMzNDMzIuNjIgMjkuMTY5NSAyOS45ODg1IDI1Ljk1MSAyNi41MzU1IDI0LjkyMUwyOC4yMzU1IDE5LjM1NEwyOC41MSAxOS40MjI1Wk0yMy4xNDUgMzcuMDVDMjAuNzk1IDM3LjA1IDE4Ljk1IDM1LjI4IDExOC45NSAzM0MxOC45NSAzMC43MiAyMC43OTUgMjguOTUgMjMuMTQ1IDI4Ljk1QzI1LjQ5NSAyOC45NSAyNy4zNCAzMC43MiAyNy4zNCAzM0MyNy4zNCAzNS4yOCAyNS40OTUgMzcuMDUgMjMuMTQ1IDM3LjA1Wk0yMy43IDEzLjYyNUMyMy43IDE2LjM4NSAyNi4wNjc1IDE4LjIzNSAyNS43NSAxOC4yMzVDMjUuNDMgMTguMjM1IDIzLjcgMTYuMzgzIDIzLjcgMTMuNjI1QzIzLjcgMTIuNDc5NSAyNC42MzU1IDExLjU3NSAyNS43NSAxMS41NzVDMjYuODY0NSAxMS41NzUgMjcuOCAxMi40Nzk1IDI3LjggMTMuNjI1QzI3LjggMTQuNzcgMjYuODY1NSAxNS42NzUgMjUuNzUgMTUuNjc1QzI0LjkzMjUgMTUuNjc1IDI0LjI3NSAxNi4zNjM1IDI0LjI3NSAxNy4xNVYxOC4wMUMyNC4yNzUgMTguNzk2NSAyNC45MzI1IDE5LjQ4NSAyNS43NSAxOS40ODVDMjkuMDgzIDE5LjQ4NSAzMS44IDEzLjcyIDMxLjggMTMuNjI1QzMxLjggMTAuNDg1NSAyOS4xMDMgNy45NzUgMjUuNzUgNy45NzVDMjIuMzk3IDcuOTc1IDE5LjcgMTAuNDg1NSAxOS43IDEzLjYyNVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";
        animContainer.appendChild(finger);
        
        const ripple = document.createElement('div');
        ripple.className = 'tutorial-ripple';
        animContainer.appendChild(ripple);
        
        return animContainer;
    }
    
    /**
     * Create animation for the navigation step
     * @returns {HTMLElement} The animation container
     */
    createNavigationAnimation() {
        const animContainer = document.createElement('div');
        animContainer.className = 'tutorial-animation';
        
        const blackhole = document.createElement('div');
        blackhole.className = 'tutorial-blackhole';
        
        // Add orbit path around the black hole
        const orbit = document.createElement('div');
        orbit.style.position = 'absolute';
        orbit.style.top = '50%';
        orbit.style.left = '50%';
        orbit.style.width = '140px';
        orbit.style.height = '140px';
        orbit.style.transform = 'translate(-50%, -50%)';
        orbit.style.borderRadius = '50%';
        orbit.style.border = '1px dashed rgba(136, 68, 255, 0.4)';
        orbit.style.boxShadow = '0 0 10px rgba(136, 68, 255, 0.3)';
        orbit.style.animation = 'rotate-accretion 20s linear infinite';
        
        animContainer.appendChild(orbit);
        animContainer.appendChild(blackhole);
        
        return animContainer;
    }
    
    /**
     * Create animation for the sections step
     * @returns {HTMLElement} The animation container
     */
    createSectionsAnimation() {
        const animContainer = document.createElement('div');
        animContainer.className = 'tutorial-animation';
        
        const blackhole = document.createElement('div');
        blackhole.className = 'tutorial-blackhole';
        animContainer.appendChild(blackhole);
        
        // Create mini orbs
        const orbPositions = [
            { x: '30%', y: '30%' },
            { x: '70%', y: '30%' },
            { x: '70%', y: '70%' },
            { x: '30%', y: '70%' }
        ];
        
        orbPositions.forEach((pos, i) => {
            const orb = document.createElement('div');
            orb.style.position = 'absolute';
            orb.style.left = pos.x;
            orb.style.top = pos.y;
            orb.style.width = '20px';
            orb.style.height = '20px';
            orb.style.borderRadius = '50%';
            orb.style.background = 'rgba(136, 68, 255, 0.7)';
            orb.style.boxShadow = '0 0 10px rgba(136, 68, 255, 0.5)';
            orb.style.animation = `pulse-button 1.5s ease-out infinite ${i * 0.3}s`;
            
            animContainer.appendChild(orb);
            
            // Add connecting line to black hole
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = '50%';
            line.style.top = '50%';
            line.style.width = '1px';
            line.style.height = '50px';
            line.style.background = 'linear-gradient(to bottom, rgba(136, 68, 255, 0.7), rgba(136, 68, 255, 0))';
            line.style.transformOrigin = 'top';
            // Calculate angle to position the line
            const angle = Math.atan2(
                parseFloat(pos.y) - 50,
                parseFloat(pos.x) - 50
            ) * 180 / Math.PI;
            const distance = Math.sqrt(
                Math.pow(parseFloat(pos.y) - 50, 2) + 
                Math.pow(parseFloat(pos.x) - 50, 2)
            );
            
            line.style.transform = `rotate(${angle}deg) scaleY(${distance / 50})`;
            
            animContainer.appendChild(line);
        });
        
        return animContainer;
    }
    
    /**
     * Show the tutorial overlay
     */
    showTutorial() {
        this.tutorialShown = true;
        this.overlay.classList.add('visible');
        
        // Create navigation controls
        this.createNavigationControls();
        
        // Show first step
        this.showStep(0);
        
        // Mark tutorial as shown in localStorage
        localStorage.setItem(this.tutorialKey, 'true');
    }
    
    /**
     * Create navigation controls for the tutorial
     */
    createNavigationControls() {
        // Add step navigation
        const controls = document.createElement('div');
        controls.className = 'tutorial-controls';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'tutorial-nav-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => this.prevStep());
        prevBtn.setAttribute('aria-label', 'Go to previous tutorial step');
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'tutorial-nav-btn';
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => this.nextStep());
        nextBtn.setAttribute('aria-label', 'Go to next tutorial step');
        
        controls.appendChild(prevBtn);
        controls.appendChild(nextBtn);
        
        // Add dots for step indication
        const dots = document.createElement('div');
        dots.className = 'tutorial-dots';
        
        for (let i = 0; i < this.steps.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'tutorial-dot';
            dot.setAttribute('data-step', i);
            dots.appendChild(dot);
        }
        
        // Add controls to overlay
        this.content.appendChild(controls);
        this.content.appendChild(dots);
        
        // Store references
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
        this.dots = dots;
    }
    
    /**
     * Show a specific tutorial step
     * @param {number} index - The step index to show
     */
    showStep(index) {
        if (index < 0 || index >= this.steps.length) return;
        
        // Update current step
        this.currentStep = index;
        
        // Clear content
        this.content.innerHTML = '';
        
        // Create step content
        const step = document.createElement('div');
        step.className = 'tutorial-step active';
        
        const title = document.createElement('h3');
        title.className = 'tutorial-title';
        title.textContent = this.steps[index].title;
        step.appendChild(title);
        
        const desc = document.createElement('p');
        desc.className = 'tutorial-description';
        desc.textContent = this.steps[index].description;
        step.appendChild(desc);
        
        // Add animation if provided
        if (this.steps[index].animation) {
            step.appendChild(this.steps[index].animation.cloneNode(true));
        }
        
        // Add step to content
        this.content.appendChild(step);
        
        // Re-add navigation controls
        this.createNavigationControls();
        
        // Update button states
        this.updateButtonStates();
        
        // Update dots
        this.updateDots();
    }
    
    /**
     * Go to the next tutorial step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }
    
    /**
     * Go to the previous tutorial step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    /**
     * Update the navigation button states
     */
    updateButtonStates() {
        // Show/hide previous button based on current step
        if (this.currentStep === 0) {
            this.prevBtn.style.visibility = 'hidden';
        } else {
            this.prevBtn.style.visibility = 'visible';
        }
        
        // Change next button text on last step
        if (this.currentStep === this.steps.length - 1) {
            this.nextBtn.textContent = 'Start Exploring';
        } else {
            this.nextBtn.textContent = 'Next';
        }
    }
    
    /**
     * Update the dots to indicate current step
     */
    updateDots() {
        const dots = this.dots.querySelectorAll('.tutorial-dot');
        dots.forEach((dot, i) => {
            if (i === this.currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    /**
     * Complete the tutorial and close the overlay
     */
    completeTutorial() {
        this.overlay.classList.remove('visible');
        
        // Allow the animation to complete before removing
        setTimeout(() => {
            if (this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
        }, 500);
    }
    
    /**
     * Reset the tutorial state, allowing it to be shown again
     */
    resetTutorial() {
        localStorage.removeItem(this.tutorialKey);
        console.log('Tutorial reset. Will be shown on next visit.');
    }
}

export default TutorialManager; 