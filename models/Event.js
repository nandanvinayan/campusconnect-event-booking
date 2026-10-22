const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  venue: { type: String, required: true, trim: true, maxlength: 120 },
  startsAt: { type: Date, required: true, index: true },
  capacity: { type: Number, required: true, min: 1, max: 5000 },
  registeredCount: { type: Number, required: true, default: 0, min: 0 },
  status: { type: String, required: true, enum: ['published', 'cancelled'], default: 'published', index: true },
}, { timestamps: true });

eventSchema.index({ status: 1, startsAt: 1 });
module.exports = mongoose.model('Event', eventSchema);
