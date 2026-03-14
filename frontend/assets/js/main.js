/* ============================================================
   EDUNEX ACADEMY - MAIN JAVASCRIPT
   Global: Navbar, Back-to-top, Scroll Animations, Ticker
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

    // ---- Navbar Scroll Effect ----
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        toggleBackToTop();
    });

    // ---- Hamburger Mobile Menu ----
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        // Close on nav link click (mobile)
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }

    // ---- Back to Top Button ----
    const backToTop = document.getElementById('backToTop');
    function toggleBackToTop() {
        if (!backToTop) return;
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Scroll Animations (Intersection Observer) ----
    const animatedEls = document.querySelectorAll('.fade-up');
    if (animatedEls.length > 0) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        animatedEls.forEach(el => observer.observe(el));
    }

    // ---- Set Active Navbar Link ----
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && (href === currentPage || href.includes(currentPage)) && currentPage !== '') {
            link.classList.add('active');
        }
    });

    // Home page nav highlight
    if (currentPage === '' || currentPage === 'index.html') {
        const homeLink = document.querySelector('.nav-link[href="index.html"]');
        if (homeLink) homeLink.classList.add('active');
    }

    // ---- Form Validation Helper ----
    window.validateForm = function (formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;
        const fields = form.querySelectorAll('[data-required]');

        fields.forEach(field => {
            const errorEl = document.getElementById(field.id + '-error');
            field.classList.remove('error');
            if (errorEl) errorEl.classList.remove('visible');

            if (!field.value.trim()) {
                field.classList.add('error');
                if (errorEl) {
                    errorEl.textContent = 'This field is required.';
                    errorEl.classList.add('visible');
                }
                isValid = false;
            } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                field.classList.add('error');
                if (errorEl) {
                    errorEl.textContent = 'Please enter a valid email address.';
                    errorEl.classList.add('visible');
                }
                isValid = false;
            } else if (field.type === 'tel' && !/^[6-9]\d{9}$/.test(field.value.replace(/\s/g, ''))) {
                field.classList.add('error');
                if (errorEl) {
                    errorEl.textContent = 'Please enter a valid 10-digit mobile number.';
                    errorEl.classList.add('visible');
                }
                isValid = false;
            }
        });

        return isValid;
    };

    // ---- Show Toast Notification ----
    window.showToast = function (message, type = 'success') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
            color: white; padding: 14px 28px; border-radius: 50px;
            display: flex; align-items: center; gap: 10px;
            font-weight: 600; font-size: 0.92rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 9999; animation: toastIn 0.4s ease;
            font-family: var(--font-body);
        `;

        document.head.insertAdjacentHTML('beforeend', `
            <style>
                @keyframes toastIn {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to   { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            </style>
        `);

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
    };

});
