import * as THREE from 'three';
import { App } from './App.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { TouchInteractionManager } from './utils/TouchInteractionManager.js';
import { TutorialManager } from './ui/TutorialManager.js';

// Create a global reference to the app instance
let app;

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing App...');
    
    try {
        // Create main application instance
        app = new App();
        
        // Initialize app
        app.init().then(() => {
            console.log('App initialized successfully');
            
            // Initialize performance monitoring
            const performanceMonitor = new PerformanceMonitor(app);
            performanceMonitor.start();
            app.performanceMonitor = performanceMonitor;
            
            // Initialize touch interaction for mobile devices
            const touchInteractionManager = new TouchInteractionManager(app);
            app.touchInteractionManager = touchInteractionManager;
            
            // Initialize tutorial for first-time users
            const tutorialManager = new TutorialManager(app);
            app.tutorialManager = tutorialManager;
        }).catch(error => {
            console.error('Failed to initialize app:', error);
            showFallbackMessage('An error occurred while initializing the application.');
        });
    } catch (error) {
        console.error('Critical error during App initialization:', error);
        showFallbackMessage('An error occurred while starting the application.');
    }
});

// Show a simple fallback message if initialization fails
function showFallbackMessage(message) {
    const fallback = document.createElement('div');
    fallback.style.position = 'fixed';
    fallback.style.top = '0';
    fallback.style.left = '0';
    fallback.style.width = '100%';
    fallback.style.height = '100%';
    fallback.style.display = 'flex';
    fallback.style.flexDirection = 'column';
    fallback.style.alignItems = 'center';
    fallback.style.justifyContent = 'center';
    fallback.style.backgroundColor = '#111';
    fallback.style.color = '#fff';
    fallback.style.fontFamily = 'Arial, sans-serif';
    fallback.style.zIndex = '9999';
    
    const title = document.createElement('h2');
    title.textContent = 'Something went wrong';
    title.style.marginBottom = '1rem';
    
    const text = document.createElement('p');
    text.textContent = message || 'Please try refreshing the page or using a different browser.';
    text.style.maxWidth = '80%';
    text.style.textAlign = 'center';
    
    fallback.appendChild(title);
    fallback.appendChild(text);
    document.body.appendChild(fallback);
}

// Export the app instance
export { app }; 