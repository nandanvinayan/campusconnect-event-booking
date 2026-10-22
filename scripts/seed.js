require('dotenv').config();
const connectDatabase = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const bcrypt = require('bcryptjs');

const organizerEmail = 'organizer@campusconnect.demo';
const studentEmail = 'student@campusconnect.demo';
const demoPassword = 'demo1234';

async function seed() {
  await connectDatabase(process.env.MONGODB_URI);
  const existingOrganizer = await User.findOne({ email: organizerEmail });
  const existingStudent = await User.findOne({ email: studentEmail });
  const ownedEvents = existingOrganizer ? await Event.find({ organizer: existingOrganizer._id }).select('_id') : [];
  const eventIds = ownedEvents.map((event) => event._id);
  const cleanup = [];
  if (existingStudent) cleanup.push({ student: existingStudent._id });
  if (eventIds.length) cleanup.push({ event: { $in: eventIds } });
  if (cleanup.length) await Registration.deleteMany({ $or: cleanup });
  if (eventIds.length) await Event.deleteMany({ _id: { $in: eventIds } });
  if (existingOrganizer) await User.deleteOne({ _id: existingOrganizer._id });
  if (existingStudent) await User.deleteOne({ _id: existingStudent._id });

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const [organizer, student] = await User.create([
    { name: 'Campus Team', email: organizerEmail, passwordHash, role: 'organizer' },
    { name: 'Aanya Sharma', email: studentEmail, passwordHash, role: 'student' },
  ]);
  const days = (count) => new Date(Date.now() + count * 24 * 60 * 60 * 1000);
  const events = await Event.create([
    { organizer: organizer._id, title: 'Design Thinking Sprint', description: 'A hands-on workshop to turn everyday campus challenges into thoughtful prototypes.', category: 'Workshop', venue: 'Innovation Lab · Block C', startsAt: days(4), capacity: 40, registeredCount: 1 },
    { organizer: organizer._id, title: 'The Future of Clean Energy', description: 'A student-led conversation on practical renewable energy and the ideas shaping a greener future.', category: 'Talk', venue: 'Auditorium 2', startsAt: days(7), capacity: 120, registeredCount: 1 },
    { organizer: organizer._id, title: 'Open Mic Under the Stars', description: 'An easy-going evening for poetry, acoustic music, comedy, and all kinds of creative voices.', category: 'Arts', venue: 'Central Courtyard', startsAt: days(10), capacity: 80, registeredCount: 0 },
    { organizer: organizer._id, title: 'Campus 5K Fun Run', description: 'Bring a friend, choose your pace, and finish the morning with a community run around campus.', category: 'Sports', venue: 'Sports Ground Gate', startsAt: days(14), capacity: 200, registeredCount: 0 },
    { organizer: organizer._id, title: 'First-Year Community Lunch', description: 'Meet student clubs and find small ways to get involved in campus life this semester.', category: 'Community', venue: 'Student Commons', startsAt: days(18), capacity: 60, registeredCount: 0 },
  ]);
  await Registration.create([
    { event: events[0]._id, student: student._id, status: 'confirmed', active: true },
    { event: events[1]._id, student: student._id, status: 'confirmed', active: true },
  ]);
  console.log('Seeded CampusConnect demo accounts and five upcoming events.');
  console.log(`Organizer: ${organizerEmail} / ${demoPassword}`);
  console.log(`Student:   ${studentEmail} / ${demoPassword}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
