require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

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

    db.run(query, [name, phone, date.toISOString(), details], function(err) {
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
 * @desc Get all bookings (Protected in production, open for demonstration)
 */
app.get('/api/bookings', (req, res) => {
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
