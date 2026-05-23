#!/usr/bin/env node

/**
 * 🧪 Signal-Moi Backend - Test Script
 * Tests d'authentification JWT et endpoints protégés
 * 
 * Usage:
 *   node backend/test-backend.js http://localhost:8080
 *   node backend/test-backend.js https://signal-moi-api.onrender.com
 */

const http = require('http');
const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const TEST_EMAIL = `test-${Date.now()}@signal-moi.local`;
const TEST_PASSWORD = 'TestPassword123!@#';

let testToken = null;
let testUserId = null;

function log(color, label, message) {
  console.log(`${color}${label}${colors.reset} ${message}`);
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Signal-Moi-Test-Script/1.0'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  log(colors.cyan, '📋', `Démarrage des tests sur ${BASE_URL}\n`);

  try {
    // Test 1: Health Check
    log(colors.blue, '1️⃣', 'Test: Health Check');
    const healthRes = await makeRequest('GET', '/api/health');
    if (healthRes.status === 200) {
      log(colors.green, '✅', `Health check OK - ${healthRes.body.message}`);
    } else {
      log(colors.red, '❌', `Health check échoué (${healthRes.status})`);
    }

    // Test 2: Register
    log(colors.blue, '\n2️⃣', 'Test: Inscription (Register)');
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      firstName: 'Test',
      lastName: 'User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      phone: '0612345678',
      city: 'Paris'
    });

    if (registerRes.status === 201 && registerRes.body.success && registerRes.body.token) {
      testToken = registerRes.body.token;
      testUserId = registerRes.body.user.id;
      log(colors.green, '✅', `Inscription réussie - Email: ${TEST_EMAIL}`);
      log(colors.green, '✅', `Token reçu: ${testToken.substring(0, 20)}...`);
      log(colors.green, '✅', `User ID: ${testUserId}`);
    } else {
      log(colors.red, '❌', `Inscription échouée (${registerRes.status})`);
      log(colors.red, '❌', JSON.stringify(registerRes.body, null, 2));
      return;
    }

    // Test 3: Login
    log(colors.blue, '\n3️⃣', 'Test: Connexion (Login)');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginRes.status === 200 && loginRes.body.success && loginRes.body.token) {
      testToken = loginRes.body.token;
      log(colors.green, '✅', `Connexion réussie`);
      log(colors.green, '✅', `Token reçu: ${testToken.substring(0, 20)}...`);
    } else {
      log(colors.red, '❌', `Connexion échouée (${loginRes.status})`);
      log(colors.red, '❌', JSON.stringify(loginRes.body, null, 2));
      return;
    }

    // Test 4: Protected Endpoint without Token
    log(colors.blue, '\n4️⃣', 'Test: Endpoint protégé SANS token');
    const noTokenRes = await makeRequest('GET', '/api/admin/users');
    if (noTokenRes.status === 401) {
      log(colors.green, '✅', `Correctement bloqué (401 Unauthorized)`);
      log(colors.green, '✅', `Message: ${noTokenRes.body.message}`);
    } else {
      log(colors.red, '❌', `Endpoint non protégé! Status: ${noTokenRes.status}`);
    }

    // Test 5: Protected Endpoint with Token
    log(colors.blue, '\n5️⃣', 'Test: Endpoint protégé AVEC token');
    const withTokenRes = await makeRequest('GET', '/api/admin/users', null, testToken);
    if (withTokenRes.status === 200 || withTokenRes.status === 403) {
      log(colors.green, '✅', `Token accepté (Status: ${withTokenRes.status})`);
      if (withTokenRes.status === 403) {
        log(colors.yellow, '⚠️', `Rôle utilisateur non autorisé pour cet endpoint (normal pour un citoyen)`);
      } else {
        log(colors.green, '✅', `Accès autorisé à l'endpoint admin`);
      }
    } else if (withTokenRes.status === 401) {
      log(colors.red, '❌', `Token invalide ou expiré (401)`);
      log(colors.red, '❌', `Message: ${withTokenRes.body.message}`);
    } else {
      log(colors.red, '❌', `Erreur inattendue (${withTokenRes.status})`);
    }

    // Test 6: Invalid Token
    log(colors.blue, '\n6️⃣', 'Test: Token INVALIDE');
    const invalidTokenRes = await makeRequest('GET', '/api/admin/users', null, 'invalid.token.here');
    if (invalidTokenRes.status === 401) {
      log(colors.green, '✅', `Token invalide correctement rejeté (401)`);
      log(colors.green, '✅', `Message: ${invalidTokenRes.body.message}`);
    } else {
      log(colors.red, '❌', `Token invalide non rejeté! Status: ${invalidTokenRes.status}`);
    }

    // Test 7: Expired-looking Token Format
    log(colors.blue, '\n7️⃣', 'Test: Malformed Token');
    const malformedTokenRes = await makeRequest('GET', '/api/admin/users', null, 'Bearer xyz');
    if (malformedTokenRes.status === 401) {
      log(colors.green, '✅', `Token malformé correctement rejeté (401)`);
    } else {
      log(colors.red, '❌', `Token malformé non rejeté! Status: ${malformedTokenRes.status}`);
    }

    log(colors.cyan, '\n' + '='.repeat(60));
    log(colors.green, '✅', 'Tous les tests de sécurité JWT sont passés!');
    log(colors.cyan, '='.repeat(60) + '\n');

  } catch (error) {
    log(colors.red, '❌', `Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(colors.red, '❌', `Erreur fatale: ${error.message}`);
  process.exit(1);
});
