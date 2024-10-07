import { pool } from "../../db/connect.js";
import { createCustomError } from "../../errors/customErrors.js";
import { tryCatchWrapper } from "../../middlewares/tryCatchWrapper.js";



export const getButtons = tryCatchWrapper(async function (req, res) {
    const ownerId = req.user.id;  // Get the user ID from the token
    const houseId = req.params.houseId;  // Get 
            // Query to fetch active buttons for the specific house and owner
    console.log(ownerId, houseId); 
   const [buttons] = await pool.query(`
        SELECT B.* FROM Buttons B
        INNER JOIN Houses H ON B.HouseId = H.Id
        WHERE H.OwnerId = ? AND B.HouseId = ? AND B.IsActive = ?`,
        [ownerId, houseId, true]
    );
    
    // Send the retrieved buttons back in the response
    res.status(200).json(buttons);
    });

export const addButton = tryCatchWrapper(async function (req, res) {
    const { name, houseId, status, connected } = req.body;
    const ownerId = req.user.id;

    // Check if the house belongs to the user
    const [house] = await pool.query('SELECT * FROM Houses WHERE Id = ? AND OwnerId = ? AND IsActive = ?', [houseId, ownerId, true]);
    if (house.length === 0) {
        return res.status(404).json({ message: 'House not found or not owned by user' });
    }

    const [result] = await pool.query(
        'INSERT INTO Buttons (Name, HouseId, Status, Connected) VALUES (?, ?, ?, ?)',
        [name, houseId, status || 'off', connected || false]
    );

    res.status(201).json({ message: 'Button added successfully', buttonId: result.insertId });

});

export const deleteButton = tryCatchWrapper(async function (req, res) {
    const { id } = req.params;
    const ownerId = req.user.id;

    // Check if the button belongs to a house owned by the user
    const [button] = await pool.query(`
        SELECT B.* FROM Buttons B
        INNER JOIN Houses H ON B.HouseId = H.Id
        WHERE B.Id = ? AND H.OwnerId = ? AND B.IsActive = ?`,
        [id, ownerId, true]
    );

    if (button.length === 0) {
        return res.status(404).json({ message: 'Button not found or not owned by user' });
    }

    await pool.query('UPDATE Buttons SET IsActive = ? WHERE Id = ?', [false, id]);

    res.status(200).json({ message: 'Button marked as inactive' });
});

export const updateButton = tryCatchWrapper(async function (req, res) {
    const { id } = req.params;
    const { name, status, connected } = req.body;
    const ownerId = req.user.id;

    // Check if the button belongs to a house owned by the user
    const [button] = await pool.query(`
        SELECT B.* FROM Buttons B
        INNER JOIN Houses H ON B.HouseId = H.Id
        WHERE B.Id = ? AND H.OwnerId = ? AND B.IsActive = ?`,
        [id, ownerId, true]
    );

    if (button.length === 0) {
        return res.status(404).json({ message: 'Button not found or not owned by user' });
    }

    await pool.query('UPDATE Buttons SET Name = ?, Status = ?, Connected = ? WHERE Id = ?', 
        [name || button[0].Name, status || button[0].Status, connected !== undefined ? connected : button[0].Connected, id]);

    res.status(200).json({ message: 'Button updated successfully' });
});