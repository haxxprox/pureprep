/* ═══════════════════════════════════════════════════════
   PS-Design's – Haupt-JavaScript
   Alle Verbesserungen integriert:
   1. XSS-Schutz (kein unsicheres innerHTML für Benutzerdaten)
   2. localStorage QuotaExceeded-Fallback
   3. prefers-reduced-motion
   4. Focus-Trap in Modals
   5. Touch/Swipe Slider
   6. Inline onclick entfernt → Event Delegation
   7. Scroll-Event debouncen
   8. Emoji-Picker memoize
   ═══════════════════════════════════════════════════════ */

// ── Hilfsfunktionen ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── 3. prefers-reduced-motion ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 2. localStorage mit QuotaExceeded-Fallback ──
const Storage = {
    _inMemory: {},
    get(key) {
        try {
            const val = localStorage.getItem(key);
            if (val !== null) return JSON.parse(val);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('[Storage] localStorage voll – nutze In-Memory-Fallback');
            }
        }
        return this._inMemory[key] !== undefined ? this._inMemory[key] : null;
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this._inMemory[key] = value;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('[Storage] localStorage voll – nutze In-Memory-Fallback');
                this._inMemory[key] = value;
            }
        }
    },
    remove(key) {
        try { localStorage.removeItem(key); } catch(e) {}
        delete this._inMemory[key];
    }
};

// ── 1. XSS-Schutz: Sanitization ──
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ── 8. Emoji-Picker memoize ──
const emojiCache = new Map();
const EMOJIS = ['📦','💡','🔌','🌱','🔧','🪝','📋','🪴','🏠','🚗','🎮','⌚','👟','🎒','🧩','🔮','🎭','🎨','🖼️','🏆','⭐','💎','🌟','🎯','🛡️','⚔️','🗡️','🧲','🔩','🪛','🧰','📐','📏','✂️','🪚','🔨','🪓','🧪','🧫','🔬','🌍','🌙','☀️','🍃','🌸','🎵','🎶','📷','🎬','🧸','🎪','🎠','🗿','🏺','🪃','🧿','🔑','🗝️','🧲'];

function getMemoizedEmojis() {
    if (!emojiCache.has('EMOJIS')) {
        emojiCache.set('EMOJIS', [...EMOJIS]);
    }
    return emojiCache.get('EMOJIS');
}

// ── STANDARD PRODUKTE ──
const defaultProducts = [
    { id: 1, name: "Modulare Aufbewahrungsbox", desc: "Stapelbare Box mit individuell anpassbaren Fächern. Perfekt für Büro oder Werkstatt.", price: 24.99, originalPrice: 34.99, category: "physical", tag: "hot", icon: "📦", bg: "bg-1", rating: 4.9, reviews: 128, material: "PLA Premium", image: null },
    { id: 2, name: "Geometrische Tischlampe", desc: "Futuristische Lampe mit beleuchtbarem Kern. Kommt als fertiger Bausatz mit Anleitung.", price: 42.99, category: "physical", tag: "new", icon: "💡", bg: "bg-4", rating: 4.8, reviews: 67, material: "PLA Matt", image: null },
    { id: 3, name: "Kabelorganizer Set", desc: "5-teiliges Set aus Clips, Halterungen und Management-Lösungen für deinen Schreibtisch.", price: 12.99, category: "physical", tag: null, icon: "🔌", bg: "bg-2", rating: 4.7, reviews: 203, material: "PETG Flex", image: null },
    { id: 4, name: "Deko-Gewächshaus Mini", desc: "Detailliertes Modell für Sukkulenten. Kommt als fertiges Druckteil mit Anleitung.", price: 29.99, category: "physical", tag: "limited", icon: "🌱", bg: "bg-6", rating: 4.9, reviews: 45, material: "PLA Silk", image: null },
    { id: 5, name: "Innovatives Werkzeug-Konzept", desc: "Komplettes Design-Paket für ein modulares Werkzeug-System. Inkl. Prototyp-Planung.", price: 49.99, category: "ideas", tag: "hot", icon: "🔧", bg: "bg-3", rating: 5.0, reviews: 31, material: "PDF + CAD", image: null },
    { id: 6, name: "Wandhalterung Universal", desc: "Anpassbare Halterung für Werkzeuge, Küchengeräte oder Deko-Elemente.", price: 16.99, originalPrice: 22.99, category: "physical", tag: null, icon: "🪝", bg: "bg-5", rating: 4.6, reviews: 156, material: "PLA Carbon", image: null },
    { id: 7, name: "Design-Entwicklungspaket", desc: "Strukturiertes Template für eigene 3D-Projekte: Von der Skizze zum fertigen Druck.", price: 14.99, category: "ideas", tag: "new", icon: "📋", bg: "bg-1", rating: 4.8, reviews: 89, material: "Notion + PDF", image: null },
    { id: 8, name: "Dekorative Pflanzenschale", desc: "Organisches Design mit natürlichen Strukturen. Perfekt für Zimmerpflanzen.", price: 29.99, category: "physical", tag: "hot", icon: "🪴", bg: "bg-6", rating: 4.9, reviews: 94, material: "PLA Silk", image: null },
];

// ── STATE ──
let products = Storage.get('psdesigns_products') || JSON.parse(JSON.stringify(defaultProducts));
let cart = [];
let editingProductId = null;
let sliderActiveFilter = 'all';
let productActiveFilter = 'all';
let currentFilter = 'all';
let currentImageData = null;

// ── Slider-Elemente ──
const sliderTrack = $('#sliderTrack');
const sliderPrev = $('#sliderPrev');
const sliderNext = $('#sliderNext');
const sliderTrackWrapper = $('#sliderTrackWrapper');
let currentTranslate = 0;
let autoScrollSpeed = 0.5;
let isAutoScrolling = true;
let lastInteraction = Date.now();
let sliderRAF = null;

// ── 6. 4. FILTER-FUNKTIONEN ──
function getFilteredProducts(filter) {
    if (filter === 'all') return [...products];
    return products.filter(p => p.tag === filter);
}

function updateFilterCounts() {
    const counts = {
        all: products.length,
        new: products.filter(p => p.tag === 'new').length,
        hot: products.filter(p => p.tag === 'hot').length,
        limited: products.filter(p => p.tag === 'limited').length
    };
    const prefix = (id) => document.getElementById(id);
    if (prefix('sliderCountAll')) prefix('sliderCountAll').textContent = counts.all;
    if (prefix('sliderCountNew')) prefix('sliderCountNew').textContent = counts.new;
    if (prefix('sliderCountHot')) prefix('sliderCountHot').textContent = counts.hot;
    if (prefix('sliderCountLimited')) prefix('sliderCountLimited').textContent = counts.limited;
    if (prefix('prodCountAll')) prefix('prodCountAll').textContent = counts.all;
    if (prefix('prodCountNew')) prefix('prodCountNew').textContent = counts.new;
    if (prefix('prodCountHot')) prefix('prodCountHot').textContent = counts.hot;
    if (prefix('prodCountLimited')) prefix('prodCountLimited').textContent = counts.limited;
}

function setSliderFilter(filter, btn) {
    sliderActiveFilter = filter;
    $$('#sliderFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSlider();
}

function setProductFilter(filter, btn) {
    productActiveFilter = filter;
    $$('#productFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
}

// ── 1. XSS-SAFE DOM-Builder für Slider-Karten ──
function createSliderCardElement(product) {
    const card = document.createElement('div');
    card.className = 'slider-card';
    card.dataset.productId = product.id;

    // Bild-Container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'slider-card-image';

    const bgDiv = document.createElement('div');
    bgDiv.className = `img-bg ${product.bg}`;
    imgContainer.appendChild(bgDiv);

    if (product.image) {
        const img = document.createElement('img');
        img.src = escapeHTML(product.image);
        img.alt = escapeHTML(product.name);
        img.loading = 'lazy';
        imgContainer.appendChild(img);
    } else {
        const icon = document.createElement('span');
        icon.className = 'card-icon';
        icon.textContent = product.icon;
        imgContainer.appendChild(icon);
    }

    if (product.tag) {
        const tag = document.createElement('span');
        tag.className = `slider-card-tag tag-${product.tag}`;
        const tagLabels = { new: '✦ Neu', hot: '🔥 Beliebt', limited: '⚡ Limitiert' };
        tag.textContent = tagLabels[product.tag] || '';
        imgContainer.appendChild(tag);
    }

    card.appendChild(imgContainer);

    // Body
    const body = document.createElement('div');
    body.className = 'slider-card-body';

    const catLabels = { physical: '3D-Druckteil', ideas: 'Idee & Konzept' };
    const catEl = document.createElement('div');
    catEl.className = 'slider-card-cat';
    catEl.textContent = catLabels[product.category] || product.category;
    body.appendChild(catEl);

    const nameEl = document.createElement('div');
    nameEl.className = 'slider-card-name';
    nameEl.textContent = product.name;
    body.appendChild(nameEl);

    const descEl = document.createElement('div');
    descEl.className = 'slider-card-desc';
    descEl.textContent = product.desc;
    body.appendChild(descEl);

    const footer = document.createElement('div');
    footer.className = 'slider-card-footer';

    const priceEl = document.createElement('div');
    priceEl.className = 'slider-card-price';
    priceEl.textContent = `€${product.price.toFixed(2)}`;
    if (product.originalPrice) {
        const orig = document.createElement('span');
        orig.className = 'original';
        orig.textContent = `€${product.originalPrice.toFixed(2)}`;
        priceEl.appendChild(orig);
    }
    footer.appendChild(priceEl);

    const addBtn = document.createElement('button');
    addBtn.className = 'slider-card-add';
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.title = 'In den Warenkorb';
    addBtn.dataset.action = 'add-to-cart';
    addBtn.dataset.productId = product.id;
    footer.appendChild(addBtn);

    body.appendChild(footer);
    card.appendChild(body);

    return card;
}

// ── SLIDER RENDERN (XSS-safe) ──
function renderSlider() {
    const filtered = getFilteredProducts(sliderActiveFilter);

    if (filtered.length === 0) {
        sliderTrack.innerHTML = '';
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:2rem;color:var(--text-muted);';
        empty.textContent = 'Keine Produkte in dieser Kategorie.';
        sliderTrack.appendChild(empty);
        initSlider();
        return;
    }

    // XSS-safe: DOM-Elemente statt innerHTML
    sliderTrack.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // Duplizieren für Endlos-Effekt
    for (let loop = 0; loop < 2; loop++) {
        for (const p of filtered) {
            const card = createSliderCardElement(p);
            fragment.appendChild(card);
        }
    }
    sliderTrack.appendChild(fragment);

    initSlider();
}

// ── 5. TOUCH/SWIPE SLIDER ──
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let isTouching = false;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isTouching = true;
    isAutoScrolling = false;
    lastInteraction = Date.now();
}

function handleTouchMove(e) {
    if (!isTouching) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    touchDeltaX = currentX - touchStartX;

    // Verhindere Scrollen wenn horizontal mehr als vertikal
    if (Math.abs(touchDeltaX) > Math.abs(currentY - touchStartY)) {
        e.preventDefault();
    }
}

function handleTouchEnd() {
    if (!isTouching) return;
    isTouching = false;
    const threshold = 50;

    if (touchDeltaX > threshold) {
        scrollSlider('left');
    } else if (touchDeltaX < -threshold) {
        scrollSlider('right');
    }

    touchDeltaX = 0;
    setTimeout(() => { isAutoScrolling = true; }, 4000);
}

sliderTrackWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
sliderTrackWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
sliderTrackWrapper.addEventListener('touchend', handleTouchEnd);

// ── JS SLIDER ENGINE ──
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
    const step = 280;
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

// ── 1. XSS-SAFE DOM-Builder für Produktkarten ──
function createProductCardElement(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category;
    card.style.transitionDelay = `${index * 0.08}s`;

    const catLabels = { physical: '3D-Druckteil', ideas: 'Idee & Konzept' };
    const tagLabels = { new: '✦ Neu', hot: '🔥 Beliebt', limited: '⚡ Limitiert' };

    // Image
    const imgDiv = document.createElement('div');
    imgDiv.className = 'product-image';

    const bgEl = document.createElement('div');
    bgEl.className = `img-bg ${product.bg}`;
    imgDiv.appendChild(bgEl);

    if (product.image) {
        const img = document.createElement('img');
        img.className = 'product-img';
        img.src = escapeHTML(product.image);
        img.alt = escapeHTML(product.name);
        img.loading = 'lazy';
        imgDiv.appendChild(img);
    } else {
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = product.icon;
        imgDiv.appendChild(icon);
    }

    if (product.tag) {
        const tag = document.createElement('span');
        tag.className = `product-tag tag-${product.tag}`;
        tag.textContent = tagLabels[product.tag] || '';
        imgDiv.appendChild(tag);
    }

    const wishBtn = document.createElement('button');
    wishBtn.className = 'product-wishlist';
    wishBtn.type = 'button';
    wishBtn.textContent = '♡';
    wishBtn.title = 'Zur Wunschliste';
    wishBtn.dataset.action = 'toggle-wishlist';
    imgDiv.appendChild(wishBtn);

    card.appendChild(imgDiv);

    // Info
    const info = document.createElement('div');
    info.className = 'product-info';

    const catEl = document.createElement('div');
    catEl.className = 'product-category';
    catEl.textContent = catLabels[product.category] || product.category;
    info.appendChild(catEl);

    const nameEl = document.createElement('div');
    nameEl.className = 'product-name';
    nameEl.textContent = product.name;
    info.appendChild(nameEl);

    const descEl = document.createElement('div');
    descEl.className = 'product-desc';
    descEl.textContent = product.desc;
    info.appendChild(descEl);

    const meta = document.createElement('div');
    meta.className = 'product-meta';

    const ratingEl = document.createElement('span');
    ratingEl.className = 'product-rating';
    ratingEl.textContent = `★★★★★ ${product.rating || '4.5'}`;
    meta.appendChild(ratingEl);

    const reviewsEl = document.createElement('span');
    reviewsEl.textContent = `(${product.reviews || 0} Bewertungen)`;
    meta.appendChild(reviewsEl);

    const materialEl = document.createElement('span');
    materialEl.textContent = `📐 ${product.material || 'Standard'}`;
    meta.appendChild(materialEl);

    info.appendChild(meta);

    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const priceEl = document.createElement('div');
    priceEl.className = 'product-price';
    priceEl.textContent = `€${product.price.toFixed(2)}`;
    if (product.originalPrice) {
        const orig = document.createElement('span');
        orig.className = 'original';
        orig.textContent = `€${product.originalPrice.toFixed(2)}`;
        priceEl.appendChild(orig);
    }
    footer.appendChild(priceEl);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-to-cart';
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.title = 'In den Warenkorb';
    addBtn.dataset.action = 'add-to-cart';
    addBtn.dataset.productId = product.id;
    footer.appendChild(addBtn);

    info.appendChild(footer);
    card.appendChild(info);

    return card;
}

// ── PRODUKTE RENDERN (XSS-safe) ──
function renderProducts() {
    const grid = $('#productGrid');
    const filtered = getFilteredProducts(productActiveFilter);

    if (filtered.length === 0) {
        grid.innerHTML = '';
        const empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:4rem;color:var(--text-muted); grid-column: 1/-1;';
        empty.textContent = 'Keine Produkte in dieser Kategorie.';
        grid.appendChild(empty);
        return;
    }

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    filtered.forEach((p, i) => {
        const card = createProductCardElement(p, i);
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);

    requestAnimationFrame(() => {
        $$('.product-card').forEach(card => setTimeout(() => card.classList.add('visible'), 50));
    });
}

// ── 7. DEBOUNCED SCROLL ──
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedScroll = debounce(() => {
    const navbar = $('#navbar');
    const scrollTop = $('#scrollTop');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
    if (window.scrollY > 500) scrollTop.classList.add('show');
    else scrollTop.classList.remove('show');
}, 16);

window.addEventListener('scroll', debouncedScroll, { passive: true });

// ── 4. FOCUS-TRAP ──
function trapFocus(element) {
    const focusable = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeydown(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        if (e.key === 'Escape') {
            closeAdminLogin();
            closeAdminPanel();
            closeProductModal();
            closeChangePassword();
            closeResetConfirm();
        }
    }

    element.addEventListener('keydown', handleKeydown);
    element._focusHandler = handleKeydown;
    first.focus();
}

function removeFocusTrap(element) {
    if (element._focusHandler) {
        element.removeEventListener('keydown', element._focusHandler);
        delete element._focusHandler;
    }
}

// ── ADMIN PANEL ──
function openAdminLogin() {
    const overlay = $('#adminLoginOverlay');
    overlay.classList.add('open');
    $('#adminPasswordInput').value = '';
    $('#loginError').style.display = 'none';
    setTimeout(() => $('#adminPasswordInput').focus(), 100);
    trapFocus(overlay);
}

function closeAdminLogin() {
    const overlay = $('#adminLoginOverlay');
    overlay.classList.remove('open');
    removeFocusTrap(overlay);
}

function tryLogin() {
    const password = Storage.get('psdesigns_admin_password') || 'admin123';
    const input = $('#adminPasswordInput').value;
    if (input === password) {
        closeAdminLogin();
        openAdminPanel();
    } else {
        $('#loginError').style.display = 'block';
        $('#adminPasswordInput').value = '';
        $('#adminPasswordInput').focus();
    }
}

function openAdminPanel() {
    $('#adminPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderAdminProducts();
    trapFocus($('#adminPanel'));
}

function closeAdminPanel() {
    $('#adminPanel').classList.remove('open');
    document.body.style.overflow = '';
    removeFocusTrap($('#adminPanel'));
}

function renderAdminProducts() {
    const search = ($('#adminSearch').value || '').toLowerCase();
    const list = $('#adminProductsList');
    const count = $('#adminCount');

    if (!products || products.length === 0) {
        count.textContent = `0 von 0 Produkten`;
        list.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'admin-empty';
        const icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '📭';
        const p = document.createElement('p');
        p.textContent = 'Keine Produkte vorhanden. Klicke auf "➕ Neues Produkt" oder "🔄 Reset".';
        empty.appendChild(icon);
        empty.appendChild(p);
        list.appendChild(empty);
        return;
    }

    let filtered = [...products];
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    if (search) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.desc.toLowerCase().includes(search) ||
            p.material.toLowerCase().includes(search)
        );
    }

    count.textContent = `${filtered.length} von ${products.length} Produkten`;

    if (filtered.length === 0) {
        list.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'admin-empty';
        const icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '🔍';
        const p = document.createElement('p');
        p.textContent = 'Keine Produkte gefunden';
        empty.appendChild(icon);
        empty.appendChild(p);
        list.appendChild(empty);
        return;
    }

    list.innerHTML = '';
    const fragment = document.createDocumentFragment();

    filtered.forEach(p => {
        const item = document.createElement('div');
        item.className = 'admin-product-item';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'admin-product-icon';
        if (p.image) {
            const img = document.createElement('img');
            img.src = escapeHTML(p.image);
            img.alt = escapeHTML(p.name);
            iconDiv.appendChild(img);
        } else {
            iconDiv.textContent = p.icon;
        }
        item.appendChild(iconDiv);

        const info = document.createElement('div');
        info.className = 'admin-product-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'admin-product-name';
        nameEl.textContent = p.name;
        info.appendChild(nameEl);

        const meta = document.createElement('div');
        meta.className = 'admin-product-meta';

        const catEl = document.createElement('span');
        catEl.textContent = p.category === 'physical' ? '📦 Druckteil' : '💡 Idee';
        meta.appendChild(catEl);

        const matEl = document.createElement('span');
        matEl.textContent = `📐 ${p.material || 'Standard'}`;
        meta.appendChild(matEl);

        if (p.tag) {
            const tagEl = document.createElement('span');
            const tagLabels = { new: 'Neu', hot: 'Beliebt', limited: 'Limitiert' };
            tagEl.textContent = `🏷️ ${tagLabels[p.tag] || p.tag}`;
            meta.appendChild(tagEl);
        }
        if (p.image) {
            const imgEl = document.createElement('span');
            imgEl.textContent = '🖼️ Bild';
            meta.appendChild(imgEl);
        }

        info.appendChild(meta);
        item.appendChild(info);

        const priceEl = document.createElement('div');
        priceEl.className = 'admin-product-price';
        priceEl.textContent = `€${p.price.toFixed(2)}`;
        item.appendChild(priceEl);

        const actions = document.createElement('div');
        actions.className = 'admin-product-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-edit';
        editBtn.textContent = '✏️';
        editBtn.title = 'Bearbeiten';
        editBtn.dataset.action = 'edit-product';
        editBtn.dataset.productId = p.id;
        actions.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete';
        delBtn.textContent = '🗑️';
        delBtn.title = 'Löschen';
        delBtn.dataset.action = 'delete-product';
        delBtn.dataset.productId = p.id;
        actions.appendChild(delBtn);

        item.appendChild(actions);
        fragment.appendChild(item);
    });

    list.appendChild(fragment);
}

function filterByTag(tag, btn) {
    currentFilter = tag;
    $$('.tag-filter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAdminProducts();
}

// ── PRODUKT MODAL ──
function openProductModal(productId = null) {
    editingProductId = productId;
    currentImageData = null;
    const modal = $('#productModal');
    const title = $('#modalTitle');

    if (productId) {
        const p = products.find(x => x.id === productId);
        if (!p) { showToast('⚠️ Produkt nicht gefunden!'); return; }
        title.textContent = '✏️ Produkt bearbeiten';
        $('#modalName').value = p.name || '';
        $('#modalDesc').value = p.desc || '';
        $('#modalPrice').value = p.price || '';
        $('#modalOrigPrice').value = p.originalPrice || '';
        $('#modalIcon').value = p.icon || '📦';
        $('#modalBg').value = p.bg || 'bg-1';
        $('#modalCategory').value = p.category || 'physical';
        $('#modalTag').value = p.tag || '';
        $('#modalMaterial').value = p.material || '';
        $('#modalRating').value = p.rating || '4.5';
        $('#modalReviews').value = p.reviews || '0';
        currentImageData = p.image || null;
        if (currentImageData) {
            $('#imagePreview').src = currentImageData;
            $('#imagePreviewContainer').classList.add('show');
            $('#uploadPlaceholder').style.display = 'none';
            $('#modalImageUrl').value = '';
        } else {
            $('#imagePreviewContainer').classList.remove('show');
            $('#uploadPlaceholder').style.display = 'block';
            $('#modalImageUrl').value = '';
        }
    } else {
        title.textContent = '➕ Neues Produkt';
        $('#modalName').value = '';
        $('#modalDesc').value = '';
        $('#modalPrice').value = '';
        $('#modalOrigPrice').value = '';
        $('#modalIcon').value = '📦';
        $('#modalBg').value = 'bg-1';
        $('#modalCategory').value = 'physical';
        $('#modalTag').value = '';
        $('#modalMaterial').value = '';
        $('#modalRating').value = '4.5';
        $('#modalReviews').value = '0';
        $('#imagePreviewContainer').classList.remove('show');
        $('#uploadPlaceholder').style.display = 'block';
        $('#modalImageUrl').value = '';
    }
    renderEmojiPicker();
    modal.classList.add('open');
    trapFocus(modal);
}

function closeProductModal() {
    const modal = $('#productModal');
    modal.classList.remove('open');
    editingProductId = null;
    currentImageData = null;
    removeFocusTrap(modal);
}

// ── 8. MEMOIZED EMOJI PICKER ──
function renderEmojiPicker() {
    const picker = $('#emojiPicker');
    const selectedEmoji = $('#modalIcon').value;
    picker.innerHTML = '';

    const emojis = getMemoizedEmojis();
    const fragment = document.createDocumentFragment();

    emojis.forEach(e => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = e;
        if (selectedEmoji === e) btn.classList.add('selected');
        btn.dataset.emoji = e;
        fragment.appendChild(btn);
    });

    picker.appendChild(fragment);
}

function selectEmoji(emoji, btn) {
    $('#modalIcon').value = emoji;
    $$('#emojiPicker button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// ── IMAGE HANDLING ──
function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast('⚠️ Datei zu groß! Maximale Größe: 2MB. Nutze lieber eine URL.');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageData = e.target.result;
        $('#imagePreview').src = currentImageData;
        $('#imagePreviewContainer').classList.add('show');
        $('#uploadPlaceholder').style.display = 'none';
        $('#modalImageUrl').value = '';
    };
    reader.readAsDataURL(file);
}

function handleImageUrlInput() {
    const url = ($('#modalImageUrl').value || '').trim();
    if (url) {
        currentImageData = url;
        $('#imagePreview').src = url;
        $('#imagePreviewContainer').classList.add('show');
        $('#uploadPlaceholder').style.display = 'none';
    } else {
        currentImageData = null;
        $('#imagePreviewContainer').classList.remove('show');
        $('#uploadPlaceholder').style.display = 'block';
    }
}

function removeImage() {
    currentImageData = null;
    $('#imagePreview').src = '';
    $('#imagePreviewContainer').classList.remove('show');
    $('#uploadPlaceholder').style.display = 'block';
    $('#modalImageUrl').value = '';
    $('#imageFileInput').value = '';
}

function saveProduct() {
    const name = ($('#modalName').value || '').trim();
    const desc = ($('#modalDesc').value || '').trim();
    const price = parseFloat($('#modalPrice').value);
    const origPrice = parseFloat($('#modalOrigPrice').value) || null;
    const icon = $('#modalIcon').value;
    const bg = $('#modalBg').value;
    const category = $('#modalCategory').value;
    const tag = $('#modalTag').value || null;
    const material = ($('#modalMaterial').value || '').trim();
    const rating = parseFloat($('#modalRating').value) || 4.5;
    const reviews = parseInt($('#modalReviews').value) || 0;

    if (!name || !desc || isNaN(price) || price <= 0) {
        showToast('⚠️ Bitte alle Pflichtfelder ausfüllen!');
        return;
    }

    if (currentImageData && currentImageData.startsWith('data:image') && currentImageData.length > 150000) {
        if (!confirm('⚠️ Dieses Bild ist sehr groß (>150KB). Es kann die Browser-Speicherung verlangsamen. Trotzdem speichern?')) {
            return;
        }
    }

    if (editingProductId) {
        const idx = products.findIndex(p => p.id === editingProductId);
        if (idx !== -1) {
            products[idx] = { ...products[idx], name, desc, price, originalPrice: origPrice, icon, bg, category, tag, material, rating, reviews, image: currentImageData };
        }
        showToast('✅ Produkt aktualisiert!');
    } else {
        const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: nextId, name, desc, price, originalPrice: origPrice, category, tag, icon, bg, rating, reviews, material: material || 'Standard', image: currentImageData });
        showToast('✅ Neues Produkt hinzugefügt!');
    }

    Storage.set('psdesigns_products', products);
    renderProducts();
    renderSlider();
    updateFilterCounts();
    renderAdminProducts();
    closeProductModal();
}

function editProduct(id) { openProductModal(id); }

function deleteProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (confirm(`"${p.name}" wirklich löschen?`)) {
        products = products.filter(x => x.id !== id);
        Storage.set('psdesigns_products', products);
        renderProducts();
        renderSlider();
        updateFilterCounts();
        renderAdminProducts();
        showToast('🗑️ Produkt gelöscht!');
    }
}

// ── PASSWORT ÄNDERN ──
function openChangePassword() {
    $('#changePassModal').classList.add('open');
    $('#newPassInput').value = '';
    $('#confirmPassInput').value = '';
    trapFocus($('#changePassModal'));
}
function closeChangePassword() {
    $('#changePassModal').classList.remove('open');
    removeFocusTrap($('#changePassModal'));
}
function changePassword() {
    const newPass = $('#newPassInput').value;
    const confirmPass = $('#confirmPassInput').value;
    if (!newPass || newPass.length < 4) { showToast('⚠️ Passwort muss mindestens 4 Zeichen haben!'); return; }
    if (newPass !== confirmPass) { showToast('⚠️ Passwörter stimmen nicht überein!'); return; }
    Storage.set('psdesigns_admin_password', newPass);
    closeChangePassword();
    showToast('✅ Passwort geändert!');
}

// ── EXPORT / IMPORT ──
function exportProducts() {
    const data = JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `psdesigns-produkte-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('📤 Produkte exportiert!');
}

function importProducts(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                products = imported;
                Storage.set('psdesigns_products', products);
                renderProducts();
                renderSlider();
                updateFilterCounts();
                renderAdminProducts();
                showToast(`📥 ${imported.length} Produkte importiert!`);
            } else { showToast('⚠️ Ungültiges Dateiformat!'); }
        } catch(err) { showToast('⚠️ Fehler beim Import!'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function openResetConfirm() { $('#resetConfirmModal').classList.add('open'); trapFocus($('#resetConfirmModal')); }
function closeResetConfirm() { $('#resetConfirmModal').classList.remove('open'); removeFocusTrap($('#resetConfirmModal')); }
function resetProducts() {
    products = JSON.parse(JSON.stringify(defaultProducts));
    Storage.set('psdesigns_products', products);
    renderProducts();
    renderSlider();
    updateFilterCounts();
    renderAdminProducts();
    closeResetConfirm();
    showToast('🔄 Alle Produkte zurückgesetzt!');
}

// ── WARENKORB ──
function addToCart(productId, btnEl) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });

    if (btnEl) {
        btnEl.classList.add('added'); btnEl.textContent = '✓';
        setTimeout(() => { btnEl.classList.remove('added'); btnEl.textContent = '+'; }, 1000);
    }

    updateCart();
    showToast(`✅ ${product.name} hinzugefügt!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function changeQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(productId);
    }
    updateCart();
}

function updateCart() {
    const badge = $('#cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    badge.textContent = totalItems;
    badge.classList.toggle('show', totalItems > 0);
    $('#cartTotal').textContent = `€${totalPrice.toFixed(2)}`;

    const cartItemsEl = $('#cartItems');
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'cart-empty';
        const icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '🛒';
        const p = document.createElement('p');
        p.textContent = 'Dein Warenkorb ist leer';
        empty.appendChild(icon);
        empty.appendChild(p);
        cartItemsEl.appendChild(empty);
    } else {
        cartItemsEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'cart-item-icon';
            iconDiv.style.background = 'rgba(108,92,231,0.15)';
            iconDiv.textContent = item.icon;
            cartItem.appendChild(iconDiv);

            const info = document.createElement('div');
            info.className = 'cart-item-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'cart-item-name';
            nameEl.textContent = item.name;
            info.appendChild(nameEl);

            const priceEl = document.createElement('div');
            priceEl.className = 'cart-item-price';
            priceEl.textContent = `€${item.price.toFixed(2)}`;
            info.appendChild(priceEl);

            const qtyDiv = document.createElement('div');
            qtyDiv.className = 'cart-item-qty';

            const minusBtn = document.createElement('button');
            minusBtn.type = 'button';
            minusBtn.className = 'qty-btn';
            minusBtn.textContent = '−';
            minusBtn.dataset.action = 'qty-minus';
            minusBtn.dataset.productId = item.id;
            qtyDiv.appendChild(minusBtn);

            const qtyNum = document.createElement('span');
            qtyNum.className = 'qty-num';
            qtyNum.textContent = item.qty;
            qtyDiv.appendChild(qtyNum);

            const plusBtn = document.createElement('button');
            plusBtn.type = 'button';
            plusBtn.className = 'qty-btn';
            plusBtn.textContent = '+';
            plusBtn.dataset.action = 'qty-plus';
            plusBtn.dataset.productId = item.id;
            qtyDiv.appendChild(plusBtn);

            info.appendChild(qtyDiv);
            cartItem.appendChild(info);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'cart-item-remove';
            removeBtn.textContent = '🗑️';
            removeBtn.dataset.action = 'remove-cart-item';
            removeBtn.dataset.productId = item.id;
            cartItem.appendChild(removeBtn);

            fragment.appendChild(cartItem);
        });

        cartItemsEl.appendChild(fragment);
    }
}

const cartSidebar = $('#cartSidebar');
const cartOverlay = $('#cartOverlay');

$('#cartToggle').addEventListener('click', () => {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
});

function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
}
$('#cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function showToast(message) {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function handleCheckout() {
    if (cart.length === 0) { showToast('⚠️ Warenkorb ist leer!'); return; }
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    showToast(`🎉 Bestellung über €${total.toFixed(2)} wird verarbeitet!`);
    cart = []; updateCart(); closeCart();
}

function handleNewsletter(e) {
    e.preventDefault();
    showToast('🎉 Erfolgreich angemeldet! Willkommen bei PS-Design\'s!');
    e.target.reset();
}

function handleContact(e) {
    e.preventDefault();
    showToast('📩 Nachricht erfolgreich gesendet! Wir melden uns innerhalb von 24h.');
    e.target.reset();
}

// ── MOBILE NAV ──
const hamburger = $('#hamburger');
const mobileNav = $('#mobileNav');
let mobileOpen = false;
hamburger.addEventListener('click', () => {
    mobileOpen = !mobileOpen;
    mobileNav.classList.toggle('open', mobileOpen);
    hamburger.querySelectorAll('span').forEach((span, i) => {
        if (mobileOpen) {
            if(i===0) span.style.transform='rotate(45deg) translate(5px, 5px)';
            if(i===1) span.style.opacity='0';
            if(i===2) span.style.transform='rotate(-45deg) translate(5px, -5px)';
        } else { span.style.transform=''; span.style.opacity=''; }
    });
});
function closeMobileNav() {
    mobileOpen=false;
    mobileNav.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(span=>{span.style.transform='';span.style.opacity='';});
}

// ── SMOOTH SCROLL ──
$$('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const t = document.querySelector(this.getAttribute('href'));
    if (t) t.scrollIntoView({behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start'});
}));

// ═══════════════════════════════════════════
// ── 6. EVENT DELEGATION (keine inline onclick) ──
// ═══════════════════════════════════════════

// Filter-Buttons (Slider)
$('#sliderFilterBar').addEventListener('click', function(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    setSliderFilter(btn.dataset.filter, btn);
});

// Filter-Buttons (Products)
$('#productFilterBar').addEventListener('click', function(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    setProductFilter(btn.dataset.filter, btn);
});

// Slider-Nav
sliderPrev.addEventListener('click', () => scrollSlider('left'));
sliderNext.addEventListener('click', () => scrollSlider('right'));

// Product Grid – Event Delegation
$('#productGrid').addEventListener('click', function(e) {
    const wishlistBtn = e.target.closest('[data-action="toggle-wishlist"]');
    if (wishlistBtn) {
        wishlistBtn.classList.toggle('liked');
        wishlistBtn.textContent = wishlistBtn.classList.contains('liked') ? '♥' : '♡';
        return;
    }

    const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
    if (addToCartBtn) {
        const productId = parseInt(addToCartBtn.dataset.productId);
        addToCart(productId, addToCartBtn);
        return;
    }

    const sliderCard = e.target.closest('.slider-card');
    if (sliderCard) {
        const productId = parseInt(sliderCard.dataset.productId);
        addToCart(productId);
    }
});

// Cart
$('#checkoutBtn').addEventListener('click', handleCheckout);

// Admin Lock
$('#adminLockBtn').addEventListener('click', openAdminLogin);

// Admin Login Buttons
$('#adminLoginOverlay .login-confirm').addEventListener('click', tryLogin);
$('#adminLoginOverlay .login-cancel').addEventListener('click', closeAdminLogin);

// Admin Panel Buttons
$('#adminPanel .btn-exit').addEventListener('click', closeAdminPanel);
$('#adminPanel .btn-add').addEventListener('click', () => openProductModal());
$('#adminSearch').addEventListener('input', renderAdminProducts);

// Admin Panel Toolbar
$('#adminPanel').addEventListener('click', function(e) {
    const tagBtn = e.target.closest('.tag-filter button');
    if (tagBtn) {
        currentFilter = tagBtn.textContent.includes('Druckteile') ? 'physical' :
                       tagBtn.textContent.includes('Ideen') ? 'ideas' : 'all';
        $$('.tag-filter button').forEach(b => b.classList.remove('active'));
        tagBtn.classList.add('active');
        renderAdminProducts();
        return;
    }

    const editBtn = e.target.closest('[data-action="edit-product"]');
    if (editBtn) { editProduct(parseInt(editBtn.dataset.productId)); return; }

    const delBtn = e.target.closest('[data-action="delete-product"]');
    if (delBtn) { deleteProduct(parseInt(delBtn.dataset.productId)); return; }

    const exportBtn = e.target.closest('.admin-topbar-actions button');
    if (exportBtn && exportBtn.textContent.includes('Export')) { exportProducts(); return; }
    if (exportBtn && exportBtn.textContent.includes('Import')) { $('#importFile').click(); return; }
    if (exportBtn && exportBtn.textContent.includes('Reset')) { openResetConfirm(); return; }
    if (exportBtn && exportBtn.textContent.includes('Passwort')) { openChangePassword(); return; }
});

// Import File
$('#importFile').addEventListener('change', importProducts);

// Product Modal
$('#productModal .modal-save').addEventListener('click', saveProduct);
$('#productModal .modal-cancel').addEventListener('click', closeProductModal);
$('#imageUploadArea').addEventListener('click', () => $('#imageFileInput').click());
$('#imageFileInput').addEventListener('change', function() { handleFileUpload(this); });
$('#modalImageUrl').addEventListener('input', handleImageUrlInput);
$('#emojiPicker').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-emoji]');
    if (btn) selectEmoji(btn.dataset.emoji, btn);
});
$('#imagePreviewContainer .remove-image-btn').addEventListener('click', removeImage);

// Change Password
$('#changePassModal .pass-save').addEventListener('click', changePassword);
$('#changePassModal .pass-cancel').addEventListener('click', closeChangePassword);

// Reset Confirm
$('#resetConfirmModal .reset-yes').addEventListener('click', resetProducts);
$('#resetConfirmModal .pass-cancel').addEventListener('click', closeResetConfirm);

// Scroll Top
$('#scrollTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
});

// Newsletter Form
$('#newsletterForm').addEventListener('submit', handleNewsletter);

// Contact Form
$('#contactForm').addEventListener('submit', handleContact);

// ═══════════════════════════════════════════
// ── FEATURES & CONTACT INFO (DOM-Building) ──
// ═══════════════════════════════════════════
function renderFeatures() {
    const grid = $('#featuresGrid');
    const features = [
        { icon: '🎨', bg: 'rgba(108,92,231,0.15)', title: 'Einzigartiges Design', desc: 'Jedes Produkt wird mit Liebe zum Detail entwickelt und ist nur bei PS-Design\'s erhältlich.' },
        { icon: '🖨️', bg: 'rgba(0,206,201,0.15)', title: 'Premium Qualität', desc: 'Hochwertige Materialien und präziser Druck für ein perfektes Ergebnis.' },
        { icon: '📦', bg: 'rgba(253,121,168,0.15)', title: 'Versand', desc: 'Innerhalb von 14 Werktagen direkt zu dir nach Hause.' },
        { icon: '🛠️', bg: 'rgba(253,203,110,0.15)', title: 'Individuelle Anpassung', desc: 'Farbe, Größe, Material und Details können auf Wunsch perfekt angepasst werden.' },
        { icon: '💬', bg: 'rgba(85,239,196,0.15)', title: 'Persönlicher Support', desc: 'Direkter Draht zum Erfinder – Fragen, Anpassungen und Beratung inklusive.' }
    ];

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    features.forEach(f => {
        const card = document.createElement('div');
        card.className = 'feature-card';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'feature-icon';
        iconDiv.style.background = f.bg;
        iconDiv.textContent = f.icon;
        card.appendChild(iconDiv);

        const titleEl = document.createElement('h3');
        titleEl.textContent = f.title;
        card.appendChild(titleEl);

        const descEl = document.createElement('p');
        descEl.textContent = f.desc;
        card.appendChild(descEl);

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

function renderContactInfo() {
    const container = $('#contactInfo');
    const items = [
        { icon: '📧', bg: 'rgba(108,92,231,0.15)', title: 'E-Mail', html: '<a href="mailto:hello@ps-designs.de">hello@ps-designs.de</a>' },
        { icon: '💬', bg: 'rgba(0,206,201,0.15)', title: 'Discord', html: '<a href="#">PS-Design\'s Discord Server</a>' },
        { icon: '📱', bg: 'rgba(253,121,168,0.15)', title: 'Social Media', html: '<a href="#">Instagram</a> · <a href="#">TikTok</a> · <a href="#">YouTube</a>' }
    ];

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'contact-info-card';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'contact-info-icon';
        iconDiv.style.background = item.bg;
        iconDiv.textContent = item.icon;
        card.appendChild(iconDiv);

        const info = document.createElement('div');
        info.className = 'contact-info-text';

        const titleEl = document.createElement('h4');
        titleEl.textContent = item.title;
        info.appendChild(titleEl);

        const pEl = document.createElement('p');
        pEl.innerHTML = item.html;
        info.appendChild(pEl);

        card.appendChild(info);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

// ═══════════════════════════════════════════
// ── INITIALISIERUNG ──
// ═══════════════════════════════════════════
updateFilterCounts();
renderProducts();
renderSlider();
renderFeatures();
renderContactInfo();

setTimeout(() => {
    $$('.feature-card').forEach(card => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        observer.observe(card);
    });
}, 100);
