const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, required: true, enum: ['confirmed', 'cancelled', 'attended'], default: 'confirmed' },
  active: { type: Boolean, required: true, default: true },
  registeredAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date },
  checkedInAt: { type: Date },
}, { timestamps: true });

// Keep cancelled history while enforcing one active ticket per student and event.
registrationSchema.index({ event: 1, student: 1 }, {
  unique: true,
  partialFilterExpression: { active: true },
});
registrationSchema.index({ student: 1, registeredAt: -1 });
module.exports = mongoose.model('Registration', registrationSchema);
