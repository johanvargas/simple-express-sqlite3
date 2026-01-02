const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
//const jwt = require('jsonwebtoken');
const initDatabase = require('./initDatabase');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, 'bb_game_container.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});
/* GENERAL SERVER FUNCTIONS & CHECKS */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/* CRUD OPERATIONS FOR player_entry TABLE */

// CREATE - Add a new player entry
app.post('/api/players', (req, res) => {
  console.log("hi hello ",  req.body)
  const { player, score, top_ten, place } = req.body;

  // Validate required fields
  if (!player || score === undefined || top_ten === undefined || place === undefined) {
    return res.status(400).json({ error: 'Missing required fields: player, score, top_ten, place' });
  }

  // Validate score range
  if (score < 0 || score > 1000) {
    return res.status(400).json({ error: 'Score must be between 0 and 1000' });
  }

  // Validate top_ten (0 or 1)
  if (top_ten !== 0 && top_ten !== 1) {
    return res.status(400).json({ error: 'top_ten must be 0 or 1' });
  }

  // Validate place range
  if (place < 1 || place > 10) {
    return res.status(400).json({ error: 'Place must be between 1 and 10' });
  }

  const sql = `INSERT INTO player_entry (player, score, top_ten, place) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [player, score, top_ten, place], function(err) {
    if (err) {
      console.error('Error creating player entry:', err.message);
      return res.status(500).json({ error: 'Failed to create player entry' });
    }
    res.status(201).json({
      session_id: this.lastID,
      player,
      score,
      top_ten,
      place
    });
  });
});

// READ - Get all player entries
app.get('/api/players', (req, res) => {
  const sql = `SELECT * FROM player_entry ORDER BY session_id DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching player entries:', err.message);
      return res.status(500).json({ error: 'Failed to fetch player entries' });
    }
    res.json(rows);
  });
});

// READ - Get a specific player entry by session_id
app.get('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM player_entry WHERE session_id = ?`;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching player entry:', err.message);
      return res.status(500).json({ error: 'Failed to fetch player entry' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Player entry not found' });
    }
    res.json(row);
  });
});

// READ - Get top ten players ordered by score
app.get('/api/topten', (req, res) => {
  const sql = `SELECT * FROM player_entry ORDER BY score DESC LIMIT 10`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching top ten players:', err.message);
      return res.status(500).json({ error: 'Failed to fetch top ten players' });
    }
    res.json(rows);
  });
});

// UPDATE - Update a player entry
app.put('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const { player, score, top_ten, place } = req.body;

  // Validate required fields
  if (!player || score === undefined || top_ten === undefined || place === undefined) {
    return res.status(400).json({ error: 'Missing required fields: player, score, top_ten, place' });
  }

  // Validate score range
  if (score < 0 || score > 1000) {
    return res.status(400).json({ error: 'Score must be between 0 and 1000' });
  }

  // Validate top_ten (0 or 1)
  if (top_ten !== 0 && top_ten !== 1) {
    return res.status(400).json({ error: 'top_ten must be 0 or 1' });
  }

  // Validate place range
  if (place < 1 || place > 10) {
    return res.status(400).json({ error: 'Place must be between 1 and 10' });
  }

  const sql = `UPDATE player_entry SET player = ?, score = ?, top_ten = ?, place = ? WHERE session_id = ?`;
  
  db.run(sql, [player, score, top_ten, place, id], function(err) {
    if (err) {
      console.error('Error updating player entry:', err.message);
      return res.status(500).json({ error: 'Failed to update player entry' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Player entry not found' });
    }
    res.json({
      session_id: parseInt(id),
      player,
      score,
      top_ten,
      place
    });
  });
});

// DELETE - Delete a player entry
app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM player_entry WHERE session_id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting player entry:', err.message);
      return res.status(500).json({ error: 'Failed to delete player entry' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Player entry not found' });
    }
    res.json({ message: 'Player entry deleted successfully', session_id: parseInt(id) });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
});

// Start server
app.listen(PORT, () => {
  console.log(`SQLite server running on port ${PORT}`);
  initDatabase(db);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
})

