const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
});

document.querySelectorAll('a,button,.aud-card,.pw-item,.gallery-item').forEach((el) => {
  el.addEventListener('mouseenter', () => ring.classList.add('big'));
  el.addEventListener('mouseleave', () => ring.classList.remove('big'));
});

(function tick() {
  cur.style.left = mx + 'px';
  cur.style.top = my + 'px';
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(tick);
})();

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 60));

// Hamburger menu
const hamburger = document.getElementById('nav-hamburger');
const mobileNav = document.getElementById('mobile-nav');

function closeMobileNav() {
  if (!hamburger || !mobileNav) return;
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  document.body.style.overflow = '';
}

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMobileNav());
  });
}

const pageLoader = document.getElementById('page-loader');

function showPageLoader() {
  if (!pageLoader) return;
  pageLoader.classList.add('active');
  pageLoader.classList.remove('hidden');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('a, button');
  if (!target) return;

  if (target.tagName.toLowerCase() === 'a') {
    const href = target.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || target.target === '_blank') return;

    event.preventDefault();
    // Always close mobile nav and restore scroll before navigating
    closeMobileNav();
    showPageLoader();
    window.location.href = href;
    return;
  }

  if (target.disabled) return;
  // Don't show loader for the hamburger button itself
  if (target === hamburger) return;
  showPageLoader();
});

const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((r) => obs.observe(r));

function handleSubmit(e) {
  e.preventDefault();
  const msg = document.getElementById('form-msg');
  msg.style.display = 'block';
  msg.textContent = '✓ Application received! Our team will be in touch with next steps shortly.';
  e.target.reset();
  setTimeout(() => {
    msg.style.display = 'none';
  }, 7000);
}