const { User } = require('../src/models');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const user = await User.findOne();
    if (!user) {
      console.error('No user found in database');
      process.exit(2);
    }

    const secret = process.env.JWT_SECRET || 'signal-moi-secret-key';
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });

    console.log(JSON.stringify({ id: user.id, email: user.email, token }));
    process.exit(0);
  } catch (err) {
    console.error('Error generating token:', err.message);
    process.exit(3);
  }
})();
