// =============================================================
// Mobile nav toggle
// =============================================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// =============================================================
// Scroll progress bar + back-to-top button
// =============================================================
const progressBar = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');
function onScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
  backToTop.classList.toggle('show', scrollTop > 500);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =============================================================
// Active nav link highlighting
// =============================================================
const sections = document.querySelectorAll('section[id], .hero[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(sec => navObserver.observe(sec));

// =============================================================
// Scroll-reveal animation
// =============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// =============================================================
// Lazy-loaded gallery images
// Each figure builds the same "img-frame" structure used by the
// project cards (a blurred cover backdrop + a contained foreground
// image) so screenshots and square photos both sit nicely inside
// the fixed 4:3 gallery tile without stretching or ugly crops.
// A shimmer skeleton shows until the photo has loaded, then fades
// in. A genuine load failure (bad path / missing file) now shows
// a visible "Image unavailable" state instead of shimmering forever.
// =============================================================
const galleryItems = document.querySelectorAll('.gallery-item[data-src]');

function loadGalleryImage(item) {
  const src = item.getAttribute('data-src');
  if (!src || item.dataset.loading === 'true') return;
  item.dataset.loading = 'true';

  const altText = item.querySelector('figcaption strong')?.textContent || 'Gallery photo';

  const bg = new Image();
  bg.className = 'img-frame-bg';
  bg.alt = '';
  bg.setAttribute('aria-hidden', 'true');
  bg.decoding = 'async';

  const fg = new Image();
  fg.className = 'img-frame-fg zoomable';
  fg.alt = altText;
  fg.decoding = 'async';

  fg.onload = () => {
    item.appendChild(bg);
    item.appendChild(fg);
    requestAnimationFrame(() => {
      item.classList.add('loaded');
    });
  };

  fg.onerror = () => {
    console.error('Failed to load image:', src);
    item.classList.add('load-error');
  };

  bg.src = src;
  fg.src = src;
}

const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadGalleryImage(entry.target);
      imgObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '250px 0px' }); // start fetching a bit before it scrolls into view

galleryItems.forEach(item => imgObserver.observe(item));

// =============================================================
// Lightbox — full-screen image preview
//
// Behaviour:
//  - Clicking any ".zoomable" image opens it full-screen.
//  - Works for images present at page load AND images the
//    gallery loader inserts later (delegated click listener).
//  - Closing works via the close button, ESC, or clicking the
//    dark backdrop outside the image.
//  - Pressing the browser Back button closes the preview and
//    returns to the exact scroll position instead of navigating
//    away, because opening the lightbox only adds a lightweight
//    history entry (no page reload happens at any point).
// =============================================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
let lightboxOpen = false;

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || 'Preview image';
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  lightboxOpen = true;
  // Push a history entry so the Back button closes the preview
  // instead of leaving the page. Scroll position is untouched
  // since we never navigate anywhere.
  history.pushState({ lightbox: true }, '');
}

function closeLightbox({ viaPopstate = false } = {}) {
  if (!lightboxOpen) return;
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  lightboxOpen = false;
  // If the close happened via a UI action (not the Back button),
  // pop the history entry we pushed so Back continues to behave
  // predictably on subsequent presses.
  if (!viaPopstate && history.state && history.state.lightbox) {
    history.back();
  }
}

// Delegated click listener catches both static and dynamically
// inserted zoomable images (gallery + project frames).
document.addEventListener('click', (e) => {
  const img = e.target.closest('.zoomable');
  if (img) {
    openLightbox(img.currentSrc || img.src, img.alt);
  }
});

// "View Certificate" buttons open the same certificate image the
// card thumbnail shows, rather than navigating to a separate page.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.cert-link[data-cert-img]');
  if (btn) {
    openLightbox(btn.dataset.certImg, btn.dataset.certAlt || 'Certificate');
  }
});

lightboxClose.addEventListener('click', () => closeLightbox());

// Click outside the image (on the dark backdrop) closes it
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// ESC key closes it
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightboxOpen) closeLightbox();
});

// Browser Back button closes it and restores scroll position
window.addEventListener('popstate', () => {
  if (lightboxOpen) closeLightbox({ viaPopstate: true });
});
