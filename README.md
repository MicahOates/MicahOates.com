### Project Overview
"Void Protocol" is a visually stunning, interactive landing page designed to showcase advanced web development skills with a mysterious, dystopian space theme. At its core is a 3D black hole with real-time gravitational lensing, surrounded by interactive particles and a cryptic puzzle. This project leverages cutting-edge technologies like Three.js, custom shaders, and the Web Audio API to create an immersive experience that balances technical prowess with a minimalistic, high-tech aesthetic.

This landing page serves as a personal corner of the internet, offering both a visual spectacle and a hidden utility through an easter egg puzzle. It’s perfect for anyone looking to explore the intersection of art, technology, and interactivity.

---

### Key Features
- **3D Black Hole with Gravitational Lensing**: A dynamically rendered black hole using custom shaders to simulate light distortion, creating a realistic and mesmerizing visual effect.
- **Interactive Particle System**: Particles orbit the black hole and react to user input, adding depth and interactivity to the scene.
- **Cryptic Puzzle with Audio Feedback**: Hidden runes (disguised as glowing tetrahedrons) must be clicked in a specific sequence to unlock a secret panel. Audio cues enhance the experience, with a subtle hum that shifts upon solving the puzzle.
- **Minimalistic and Dystopian Design**: A dark, neon-infused aesthetic with glitch effects, maintaining a mysterious and high-tech vibe.
- **Optimized Performance**: Efficient use of instanced rendering and shaders ensures smooth performance even on lower-end devices.

---

### Setup and Installation
To run this project locally, follow these steps:

1. **Clone the Repository** (if applicable):
   ```bash
   git clone https://github.com/your-username/void-protocol.git
   cd void-protocol
   ```

2. **Open the Project**:
   - If you're using a local server (recommended for best performance), you can use tools like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code or run a simple HTTP server with Python:
     ```bash
     python -m http.server
     ```
   - Alternatively, you can open `index.html` directly in your browser, but some features (like audio) may be restricted due to browser security policies.

3. **Explore the Scene**:
   - Move your mouse to tilt the camera and explore the 3D space.
   - Look for the glowing purple runes (tetrahedrons) and click them in the correct sequence to unlock the hidden panel.

---

### Dependencies
This project relies on the following technologies:
- **Three.js**: A JavaScript library for creating 3D graphics in the browser. It is included via CDN in the HTML file.
- **Web Audio API**: Used for generating subtle audio feedback during interactions.
- **Modern Browser**: For the best experience, use an up-to-date version of Chrome, Firefox, or Edge.

No additional installations are required, as all dependencies are either included or part of standard web APIs.

---

### How to Use
- **Interact with the Scene**: Move your mouse to explore the 3D environment. The camera will tilt based on your cursor position, allowing you to view the black hole and particles from different angles.
- **Solve the Puzzle**: There are three glowing runes in the scene. Click them in the correct order (hint: try sequence [0, 2, 1]) to unlock the hidden panel. Each correct click will change the rune’s color, and solving the puzzle will trigger a visual and audio response.
- **Discover the Easter Egg**: Once the puzzle is solved, a holographic panel will appear, revealing a secret message and placeholders for future links or content.

---

### Customization and Extension
This project is designed to be easily extendable. Here are a few ways to make it your own:
- **Modify the 3D Scene**: Adjust the black hole’s size, particle count, or starfield density by tweaking the parameters in `script.js`.
- **Change the Puzzle**: Alter the `puzzleSequence` array in `script.js` to create a new solution. You can also add more runes or change their shapes for added complexity.
- **Add New Features**: Consider integrating WebGL post-processing effects (e.g., bloom or depth of field) for an even more polished look. You could also experiment with dynamic lighting or a procedurally generated starfield.
- **Enhance the Audio**: Use the Web Audio API to add more sound effects, such as particle interactions or ambient space noise.

---

### Project Structure
- **index.html**: The main HTML file that sets up the page structure and includes necessary scripts.
- **styles.css**: Contains the minimalistic, dystopian styling for the overlay text and easter egg panel.
- **script.js**: The heart of the project, handling the 3D scene, shaders, particle system, puzzle logic, and audio.

---

### Performance Notes
- The project is optimized for performance using instanced rendering for particles and efficient shader code.
- For users on lower-end devices, consider reducing the particle count or simplifying the shader for smoother rendering.

---

### License
This project is open-source and available under the [MIT License](LICENSE). Feel free to modify, share, or use it as inspiration for your own creations.
