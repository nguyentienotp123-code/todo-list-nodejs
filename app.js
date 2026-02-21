const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Trang web (Level 2)
app.get('/', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/dashboard', (req, res) => {
  // Kiểm tra token (có thể dùng middleware riêng)
  const token = req.cookies.token;
  if (!token) return res.redirect('/');
  res.render('dashboard');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));