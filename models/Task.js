const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  isCompleted: { type: Boolean, default: false }, 
  completedAt: { type: Date },
}, { timestamps: true });

taskSchema.pre('save', function(next) {
  if (this.assignedTo.length > 0 && this.completedBy.length === this.assignedTo.length) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);