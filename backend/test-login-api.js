#!/usr/bin/env node
const https = require('https');

const loginData = JSON.stringify({
    email: 'collab@test.com',
    password: 'Collab@1234!'
});

const options = {
    hostname: 'signal-moi-api.onrender.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    },
    timeout: 10000
};

console.log('Testing login with collab@test.com...');
const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
        process.exit(res.statusCode === 200 ? 0 : 1);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
});

req.on('timeout', () => {
    console.error('Request timeout');
    req.destroy();
    process.exit(1);
});

req.write(loginData);
req.end();
