function text(value, maxLength = 2000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function boundedInt(value, min, max) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

function futureDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date <= new Date() ? null : date;
}

function email(value) {
  const result = text(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : '';
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { text, boundedInt, futureDate, email, escapeRegex };
