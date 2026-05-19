// Globale Variable für Produkte
let products = [];
let cart = JSON.parse(localStorage.getItem('pureprep_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('pureprep_user')) || null;

async function loadProducts() {
  const swiperWrapper = document.getElementById('swiper-wrapper');
  const swiperContainer = document.getElementById('product-slider');
  
  if (!swiperWrapper || !swiperContainer) return;

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
    
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
          <button onclick="addToCart(${p.id})">In den Warenkorb</button>
        </div>
      `;
      swiperWrapper.appendChild(slide);
    });

    if (!swiperContainer.classList.contains('swiper-initialized')) {
      new Swiper(swiperContainer, {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: true,
        loopMode: 'flip',
        autoplay: { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        pagination: { el: '.swiper-pagination', clickable: true },
        observer: true,
        observeParents: true,
        // 🔽 Mobile-Touch Optimierungen
        touchRatio: 1,
        threshold: 10,
        longSwipesRatio: 0.5,
        shortSwipes: true,
        breakpoints: {
          640: { slidesPerView: 2, spaceBetween: 14 },
          1024: { slidesPerView: 3, spaceBetween: 18 },
          1280: { slidesPerView: 4, spaceBetween: 22 }
        }
      });
      setTimeout(() => swiper.update(), 100);
    }
  } catch (err) {
    swiperContainer.innerHTML = `<p style="color:#f85149; text-align:center; padding:3rem;">Fehler beim Laden: ${err.message}</p>`;
  }
}

// ── WARENKORB ──
function saveCart() {
  localStorage.setItem('pureprep_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  badge.textContent = totalItems;
  badge.classList.toggle('show', totalItems > 0);
  document.getElementById('cartTotal').textContent = `€${totalPrice.toFixed(2)}`;

  const cartItemsEl = document.getElementById('cartItems');
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Dein Warenkorb ist leer</p></div>`;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img"><img src="${item.image}" alt="${item.name}"></div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">€${item.price.toFixed(2)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑️</button>
      </div>
    `).join('');
  }
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  showToast(`✅ ${product.name} hinzugefügt!`);
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(productId);
    else saveCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

// ── KUNDEN-AUTH ──
function checkAuth() {
  const authToggle = document.getElementById('authToggle');
  const userProfile = document.getElementById('userProfile');
  if (currentUser) {
    authToggle.style.display = 'none';
    userProfile.style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.name || currentUser.email;
  } else {
    authToggle.style.display = 'flex';
    userProfile.style.display = 'none';
  }
}

function showAuthModal() {
  document.getElementById('authOverlay').classList.add('open');
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authError').style.display = 'none';
  document.getElementById('authSuccess').style.display = 'none';
  document.getElementById('authForm').reset();
  switchAuthTab('login');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('open');
  document.getElementById('authModal').classList.remove('open');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('nameField').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = tab === 'register' ? 'Registrieren' : 'Einloggen';
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const isRegister = document.querySelector('.auth-tab.active').dataset.tab === 'register';
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value;
  const errorEl = document.getElementById('authError');
  const successEl = document.getElementById('authSuccess');

  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!email || !password) {
    errorEl.textContent = 'Bitte alle Pflichtfelder ausfüllen.';
    errorEl.style.display = 'block';
    return;
  }

  if (isRegister) {
    if (!name) {
      errorEl.textContent = 'Bitte gib deinen Namen ein.';
      errorEl.style.display = 'block';
      return;
    }
    const users = JSON.parse(localStorage.getItem('pureprep_users') || '[]');
    if (users.find(u => u.email === email)) {
      errorEl.textContent = 'Diese E-Mail ist bereits registriert.';
      errorEl.style.display = 'block';
      return;
    }
    users.push({ email, password, name });
    localStorage.setItem('pureprep_users', JSON.stringify(users));
    currentUser = { email, name };
    localStorage.setItem('pureprep_user', JSON.stringify(currentUser));
    successEl.textContent = '✅ Registrierung erfolgreich! Du wirst eingeloggt.';
    successEl.style.display = 'block';
    setTimeout(() => { closeAuthModal(); checkAuth(); }, 1500);
  } else {
    const users = JSON.parse(localStorage.getItem('pureprep_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      currentUser = { email: user.email, name: user.name };
      localStorage.setItem('pureprep_user', JSON.stringify(currentUser));
      successEl.textContent = '✅ Erfolgreich eingeloggt!';
      successEl.style.display = 'block';
      setTimeout(() => { closeAuthModal(); checkAuth(); }, 1500);
    } else {
      errorEl.textContent = 'E-Mail oder Passwort ist falsch.';
      errorEl.style.display = 'block';
    }
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('pureprep_user');
  checkAuth();
  showToast('👋 Erfolgreich abgemeldet.');
}

// ── UI TOGGLES ──
document.getElementById('cartToggle').addEventListener('click', () => {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartSidebar').classList.add('open');
});
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);
function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartSidebar').classList.remove('open');
}

document.getElementById('authToggle').addEventListener('click', showAuthModal);
document.getElementById('authClose').addEventListener('click', closeAuthModal);
document.getElementById('authOverlay').addEventListener('click', closeAuthModal);
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
});
document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) { showToast('⚠️ Warenkorb ist leer!'); return; }
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  showToast(`🎉 Bestellung über €${total.toFixed(2)} wird verarbeitet! (Demo)`);
  cart = []; saveCart(); closeCart();
});

// ── TOAST SYSTEM ──
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:3000;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'padding:14px 24px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;color:var(--text-primary);font-size:0.9rem;box-shadow:0 4px 12px var(--shadow);animation:toastIn 0.3s ease forwards;';
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── TAB NAVIGATION ──
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

// Mobile-Touch: Scroll im Panel verhindern, wenn nötig
document.querySelectorAll('.tab-panel').forEach(panel => {
  panel.addEventListener('touchmove', (e) => {
    if (panel.scrollHeight > panel.clientHeight) {
      e.stopPropagation();
    }
  }, { passive: true });
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.tab-item')) tabItems.forEach(item => item.classList.remove('active'));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') tabItems.forEach(item => item.classList.remove('active'));
});

// ── INITIALISIERUNG ──
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartUI();
  checkAuth();
});
