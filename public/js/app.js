async function loadProducts() {
  const swiperWrapper = document.getElementById('swiper-wrapper');
  const swiperContainer = document.getElementById('product-slider');
  
  if (!swiperWrapper || !swiperContainer) return;

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    
    swiperWrapper.innerHTML = '';
    products.forEach(p => {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';
  slide.innerHTML = `
    <div class="product-card">
      <div class="card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23161b22%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%238b949e%22 font-size=%2212%22>Kein Bild</text></svg>'">
      </div>
      <h3>${p.name}</h3>
      <p class="price">${p.price.toFixed(2)} €</p>
      <button onclick="alert('Detailseite kommt später')">Details</button>
    </div>
  `;
  swiperWrapper.appendChild(slide);
});

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
    swiperContainer.innerHTML = `<p style="color:#f85149; text-align:center; padding:3rem;">Fehler beim Laden: ${err.message}</p>`;
  }
}

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
  if (!e.target.closest('.tab-item')) {
    tabItems.forEach(item => item.classList.remove('active'));
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    tabItems.forEach(item => item.classList.remove('active'));
  }
});
