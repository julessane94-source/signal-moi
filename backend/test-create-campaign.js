#!/usr/bin/env node
const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU3NDdlYTFlLWRmZDktNDFjNi04MjNlLTVmMTMzNDBlZDViOSIsInJvbGUiOiJjb2xsYWJvcmF0ZXVyIiwiaWF0IjoxNzgwMDA2MzA1LCJleHAiOjE3ODA2MTExMDV9.TzuAfWErLsIm8tAMg-A0VSf3qEhaEb2UDzcTVh9aQRI';

const campaignData = JSON.stringify({
    titre: 'Test Campaign ' + new Date().toLocaleTimeString(),
    description: 'Test campaign from Node.js',
    type: 'atelier',
    lieu: 'Paris',
    date_debut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    capacite_max: 50
});

const options = {
    hostname: 'signal-moi-api.onrender.com',
    port: 443,
    path: '/api/collaborator/campaigns',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(campaignData),
        'Authorization': `Bearer ${token}`
    },
    timeout: 10000
};

console.log('Creating campaign...');
const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Response:', JSON.stringify(parsed, null, 2));
            process.exit(res.statusCode === 200 || res.statusCode === 201 ? 0 : 1);
        } catch(e) {
            console.log('Response:', data);
            process.exit(1);
        }
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

req.write(campaignData);
req.end();
