// Smooth scrolling effect for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add a class to the navigation link when it is active
document.addEventListener("scroll", function () {
    const sections = document.querySelectorAll("section");
    const scrollPosition = window.pageYOffset;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (scrollPosition >= sectionTop - sectionHeight * 0.25 &&
            scrollPosition < sectionTop + sectionHeight) {
            const navLink = document.querySelector('a[href="#' + section.id + '"]');
            navLink.classList.add("active");
        } else {
            const navLink = document.querySelector('a[href="#' + section.id + '"]');
            navLink.classList.remove("active");
        }
    });
});
