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

// Mobile detection for performance optimization
const isMobile = window.innerWidth < 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// Extremely simplified scroll animations - mobile optimized
const animateElements = () => {
    // Skip animations on mobile for better performance
    if (isMobile) {
        // Just make everything visible immediately
        document.querySelectorAll('.section-animate, .title-animate, .card-animate, .project-animate, .feature-animate').forEach(el => {
            if (el.classList.contains('section-animate')) el.classList.add('section-visible');
            if (el.classList.contains('title-animate')) el.classList.add('title-visible');
            if (el.classList.contains('card-animate')) el.classList.add('card-visible');
            if (el.classList.contains('project-animate')) el.classList.add('project-visible');
            if (el.classList.contains('feature-animate')) el.classList.add('feature-visible');
        });
        return;
    }

    // Desktop-only animations below
    // Elements to animate
    const sections = document.querySelectorAll('section');
    const sectionTitles = document.querySelectorAll('section h2');
    const serviceCards = document.querySelectorAll('.service-card');
    const projectContent = document.querySelector('.project-content');
    const featureItems = document.querySelectorAll('.feature-list li');

    // Check if element is in initial viewport
    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight * 1.1 && rect.bottom > 0;
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
                // Add the appropriate visible class
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

    // Process all elements
    const processElement = (element, animateClass, visibleClass) => {
        if (isInViewport(element)) {
            element.classList.add(visibleClass);
        } else {
            element.classList.add(animateClass);
            observer.observe(element);
        }
    };

    // Apply to all elements
    sections.forEach(el => processElement(el, 'section-animate', 'section-visible'));
    sectionTitles.forEach(el => processElement(el, 'title-animate', 'title-visible'));
    serviceCards.forEach(el => processElement(el, 'card-animate', 'card-visible'));
    if (projectContent) processElement(projectContent, 'project-animate', 'project-visible');
    featureItems.forEach(el => processElement(el, 'feature-animate', 'feature-visible'));
};

// Subtle parallax effect for background shapes - disabled on mobile
const parallaxEffect = () => {
    // Skip parallax on mobile for better performance
    if (isMobile) {
        // Just position shapes statically
        document.querySelectorAll('.shape').forEach(shape => {
            shape.style.transform = 'none';
        });
        return;
    }

    // Desktop-only parallax below
    const shapes = document.querySelectorAll('.shape');

    // Use requestAnimationFrame for better performance
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                shapes.forEach((shape, index) => {
                    // Reduced parallax speed for better performance
                    const speed = 0.03 + (index * 0.01);
                    const yPos = scrollY * speed;

                    // Apply transform with different directions and GPU acceleration
                    if (index % 2 === 0) {
                        shape.style.transform = `translateY(${yPos}px) translateZ(0)`;
                    } else {
                        shape.style.transform = `translateY(-${yPos}px) translateZ(0)`;
                    }
                });

                ticking = false;
            });

            ticking = true;
        }
    });
};

// Add minimal CSS for animations - optimized for mobile
const addAnimationStyles = () => {
    // For mobile, use even more minimal animations
    if (isMobile) {
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile-optimized animations - just simple opacity change */
            .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
                opacity: 0;
                transition: opacity 0.2s linear;
            }
            .section-visible, .title-visible, .card-visible, .project-visible, .feature-visible {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    } else {
        // Desktop can have slightly nicer animations
        const style = document.createElement('style');
        style.textContent = `
            /* Desktop animations */
            .section-animate, .title-animate, .card-animate, .project-animate, .feature-animate {
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            .section-visible, .title-visible, .card-visible, .project-visible, .feature-visible {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
};

// Scroll Progress Indicator - optimized for performance
const updateScrollProgress = () => {
    // Skip on mobile for better performance
    if (isMobile) {
        const scrollProgress = document.querySelector('.scroll-progress');
        if (scrollProgress) {
            scrollProgress.style.display = 'none';
        }
        return;
    }

    // Desktop-only progress indicator
    const scrollProgress = document.querySelector('.scroll-progress');
    if (!scrollProgress) return;

    // Use requestAnimationFrame for better performance
    let ticking = false;

    // Function to update the progress bar
    const updateProgress = () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / scrollableHeight) * 100;
        scrollProgress.style.width = `${scrolled}%`;
        ticking = false;
    };

    // Only update on scroll with requestAnimationFrame
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateProgress);
            ticking = true;
        }
    });

    // Initial call
    updateProgress();
};

// Initialize all animations and features when DOM is loaded - optimized for mobile
document.addEventListener('DOMContentLoaded', () => {
    // Add animation styles first
    addAnimationStyles();

    // Initialize animations
    animateElements();

    // Initialize parallax (will be disabled on mobile)
    parallaxEffect();

    // Initialize scroll progress (will be disabled on mobile)
    updateScrollProgress();
});

// No need for the extra load event listener since we're handling everything in animateElements
// and we're making all elements visible immediately on mobile