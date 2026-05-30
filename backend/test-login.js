const axios = require('axios');

const API_URL = 'https://signal-moi-api.onrender.com';
const EMAIL = 'collab@test.com';
const PASSWORD = 'Collab@1234!';

async function test() {
    try {
        console.log('Testing login...');
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        }, {
            timeout: 10000,
            validateStatus: () => true
        });
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
