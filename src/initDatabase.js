/**
 * Initialize the database with required tables
 * @param {sqlite3.Database} db - SQLite database instance
 */
function initDatabase(db) {
  // Create player_entry table
  db.run(`
    CREATE TABLE IF NOT EXISTS player_entry (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player TEXT NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 0 AND score <= 1000),
      top_ten INTEGER NOT NULL CHECK(top_ten IN (0, 1)),
      place INTEGER NOT NULL CHECK(place >= 1 AND place <= 10)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating player_entry table:', err.message);
    } else {
      console.log('player_entry table initialized successfully');
    }
  });
}

module.exports = initDatabase;
