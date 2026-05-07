const http = require('http');

const data = JSON.stringify({
  titre: 'Test accent éè',
  description: 'Un signal avec accents: é à ê',
  type: 'autre',
  localisation: 'Saint-Étienne'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/signalements',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      console.log('Status:', res.statusCode);
      console.log('Response:', JSON.parse(body));
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(data);
req.end();
