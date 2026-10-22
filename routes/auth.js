const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { text, email } = require('../utils/validate');

const router = express.Router();

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

function issueToken(user) {
  return jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post('/register', asyncHandler(async (req, res) => {
  const name = text(req.body.name, 80);
  const normalizedEmail = email(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = req.body.role;
  if (name.length < 2) return res.status(400).json({ error: 'Name must have at least 2 characters.' });
  if (!normalizedEmail) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8 to 72 characters.' });
  }
  if (!['student', 'organizer'].includes(role)) {
    return res.status(400).json({ error: 'Choose student or organizer.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email: normalizedEmail, passwordHash, role });
    return res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with that email already exists.' });
    throw error;
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const normalizedEmail = email(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = normalizedEmail ? await User.findOne({ email: normalizedEmail }).select('+passwordHash') : null;
  const matches = user && await bcrypt.compare(password, user.passwordHash);
  if (!matches) return res.status(401).json({ error: 'Incorrect email or password.' });
  return res.json({ token: issueToken(user), user: publicUser(user) });
}));

router.get('/me', auth(), (req, res) => res.json({ user: publicUser(req.user) }));
module.exports = router;
