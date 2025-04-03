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

// Advanced scroll animations with staggered reveal
const animateElements = () => {
    // Elements to animate
    const sections = document.querySelectorAll('section');
    const sectionTitles = document.querySelectorAll('section h2');
    const serviceCards = document.querySelectorAll('.service-card');
    const projectContent = document.querySelector('.project-content');
    const featureItems = document.querySelectorAll('.feature-list li');

    // Observer options
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    // Section observer
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, options);

    // Title observer with animation
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('title-visible');
                titleObserver.unobserve(entry.target);
            }
        });
    }, options);

    // Card observer with staggered animation
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Staggered animation delay
                setTimeout(() => {
                    entry.target.classList.add('card-visible');
                }, index * 150);
                cardObserver.unobserve(entry.target);
            }
        });
    }, options);

    // Feature list observer
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('feature-visible');
                }, index * 100);
                featureObserver.unobserve(entry.target);
            }
        });
    }, options);

    // Project observer
    const projectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('project-visible');
                projectObserver.unobserve(entry.target);
            }
        });
    }, options);

    // Apply observers to elements
    sections.forEach(section => {
        section.classList.add('section-animate');
        sectionObserver.observe(section);
    });

    sectionTitles.forEach(title => {
        title.classList.add('title-animate');
        titleObserver.observe(title);
    });

    serviceCards.forEach(card => {
        card.classList.add('card-animate');
        cardObserver.observe(card);
    });

    if (projectContent) {
        projectContent.classList.add('project-animate');
        projectObserver.observe(projectContent);
    }

    featureItems.forEach(item => {
        item.classList.add('feature-animate');
        featureObserver.observe(item);
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

// Add CSS for animations - optimized and cleaned up
const addAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Base animation properties */
        .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
            opacity: 0;
            transition-property: opacity, transform;
            transition-timing-function: ease;
        }

        /* Specific animation settings */
        .section-animate { transform: translateY(20px); transition-duration: 0.8s; }
        .title-animate { transform: translateY(-15px); transition-duration: 0.6s; }
        .card-animate { transform: translateY(20px); transition-duration: 0.6s; transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .project-animate { transform: translateY(25px); transition-duration: 0.8s; transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .feature-animate { transform: translateX(-15px); transition-duration: 0.5s; }

        /* Visible state for all elements */
        .section-visible, .title-visible, .card-visible, .project-visible, .feature-visible {
            opacity: 1;
            transform: translate(0);
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

// Initial check for elements in view
window.addEventListener('load', () => {
    // Trigger animations after page load
    setTimeout(() => {
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
    }, 100);
});