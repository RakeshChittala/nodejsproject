// auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const authRouter = express.Router();

const dbPath = path.join(__dirname, 'database.db');

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const user = await db.get('SELECT * FROM Users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, 'secret');
    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

authRouter.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const existingUser = await db.get('SELECT * FROM Users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = authRouter;
