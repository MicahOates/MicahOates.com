document.addEventListener('mousemove', (event) => {
  const portals = document.querySelectorAll('.portal');
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  portals.forEach((portal) => {
    const rect = portal.getBoundingClientRect();
    const portalX = rect.left + rect.width / 2;
    const portalY = rect.top + rect.height / 2;
    const dist = Math.sqrt((mouseX - portalX) ** 2 + (mouseY - portalY) ** 2);

    if (dist < 150) {
      portal.style.transform = 'scale(1.5)';
      portal.style.opacity = '1';
      portal.style.boxShadow = '0 0 20px #00ffcc';
    } else {
      portal.style.transform = 'scale(1)';
      portal.style.opacity = '0.6';
      portal.style.boxShadow = 'none';
    }
  });
});
