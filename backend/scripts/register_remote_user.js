const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const email = `test.socket.${Date.now()}@example.com`;
    const body = {
      prenom: 'Test',
      nom: 'Socket',
      email,
      password: 'Test1234!',
      role: 'citoyen'
    };

    const res = await fetch('https://signal-moi-api.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(json, null, 2));

    if (json && json.token) {
      console.log('TOKEN_OK:' + json.token);
      process.exit(0);
    }
    process.exit(res.ok ? 0 : 2);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(3);
  }
})();
