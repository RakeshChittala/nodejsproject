 // index.js
const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const authRouter = require('./auth');
const employeesRouter = require('./employees');
const { authenticate, isAdmin } = require('./middlewares');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'database.db');

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT
      );

      CREATE TABLE IF NOT EXISTS Employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        role TEXT,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(id)
      );
    `);

    app.listen(3004, () => {
      console.log('Server Running at http://localhost:3004/');
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.use('/auth', authRouter);
app.use('/employees', authenticate, employeesRouter);
