# Into the Void

Welcome to **Into the Void**, a visually captivating, space-themed landing page that harnesses the chaotic allure of a black hole to serve as a navigation hub. This project blends a minimalistic, dystopian sci-fi aesthetic with intuitive functionality, offering a portal-like experience to explore various pages, including a practical **Grand Exchange Merch Tool** for Old School RuneScape players.

Built with HTML, CSS, and JavaScript, this site is a showcase of technical creativity and user-friendly design—no hidden easter eggs, just a seamless journey into the abyss.

---

## Features

- **Black Hole Navigation**: A swirling 3D black hole at the center of the landing page, surrounded by glowing portals that orbit and respond to mouse movement, linking to sub-pages.
- **Minimalistic Space Aesthetic**: Dark backgrounds, neon accents (cyan and magenta), and subtle star animations create a high-tech, mysterious vibe.
- **Intuitive Design**: Portals expand and glow on hover, making navigation clear and engaging without relying on hidden elements.
- **RuneScape Merch Tool**: A dedicated page to analyze the Grand Exchange market, helping players identify profitable items to merchant based on budget and profit margin.
- **Responsive Layout**: Scales gracefully across devices, from desktops to mobiles, ensuring accessibility everywhere.

---

## Directory Structure

```
into-the-void/
├── index.html         # Landing page with black hole and portals
├── styles.css         # CSS for the landing page
├── script.js          # JavaScript for landing page interactivity
├── about.html         # About page
├── projects.html      # Projects page
├── merch-tool.html    # Merch Tool page for RuneScape
├── merch-tool.js      # JavaScript for the Merch Tool
├── contact.html       # Contact page
└── pages.css          # Shared CSS for sub-pages
```

- **Total Files**: 10
- **Assets**: Optional `stars-bg.png` can be added for sub-page backgrounds (update `pages.css` accordingly).

---

## Installation & Setup

1. **Clone or Download**:
   - If using Git: `git clone https://github.com/your-username/into-the-void.git`
   - Or download the ZIP and extract to a folder named `into-the-void`.

2. **Navigate to the Directory**:
   ```bash
   cd into-the-void
   ```

3. **Run Locally**:
   - Open `index.html` in a modern browser (Chrome, Firefox, or Edge recommended).
   - For the Merch Tool to fetch live data, use a local server:
     ```bash
     python -m http.server
     ```
     Then visit `http://localhost:8000`.

---

## Usage

- **Landing Page**: 
  - Hover over the portals orbiting the black hole to see them expand and glow.
  - Click a portal to navigate to its corresponding page: "About," "Projects," "Merch Tool," or "Contact."

- **Merch Tool**:
  - On `merch-tool.html`, enter your budget (in GP) and desired profit margin (%).
  - Click "Analyze Market" to see a table of profitable items, including buy price, sell price, profit, and market trend.
  - Note: The tool fetches a sample dataset from the Grand Exchange API; full implementation would require broader API calls.

- **Sub-Pages**: Use the "Return to Void" link to go back to the landing page.

---

## Technologies Used

- **HTML5**: Structure for all pages.
- **CSS3**: Styling with animations (e.g., black hole swirl, portal orbit).
- **JavaScript**: Interactivity (portal hover effects, Merch Tool logic).
- **RuneScape API**: Fetches live Grand Exchange data for the Merch Tool.

No external libraries are required—everything runs natively in the browser.

---

## Customization

- **Visuals**: 
  - Edit `styles.css` or `pages.css` to change colors (e.g., `#00ffcc` to another neon shade) or sizes (e.g., black hole diameter).
  - Add `stars-bg.png` to the root folder and update `pages.css` for a starry sub-page background.

- **Content**: 
  - Update `about.html`, `projects.html`, and `contact.html` with personal details or project info.
  - Expand the Merch Tool in `merch-tool.js` by fetching more API data (e.g., multiple categories).

- **Navigation**: 
  - Add more portals in `index.html` by duplicating `<a class="portal">` elements and adjusting their positions in `styles.css`.

---

## Performance Notes

- Optimized for smooth animations using CSS transitions and lightweight JavaScript.
- The Merch Tool uses a single API call for simplicity; for production use, consider caching or broader queries to avoid rate limits.

---

## Contributing

Feel free to fork this project, tweak it, or suggest improvements:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-idea`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to your branch (`git push origin feature/your-idea`).
5. Open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE). Use it, modify it, and share it as you see fit.

---

## Acknowledgements

- Inspired by the chaotic beauty of black holes and the minimalist allure of sci-fi dystopias.
- Built with love for tech wizards and RuneScape enthusiasts alike.
