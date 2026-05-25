/* ============================================================
   Friends of Whittier Narrows — Main JS
   Clean rebuild: timeline-first, no hero, mobile-friendly
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll progress bar ---- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrolled / total * 100) + '%';
  }, { passive: true });

  /* ---- Set CSS variables for header and timeline nav heights ---- */
  function setHeights() {
    const headerEl = document.querySelector('.site-header');
    const stickyNavEl = document.getElementById('tl-sticky-nav');
    const headerH = headerEl?.offsetHeight || 72;
    const navH = stickyNavEl?.offsetHeight
      || document.getElementById('tl-nav')?.offsetHeight
      || 110;
    document.documentElement.style.setProperty('--header-h', headerH + 'px');
    document.documentElement.style.setProperty('--tl-nav-h', navH + 'px');
  }
  requestAnimationFrame(() => { setHeights(); });
  window.addEventListener('resize', setHeights);

  /* ============================================================
     TIMELINE
     ============================================================ */
  const track = document.getElementById('tl-track');
  const navItems = document.querySelectorAll('.tl-nav-item');
  const prevBtn = document.getElementById('tl-prev');
  const nextBtn = document.getElementById('tl-next');
  const currentLabel = document.getElementById('tl-current');
  const navProgress = document.getElementById('tl-nav-progress');
  const tlProgressBar = document.getElementById('tl-progress-bar');
  const tlLiveRegion = document.getElementById('tl-live-region');
  const slides = document.querySelectorAll('.tl-slide');
  const totalSlides = slides.length;

  // Dot nav elements
  const dotNavDots = document.querySelectorAll('.tl-dot');
  const dotNavLabel = document.getElementById('tl-dot-label');
  const swipeHintBar = document.getElementById('tl-swipe-hint-bar');
  const dotSlideLabels = [
    'The Place', 'The Threat', 'Alert & Action',
    'Organizing', 'Petition', 'The Trial', 'Victory'
  ];
  const dotSlideYears = [
    '1939', '2006', '2007', '2008–10', '2010–11', 'Feb 2011', '2014–17'
  ];

  navItems.forEach((item, i) => {
    const title = item.querySelector('.tl-nav-year')?.textContent?.trim() || dotSlideLabels[i];
    const year = item.querySelector('.tl-nav-label')?.textContent?.trim() || dotSlideYears[i];
    item.setAttribute('aria-label', `${title}, ${year}`);
  });

  let currentSlide = 0;
  let isAnimating = false;

  function updateTimelineControls(index) {
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });

    navItems.forEach((item, i) => {
      item.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    if (tlProgressBar) {
      tlProgressBar.setAttribute('aria-valuenow', String(index + 1));
    }

    if (prevBtn) {
      const atStart = index === 0;
      prevBtn.disabled = atStart;
      prevBtn.setAttribute('aria-disabled', atStart ? 'true' : 'false');
    }
    if (nextBtn) {
      const atEnd = index >= totalSlides - 1;
      nextBtn.disabled = atEnd;
      nextBtn.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
    }

    if (tlLiveRegion) {
      tlLiveRegion.textContent = `Chapter ${index + 1} of ${totalSlides}: ${dotSlideLabels[index]}, ${dotSlideYears[index]}`;
    }
  }

  function goToSlide(index, skipAnimation) {
    if (prefersReducedMotion) skipAnimation = true;
    if (isAnimating && !skipAnimation) return;
    if (index < 0 || index >= totalSlides) return;

    isAnimating = true;
    currentSlide = index;

    track.style.transition = skipAnimation ? 'none' : 'transform 0.65s cubic-bezier(0.76, 0, 0.24, 1)';
    track.style.transform = `translateX(-${index * 100}%)`;

    navItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    updateTimelineControls(index);

    const slideNum = String(index + 1).padStart(2, '0');
    if (currentLabel) {
      currentLabel.textContent = slideNum;
    }
    const currentMobile = document.getElementById('tl-current-mobile');
    if (currentMobile) {
      currentMobile.textContent = slideNum;
    }

    if (navProgress) {
      const pct = totalSlides > 1 ? (index / (totalSlides - 1)) * 100 : 100;
      navProgress.style.width = pct + '%';
      const navProgressMobile = document.getElementById('tl-nav-progress-mobile');
      if (navProgressMobile) navProgressMobile.style.width = pct + '%';
    }

    const activeNavItem = navItems[index];
    if (activeNavItem) {
      activeNavItem.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }

    updateArrowColors(index);

    // Sync dot nav
    dotNavDots.forEach((dot, i) => dot.classList.toggle('tl-dot--active', i === index));
    if (dotNavLabel) dotNavLabel.textContent = dotSlideLabels[index] || '';

    setTimeout(() => { isAnimating = false; }, skipAnimation ? 0 : 700);

    // SVG fade-in for illustrated slides
    const svgWrapIds = { 0: 'tl-map-wrap', 1: 'tl-bulldozer-wrap' };
    if (svgWrapIds[index]) {
      setTimeout(() => {
        const wrap = document.getElementById(svgWrapIds[index]);
        if (!wrap) return;
        wrap.classList.remove('tl-map--revealed');
        // Force reflow so transition re-fires
        void wrap.offsetWidth;
        wrap.classList.add('tl-map--revealed');
      }, skipAnimation ? 80 : 350);
    }
  }

  const arrowsContainer = document.getElementById('tl-arrows');

  function updateArrowColors(index) {
    const slide = slides[index];
    const isDark = slide?.classList.contains('tl-slide--dark') || slide?.classList.contains('tl-slide--victory');
    if (arrowsContainer) {
      arrowsContainer.classList.toggle('dark', isDark);
    }
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.slide, 10);
      goToSlide(idx);
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

  document.addEventListener('keydown', (e) => {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    const rect = tl.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToSlide(currentSlide + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToSlide(currentSlide - 1);
  });

  // Swipe hint bar — dismiss after first swipe
  const swipeHint = document.getElementById('tl-swipe-hint'); // legacy, keep for safety
  let swipeHintDismissed = false;
  function dismissSwipeHint() {
    if (!swipeHintDismissed && swipeHintBar) {
      swipeHintDismissed = true;
      swipeHintBar.classList.add('hidden');
    }
    if (swipeHint) {
      swipeHint.style.transition = 'opacity 0.5s ease';
      swipeHint.style.opacity = '0';
      setTimeout(() => { swipeHint.style.display = 'none'; }, 500);
    }
  }

  let touchStartX = 0;
  let touchStartY = 0;
  const trackOuter = document.getElementById('tl-track-outer');
  if (trackOuter) {
    trackOuter.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    trackOuter.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dismissSwipeHint();
        if (dx < 0) goToSlide(currentSlide + 1);
        else goToSlide(currentSlide - 1);
      }
    }, { passive: true });
  }

  // Dot nav click handlers
  dotNavDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.slide, 10);
      goToSlide(idx);
      dismissSwipeHint();
    });
  });

  // Also dismiss hint on nav button click
  navItems.forEach((item) => {
    item.addEventListener('click', dismissSwipeHint, { once: true });
  });

  goToSlide(0, true);
  /* ============================================================
     QUOTE SECTION — word-by-word reveal
     ============================================================ */
  const quoteWords = document.querySelectorAll('.quote-word');
  if (prefersReducedMotion) {
    quoteWords.forEach(w => w.classList.add('visible'));
  } else if (quoteWords.length && 'IntersectionObserver' in window) {
    const quoteObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          quoteWords.forEach((word, i) => {
            setTimeout(() => word.classList.add('visible'), i * 180);
          });
          quoteObs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    const quoteSection = document.getElementById('quote');
    if (quoteSection) quoteObs.observe(quoteSection);
  } else {
    quoteWords.forEach(w => w.classList.add('visible'));
  }

  /* ============================================================
     FADE-UP ENTRANCE ANIMATIONS (IntersectionObserver)
     ============================================================ */
  const fadeEls = document.querySelectorAll(
    '.section-eyebrow, .section-heading, .footer-title, .footer-tagline, .quote-attribution, .quote-body'
  );

  if ('IntersectionObserver' in window) {
    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });

    fadeEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      } else {
        el.classList.add('fade-up');
        fadeObs.observe(el);
      }
    });

    // Safety net: after 3s reveal anything still hidden
    setTimeout(() => {
      document.querySelectorAll('.fade-up:not(.visible)').forEach(el => {
        el.classList.add('visible');
      });
    }, 3000);

  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  function initStaggerReveal(sectionId, itemSelector, staggerMs) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const items = section.querySelectorAll(itemSelector);
    if (!items.length) return;

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            items.forEach((item, i) => {
              item.classList.add('fade-up');
              setTimeout(() => item.classList.add('visible'), i * staggerMs);
            });
            obs.disconnect();
          }
        });
      }, { threshold: 0.15 });
      obs.observe(section);
    } else {
      items.forEach(item => item.classList.add('visible'));
    }
  }

  initStaggerReveal('contributors', '.contrib-item', 120);
  initStaggerReveal('gallery', '.gallery-item', 100);

    /* ============================================================
     GALLERY CAROUSEL (mobile only)
     ============================================================ */
  (function initGalleryCarousel() {
    const grid    = document.getElementById('gallery-grid');
    const prevBtn = document.getElementById('gallery-carousel-prev');
    const nextBtn = document.getElementById('gallery-carousel-next');
    const dotsWrap= document.getElementById('gallery-carousel-dots');
    if (!grid || !prevBtn || !nextBtn || !dotsWrap) return;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    const total = items.length;
    let current = 0;

    // Build dots
    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'gallery-carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
      dot.addEventListener('click', () => scrollToItem(i));
      dotsWrap.appendChild(dot);
    });

    function isCarouselActive() {
      return window.getComputedStyle(prevBtn).display !== 'none';
    }

    function updateCarouselControls() {
      prevBtn.disabled = current === 0;
      prevBtn.setAttribute('aria-disabled', current === 0 ? 'true' : 'false');
      nextBtn.disabled = current >= total - 1;
      nextBtn.setAttribute('aria-disabled', current >= total - 1 ? 'true' : 'false');
    }

    function scrollToItem(idx) {
      if (!isCarouselActive()) return;
      current = Math.max(0, Math.min(idx, total - 1));
      items[current].scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      updateDots();
      updateCarouselControls();
    }

    function updateDots() {
      const dots = dotsWrap.querySelectorAll('.gallery-carousel-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    prevBtn.addEventListener('click', () => scrollToItem(current - 1));
    nextBtn.addEventListener('click', () => scrollToItem(current + 1));

    // Update current index on scroll (IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
      if (!isCarouselActive()) return;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          current = items.indexOf(entry.target);
          updateDots();
          updateCarouselControls();
        }
      });
    }, { root: grid, threshold: 0.5 });
    items.forEach(item => observer.observe(item));
    updateCarouselControls();
  })();

    /* ============================================================
     GALLERY LIGHTBOX
     ============================================================ */
  (function initLightbox() {
    const lightbox     = document.getElementById('lightbox');
    const lightboxImg  = document.getElementById('lightbox-img');
    const lightboxClose= document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');
    if (!lightbox || !lightboxImg) return;

    // Build ordered list of image sources from gallery items
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    const srcs  = items.map(item => item.dataset.src || item.querySelector('img')?.src || '');
    const alts  = items.map(item => item.querySelector('img')?.alt || '');
    const total = srcs.length;
    let current = 0;
    let transitioning = false;
    let lastFocus = null;

    const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

    function getFocusableElements() {
      return Array.from(lightbox.querySelectorAll(focusableSelector));
    }

    function trapFocus(e) {
      if (e.key !== 'Tab' || !lightbox.classList.contains('open')) return;
      const focusables = getFocusableElements();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function updateCounter() {
      if (lightboxCounter) lightboxCounter.textContent = `${current + 1} / ${total}`;
    }

    function setLightboxImage(index) {
      current = (index + total) % total;
      lightboxImg.src = srcs[current];
      lightboxImg.alt = alts[current] || 'Gallery image';
      updateCounter();
    }

    function showImage(index) {
      if (transitioning) return;
      transitioning = true;
      lightboxImg.classList.add('transitioning');
      setTimeout(() => {
        setLightboxImage(index);
        lightboxImg.classList.remove('transitioning');
        transitioning = false;
      }, prefersReducedMotion ? 0 : 250);
    }

    function openLightbox(index) {
      lastFocus = document.activeElement;
      setLightboxImage(index);
      lightbox.hidden = false;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

  items.forEach((item, i) => {
      const label = alts[i]
        ? `View enlarged image: ${alts[i]}`
        : `View enlarged gallery image ${i + 1}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', label);
      item.addEventListener('click', () => openLightbox(i));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(i);
        }
      });
    });

    lightbox.addEventListener('keydown', trapFocus);

    // Close on × button or backdrop click
    lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

    // Prev / Next buttons
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => showImage(current - 1));
    if (lightboxNext) lightboxNext.addEventListener('click', () => showImage(current + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   showImage(current - 1);
      if (e.key === 'ArrowRight')  showImage(current + 1);
    });

    // Touch swipe navigation inside lightbox
    let lbTouchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
      lbTouchStartX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - lbTouchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) showImage(current + 1);
        else        showImage(current - 1);
      }
    }, { passive: true });
  })();

  /* ============================================================
     FLASHLIGHT / TORCH EFFECT — Quote Section
     Canvas overlay sits above the park photo (z-index 1).
     The canvas draws a near-opaque black fill and punches a
     radial gradient "hole" at the cursor position, revealing
     the park photo below. Section content is at z-index 2.
     ============================================================ */
  (function initFlashlight() {
    if (prefersReducedMotion) return;

    const section = document.getElementById('quote');
    const canvas  = document.getElementById('quote-flashlight-canvas');
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d');

    // Fixed dark overlay color for the quote section — darker to make flashlight more subtle
    const OVERLAY = 'rgba(5, 5, 5, 0.985)';

    // Mouse position (in canvas coordinates)
    let mouseX = -9999;
    let mouseY = -9999;
    // Lerped mouse position for smooth tracking
    let lerpX = -9999;
    let lerpY = -9999;

    // Flashlight radius: 0 = closed, target = open
    const RADIUS_OPEN = 180;
    let radius = 0;
    let targetRadius = 0;

    // Whether mouse is over the section
    let mouseInside = false;

    // Resize canvas to match section
    function resizeCanvas() {
      canvas.width  = section.offsetWidth;
      canvas.height = section.offsetHeight;
    }

    resizeCanvas();
    setTimeout(resizeCanvas, 200);
    window.addEventListener('resize', () => {
      resizeCanvas();
      setTimeout(resizeCanvas, 100);
    });

    // Track mouse position relative to canvas
    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseInside = true;
      targetRadius = RADIUS_OPEN;
    }, { passive: true });

    section.addEventListener('mouseleave', () => {
      mouseInside = false;
      targetRadius = 0;
    });

    // Lerp helper
    function lerp(a, b, t) { return a + (b - a) * t; }

    // Main render loop
    function render() {
      requestAnimationFrame(render);

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      // Lerp mouse position (smooth tracking)
      if (mouseInside) {
        lerpX = lerp(lerpX === -9999 ? mouseX : lerpX, mouseX, 0.12);
        lerpY = lerp(lerpY === -9999 ? mouseY : lerpY, mouseY, 0.12);
      }

      // Lerp radius
      radius = lerp(radius, targetRadius, 0.1);

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      if (radius < 1) {
        // No hole — just fill solid overlay
        ctx.fillStyle = OVERLAY;
        ctx.fillRect(0, 0, w, h);
        return;
      }

      // Step 1: fill solid overlay
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = OVERLAY;
      ctx.fillRect(0, 0, w, h);

      // Step 2: punch hole with radial gradient (destination-out erases)
      const cx = lerpX;
      const cy = lerpY;
      const r  = radius;

      // Extend the erase zone to 2× radius so the dimming falloff is wide and gradual
      const eraseR = r * 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, eraseR);
      // Bright core — fully transparent (fully reveals photo)
      grad.addColorStop(0,    'rgba(0,0,0,1)');
      grad.addColorStop(0.15, 'rgba(0,0,0,0.97)');
      // Mid zone — partial reveal (photo shows dimly)
      grad.addColorStop(0.35, 'rgba(0,0,0,0.75)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.45)');
      grad.addColorStop(0.72, 'rgba(0,0,0,0.2)');
      // Outer edge — barely visible, fades to nothing
      grad.addColorStop(0.88, 'rgba(0,0,0,0.06)');
      grad.addColorStop(1,    'rgba(0,0,0,0)');

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, eraseR, 0, Math.PI * 2);
      ctx.fill();

      // Reset composite mode
      ctx.globalCompositeOperation = 'source-over';
    }

        render();
  })();

  /* ============================================================
     CONTRIBUTORS ACCORDION
     ============================================================ */
  (function initAccordion() {
    const items     = document.querySelectorAll('.contrib-item');
    const imgSlots  = document.querySelectorAll('.contrib-img-slot');
    if (!items.length) return;

    items.forEach((item, i) => {
      const header = item.querySelector('.contrib-header');
      const body = item.querySelector('.contrib-body');
      if (!header || !body) return;
      const panelId = `contrib-panel-${i}`;
      const headerId = `contrib-header-${i}`;
      header.id = header.id || headerId;
      header.setAttribute('aria-controls', panelId);
      body.id = body.id || panelId;
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', header.id);
    });

    function activate(index) {
      items.forEach((item, i) => {
        const isActive = i === index;
        item.classList.toggle('contrib-item--active', isActive);
        item.querySelector('.contrib-header').setAttribute('aria-expanded', isActive);
      });
      imgSlots.forEach((slot, i) => {
        slot.classList.toggle('contrib-img-slot--active', i === index);
      });
    }

    items.forEach((item, i) => {
      item.querySelector('.contrib-header').addEventListener('click', () => {
        if (item.classList.contains('contrib-item--active')) {
          // Collapse the open item
          item.classList.remove('contrib-item--active');
          item.querySelector('.contrib-header').setAttribute('aria-expanded', 'false');
        } else {
          activate(i);
        }
      });
    });

    // First item open by default
    activate(0);
  })();

  /* ============================================================
     MOBILE HAMBURGER DRAWER
     ============================================================ */
  const hamburger = document.getElementById('header-hamburger');
  const drawer    = document.getElementById('mobile-drawer');
  const overlay   = document.getElementById('mobile-drawer-overlay');
  const drawerClose = document.getElementById('mobile-drawer-close');
  let drawerLastFocus = null;

  function getDrawerFocusables() {
    if (!drawer) return [];
    return Array.from(drawer.querySelectorAll('button, a[href]'));
  }

  function trapDrawerFocus(e) {
    if (!drawer?.classList.contains('open') || e.key !== 'Tab') return;
    const focusables = getDrawerFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openDrawer() {
    drawerLastFocus = document.activeElement;
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstLink = drawer.querySelector('a, button');
    if (firstLink) firstLink.focus();
    document.addEventListener('keydown', trapDrawerFocus);
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapDrawerFocus);
    if (drawerLastFocus && typeof drawerLastFocus.focus === 'function') {
      drawerLastFocus.focus();
    }
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (overlay)     overlay.addEventListener('click', closeDrawer);

  // Close drawer when a nav link is tapped
  if (drawer) {
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeDrawer);
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer?.classList.contains('open')) closeDrawer();
  });

  /* ============================================================
     SVG FADE-IN ANIMATIONS
     CSS transition-based: add .tl-map--revealed to trigger fade.
     ============================================================ */

  // Fire slide-0 map fade on initial load
  setTimeout(() => {
    const w = document.getElementById('tl-map-wrap');
    if (w) w.classList.add('tl-map--revealed');
  }, 350);

  /* ============================================================
     GALLERY COLOR SPOTLIGHT
     Keeps 3 random gallery items in color at all times.
     Picks a new set of 3 every 5 seconds using the same
     clip-path wipe transition defined in CSS.
     ============================================================ */
  (function initGallerySpotlight() {
    if (prefersReducedMotion) return;

    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    if (galleryItems.length < 3) return;

    const COUNT = 5;
    let activeIndices = [];

    function pickRandom(total, count, exclude) {
      const pool = [];
      for (let i = 0; i < total; i++) {
        if (!exclude.includes(i)) pool.push(i);
      }
      // Fisher-Yates shuffle then slice
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, count);
    }

    function rotatePick() {
      // Pick 3 new indices, ensuring they differ from current set
      const newIndices = pickRandom(galleryItems.length, COUNT, activeIndices);

      // Deactivate old
      activeIndices.forEach(i => {
        galleryItems[i].classList.remove('gallery-item--color-active');
      });

      // Activate new (stagger slightly for a more organic feel)
      newIndices.forEach((idx, offset) => {
        setTimeout(() => {
          galleryItems[idx].classList.add('gallery-item--color-active');
        }, offset * 120);
      });

      activeIndices = newIndices;
    }

    // Initial pick after a short delay so the page has settled
    setTimeout(rotatePick, 800);

    // Rotate every 5 seconds
    setInterval(rotatePick, 5000);
  })();
});

