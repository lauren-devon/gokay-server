import express from "express";
import dotenv from "dotenv";
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

//middleware
app.use(express.json());

// api routes
app.use("/api/auth", authRoute);
app.use("/api/house", houseRoute);
app.use("/api/button", buttonRoute);

app.use(notFound);
app.use(handleError);

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});

startButtonWebSocketServer();
startMobileWebSocketServer();
