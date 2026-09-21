// header scroll shadow
const siteHeader = document.querySelector('header');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}

// mobile nav — reuses the desktop nav list, toggled as a dropdown panel
const hamBtn = document.getElementById('hamBtn');
const navlinks = document.querySelector('.navlinks');
if (hamBtn && navlinks) {
  hamBtn.addEventListener('click', () => {
    const open = navlinks.classList.toggle('mobileopen');
    navlinks.style.cssText = open
      ? 'display:flex;flex-direction:column;gap:14px;position:absolute;top:100%;left:0;right:0;background:#FBF7EE;padding:18px 28px;border-bottom:1px solid #E8DFC4'
      : '';
  });
  navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navlinks.classList.remove('mobileopen');
    navlinks.style.cssText = '';
  }));
}

// animated stat counters — count up once when scrolled into view
document.querySelectorAll('.herostat .n[data-count]').forEach(el => {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const dur = 1200, start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const val = target * (1 - Math.pow(1 - p, 3));
        el.textContent = (target % 1 !== 0 ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  obs.observe(el);
});

// scroll reveal — progressive enhancement: sections are visible by default
// (see .reveal rule in style.css), JS opts them INTO the fade-in-on-scroll
// treatment only if IntersectionObserver exists, never the other way round.
if ('IntersectionObserver' in window) {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => el.classList.add('js-armed'));
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); revealObs.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => revealObs.observe(el));
}

// RFQ form — visual submit only, demo purposes (no backend)
const rfqForm = document.getElementById('rfqForm');
const formDefault = document.getElementById('formDefault');
const formSuccess = document.getElementById('formSuccess');
if (rfqForm) {
  rfqForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formDefault.style.display = 'none';
    formSuccess.classList.add('show');
  });
}

// WhatsApp fab — scrolls to the quote form rather than dialing a placeholder number
const waFab = document.getElementById('waFab');
if (waFab) {
  waFab.addEventListener('click', () => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  });
}
