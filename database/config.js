// Configuration de la base de données pour Node.js
require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'signal_app',
        password: process.env.DB_PASSWORD || 'Signal2024Secure!',
        database: process.env.DB_NAME || 'signal_moi_db',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    test: {
        username: process.env.TEST_DB_USER || 'signal_app',
        password: process.env.TEST_DB_PASSWORD || 'Signal2024Secure!',
        database: process.env.TEST_DB_NAME || 'signal_moi_db_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    },
    production: {
        username: process.env.PROD_DB_USER,
        password: process.env.PROD_DB_PASSWORD,
        database: process.env.PROD_DB_NAME,
        host: process.env.PROD_DB_HOST,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 60000,
            idle: 10000
        }
    }
};
