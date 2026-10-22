const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { text, boundedInt, futureDate, escapeRegex } = require('../utils/validate');

const router = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);

function readEventInput(body, partial = false) {
  const result = {};
  const checks = [
    ['title', () => text(body.title, 120), (v) => v.length >= 3],
    ['description', () => text(body.description, 2000), (v) => v.length >= 10],
    ['category', () => text(body.category, 40), (v) => v.length > 0],
    ['venue', () => text(body.venue, 120), (v) => v.length > 0],
    ['startsAt', () => futureDate(body.startsAt), Boolean],
    ['capacity', () => boundedInt(body.capacity, 1, 5000), (v) => v !== null],
  ];
  for (const [key, read, valid] of checks) {
    if (partial && !Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = read();
    if (!valid(value)) return { error: `Check the ${key} field and try again.` };
    result[key] = value;
  }
  return { value: result };
}

router.get('/', asyncHandler(async (req, res) => {
  const query = { status: 'published', startsAt: { $gt: new Date() } };
  const search = text(req.query.search, 80);
  const category = text(req.query.category, 40);
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ title: pattern }, { description: pattern }, { venue: pattern }];
  }
  if (category) query.category = category;
  const events = await Event.find(query).sort({ startsAt: 1 }).populate('organizer', 'name');
  res.json({ events });
}));

router.get('/mine', auth(['organizer']), asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ startsAt: 1 });
  res.json({ events });
}));

router.get('/:eventId', auth(), asyncHandler(async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(400).json({ error: 'Invalid event id.' });
  const event = await Event.findById(req.params.eventId).populate('organizer', 'name');
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  res.json({ event });
}));

router.post('/', auth(['organizer']), asyncHandler(async (req, res) => {
  const parsed = readEventInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const event = await Event.create({ ...parsed.value, organizer: req.user._id });
  res.status(201).json({ event });
}));

router.patch('/:eventId', auth(['organizer']), asyncHandler(async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(400).json({ error: 'Invalid event id.' });
  const parsed = readEventInput(req.body, true);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  if (Object.keys(parsed.value).length === 0) return res.status(400).json({ error: 'Add at least one field to update.' });
  const filter = { _id: req.params.eventId, organizer: req.user._id, status: 'published' };
  if (parsed.value.capacity !== undefined) filter.registeredCount = { $lte: parsed.value.capacity };
  const event = await Event.findOneAndUpdate(filter, { $set: parsed.value }, { new: true, runValidators: true });
  if (!event) {
    const owned = await Event.findOne({ _id: req.params.eventId, organizer: req.user._id });
    if (!owned) return res.status(404).json({ error: 'Event not found.' });
    if (owned.status !== 'published') return res.status(409).json({ error: 'Cancelled events cannot be edited.' });
    if (parsed.value.capacity !== undefined && parsed.value.capacity < owned.registeredCount) {
      return res.status(409).json({ error: `Capacity cannot be lower than the ${owned.registeredCount} confirmed registrations.` });
    }
    return res.status(409).json({ error: 'The event changed before this update. Please refresh and try again.' });
  }
  res.json({ event });
}));

router.post('/:eventId/cancel', auth(['organizer']), asyncHandler(async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(400).json({ error: 'Invalid event id.' });
  const event = await Event.findOneAndUpdate(
    { _id: req.params.eventId, organizer: req.user._id, status: 'published' },
    { $set: { status: 'cancelled' } },
    { new: true },
  );
  if (!event) return res.status(404).json({ error: 'Published event not found.' });
  res.json({ event });
}));

module.exports = router;
