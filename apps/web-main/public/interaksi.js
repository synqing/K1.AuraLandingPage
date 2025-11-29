// ==================== FORM SUBMISSION ==================== //
document.addEventListener('DOMContentLoaded', function () {
  const allocationForm = document.getElementById('allocationForm');

  if (allocationForm) {
    allocationForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(this);
      const fullName = formData.get('full_name').trim();
      const email = formData.get('email').trim();

      // Basic validation
      if (!fullName || !email) {
        alert('Please fill in all fields');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Log the data (until backend is ready)
      console.log('Form submitted:', { fullName, email });

      // TODO: Replace with actual backend API call
      // Example:
      // fetch('/api/request-access', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ fullName, email })
      // })
      // .then(response => response.json())
      // .then(data => {
      //   showModal(data.message || 'Request submitted successfully!');
      //   allocationForm.reset();
      // })
      // .catch(error => {
      //   console.error('Error:', error);
      //   showModal('An error occurred. Please try again.');
      // });

      // For now, show success modal
      showModal(
        `Thank you, ${fullName}! We'll reach out when your allocation slot opens.`,
        'Request Submitted'
      );

      // Reset form
      allocationForm.reset();
    });
  }
});

// ==================== MODAL MANAGEMENT ==================== //
function showModal(message, title = 'Request Submitted') {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modalMessage');
  const modalTitle = modal.querySelector('h2');

  if (modalTitle) {
    modalTitle.textContent = title;
  }
  if (modalMessage) {
    modalMessage.textContent = message;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Close modal when clicking outside of it
window.addEventListener('click', function (event) {
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('.modal-content');

  if (event.target === modal) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// ==================== NAVIGATION SMOOTH SCROLL ==================== //
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const href = this.getAttribute('href');

    if (href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      // Account for fixed navbar height
      const navbarHeight = document.querySelector('.navbar').offsetHeight;
      const targetPosition = target.offsetTop - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  });
});

// ==================== HAMBURGER MENU (MOBILE) ==================== //
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.navbar a');

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      // Toggle menu visibility (CSS handles actual display)
      navbar.classList.toggle('mobile-active');
    });

    // Close menu when a link is clicked
    navLinks.forEach((link) => {
      link.addEventListener('click', function () {
        navbar.classList.remove('mobile-active');
      });
    });
  }
});

// ==================== ACTIVE SECTION HIGHLIGHTING ==================== //
window.addEventListener('scroll', function () {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.navbar a');

  let current = '';

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 200;
    const sectionHeight = section.clientHeight;

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href').slice(1) === current) {
      link.classList.add('active');
    }
  });
});

// ==================== UTILITIES ==================== //
// Helper function to check if element is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.bottom >= 0
  );
}

// Lazy load animation trigger (optional enhancement)
document.addEventListener('scroll', function () {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    if (isElementInViewport(card)) {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }
  });
});

// ==================== ANALYTICS PLACEHOLDER ==================== //
// TODO: Replace with actual analytics service (Plausible, Posthog, etc.)
function trackEvent(eventName, eventData = {}) {
  console.log('Event:', eventName, eventData);
  // Implement your analytics integration here
}

// Track form submissions
const allocationForm = document.getElementById('allocationForm');
if (allocationForm) {
  allocationForm.addEventListener('submit', function () {
    trackEvent('form_submitted', { form: 'allocation' });
  });
}

// Track section views
document.addEventListener('scroll', function () {
  const sections = document.querySelectorAll('section');
  sections.forEach((section) => {
    if (isElementInViewport(section)) {
      const sectionId = section.getAttribute('id');
      trackEvent('section_viewed', { section: sectionId });
    }
  });
});
