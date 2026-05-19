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
