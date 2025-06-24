// ===== MAIN JAVASCRIPT FOR CaS HOMEPAGE =====

document.addEventListener('DOMContentLoaded', function() {
  initializeHomepage();
});

function initializeHomepage() {
  // Initialize all homepage functionality
  initMobileMenu();
  initSmoothScrolling();
  initHeaderScroll();
  initAnimations();
  initStatsCounter();
}

// Mobile Menu Functionality
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', function() {
      mainNav.classList.toggle('mobile-active');
      mobileMenuBtn.classList.toggle('active');
    });
    
    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        mainNav.classList.remove('mobile-active');
        mobileMenuBtn.classList.remove('active');
      });
    });
  }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const headerHeight = document.querySelector('.main-header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Update active nav link
        updateActiveNavLink(targetId);
      }
    });
  });
}

// Update Active Navigation Link
function updateActiveNavLink(targetId) {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === targetId) {
      link.classList.add('active');
    }
  });
}

// Header Scroll Effect
function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add/remove scrolled class based on scroll position
    if (scrollTop > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Hide/show header on scroll
    if (scrollTop > lastScrollTop && scrollTop > 200) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
}

// Intersection Observer for Animations
function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe elements for animation
  const animateElements = document.querySelectorAll('.service-card, .advantage, .hero-card');
  animateElements.forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });
}

// Stats Counter Animation
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number, .coverage-number, .quick-stat .stat-number');
  
  const observerOptions = {
    threshold: 0.5
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  stats.forEach(stat => {
    observer.observe(stat);
  });
}

function animateCounter(element) {
  // Check if element has data-target attribute (for About Us stats)
  const targetValue = element.dataset.target || element.textContent;
  const targetNumber = parseInt(targetValue);
  
  if (isNaN(targetNumber)) return;
  
  const duration = 2500; // 2.5 seconds
  const steps = 80;
  const increment = targetNumber / steps;
  let current = 0;
  
  // Add some visual feedback
  element.style.transform = 'scale(1.1)';
  element.style.transition = 'transform 0.3s ease';
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= targetNumber) {
      element.textContent = formatNumber(targetNumber);
      clearInterval(timer);
      // Reset scale
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 100);
    } else {
      element.textContent = formatNumber(Math.floor(current));
    }
  }, duration / steps);
}

function formatNumber(num) {
  if (num >= 1000) {
    return num.toLocaleString('ro-RO');
  }
  return num.toString();
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add CSS for animations
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Animation Styles */
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease-out;
    }
    
    .animate-on-scroll.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    
    .main-header {
      transition: transform 0.3s ease-in-out, background-color 0.3s ease;
    }
    
    .main-header.scrolled {
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
    
    /* Mobile Menu Styles */
    @media (max-width: 768px) {
      .main-nav {
        position: fixed;
        top: var(--header-height);
        left: 0;
        right: 0;
        background: var(--primary-white);
        border-top: 1px solid var(--gray-200);
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: var(--z-dropdown);
      }
      
      .main-nav.mobile-active {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }
      
      .nav-links {
        flex-direction: column;
        padding: var(--space-4);
        gap: var(--space-4);
      }
      
      .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
      }
      
      .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
    }
    
    /* Service Card Hover Effects */
    .service-card {
      transition: all 0.3s ease;
    }
    
    .service-card:hover .service-icon {
      transform: scale(1.1);
      transition: transform 0.3s ease;
    }
    
    /* Hero Card Animation */
    .hero-card {
      animation: float 6s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: rotate(3deg) translateY(0px); }
      50% { transform: rotate(3deg) translateY(-10px); }
    }
    
    .hero-card:hover {
      animation-play-state: paused;
    }
    
    /* Button Ripple Effect */
    .btn {
      position: relative;
      overflow: hidden;
    }
    
    .btn::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .btn:active::after {
      width: 300px;
      height: 300px;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize animation styles
addAnimationStyles();
