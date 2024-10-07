import { WebSocketServer } from 'ws';
import fs from 'fs';
import https from 'https';
import { pool } from "../db/connect.js";

const serverOptions = {
    cert: fs.readFileSync('./server-cert.pem'),
    key: fs.readFileSync('./server-key.pem')
  };

const httpsServerMobile = https.createServer(serverOptions);
const wss = new WebSocketServer({ server: httpsServerMobile });

const subscriptions = new Map();

wss.on('connection', function connection(ws) {
    console.log('Mobile client connected');

    ws.on('message', async function incoming(message) {
        const data = JSON.parse(message);

        if (data.type === 'mobileConnection') {
            // Subscribe to house updates
            if (!subscriptions.has(data.houseId)) {
                subscriptions.set(data.houseId, new Set());
            }
            subscriptions.get(data.houseId).add(ws);

            // Send initial button states
            const buttons = await getButtonsForHouse(data.houseId);
            ws.send(JSON.stringify({ type: 'mobileConnection', buttons }));
            return;
        }
        if(data.type === 'buttonUpdate') {
            // Update button state
            updateButtonState(data.buttonId, data.newState);
        }
    });

    ws.on('close', () => {
        for (let [houseId, connections] of subscriptions.entries()) {
            connections.delete(ws);
            if (connections.size === 0) {
                subscriptions.delete(houseId);
            }
        }
    });
});

async function getButtonsForHouse(houseId) {
    const [rows] = await pool.query('SELECT * FROM Buttons WHERE HouseId = ? && IsActive = True', [houseId]);
    return rows;
}

async function updateButtonState(buttonId, newState = null, connectionStatus = null) {
    let updateQuery = 'UPDATE Buttons SET ';
    let updateParams = [];
    let updateFields = [];
  
    if (newState !== null) {
      updateFields.push('Status = ?');
      updateParams.push(newState);
    }
  
    if (connectionStatus !== null) {
      updateFields.push('Connected = ?');
      updateParams.push(connectionStatus);
    }
  
    if (updateFields.length === 0) {
      console.log('No updates to perform');
      return;
    }
  
    updateQuery += updateFields.join(', ') + ' WHERE Id = ?';
    updateParams.push(buttonId);
  
    await pool.query(updateQuery, updateParams);
    
    const [button] = await pool.query('SELECT * FROM Buttons WHERE Id = ?', [buttonId]);
    
    if (button.length > 0) {
      const houseId = button[0].HouseId;
      const connections = subscriptions.get(houseId);
      if (connections) {
        const update = JSON.stringify({ 
          type: 'buttonUpdate', 
          button: button[0],
          updateType: newState !== null ? 'status' : 'connection'
        });
        for (let client of connections) {
          client.send(update);
        }
      }
    }
  }
  
  // ... rest of your mobile_socket.js code ...

export function startMobileWebSocketServer() {
    httpsServerMobile.listen(9091, () => {
        console.log('Mobile WebSocket server is listening on port 9091');
    });
}

// Export this function to be used in button_socket.js
export { updateButtonState };