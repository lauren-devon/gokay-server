import { pool } from "../../db/connect.js";
import { createCustomError } from "../../errors/customErrors.js";
import { tryCatchWrapper } from "../../middlewares/tryCatchWrapper.js";



export const getHouses = tryCatchWrapper(async function (req, res) {
    const ownerId = req.user.id;

    const [houses] = await pool.query('SELECT * FROM Houses WHERE OwnerId = ? AND IsActive = ?', [ownerId, true]);

    res.status(200).json(houses);
    });

export const addHouse = tryCatchWrapper(async function (req, res) {
    const { name } = req.body;
    const ownerId = req.user.id; // Extracted from JWT token

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    const [result] = await pool.query(
        'INSERT INTO Houses (Name, OwnerId) VALUES (?, ?)',
        [name, ownerId]
    );

    res.status(201).json({ message: 'House added successfully', houseId: result.insertId });
});

export const deleteHouse = tryCatchWrapper(async function (req, res) {
    const { id } = req.params;
    const ownerId = req.user.id;

    // Check if the house belongs to the user
    const [house] = await pool.query('SELECT * FROM Houses WHERE Id = ? AND OwnerId = ?', [id, ownerId]);
    if (house.length === 0) {
        return res.status(404).json({ message: 'House not found or not owned by user' });
    }

    // Mark the house as inactive (soft delete)
    await pool.query('UPDATE Houses SET IsActive = ? WHERE Id = ?', [false, id]);

    res.status(200).json({ message: 'House marked as inactive' });
});

export const updateHouse = tryCatchWrapper(async function (req, res) {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const ownerId = req.user.id;

    // Check if the house belongs to the user
    const [house] = await pool.query('SELECT * FROM Houses WHERE Id = ? AND OwnerId = ?', [id, ownerId]);
    if (house.length === 0) {
        return res.status(404).json({ message: 'House not found or not owned by user' });
    }

    await pool.query('UPDATE Houses SET Name = ?, IsActive = ? WHERE Id = ?', [name || house[0].Name, isActive !== undefined ? isActive : house[0].IsActive, id]);

    res.status(200).json({ message: 'House updated successfully' });
});