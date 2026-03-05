const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'choresuser',
  password: process.env.DB_PASSWORD || 'chorespass',
  database: process.env.DB_NAME || 'choresapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Trust Traefik as the first proxy so secure cookies work behind HTTPS termination
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'chores-super-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: 'auto', // secure when X-Forwarded-Proto is https, plain http otherwise
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// Helper: get today's date string
const today = () => new Date().toISOString().split('T')[0];

// Helper: check if chore is due today
function isChoreActiveToday(chore) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...

  if (chore.frequency === 'daily') return true;
  if (chore.frequency === 'school_days') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (chore.frequency === 'weekend') return dayOfWeek === 0 || dayOfWeek === 6;
  if (chore.frequency === 'specific_days') {
    const days = typeof chore.days_of_week === 'string'
      ? JSON.parse(chore.days_of_week)
      : chore.days_of_week;
    return days && days.includes(dayOfWeek);
  }
  if (chore.frequency === 'monthly') {
    return now.getDate() === 1;
  }
  return false;
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [req.session.userId]);
    if (!rows.length) return res.status(401).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', requireAuth, async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
      [username, hash, email, 'parent']
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/auth/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.session.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CHILDREN ROUTES ====================

app.get('/api/children', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM children WHERE parent_id = ? ORDER BY name',
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public endpoint for children dashboard (no auth required for viewing)
app.get('/api/children/public', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, avatar, color, total_points, available_points FROM children ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/children', requireAuth, async (req, res) => {
  const { name, avatar, color } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO children (parent_id, name, avatar, color) VALUES (?, ?, ?, ?)',
      [req.session.userId, name, avatar || 'star', color || '#FF6B6B']
    );
    res.json({ id: result.insertId, name, avatar, color, total_points: 0, available_points: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/children/:id', requireAuth, async (req, res) => {
  const { name, avatar, color } = req.body;
  try {
    await pool.query(
      'UPDATE children SET name = ?, avatar = ?, color = ? WHERE id = ? AND parent_id = ?',
      [name, avatar, color, req.params.id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/children/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM children WHERE id = ? AND parent_id = ?',
      [req.params.id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CHORES ROUTES ====================

app.get('/api/chores', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, ch.name as child_name FROM chores c 
       LEFT JOIN children ch ON c.child_id = ch.id
       WHERE c.parent_id = ? AND c.active = TRUE
       ORDER BY c.title`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/chores/today/:childId', async (req, res) => {
  const { childId } = req.params;
  const todayDate = today();
  
  try {
    // Get chores for this child (child-specific or unassigned = all children)
    const [chores] = await pool.query(
      `SELECT c.*, 
        CASE WHEN cc.id IS NOT NULL THEN TRUE ELSE FALSE END as completed
       FROM chores c
       LEFT JOIN chore_completions cc ON cc.chore_id = c.id 
         AND cc.child_id = ? AND cc.completed_date = ?
       LEFT JOIN children ch ON c.child_id = ch.id
       WHERE c.active = TRUE 
         AND (c.child_id = ? OR c.child_id IS NULL)
       ORDER BY completed, c.title`,
      [childId, todayDate, childId]
    );
    
    // Filter by today's schedule
    const filtered = chores.filter(c => isChoreActiveToday(c));
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/chores', requireAuth, async (req, res) => {
  const { title, description, points, frequency, days_of_week, child_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO chores (parent_id, child_id, title, description, points, frequency, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.session.userId, child_id || null, title, description, points || 10, frequency || 'daily', 
       days_of_week ? JSON.stringify(days_of_week) : null]
    );
    res.json({ id: result.insertId, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/chores/:id', requireAuth, async (req, res) => {
  const { title, description, points, frequency, days_of_week, child_id, active } = req.body;
  try {
    await pool.query(
      'UPDATE chores SET title=?, description=?, points=?, frequency=?, days_of_week=?, child_id=?, active=? WHERE id=? AND parent_id=?',
      [title, description, points, frequency, 
       days_of_week ? JSON.stringify(days_of_week) : null,
       child_id || null, active !== undefined ? active : true,
       req.params.id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/chores/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE chores SET active = FALSE WHERE id = ? AND parent_id = ?',
      [req.params.id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete a chore
app.post('/api/chores/:id/complete', async (req, res) => {
  const { child_id } = req.body;
  const todayDate = today();
  
  try {
    // Get chore points
    const [chores] = await pool.query('SELECT * FROM chores WHERE id = ?', [req.params.id]);
    if (!chores.length) return res.status(404).json({ error: 'Chore not found' });
    
    const chore = chores[0];
    
    // Record completion
    await pool.query(
      'INSERT INTO chore_completions (chore_id, child_id, completed_date, points_earned) VALUES (?, ?, ?, ?)',
      [req.params.id, child_id, todayDate, chore.points]
    );
    
    // Update child points
    await pool.query(
      'UPDATE children SET total_points = total_points + ?, available_points = available_points + ? WHERE id = ?',
      [chore.points, chore.points, child_id]
    );
    
    const [updated] = await pool.query('SELECT total_points, available_points FROM children WHERE id = ?', [child_id]);
    res.json({ success: true, points_earned: chore.points, child: updated[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Already completed today' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Uncomplete a chore
app.delete('/api/chores/:id/complete', async (req, res) => {
  const { child_id } = req.body;
  const todayDate = today();
  
  try {
    const [chores] = await pool.query('SELECT * FROM chores WHERE id = ?', [req.params.id]);
    if (!chores.length) return res.status(404).json({ error: 'Chore not found' });
    
    const [completions] = await pool.query(
      'SELECT * FROM chore_completions WHERE chore_id = ? AND child_id = ? AND completed_date = ?',
      [req.params.id, child_id, todayDate]
    );
    
    if (!completions.length) return res.status(404).json({ error: 'Completion not found' });
    
    await pool.query(
      'DELETE FROM chore_completions WHERE chore_id = ? AND child_id = ? AND completed_date = ?',
      [req.params.id, child_id, todayDate]
    );
    
    await pool.query(
      'UPDATE children SET total_points = total_points - ?, available_points = available_points - ? WHERE id = ? AND available_points >= ?',
      [completions[0].points_earned, completions[0].points_earned, child_id, completions[0].points_earned]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== REWARDS ROUTES ====================

app.get('/api/rewards', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, c.name as child_name FROM rewards r
       JOIN children c ON r.child_id = c.id
       WHERE c.parent_id = ?
       ORDER BY r.nominated_at DESC`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/rewards/child/:childId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM rewards WHERE child_id = ? ORDER BY nominated_at DESC',
      [req.params.childId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Child nominates a reward
app.post('/api/rewards', async (req, res) => {
  const { child_id, title, description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO rewards (child_id, title, description, status) VALUES (?, ?, ?, ?)',
      [child_id, title, description, 'pending']
    );
    res.json({ id: result.insertId, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Parent approves/rejects reward and sets cost
app.put('/api/rewards/:id', requireAuth, async (req, res) => {
  const { status, points_cost, special_day, target_date } = req.body;
  try {
    await pool.query(
      'UPDATE rewards SET status = ?, points_cost = ?, special_day = ?, target_date = ?, approved_at = ? WHERE id = ?',
      [
        status,
        points_cost || 50,
        special_day || null,
        target_date || null,
        status === 'approved' ? new Date() : null,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redeem a reward
app.post('/api/rewards/:id/redeem', async (req, res) => {
  const { child_id } = req.body;
  try {
    const [rewards] = await pool.query('SELECT * FROM rewards WHERE id = ? AND child_id = ?', [req.params.id, child_id]);
    if (!rewards.length) return res.status(404).json({ error: 'Reward not found' });
    
    const reward = rewards[0];
    if (reward.status !== 'approved') return res.status(400).json({ error: 'Reward not approved yet' });
    
    // Check if child has enough points
    const [children] = await pool.query('SELECT available_points FROM children WHERE id = ?', [child_id]);
    if (!children.length) return res.status(404).json({ error: 'Child not found' });
    
    if (children[0].available_points < reward.points_cost) {
      return res.status(400).json({ error: 'Not enough points' });
    }
    
    // Deduct points and mark redeemed
    await pool.query(
      'UPDATE children SET available_points = available_points - ? WHERE id = ?',
      [reward.points_cost, child_id]
    );
    await pool.query(
      'UPDATE rewards SET status = ?, redeemed_at = ? WHERE id = ?',
      ['redeemed', new Date(), req.params.id]
    );
    
    const [updated] = await pool.query('SELECT available_points FROM children WHERE id = ?', [child_id]);
    res.json({ success: true, remaining_points: updated[0].available_points });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/rewards/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM rewards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== STATS ROUTES ====================

app.get('/api/stats/child/:childId', async (req, res) => {
  const { childId } = req.params;
  try {
    const [completions] = await pool.query(
      `SELECT DATE(completed_date) as date, SUM(points_earned) as points, COUNT(*) as chores
       FROM chore_completions WHERE child_id = ? 
       AND completed_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(completed_date) ORDER BY date DESC`,
      [childId]
    );
    
    const [totals] = await pool.query(
      'SELECT total_points, available_points FROM children WHERE id = ?',
      [childId]
    );
    
    res.json({ history: completions, totals: totals[0] || {} });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Start server
app.listen(PORT, () => {
  console.log(`Chores App backend running on port ${PORT}`);
});
