const placeholders = [
  "Search for phones, laptops, TVs & more…",
  "Find a laptop under ₹65,000 for editing…",
  "Compare Pulse X13 Pro vs Nova S24…",
  "Best earbuds under ₹3,000…",
];
let pi = 0;
const askInput = document.getElementById('askInput');
if (askInput) setInterval(() => { pi = (pi + 1) % placeholders.length; askInput.placeholder = placeholders[pi]; }, 2600);

const fab = document.getElementById('fabBtn');
const panel = document.getElementById('aiPanel');
if (fab) fab.addEventListener('click', () => panel.classList.toggle('open'));

const pbody = document.getElementById('pbody');
const chatInput = document.getElementById('chatInput');
const replies = [
  "The Orbit Watch SE at ₹6,999 fits that — 12-day battery and SpO2 tracking.",
  "Pulse X13 Pro wins on night shots. Nova S24 charges faster and costs less.",
  "Try Settings → Network → Reset, or hold the reset button for 10s.",
];
let ri = 0;
function send(){
  const v = chatInput.value.trim();
  if(!v) return;
  const u = document.createElement('div'); u.className='msg user'; u.textContent=v;
  pbody.appendChild(u); chatInput.value=''; pbody.scrollTop = pbody.scrollHeight;
  const typing = document.createElement('div'); typing.className='typing'; typing.innerHTML='<span></span><span></span><span></span>';
  pbody.appendChild(typing); pbody.scrollTop = pbody.scrollHeight;
  setTimeout(() => {
    typing.remove();
    const b = document.createElement('div'); b.className='msg bot'; b.textContent=replies[ri % replies.length]; ri++;
    pbody.appendChild(b); pbody.scrollTop = pbody.scrollHeight;
  }, 900);
}
const chatSend = document.getElementById('chatSend');
if (chatSend) chatSend.addEventListener('click', send);
if (chatInput) chatInput.addEventListener('keydown', e => { if(e.key==='Enter') send(); });

// cart badge bump on "Add to Cart" — visual only, demo purposes
let cartCount = parseInt(localStorage.getItem('glocalCart') || '3', 10);
const badge = document.querySelector('.navicon .badge');
function paintBadge(){ if (badge) badge.textContent = cartCount; }
paintBadge();
document.querySelectorAll('.addcart').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    cartCount++;
    localStorage.setItem('glocalCart', cartCount);
    paintBadge();
    const old = btn.textContent;
    btn.textContent = 'Added ✓';
    setTimeout(() => { btn.textContent = old; }, 1200);
  });
});

// qty steppers on cart page
document.querySelectorAll('.qty-stepper').forEach(st => {
  const n = st.querySelector('.n');
  st.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      let v = parseInt(n.textContent, 10);
      v = b.dataset.d === '+' ? v + 1 : Math.max(1, v - 1);
      n.textContent = v;
    });
  });
});

// payment method selector on checkout
document.querySelectorAll('.paymethod').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.paymethod').forEach(x => x.classList.remove('on'));
    p.classList.add('on');
    p.querySelector('input').checked = true;
  });
});

// header scroll shadow
const siteHeader = document.querySelector('header');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}

// mic / voice search — visual simulation only
document.querySelectorAll('.micbtn').forEach(mic => {
  mic.addEventListener('click', () => {
    if (mic.classList.contains('listening')) return;
    mic.classList.add('listening');
    setTimeout(() => {
      mic.classList.remove('listening');
      if (askInput) { askInput.value = 'best camera phone under ₹45,000'; askInput.focus(); }
    }, 1800);
  });
});

// proactive AI nudge — appears once per session, homepage only
const nudge = document.getElementById('aiNudge');
if (nudge && !sessionStorage.getItem('glocalNudgeShown')) {
  setTimeout(() => nudge.classList.add('show'), 4200);
  sessionStorage.setItem('glocalNudgeShown', '1');
}
document.querySelectorAll('.nudge .x').forEach(x => x.addEventListener('click', () => nudge.classList.remove('show')));
document.querySelectorAll('.nudge .nudgeAsk').forEach(b => b.addEventListener('click', () => {
  nudge.classList.remove('show');
  if (panel) panel.classList.add('open');
}));

// animated stat counters — count up once when scrolled into view
document.querySelectorAll('.statcard .num[data-count]').forEach(el => {
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

// scroll reveal — progressive enhancement: elements are visible by default
// (see .reveal rule), JS opts them INTO the fade-in-on-scroll treatment only
// if IntersectionObserver exists, never the other way round.
if ('IntersectionObserver' in window) {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => el.classList.add('js-armed'));
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); revealObs.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => revealObs.observe(el));
}

// AI compare modal
const aiOverlay = document.getElementById('aiOverlay');
function openCompareModal(){
  if (!aiOverlay) return;
  aiOverlay.classList.add('open');
  const fills = aiOverlay.querySelectorAll('.metric .fill');
  fills.forEach(f => { f.style.width = '0'; });
  setTimeout(() => fills.forEach(f => { f.style.width = f.dataset.pct + '%'; }), 120);
}
document.querySelectorAll('.openCompare').forEach(b => b.addEventListener('click', openCompareModal));
if (aiOverlay) {
  aiOverlay.addEventListener('click', (e) => { if (e.target === aiOverlay) aiOverlay.classList.remove('open'); });
  const closeBtn = aiOverlay.querySelector('.close');
  if (closeBtn) closeBtn.addEventListener('click', () => aiOverlay.classList.remove('open'));
}

// AI confidence meter (PDP) — animate bars in on load
document.querySelectorAll('.confrow .fill').forEach(f => {
  setTimeout(() => { f.style.width = f.dataset.pct + '%'; }, 300);
});
