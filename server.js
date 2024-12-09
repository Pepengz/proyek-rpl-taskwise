const express = require('express');
const path = require('path');
const app = express();
const pool = require('./config/database');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Todo routes
app.get('/api/todos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM todos ORDER BY date ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/todos', async (req, res) => {
    const { text, date } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO todos (text, date, completed) VALUES (?, ?, ?)',
            [text, date, false]
        );
        const [newTodo] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        res.json(newTodo[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    try {
        await pool.query('UPDATE todos SET completed = ? WHERE id = ?', [completed, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM todos WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/todos/:id/reminder', async (req, res) => {
    const { id } = req.params;
    const { reminderTime } = req.body;
    try {
        await pool.query(
            'UPDATE todos SET reminder_time = ?, reminder_set = true WHERE id = ?',
            [reminderTime, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/todos/:id/reminder', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'UPDATE todos SET reminder_time = NULL, reminder_set = false WHERE id = ?',
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 4000;  // Changed from 3000 to 4000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});