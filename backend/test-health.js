#!/usr/bin/env node
const http = require('http');
const https = require('https');

const options = {
    hostname: 'signal-moi-api.onrender.com',
    port: 443,
    path: '/api/health',
    method: 'GET',
    timeout: 10000
};

console.log('Testing Render API health endpoint...');
const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
        process.exit(0);
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

req.end();
