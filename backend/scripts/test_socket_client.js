const io = require('socket.io-client');

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';
const TOKEN = process.env.TOKEN || 'LOCAL_TEST_TOKEN';

const socket = io(SOCKET_URL, {
  auth: { token: TOKEN }
});

socket.on('connect', () => {
  console.log('Connected to socket, id=', socket.id);
  socket.disconnect();
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
  process.exit(2);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
