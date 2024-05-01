// employees.js
const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const employeesRouter = express.Router();
const path = require('path');
const {authenticate, isAdmin}=require("./middlewares")
const dbPath = path.join(__dirname, 'database.db');

employeesRouter.post('/', isAdmin, async (req, res) => {
  const { name, age, role } = req.body;
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('INSERT INTO Employees (name, age, role, user_id) VALUES (?, ?, ?, ?)', [name, age, role, req.userId]);
    res.status(201).json({ message: 'Employee created successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

employeesRouter.get('/', async (req, res) => {
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const employees = await db.all('SELECT * FROM Employees');
    res.json(employees);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

employeesRouter.put('/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, age, role } = req.body;
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('UPDATE Employees SET name = ?, age = ?, role = ? WHERE id = ?', [name, age, role, id]);
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

employeesRouter.delete('/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('DELETE FROM Employees WHERE id = ?', [id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = employeesRouter;
