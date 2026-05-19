async function loadProducts() {
  const container = document.getElementById('product-list');
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    container.innerHTML = products.map(p => `
      <div class="product-card">
        <h3>${p.name}</h3>
        <p class="price">${p.price.toFixed(2)} €</p>
        <button onclick="alert('Detailseite kommt später')">Details</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:#dc3545; text-align:center;">Fehler beim Laden: ${err.message}</p>`;
  }
}
loadProducts();
