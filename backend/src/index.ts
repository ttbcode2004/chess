import "dotenv/config";
import http from "http";
import app from "./app";
import { WebSocketServer } from 'ws';
import logger from "./config/logger.config";
import connectDatabase from "./config/database.config";
import { setupWebSocket } from "./libs/socket.lib";

async function startServer() {
  try {
    await connectDatabase();

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server, path: "/ws" });

    setupWebSocket(wss);

    const PORT = Number(process.env.PORT) || 3001;

    server.listen(PORT, () => {
      logger.info(`♟  PlayChess API  →  http://localhost:${PORT}`);
      logger.info(`♞  WebSocket      →  ws://localhost:${PORT}/ws\n`);
    });
  } catch (err) {
    logger.error("❌ Failed to start server", err);
    process.exit(1);
  }
}

startServer();

