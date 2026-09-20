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
  setTimeout(() => {
    const b = document.createElement('div'); b.className='msg bot'; b.textContent=replies[ri % replies.length]; ri++;
    pbody.appendChild(b); pbody.scrollTop = pbody.scrollHeight;
  }, 550);
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
