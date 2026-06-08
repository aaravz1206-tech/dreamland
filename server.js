require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_dreamland';

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disabled for simple mockup static files but typically configured carefully
})); 
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

/**
 * @route POST /api/bookings
 * @desc Create a new consultation booking
 */
app.post('/api/bookings', [
    // Validation rules
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[0-9+\-\s]+$/).withMessage('Invalid phone format').escape(),
    body('date').trim().notEmpty().withMessage('Date is required').isISO8601().toDate().withMessage('Invalid date format'),
    body('details').optional().trim().escape()
], (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, date, details } = req.body;
    const query = `INSERT INTO bookings (name, phone, date, details) VALUES (?, ?, ?, ?)`;

    db.run(query, [name, phone, new Date(date).toISOString(), details], function(err) {
        if (err) {
            console.error('Error inserting booking:', err.message);
            return res.status(500).json({ success: false, message: 'Server error while processing booking' });
        }
        res.status(201).json({
            success: true,
            message: 'Booking successfully created',
            bookingId: this.lastID
        });
    });
});

/**
 * @route GET /api/bookings
 * @desc Get all bookings (Protected for admin dashboard)
 */
app.get('/api/bookings', (req, res) => {
    // Simple password check for mockup purposes
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'dreamland2026') {
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid admin key.' });
    }

    db.all(`SELECT * FROM bookings ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching bookings:', err.message);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, count: rows.length, data: rows });
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
app.post('/api/auth/register', [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        // Check if user exists
        db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, row) => {
            if (err) return res.status(500).json({ success: false, message: 'Database error' });
            if (row) return res.status(400).json({ success: false, message: 'User already exists' });

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert user
            db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword], function(err) {
                if (err) return res.status(500).json({ success: false, message: 'Failed to create user' });
                
                // Create token
                const token = jwt.sign({ id: this.lastID, name }, JWT_SECRET, { expiresIn: '7d' });
                res.status(201).json({ success: true, token, user: { id: this.lastID, name, email } });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate a user and get token
 */
app.post('/api/auth/login', [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        // Create token
        const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
