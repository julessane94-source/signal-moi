#!/usr/bin/env node

/**
 * Script de validation du déploiement Signal-Moi
 * Vérifie:
 * - Configuration du port
 * - Variables d'environnement
 * - Logique d'authentification JWT
 * - Endpoints publics vs protégés
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Couleurs console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
};

let testsPass = true;

// Test 1: Vérifier render.yaml
log.header('TEST 1: Configuration render.yaml');
try {
    const renderConfig = yaml.load(fs.readFileSync('render.yaml', 'utf8'));
    const service = renderConfig.services[0];
    
    if (!service) {
        log.error('Aucun service trouvé dans render.yaml');
        testsPass = false;
    } else {
        // Vérifier le PORT
        const portVar = service.envVars.find(v => v.key === 'PORT');
        if (!portVar) {
            log.error('PORT non défini dans render.yaml');
            testsPass = false;
        } else if (portVar.value !== '3000') {
            log.error(`PORT n'est pas 3000 (actuellement: ${portVar.value})`);
            testsPass = false;
        } else {
            log.success(`PORT correctement configuré: ${portVar.value}`);
        }
        
        // Vérifier JWT_SECRET
        const jwtVar = service.envVars.find(v => v.key === 'JWT_SECRET');
        if (!jwtVar) {
            log.error('JWT_SECRET manquant');
            testsPass = false;
        } else if (jwtVar.value === 'REPLACE_ME') {
            log.warn('JWT_SECRET non configuré (placeholder)');
        } else {
            log.success('JWT_SECRET configuré');
        }
        
        // Vérifier JWT_REFRESH_SECRET
        const refreshVar = service.envVars.find(v => v.key === 'JWT_REFRESH_SECRET');
        if (!refreshVar) {
            log.error('JWT_REFRESH_SECRET manquant');
            testsPass = false;
        } else if (refreshVar.value === 'REPLACE_ME_REFRESH') {
            log.warn('JWT_REFRESH_SECRET non configuré (placeholder)');
        } else {
            log.success('JWT_REFRESH_SECRET configuré');
        }
        
        // Vérifier FRONTEND_URL
        const frontendVar = service.envVars.find(v => v.key === 'FRONTEND_URL');
        if (!frontendVar || frontendVar.value.includes('your-frontend')) {
            log.warn('FRONTEND_URL non configurée (placeholder)');
        } else {
            log.success(`FRONTEND_URL configurée: ${frontendVar.value}`);
        }
    }
} catch (err) {
    log.error(`Impossible de parser render.yaml: ${err.message}`);
    testsPass = false;
}

// Test 2: Vérifier server.js
log.header('TEST 2: Configuration server.js');
try {
    const serverCode = fs.readFileSync('backend/src/server.js', 'utf8');
    
    // Vérifier le middleware de logging
    if (serverCode.includes('Authorization=')) {
        log.success('Middleware de logging Authorization présent');
    } else {
        log.error('Middleware de logging Authorization manquant');
        testsPass = false;
    }
    
    // Vérifier binding 0.0.0.0
    if (serverCode.includes("'0.0.0.0'") || serverCode.includes('listen(PORT')) {
        log.success('Server bind sur 0.0.0.0 (ou ALL interfaces)');
    } else {
        log.warn('Vérifier que le serveur est bindé sur 0.0.0.0');
    }
    
    // Vérifier endpoints publics
    if (serverCode.includes("app.get('/'") && serverCode.includes("app.head('/'")) {
        log.success('Endpoints publics (GET /, HEAD /) présents');
    } else {
        log.error('Endpoints publics manquants');
        testsPass = false;
    }
    
    // Vérifier /api/health
    if (serverCode.includes('/api/health')) {
        log.success('Endpoint /api/health présent');
    } else {
        log.error('/api/health manquant');
        testsPass = false;
    }
} catch (err) {
    log.error(`Impossible de lire server.js: ${err.message}`);
    testsPass = false;
}

// Test 3: Vérifier auth middleware
log.header('TEST 3: Middleware d\'authentification');
try {
    const authCode = fs.readFileSync('backend/src/middlewares/auth.js', 'utf8');
    
    // Vérifier la validation du header
    if (authCode.includes('req.header(\'Authorization\')') || authCode.includes("req.header('Authorization')")) {
        log.success('Validation du header Authorization présente');
    } else {
        log.error('Validation du header Authorization manquante');
        testsPass = false;
    }
    
    // Vérifier les codes d'erreur
    const errorCodes = ['MISSING_AUTH_HEADER', 'INVALID_TOKEN_FORMAT', 'TOKEN_EXPIRED', 'INVALID_TOKEN'];
    const missingCodes = errorCodes.filter(code => !authCode.includes(code));
    if (missingCodes.length === 0) {
        log.success('Tous les codes d\'erreur JWT présents');
    } else {
        log.warn(`Codes d'erreur manquants: ${missingCodes.join(', ')}`);
    }
    
    // Vérifier la gestion des tokens expirés
    if (authCode.includes('TokenExpiredError') && authCode.includes('JsonWebTokenError')) {
        log.success('Gestion des erreurs JWT détaillées présente');
    } else {
        log.error('Gestion des erreurs JWT incomplète');
        testsPass = false;
    }
} catch (err) {
    log.error(`Impossible de lire auth.js: ${err.message}`);
    testsPass = false;
}

// Test 4: Vérifier package.json
log.header('TEST 4: Dépendances essentielles');
try {
    const pkgJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    
    const required = ['express', 'jsonwebtoken', 'bcrypt', 'dotenv', 'cors'];
    const missing = required.filter(pkg => !pkgJson.dependencies[pkg]);
    
    if (missing.length === 0) {
        log.success(`Toutes les dépendances essentielles présentes`);
    } else {
        log.error(`Dépendances manquantes: ${missing.join(', ')}`);
        testsPass = false;
    }
    
    // Vérifier le script start
    if (pkgJson.scripts && pkgJson.scripts.start) {
        log.success(`Script start configuré: ${pkgJson.scripts.start}`);
    } else {
        log.warn('Script start non configuré');
    }
} catch (err) {
    log.error(`Impossible de lire package.json: ${err.message}`);
    testsPass = false;
}

// Test 5: Vérifier Dockerfile
log.header('TEST 5: Configuration Docker');
try {
    const dockerfile = fs.readFileSync('backend/Dockerfile', 'utf8');
    
    if (dockerfile.includes('EXPOSE 3000')) {
        log.success('Dockerfile expose le port 3000');
    } else if (dockerfile.includes('EXPOSE')) {
        const match = dockerfile.match(/EXPOSE\s+(\d+)/);
        const port = match ? match[1] : 'unknown';
        log.warn(`Dockerfile expose le port ${port} (non 3000)`);
    } else {
        log.error('Dockerfile n\'expose pas de port');
        testsPass = false;
    }
    
    if (dockerfile.includes('npm start') || dockerfile.includes('node')) {
        log.success('Dockerfile contient une commande start valide');
    } else {
        log.error('Dockerfile manque de commande start');
        testsPass = false;
    }
} catch (err) {
    log.error(`Impossible de lire Dockerfile: ${err.message}`);
    testsPass = false;
}

// Résumé
log.header('RÉSUMÉ');
if (testsPass) {
    log.success('✅ Toutes les vérifications sont passées!');
    console.log('\nLe serveur est prêt pour le déploiement sur Render.');
    console.log('Prochaines étapes:');
    console.log('  1. git add . && git commit -m "fix: corrections déploiement"');
    console.log('  2. git push origin master');
    console.log('  3. Redéployer sur Render');
    process.exit(0);
} else {
    log.error('❌ Certaines vérifications ont échoué.');
    console.log('\nCorrigez les erreurs ci-dessus avant de déployer.');
    process.exit(1);
}
