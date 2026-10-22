const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);

router.get('/mine', auth(['student']), asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ student: req.user._id })
    .sort({ registeredAt: -1 }).populate('event');
  res.json({ registrations });
}));

router.get('/event/:eventId', auth(['organizer']), asyncHandler(async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(400).json({ error: 'Invalid event id.' });
  const event = await Event.findOne({ _id: req.params.eventId, organizer: req.user._id });
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const registrations = await Registration.find({ event: event._id, active: true })
    .sort({ registeredAt: 1 }).populate('student', 'name email');
  res.json({ registrations });
}));

router.post('/event/:eventId', auth(['student']), asyncHandler(async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(400).json({ error: 'Invalid event id.' });
  const event = await Event.findOneAndUpdate(
    {
      _id: req.params.eventId,
      status: 'published',
      startsAt: { $gt: new Date() },
      $expr: { $lt: ['$registeredCount', '$capacity'] },
    },
    { $inc: { registeredCount: 1 } },
    { new: true },
  );
  if (!event) {
    const existing = await Event.findById(req.params.eventId);
    if (!existing) return res.status(404).json({ error: 'Event not found.' });
    if (existing.status !== 'published' || existing.startsAt <= new Date()) {
      return res.status(409).json({ error: 'This event is no longer open for registration.' });
    }
    return res.status(409).json({ error: 'This event is full.' });
  }
  try {
    const registration = await Registration.create({ event: event._id, student: req.user._id });
    return res.status(201).json({ registration });
  } catch (error) {
    await Event.updateOne({ _id: event._id, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
    if (error.code === 11000) return res.status(409).json({ error: 'You already have an active ticket for this event.' });
    throw error;
  }
}));

router.post('/:registrationId/cancel', auth(['student']), asyncHandler(async (req, res) => {
  if (!isId(req.params.registrationId)) return res.status(400).json({ error: 'Invalid registration id.' });
  const registration = await Registration.findOneAndUpdate(
    { _id: req.params.registrationId, student: req.user._id, status: 'confirmed', active: true },
    { $set: { status: 'cancelled', active: false, cancelledAt: new Date() } },
    { new: true },
  );
  if (!registration) return res.status(409).json({ error: 'This ticket cannot be cancelled.' });
  const release = await Event.updateOne(
    { _id: registration.event, registeredCount: { $gt: 0 } },
    { $inc: { registeredCount: -1 } },
  );
  if (release.modifiedCount !== 1) {
    await Registration.updateOne({ _id: registration._id, status: 'cancelled' }, {
      $set: { status: 'confirmed', active: true }, $unset: { cancelledAt: 1 },
    });
    return res.status(409).json({ error: 'The seat count could not be updated. Please try again.' });
  }
  res.json({ registration });
}));

router.post('/:registrationId/check-in', auth(['organizer']), asyncHandler(async (req, res) => {
  if (!isId(req.params.registrationId)) return res.status(400).json({ error: 'Invalid registration id.' });
  const registration = await Registration.findById(req.params.registrationId);
  if (!registration) return res.status(404).json({ error: 'Registration not found.' });
  const event = await Event.findOne({ _id: registration.event, organizer: req.user._id });
  if (!event) return res.status(404).json({ error: 'Registration not found.' });
  const checkedIn = await Registration.findOneAndUpdate(
    { _id: registration._id, status: 'confirmed', active: true },
    { $set: { status: 'attended', checkedInAt: new Date() } },
    { new: true },
  );
  if (!checkedIn) return res.status(409).json({ error: 'Only confirmed tickets can be checked in.' });
  res.json({ registration: checkedIn });
}));

module.exports = router;
