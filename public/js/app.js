async function loadProducts() {
  const sliderTrack = document.getElementById('sliderTrack');
  const sliderContainer = document.getElementById('heroSlider');
  
  if (!sliderTrack || !sliderContainer) return;

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    
    renderSlider(products);
    
    // WICHTIG: Layout muss berechnet sein bevor die Engine startet
    requestAnimationFrame(() => initSlider());
  } catch (err) {
    sliderContainer.innerHTML = `<p style="color:#f85149; text-align:center; padding:3rem;">Fehler beim Laden: ${err.message}</p>`;
  }
}

function renderSlider(productList) {
  const track = document.getElementById('sliderTrack');
  if (productList.length === 0) {
    track.innerHTML = '<div style="padding:2rem;color:var(--text-secondary);">Keine Produkte verfügbar.</div>';
    return;
  }

  const cardHTML = productList.map(p => `
    <div class="product-card">
      <div class="card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23161b22%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%238b949e%22 font-size=%2212%22>Kein Bild</text></svg>'">
      </div>
      <h3>${p.name}</h3>
      <p class="price">${p.price.toFixed(2)} €</p>
      <button onclick="alert('Detailseite kommt später')">Details</button>
    </div>
  `).join('');

  // DUPLIZIERUNG für nahtlosen Loop
  track.innerHTML = cardHTML + cardHTML;
}

// ── CUSTOM SLIDER ENGINE (Flüssig & Stabil) ──
let sliderTrack = document.getElementById('sliderTrack');
let sliderPrev = document.getElementById('sliderPrev');
let sliderNext = document.getElementById('sliderNext');
let currentTranslate = 0;
let autoScrollSpeed = 0.6; // Geringer = flüssiger
let isAutoScrolling = true;
let lastInteraction = Date.now();
let sliderRAF = null;

function getMaxScroll() {
  return -(sliderTrack.scrollWidth / 2);
}

function initSlider() {
  currentTranslate = 0;
  sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
  isAutoScrolling = true;
  lastInteraction = Date.now();
  if (sliderRAF) cancelAnimationFrame(sliderRAF);
  animateSlider();
}

function animateSlider() {
  if (isAutoScrolling && (Date.now() - lastInteraction > 3000)) {
    currentTranslate -= autoScrollSpeed;
    // Nahtloser Sprung zurück zum Start (Anfang der Duplikate)
    if (currentTranslate <= getMaxScroll()) {
      currentTranslate = 0;
    }
    sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
  }
  sliderRAF = requestAnimationFrame(animateSlider);
}

function scrollSlider(direction) {
  isAutoScrolling = false;
  lastInteraction = Date.now();
  sliderTrack.classList.add('manual-scroll');
  const step = 340; // Ca. Breite + Gap
  const maxScroll = getMaxScroll();

  if (direction === 'left') {
    currentTranslate = Math.min(currentTranslate + step, 0);
  } else {
    if (currentTranslate + step >= maxScroll) {
      currentTranslate = 0;
    } else {
      currentTranslate -= step;
    }
  }
  sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
  setTimeout(() => sliderTrack.classList.remove('manual-scroll'), 400);
  setTimeout(() => { isAutoScrolling = true; }, 4000);
}

sliderPrev.addEventListener('click', () => scrollSlider('left'));
sliderNext.addEventListener('click', () => scrollSlider('right'));

sliderTrack.addEventListener('mouseenter', () => { isAutoScrolling = false; });
sliderTrack.addEventListener('mouseleave', () => {
  setTimeout(() => { if(Date.now() - lastInteraction > 2000) isAutoScrolling = true; }, 2000);
});

document.addEventListener('DOMContentLoaded', loadProducts);

// ── Tab Navigation Logic ──
const tabItems = document.querySelectorAll('.tab-item');
tabItems.forEach(item => {
  const btn = item.querySelector('.tab-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = item.classList.contains('active');
    tabItems.forEach(other => other.classList.remove('active'));
    if (!isOpen) item.classList.add('active');
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tab-item')) tabItems.forEach(item => item.classList.remove('active'));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') tabItems.forEach(item => item.classList.remove('active'));
});
