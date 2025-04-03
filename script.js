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

// Improved scroll animations with better performance
const animateElements = () => {
    // Elements to animate
    const sections = document.querySelectorAll('section');
    const sectionTitles = document.querySelectorAll('section h2');
    const serviceCards = document.querySelectorAll('.service-card');
    const projectContent = document.querySelector('.project-content');
    const featureItems = document.querySelectorAll('.feature-list li');

    // Check if element is in initial viewport
    const isInInitialViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // Observer options with larger rootMargin for better preloading
    const options = {
        root: null,
        rootMargin: '50px',
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

    // Card observer with simplified animation (no staggering on mobile)
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Reduced delay for better performance
                const isMobile = window.innerWidth < 768;
                const delay = isMobile ? 0 : Math.min(index * 100, 300);

                setTimeout(() => {
                    entry.target.classList.add('card-visible');
                }, delay);
                cardObserver.unobserve(entry.target);
            }
        });
    }, options);

    // Feature list observer with simplified animation
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Reduced delay for better performance
                const isMobile = window.innerWidth < 768;
                const delay = isMobile ? 0 : Math.min(index * 50, 200);

                setTimeout(() => {
                    entry.target.classList.add('feature-visible');
                }, delay);
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

    // Apply animations with initial viewport check
    sections.forEach(section => {
        if (isInInitialViewport(section)) {
            // If in initial viewport, show immediately
            section.classList.add('section-visible');
        } else {
            // Otherwise, animate on scroll
            section.classList.add('section-animate');
            sectionObserver.observe(section);
        }
    });

    sectionTitles.forEach(title => {
        if (isInInitialViewport(title)) {
            title.classList.add('title-visible');
        } else {
            title.classList.add('title-animate');
            titleObserver.observe(title);
        }
    });

    serviceCards.forEach((card, index) => {
        if (isInInitialViewport(card)) {
            // Show immediately with minimal delay
            setTimeout(() => {
                card.classList.add('card-visible');
            }, index * 50);
        } else {
            card.classList.add('card-animate');
            cardObserver.observe(card);
        }
    });

    if (projectContent) {
        if (isInInitialViewport(projectContent)) {
            projectContent.classList.add('project-visible');
        } else {
            projectContent.classList.add('project-animate');
            projectObserver.observe(projectContent);
        }
    }

    featureItems.forEach((item, index) => {
        if (isInInitialViewport(item)) {
            // Show immediately with minimal delay
            setTimeout(() => {
                item.classList.add('feature-visible');
            }, index * 30);
        } else {
            item.classList.add('feature-animate');
            featureObserver.observe(item);
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

// Add CSS for animations - optimized for performance
const addAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Base animation properties - simplified for better performance */
        .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
            opacity: 0;
            transition-property: opacity, transform;
            transition-timing-function: ease;
            will-change: opacity, transform;
        }

        /* Specific animation settings - reduced intensity for better performance */
        .section-animate { transform: translateY(15px); transition-duration: 0.5s; }
        .title-animate { transform: translateY(-10px); transition-duration: 0.5s; }
        .card-animate { transform: translateY(15px); transition-duration: 0.5s; }
        .project-animate { transform: translateY(15px); transition-duration: 0.5s; }
        .feature-animate { transform: translateX(-10px); transition-duration: 0.4s; }

        /* Visible state for all elements */
        .section-visible, .title-visible, .card-visible, .project-visible, .feature-visible {
            opacity: 1;
            transform: translate(0);
        }

        /* Reduce animation complexity on mobile */
        @media (max-width: 768px) {
            .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
                transition-duration: 0.3s !important;
            }
            .section-animate { transform: translateY(10px); }
            .title-animate { transform: translateY(-5px); }
            .card-animate { transform: translateY(10px); }
            .project-animate { transform: translateY(10px); }
            .feature-animate { transform: translateX(-5px); }
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