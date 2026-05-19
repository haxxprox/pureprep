// netlify/functions/products.js
export const handler = async (event, context) => {
  const { httpMethod } = event;

  if (httpMethod === 'GET') {
    // Mock-Daten (später durch DB/CMS ersetzen)
    const products = [
      { id: 1, name: 'Kopfhörer Pro', price: 129.99, image: '/img/headphones.jpg' },
      { id: 2, name: 'Mechanische Tastatur', price: 89.50, image: '/img/keyboard.jpg' },
      { id: 3, name: 'USB-C Hub', price: 45.00, image: '/img/hub.jpg' },
      { id: 4, name: 'Monitor 27"', price: 299.00, image: '/img/monitor.jpg' }
    ];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(products)
    };
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'text/plain' },
    body: 'Method Not Allowed'
  };
};
