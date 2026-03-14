/* ============================================================
   EDUNEX ACADEMY - HOME PAGE JAVASCRIPT
   Handles: Counter Animation, Testimonials Slider
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

    // ---- Animated Counters ----
    const counters = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    function runCounters() {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // ms
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 16);
        });
    }

    // Trigger counters when hero is visible
    const heroSection = document.querySelector('.hero');
    if (heroSection && counters.length > 0) {
        const heroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersStarted) {
                    countersStarted = true;
                    runCounters();
                }
            });
        }, { threshold: 0.3 });
        heroObserver.observe(heroSection);
    }

    // ---- Testimonials Slider ----
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    let currentIndex = 0;
    let autoSlide;

    function showTestimonial(index) {
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    function nextTestimonial() {
        const next = (currentIndex + 1) % cards.length;
        showTestimonial(next);
    }

    function prevTestimonial() {
        const prev = (currentIndex - 1 + cards.length) % cards.length;
        showTestimonial(prev);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { nextTestimonial(); resetAutoSlide(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevTestimonial(); resetAutoSlide(); });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            showTestimonial(parseInt(dot.getAttribute('data-index')));
            resetAutoSlide();
        });
    });

    function startAutoSlide() {
        autoSlide = setInterval(nextTestimonial, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlide);
        startAutoSlide();
    }

    if (cards.length > 0) startAutoSlide();

    // ---- Add fade-up class to sections for animation ----
    const animateSections = document.querySelectorAll('.category-card, .feature-card, .step-item');
    animateSections.forEach((el, i) => {
        el.classList.add('fade-up');
        el.style.transitionDelay = `${(i % 3) * 0.1}s`;
    });

    // Trigger observer again for these elements
    const allFadeUp = document.querySelectorAll('.fade-up');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.12 });

    allFadeUp.forEach(el => obs.observe(el));

});
