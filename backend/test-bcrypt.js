const bcrypt = require('bcrypt');

const password = 'Collab@1234!';
const hash = '$2b$10$3zQsj6ZeovRxTjSHgfYXAO32dp5fQ1QatMYLn0ZTGqtf96eWe1arW';

bcrypt.compare(password, hash, (err, result) => {
    if(err) {
        console.error('Error:', err.message);
    } else {
        console.log('Password matches:', result);
        if(result) {
            console.log('✅ Password hash is valid!');
        } else {
            console.log('❌ Password does not match');
        }
    }
    process.exit(result ? 0 : 1);
});
