const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware cho admin (Level 3)
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Chỉ admin mới có quyền' });
  next();
};

// 1. Get all tasks (của user hiện tại)
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find({ $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }] });
  res.json(tasks);
});

// 2. Get tasks by username
router.get('/user/:username', auth, async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ msg: 'User không tồn tại' });
  const tasks = await Task.find({ createdBy: user._id });
  res.json(tasks);
});

// 3. Tasks trong ngày hiện tại
router.get('/today', auth, async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await Task.find({
    createdBy: req.user.id,
    createdAt: { $gte: today, $lt: tomorrow }
  });
  res.json(tasks);
});

// 4. Tasks chưa hoàn thành
router.get('/incomplete', auth, async (req, res) => {
  const tasks = await Task.find({ isCompleted: false, $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }] });
  res.json(tasks);
});

// 5. Tasks của user có họ 'Nguyễn'
router.get('/nguyen', auth, async (req, res) => {
  const users = await User.find({ fullName: { $regex: /^Nguyễn/i } });
  const userIds = users.map(u => u._id);
  const tasks = await Task.find({ createdBy: { $in: userIds } });
  res.json(tasks);
});

// Create task (Level 2/3)
router.post('/', auth, async (req, res) => {
  const { title, description, assignedUsernames } = req.body; // assignedUsernames: mảng username (Level 3)
  const task = new Task({
    title,
    description,
    createdBy: req.user.id,
  });

  if (assignedUsernames && req.user.role === 'admin') {
    const users = await User.find({ username: { $in: assignedUsernames } });
    task.assignedTo = users.map(u => u._id);
  }

  await task.save();
  res.json(task);
});

// Mark complete (Level 3: multi complete)
router.put('/:id/complete', auth, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ msg: 'Task not found' });

  if (!task.assignedTo.includes(req.user.id) && task.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ msg: 'Không được phép' });
  }

  if (!task.completedBy.includes(req.user.id)) {
    task.completedBy.push(req.user.id);
    await task.save();
  }

  res.json(task);
});

// Delete task (chỉ creator hoặc admin)
router.delete('/:id', auth, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ msg: 'Not found' });
  if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Không được phép' });
  }
  await task.deleteOne();
  res.json({ msg: 'Deleted' });
});

module.exports = router;