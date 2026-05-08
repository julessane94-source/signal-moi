const io = require('socket.io-client');

const TARGET = process.env.SOCKET_URL || 'https://signal-moi-api.onrender.com';
const TOKEN = process.env.TOKEN || '';
const TIMEOUT = parseInt(process.env.SOCKET_TIMEOUT) || 5000;

const variants = [
  { url: TARGET, opts: { auth: { token: TOKEN } } },
  { url: TARGET, opts: { path: '/socket.io', auth: { token: TOKEN } } },
  { url: TARGET.replace(/^https:/, 'wss:'), opts: { transports: ['websocket'], auth: { token: TOKEN } } },
  { url: TARGET.replace(/^https:/, 'wss:'), opts: { path: '/socket.io', transports: ['websocket'], auth: { token: TOKEN } } }
];

async function tryConnect(entry) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = io(entry.url, entry.opts);
    let finished = false;

    const cleanup = (code, msg) => {
      if (finished) return;
      finished = true;
      try { socket.close(); } catch (e) {}
      resolve({ success: code === 0, code, msg, duration: Date.now() - start });
    };

    socket.on('connect', () => cleanup(0, 'connected'));
    socket.on('connect_error', (err) => cleanup(2, 'connect_error: ' + (err && err.message)));
    socket.on('error', (err) => cleanup(3, 'error: ' + err));

    setTimeout(() => cleanup(1, 'timeout'), TIMEOUT);
  });
}

(async () => {
  console.log('Testing socket variants to', TARGET, 'timeout=', TIMEOUT);
  for (const v of variants) {
    console.log('\nAttempt:', JSON.stringify(v));
    // ensure url is string
    try {
      const res = await tryConnect(v);
      console.log('Result:', res);
      if (res.success) {
        console.log('Handshake successful for', JSON.stringify(v));
        process.exit(0);
      }
    } catch (e) {
      console.error('Attempt error', e && e.message);
    }
  }
  console.log('\nAll attempts failed');
  process.exit(1);
})();
