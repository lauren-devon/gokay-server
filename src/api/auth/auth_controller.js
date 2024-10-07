import { pool } from "../../db/connect.js";
import { createCustomError } from "../../errors/customErrors.js";
import { tryCatchWrapper } from "../../middlewares/tryCatchWrapper.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = tryCatchWrapper(async function (req,res){
    const { name, surname, phone, email, password } = req.body;

    if (!name || !surname || !phone || !email || !password) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if the user already exists
    const [existingUser] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
    if (existingUser.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const [result] = await pool.query(
        'INSERT INTO Users (Name, Surname, Phone, Email, Password) VALUES (?, ?, ?, ?, ?)',
        [name, surname, phone, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
    
 });

    export const login = tryCatchWrapper(async function (req,res){

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
    
        // Check if user exists
        const [user] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
    
        // Compare password
        const isMatch = await bcrypt.compare(password, user[0].Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
    
        // Generate JWT token
        const token = jwt.sign({ id: user[0].Id, email: user[0].Email }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
    
        res.status(200).json({ token });

    });