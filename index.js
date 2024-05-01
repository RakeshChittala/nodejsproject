 
const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
      console.log('Server Running at http://localhost:3002/');
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
console.log(db)
// User Authentication
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
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

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
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

// Middleware for verifying JWT token
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  });
}

// Middleware for checking admin role
function isAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// CRUD operations for Employees
// Create an employee
app.post('/employees', authenticate, isAdmin, async (req, res) => {
  const { name, age, role } = req.body;
  try {
    await db.run('INSERT INTO Employees (name, age, role, user_id) VALUES (?, ?, ?, ?)', [name, age, role, req.userId]);
    res.status(201).json({ message: 'Employee created successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Read all employees
app.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await db.all('SELECT * FROM Employees');
    res.json(employees);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update an employee
app.put('/employees/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, age, role } = req.body;
  try {
    await db.run('UPDATE Employees SET name = ?, age = ?, role = ? WHERE id = ?', [name, age, role, id]);
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete an employee
app.delete('/employees/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM Employees WHERE id = ?', [id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});





























