require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocketIO = require('./sockets/socketHandler');
const notificationService = require('./services/notificationService');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(() => {
  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach socket handlers and inject into notification service
  initSocketIO(io);
  notificationService.setSocketIO(io);

  server.listen(PORT, () => {
    console.log(`[UNFAZED Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[UNFAZED Server] Health endpoint: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('[UNFAZED Server Boot Error]:', err);
  process.exit(1);
});
