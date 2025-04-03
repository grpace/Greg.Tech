// Smooth scroll for navigation links with enhanced easing
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');

        // Special case for top of page
        if (targetId === '#top') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            history.pushState(null, null, targetId);
            return;
        }

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Update URL without page jump
            history.pushState(null, null, targetId);
        }
    });
});

// Enhanced navbar effects on scroll - preserving the gradient
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
        header.style.backdropFilter = 'blur(15px)';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    } else {
        header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
        header.style.backdropFilter = 'blur(10px)';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.07)';
    }
});

// Extremely simplified scroll animations to prevent jittering
const animateElements = () => {
    // Elements to animate
    const sections = document.querySelectorAll('section');
    const sectionTitles = document.querySelectorAll('section h2');
    const serviceCards = document.querySelectorAll('.service-card');
    const projectContent = document.querySelector('.project-content');
    const featureItems = document.querySelectorAll('.feature-list li');

    // Check if element is in initial viewport
    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top < (window.innerHeight || document.documentElement.clientHeight) * 1.1 &&
            rect.bottom > 0
        );
    };

    // Observer options with larger rootMargin for better preloading
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.05
    };

    // Single observer for all elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the appropriate visible class based on the element's animate class
                if (entry.target.classList.contains('section-animate')) entry.target.classList.add('section-visible');
                if (entry.target.classList.contains('title-animate')) entry.target.classList.add('title-visible');
                if (entry.target.classList.contains('card-animate')) entry.target.classList.add('card-visible');
                if (entry.target.classList.contains('project-animate')) entry.target.classList.add('project-visible');
                if (entry.target.classList.contains('feature-animate')) entry.target.classList.add('feature-visible');

                // Stop observing once visible
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Apply animations with initial viewport check
    // For elements in the initial viewport, make them visible immediately
    // For elements outside the viewport, add animation class and observe

    // Process sections
    sections.forEach(section => {
        if (isInViewport(section)) {
            section.classList.add('section-visible');
        } else {
            section.classList.add('section-animate');
            observer.observe(section);
        }
    });

    // Process section titles
    sectionTitles.forEach(title => {
        if (isInViewport(title)) {
            title.classList.add('title-visible');
        } else {
            title.classList.add('title-animate');
            observer.observe(title);
        }
    });

    // Process service cards
    serviceCards.forEach(card => {
        if (isInViewport(card)) {
            card.classList.add('card-visible');
        } else {
            card.classList.add('card-animate');
            observer.observe(card);
        }
    });

    // Process project content
    if (projectContent) {
        if (isInViewport(projectContent)) {
            projectContent.classList.add('project-visible');
        } else {
            projectContent.classList.add('project-animate');
            observer.observe(projectContent);
        }
    }

    // Process feature items
    featureItems.forEach(item => {
        if (isInViewport(item)) {
            item.classList.add('feature-visible');
        } else {
            item.classList.add('feature-animate');
            observer.observe(item);
        }
    });
};

// Subtle parallax effect for background shapes
const parallaxEffect = () => {
    const shapes = document.querySelectorAll('.shape');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        shapes.forEach((shape, index) => {
            // Subtle parallax with different speeds for each shape
            const speed = 0.05 + (index * 0.02);
            const yPos = scrollY * speed;

            // Apply transform with different directions
            if (index % 2 === 0) {
                shape.style.transform = `translateY(${yPos}px)`;
            } else {
                shape.style.transform = `translateY(-${yPos}px)`;
            }
        });
    });
};

// Add minimal CSS for animations - optimized to prevent jittering
const addAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Base animation properties - extremely simplified for smooth performance */
        .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        /* Visible state - only fade in, no movement to prevent jittering */
        .section-visible, .title-visible, .card-visible, .project-visible, .feature-visible {
            opacity: 1;
        }

        /* Even faster transitions on mobile */
        @media (max-width: 768px) {
            .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
                transition-duration: 0.2s !important;
            }
        }
    `;
    document.head.appendChild(style);
};

// Scroll Progress Indicator
const updateScrollProgress = () => {
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollableHeight) * 100;

    if (scrollProgress) {
        scrollProgress.style.width = `${scrolled}%`;
    }
};

// Initialize all animations and features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addAnimationStyles();
    animateElements();
    parallaxEffect();

    // Initialize scroll progress
    window.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress(); // Initial call
});

// Ensure elements in initial viewport are visible immediately
window.addEventListener('load', () => {
    // Apply visible class to all elements with animation classes that are in viewport
    document.querySelectorAll('.section-animate, .title-animate, .card-animate, .project-animate, .feature-animate').forEach(el => {
        // Check if element is in viewport and doesn't already have visible class
        const rect = el.getBoundingClientRect();
        const isInViewport = (
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0
        );

        if (isInViewport && !el.classList.contains('section-visible') &&
            !el.classList.contains('title-visible') &&
            !el.classList.contains('card-visible') &&
            !el.classList.contains('project-visible') &&
            !el.classList.contains('feature-visible')) {

            // Add appropriate visible class based on animate class
            if (el.classList.contains('section-animate')) el.classList.add('section-visible');
            if (el.classList.contains('title-animate')) el.classList.add('title-visible');
            if (el.classList.contains('card-animate')) el.classList.add('card-visible');
            if (el.classList.contains('project-animate')) el.classList.add('project-visible');
            if (el.classList.contains('feature-animate')) el.classList.add('feature-visible');
        }
    });
});