require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`API server ready at http://${HOST}:${PORT}`);
});
