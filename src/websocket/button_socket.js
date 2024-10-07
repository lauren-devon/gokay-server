import { WebSocketServer } from 'ws';
import https from 'https';
import { pool } from "../db/connect.js";
import { updateButtonState } from '../websocket/mobile_socket.js';
import fs from 'fs';

const serverOptions = {
  cert: fs.readFileSync('./server-cert.pem'),
  key: fs.readFileSync('./server-key.pem')
};

const httpsServerButton = https.createServer(serverOptions);
const wss = new WebSocketServer({ server: httpsServerButton });

const buttonConnections = new Map();

wss.on('connection', async (ws) => {
  console.log('A button device connected.');
  
  let buttonId = null;

  ws.on('message', async (message) => {
    console.log('Received message: %s', message.toString());

    try {
      const data = JSON.parse(message);
      buttonId = data.buttonId;

      // Store the connection
      buttonConnections.set(buttonId, ws);

      // Update button connection status to true
      await updateButtonConnectionStatus(buttonId, true);

      // Handle manual status update
      if (data.type === 'statusUpdate') {
        await handleManualStatusUpdate(buttonId, data.status);
      }

      // Rest of your existing message handling code...

    } catch (error) {
      console.error('Error occurred:', error);
    }
  });

  ws.on('close', async () => {
    if (buttonId) {
      console.log(`Buttons ${buttonId} disconnected`);
      buttonConnections.delete(buttonId);
      
      // Update button connection status to false
      await updateButtonConnectionStatus(buttonId, false);
    }
  });
});

async function updateButtonConnectionStatus(buttonId, isConnected) {
  try {
    await pool.query('UPDATE Buttons SET Connected = ? WHERE Id = ?', [isConnected, buttonId]);
    console.log(`Updated connection status for button ${buttonId} to ${isConnected}`);

    // Notify mobile clients about the connection status change
    await updateButtonState(buttonId, null, isConnected);
  } catch (error) {
    console.error('Error updating button connection status:', error);
  }
}

async function handleManualStatusUpdate(buttonId, newStatus) {
  try {
    await pool.query('UPDATE Buttons SET Status = ? WHERE Id = ?', [newStatus, buttonId]);
    console.log(`Updated status for button ${buttonId} to ${newStatus}`);

    // Notify mobile clients about the status change
    await updateButtonState(buttonId, newStatus);
  } catch (error) {
    console.error('Error updating button status:', error);
  }
}

export function startButtonWebSocketServer() {
  httpsServerButton.listen(8091,() => {
    console.log('Buttons WebSocket server is listening on port 8091');
  });
}