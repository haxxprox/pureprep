// netlify/functions/products.js
export const handler = async (event, context) => {
  const { httpMethod } = event;

  if (httpMethod === 'GET') {
    const products = [
      { id: 1, name: 'Kopfhörer Pro', price: 129.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
      { id: 2, name: 'Mechanische Tastatur', price: 89.50, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80' },
      { id: 3, name: 'USB-C Hub', price: 45.00, image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&q=80' },
      { id: 4, name: 'Monitor 27"', price: 299.00, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80' }
    ];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(products)
    };
  }

  return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
};
