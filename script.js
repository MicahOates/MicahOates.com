// script.js
document.addEventListener('DOMContentLoaded', function() {
  // Navigation scroll
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const target = document.querySelector(link.getAttribute('href'));
      
      if (target) {
        window.scrollTo({
          top: target.offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Button hover effect
  const buttons = document.querySelectorAll('a');
  
  buttons.forEach(function(button) {
    button.addEventListener('mouseover', function() {
      button.style.backgroundColor = '#555';
      button.style.color = '#fff';
    });
    
    button.addEventListener('mouseout', function() {
      button.style.backgroundColor = '#333';
      button.style.color = '#fff';
    });
  });
  
  // Project card animation
  const projects = document.querySelectorAll('.project');
  
  projects.forEach(function(project) {
    project.addEventListener('mouseover', function() {
      project.style.transform = 'translateY(-5px)';
      project.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    });
    
    project.addEventListener('mouseout', function() {
      project.style.transform = 'translateY(0)';
      project.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    });
  });
});
