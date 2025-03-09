// Import core modules
import { BlackHoleApp } from './core/BlackHoleApp.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BlackHoleApp();
    app.init();
}); 