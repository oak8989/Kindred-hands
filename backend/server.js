import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Database
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'kindredhands',
  user: process.env.DB_USER || 'kindredhands',
  password: process.env.DB_PASSWORD || 'change-me-in-production',
  max: 20,
  idleTimeoutMillis: 30000,
});

// Email transporter
let transporter;
if (process.env.EMAIL_MODE === 'smtp') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_ENCRYPTION === 'tls',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const sendEmail = async (to, subject, body) => {
  const mode = process.env.EMAIL_MODE || 'console';
  
  if (mode === 'console') {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
  } else if (mode === 'smtp' && transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_ADDRESS || 'noreply@example.com',
      to,
      subject,
      text: body,
    });
  }
  
  await pool.query(
    'INSERT INTO email_logs (id, recipient, subject, body, status, sent_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [uuidv4(), to, subject, body, 'sent', new Date()]
  );
};

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production');
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid token.' });
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (existing.rows.length > 0) {
      await sendEmail(email, 'Account Request', 'An account with this email already exists.');
      return res.json({ success: true, message: 'If this email is not registered, you will receive instructions.' });
    }

    const tempPassword = uuidv4().substring(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    await pool.query(
      'INSERT INTO users (id, email, name, role, password_hash, must_reset_password, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), email.toLowerCase(), name, 'member', passwordHash, true, new Date()]
    );

    await sendEmail(email, 'Welcome to Kindred Hands', `Your temporary password is: ${tempPassword}\nPlease change it on first login.`);
    
    res.json({ success: true, message: 'If this email is not registered, you will receive instructions.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'If an account exists, you will receive instructions.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.json({ success: false, message: 'If an account exists, you will receive instructions.' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'change-me-in-production', { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await pool.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [new Date(), user.id]);

    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role, mustResetPassword: user.must_reset_password }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.post('/api/auth/set-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, must_reset_password = false WHERE id = $2', [passwordHash, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set password.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (result.rows.length > 0) {
      const token = uuidv4();
      await pool.query(
        'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
        [uuidv4(), result.rows[0].id, token, new Date(Date.now() + 3600000)]
      );
      
      const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}\nThis link expires in 1 hour.`);
    }
    
    res.json({ success: true, message: 'If an account exists, you will receive instructions.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > $2',
      [token, new Date()]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, result.rows[0].user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Events routes
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY start_time DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

app.post('/api/events', authenticateToken, requireRole('admin', 'assistant'), async (req, res) => {
  try {
    const { title, description, location, startTime, endTime, capacity, isPublic, isRecurring, recurrencePattern, recurrenceEndDate, timezone } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO events (id, title, description, location, start_time, end_time, capacity, is_public, is_recurring, recurrence_pattern, recurrence_end_date, timezone, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
      [id, title, description, location, startTime, endTime, capacity, isPublic, isRecurring, recurrencePattern, recurrenceEndDate, timezone, req.user.id, new Date(), new Date()]
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

// Registrations
app.post('/api/registrations', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO registrations (id, event_id, user_id, status, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, eventId, req.user.id, 'registered', new Date()]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register.' });
  }
});

// Attendance
app.post('/api/attendance/checkin', authenticateToken, async (req, res) => {
  try {
    const { eventId, method } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO attendance (id, event_id, user_id, check_in_time, method, verified) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, eventId, req.user.id, new Date(), method || 'walkin', method === 'qr']
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in.' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Kindred Hands API running on port ${PORT}`);
});
