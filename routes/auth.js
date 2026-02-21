const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: 'Username đã tồn tại' });

    user = new User({ username, password, fullName });
    await user.save();

    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, { httpOnly: true });
    res.json({ msg: 'Đăng ký thành công', token });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'Sai thông tin' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Sai thông tin' });

    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, { httpOnly: true });
    res.json({ msg: 'Đăng nhập thành công', token });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;