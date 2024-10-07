import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import { notFound } from "./src/middlewares/notFound.js";
import { handleError } from "./src/middlewares/handleError.js";
import authRoute from "./src/api/auth/auth_route.js";
import houseRoute from "./src/api/house/house_route.js";
import buttonRoute from "./src/api/button/button_route.js";

import { startButtonWebSocketServer } from "./src/websocket/button_socket.js";
import { startMobileWebSocketServer } from "./src/websocket/mobile_socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const serverOptions = {
  cert: fs.readFileSync('server-cert.pem'),
  key: fs.readFileSync('server-key.pem')
};

//middleware
app.use(express.json());

// api routes
app.use("/api/auth", authRoute);
app.use("/api/house", houseRoute);
app.use("/api/button", buttonRoute);

app.use(notFound);
app.use(handleError);

app.use((err, req, res, next) => {
  console.error('Error occurred:', err.message);
  console.error(err.stack); // Log stack trace
  res.status(err.status || 500).json({
    error: {
      message: err.message,
    },
  });
});

// Create HTTPS server
const httpsServer = https.createServer(serverOptions, app);

// Start the server
httpsServer.listen(port, () => {
  console.log(`HTTPS server running on port ${port}`);
});

startButtonWebSocketServer();
startMobileWebSocketServer();
