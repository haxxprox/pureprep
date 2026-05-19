async function loadProducts() {
  const swiperWrapper = document.getElementById('swiper-wrapper');
  const swiperContainer = document.getElementById('product-slider');
  
  if (!swiperWrapper || !swiperContainer) return;

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    
    swiperWrapper.innerHTML = ''; // Alte Slides leeren
    
    products.forEach(p => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.innerHTML = `
        <div class="product-card">
          <h3>${p.name}</h3>
          <p class="price">${p.price.toFixed(2)} €</p>
          <button onclick="alert('Detailseite kommt später')">Details</button>
        </div>
      `;
      swiperWrapper.appendChild(slide);
    });

    // Swiper initialisieren (nur wenn noch nicht geschehen)
    if (!swiperContainer.classList.contains('swiper-initialized')) {
      new Swiper(swiperContainer, {
        slidesPerView: 1,
        spaceBetween: 20,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }
      });
    }
  } catch (err) {
    swiperContainer.innerHTML = `<p style="color:#dc3545; text-align:center; padding:2rem;">Fehler beim Laden: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);

// ── Navbar Dropdown Logic ──
const navToggle = document.querySelector('.nav-toggle');
const navDropdown = document.getElementById('navDropdown');

function toggleNav() {
  const isOpen = navDropdown.classList.toggle('open');
  navToggle.classList.toggle('active');
  navToggle.setAttribute('aria-expanded', isOpen);
}

navToggle.addEventListener('click', toggleNav);

// Schließen bei Klick außerhalb
document.addEventListener('click', (e) => {
  if (!navToggle.contains(e.target) && !navDropdown.contains(e.target)) {
    navToggle.classList.remove('active');
    navDropdown.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// Schließen mit ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    navToggle.classList.remove('active');
    navDropdown.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.focus();
  }
});

// ── Tab Navigation Logic ──
const tabItems = document.querySelectorAll('.tab-item');

tabItems.forEach(item => {
  const btn = item.querySelector('.tab-btn');
  
  // Mobile/Touch: Klick zum Öffnen/Schließen
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = item.classList.contains('active');
    
    // Alle schließen
    tabItems.forEach(other => other.classList.remove('active'));
    
    // Wenn nicht offen → öffnen
    if (!isOpen) item.classList.add('active');
  });
});

// Schließen bei Klick außerhalb
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tab-item')) {
    tabItems.forEach(item => item.classList.remove('active'));
  }
});

// ESC zum Schließen
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    tabItems.forEach(item => item.classList.remove('active'));
  }
});

// ── Tab Navigation Logic ──
const tabItems = document.querySelectorAll('.tab-item');

tabItems.forEach(item => {
  const btn = item.querySelector('.tab-btn');
  
  // Mobile/Touch: Klick zum Öffnen/Schließen
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = item.classList.contains('active');
    
    // Alle schließen
    tabItems.forEach(other => other.classList.remove('active'));
    
    // Wenn nicht offen → öffnen
    if (!isOpen) item.classList.add('active');
  });
});

// Schließen bei Klick außerhalb
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tab-item')) {
    tabItems.forEach(item => item.classList.remove('active'));
  }
});

// ESC zum Schließen
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    tabItems.forEach(item => item.classList.remove('active'));
  }
});
