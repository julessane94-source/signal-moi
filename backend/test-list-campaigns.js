#!/usr/bin/env node
const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU3NDdlYTFlLWRmZDktNDFjNi04MjNlLTVmMTMzNDBlZDViOSIsInJvbGUiOiJjb2xsYWJvcmF0ZXVyIiwiaWF0IjoxNzgwMDA2MzA1LCJleHAiOjE3ODA2MTExMDV9.TzuAfWErLsIm8tAMg-A0VSf3qEhaEb2UDzcTVh9aQRI';

const options = {
    hostname: 'signal-moi-api.onrender.com',
    port: 443,
    path: '/api/collaborator/campaigns',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    timeout: 10000
};

console.log('Listing campaigns...');
const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const campaigns = Array.isArray(parsed) ? parsed : (parsed.campaigns || []);
            console.log(`\nFound ${campaigns.length} campaign(s):\n`);
            campaigns.forEach((c, i) => {
                console.log(`${i+1}. ${c.titre}`);
                console.log(`   ID: ${c.id}`);
                console.log(`   Type: ${c.type}`);
                console.log(`   Created: ${c.createdAt || c.created_at}\n`);
            });
            process.exit(res.statusCode === 200 ? 0 : 1);
        } catch(e) {
            console.log('Error parsing response:', e.message);
            console.log('Response:', data);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
});

req.end();
