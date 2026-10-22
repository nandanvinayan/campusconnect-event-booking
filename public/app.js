const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const state = { token: sessionStorage.getItem('campusconnect.token'), user: null, search: '', category: 'all' };
let toastTimer;

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);
  return element;
}
function action(label, className, handler, disabled = false) {
  const button = el('button', className, label);
  button.type = 'button';
  button.disabled = disabled;
  button.addEventListener('click', handler);
  return button;
}
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast visible${isError ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token) signOut(false);
    throw new Error(data.error || 'The request could not be completed.');
  }
  return data;
}
function showError(target, message) { target.textContent = message || ''; }
function setAuthenticated(data) {
  state.token = data.token;
  state.user = data.user;
  sessionStorage.setItem('campusconnect.token', data.token);
  renderDashboard();
}
function signOut(notify = true) {
  state.token = null;
  state.user = null;
  sessionStorage.removeItem('campusconnect.token');
  showAuth('login');
  if (notify) showToast('You have signed out.');
}
function showAuth(mode = 'login') {
  app.replaceChildren();
  const shell = el('div', 'auth-shell');
  const aside = el('section', 'auth-aside');
  const brand = el('div', 'brand');
  brand.append(el('span', 'brand-mark', 'C'), el('span', '', 'CampusConnect'));
  const copy = el('div', 'aside-copy');
  copy.append(el('span', 'eyebrow', 'Your campus, in motion'), el('h1', '', 'Make room for what brings us together.'), el('p', '', 'Find student events, reserve your seat, and give every campus idea a place to happen.'));
  const points = el('div', 'aside-points');
  ['Discover events', 'Save your seat', 'Meet your community'].forEach((item) => points.append(el('span', '', item)));
  copy.append(points);
  aside.append(brand, copy, el('div', 'aside-foot', 'A shared home for campus life.'));
  const main = el('section', 'auth-main');
  const card = el('div', 'auth-card');
  card.append(el('h2', '', mode === 'login' ? 'Welcome back' : 'Create your account'), el('p', 'subtext', mode === 'login' ? 'Sign in to discover what is happening on campus.' : 'Join CampusConnect as a student or event organizer.'));
  const tabs = el('div', 'auth-tabs');
  const signInTab = action('Sign in', mode === 'login' ? 'active' : '', () => showAuth('login'));
  const registerTab = action('Create account', mode === 'register' ? 'active' : '', () => showAuth('register'));
  tabs.append(signInTab, registerTab);
  const form = el('form');
  const err = el('div', 'error-note');
  if (mode === 'register') {
    form.append(field('Full name', input('name', 'text', 'e.g. Aanya Sharma', true)));
  }
  form.append(field('Email address', input('email', 'email', 'you@college.edu', true)));
  form.append(field('Password', input('password', 'password', mode === 'register' ? 'At least 8 characters' : 'Your password', true)));
  if (mode === 'register') {
    const role = document.createElement('select');
    role.name = 'role';
    role.required = true;
    [['student', 'Student'], ['organizer', 'Event organizer']].forEach(([value, label]) => {
      const option = el('option', '', label); option.value = value; role.append(option);
    });
    form.append(field('I am a', role));
  }
  const submit = el('button', 'primary-button full-width', mode === 'login' ? 'Sign in' : 'Create account');
  submit.type = 'submit';
  form.append(err, submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError(err, '');
    submit.disabled = true;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const data = await api(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify(payload) });
      setAuthenticated(data);
    } catch (error) {
      showError(err, error.message);
      submit.disabled = false;
    }
  });
  card.append(tabs, form);
  if (mode === 'login') {
    const note = el('div', 'demo-note', 'Demo accounts are available after seeding the database. See README.md for sign-in details.');
    card.append(note);
  }
  main.append(card);
  shell.append(aside, main);
  app.append(shell);
}
function input(name, type, placeholder, required = false) {
  const element = document.createElement('input');
  element.name = name; element.type = type; element.placeholder = placeholder; element.required = required;
  if (name === 'password') element.minLength = 8;
  return element;
}
function field(label, control) {
  const wrapper = el('div', 'field');
  wrapper.append(el('label', '', label), control);
  return wrapper;
}
function topbar() {
  const bar = el('header', 'topbar');
  const inner = el('div', 'topbar-inner');
  const brand = el('div', 'brand');
  brand.append(el('span', 'brand-mark', 'C'), el('span', '', 'CampusConnect'));
  const right = el('div', 'nav-right');
  const chip = el('div', 'user-chip');
  const avatar = el('span', 'avatar', (state.user.name || 'U').slice(0, 1).toUpperCase());
  const label = el('div', 'user-name');
  label.append(el('strong', '', state.user.name), el('span', 'role-label', state.user.role));
  chip.append(avatar, label);
  right.append(chip, action('Sign out', 'quiet-button', () => signOut()));
  inner.append(brand, right); bar.append(inner); return bar;
}
function stat(label, value) {
  const card = el('div', 'stat-card'); card.append(el('span', '', label), el('strong', '', value)); return card;
}
function panel(title, description = '') {
  const result = el('section', 'panel');
  const head = el('div', 'panel-head');
  const copy = el('div'); copy.append(el('h2', '', title));
  if (description) copy.append(el('p', 'panel-desc', description));
  head.append(copy); result.append(head); return result;
}
function empty(title, detail) {
  const box = el('div', 'empty-state'); box.append(el('strong', '', title), el('p', '', detail)); return box;
}
function dateLabel(value, options = {}) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be announced';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', ...options }).format(date);
}
function eventMeta(event) {
  const meta = el('div', 'event-meta');
  meta.append(el('span', '', `◷ ${dateLabel(event.startsAt)}`), el('span', '', `⌖ ${event.venue}`));
  if (event.organizer && event.organizer.name) meta.append(el('span', '', `Hosted by ${event.organizer.name}`));
  return meta;
}
async function renderDashboard() {
  try {
    if (!state.user) {
      const result = await api('/api/auth/me');
      state.user = result.user;
    }
    state.user.role === 'organizer' ? await renderOrganizer() : await renderStudent();
  } catch (error) {
    signOut(false);
    showToast(error.message, true);
  }
}
async function renderStudent() {
  const [eventData, ticketData] = await Promise.all([api('/api/events'), api('/api/registrations/mine')]);
  const events = eventData.events || [];
  const registrations = ticketData.registrations || [];
  const activeTickets = registrations.filter((item) => item.status !== 'cancelled');
  const upcomingTickets = activeTickets.filter((item) => item.event && new Date(item.event.startsAt) > new Date());
  const bookedIds = new Set(activeTickets.map((item) => item.event && String(item.event._id)).filter(Boolean));
  app.replaceChildren(topbar());
  const dashboard = el('div', 'dashboard');
  const heading = el('div', 'page-heading');
  const title = el('div'); title.append(el('h1', '', `Good to see you, ${state.user.name.split(' ')[0]}`), el('p', '', 'Explore what is happening around campus and save your seat.'));
  heading.append(title); dashboard.append(heading);
  const stats = el('div', 'stats-grid');
  stats.append(stat('Open events', events.length), stat('Upcoming tickets', upcomingTickets.length), stat('Checked in', registrations.filter((item) => item.status === 'attended').length));
  dashboard.append(stats);
  const grid = el('div', 'content-grid');
  const browse = panel('Find your next event', 'Workshops, performances, talks, and more.');
  const toolbar = el('div', 'toolbar');
  const searchWrap = el('div', 'search-box');
  const search = input('search', 'search', 'Search events or places'); search.value = state.search;
  search.addEventListener('input', () => { state.search = search.value; updateEventCards(); });
  searchWrap.append(search);
  const category = document.createElement('select');
  [['all', 'All categories'], ['Workshop', 'Workshop'], ['Talk', 'Talk'], ['Arts', 'Arts'], ['Sports', 'Sports'], ['Community', 'Community']].forEach(([value, label]) => {
    const option = el('option', '', label); option.value = value; category.append(option);
  });
  category.value = state.category;
  category.addEventListener('change', () => { state.category = category.value; updateEventCards(); });
  toolbar.append(searchWrap, category); browse.append(toolbar);
  const list = el('div', 'event-list');
  function updateEventCards() {
    list.replaceChildren();
    const needle = state.search.toLowerCase().trim();
    const visible = events.filter((event) => {
      const matchesSearch = !needle || [event.title, event.description, event.venue].some((value) => String(value || '').toLowerCase().includes(needle));
      return matchesSearch && (state.category === 'all' || event.category === state.category);
    });
    if (!visible.length) { list.append(empty('No events found', 'Try another search, or check back later for new events.')); return; }
    visible.forEach((event) => {
      const card = el('article', 'event-card');
      const main = el('div', 'event-main');
      const titleRow = el('div', 'event-title-row'); titleRow.append(el('h3', '', event.title), el('span', 'category-pill', event.category));
      main.append(titleRow, eventMeta(event), el('p', 'event-description', event.description));
      const controls = el('div', 'event-action');
      const remaining = Math.max(0, event.capacity - event.registeredCount);
      controls.append(el('div', 'seats-text', remaining ? `${remaining} seats left` : 'Fully booked'));
      if (bookedIds.has(String(event._id))) {
        controls.append(el('span', 'status-pill confirmed', 'Ticket saved'));
      } else {
        controls.append(action(remaining ? 'Reserve seat' : 'Full', 'primary-button', async () => {
          try { await api(`/api/registrations/event/${event._id}`, { method: 'POST', body: '{}' }); showToast('Your seat is reserved.'); await renderStudent(); }
          catch (error) { showToast(error.message, true); }
        }, remaining === 0));
      }
      card.append(main, controls); list.append(card);
    });
  }
  updateEventCards(); browse.append(list); grid.append(browse);
  const tickets = panel('My tickets', 'Your saved places and event check-ins.');
  if (!registrations.length) tickets.append(empty('No tickets yet', 'Reserve a seat at an event to see it here.'));
  registrations.forEach((registration) => {
    const event = registration.event;
    const row = el('div', 'ticket-row');
    const details = el('div');
    details.append(el('h3', '', event ? event.title : 'Event unavailable'), el('p', '', event ? `${dateLabel(event.startsAt)} · ${event.venue}` : 'Event details are no longer available'));
    const right = el('div');
    const status = registration.status === 'attended' ? 'Checked in' : registration.status === 'cancelled' ? 'Cancelled' : event && event.status === 'cancelled' ? 'Event cancelled' : 'Confirmed';
    const badge = el('span', `status-pill ${registration.status}`, status); right.append(badge);
    if (registration.status === 'confirmed' && event && event.status !== 'cancelled' && new Date(event.startsAt) > new Date()) {
      right.append(action('Cancel ticket', 'quiet-button', async () => {
        try { await api(`/api/registrations/${registration._id}/cancel`, { method: 'POST', body: '{}' }); showToast('Your ticket was cancelled.'); await renderStudent(); }
        catch (error) { showToast(error.message, true); }
      }));
    }
    row.append(details, right); tickets.append(row);
  });
  grid.append(tickets); dashboard.append(grid); app.append(dashboard);
}
async function renderOrganizer() {
  const { events = [] } = await api('/api/events/mine');
  app.replaceChildren(topbar());
  const dashboard = el('div', 'dashboard');
  const heading = el('div', 'page-heading');
  const title = el('div'); title.append(el('h1', '', 'Organizer studio'), el('p', '', 'Publish events, follow registrations, and welcome guests at the door.'));
  heading.append(title); dashboard.append(heading);
  const upcoming = events.filter((item) => item.status === 'published' && new Date(item.startsAt) > new Date()).length;
  const seats = events.filter((item) => item.status === 'published').reduce((sum, item) => sum + item.registeredCount, 0);
  const stats = el('div', 'stats-grid'); stats.append(stat('Events published', upcoming), stat('Total registrations', seats), stat('Past / cancelled', events.length - upcoming)); dashboard.append(stats);
  const layout = el('div', 'organizer-layout');
  const create = panel('Publish an event', 'Add the essential details. You can update the listing later.');
  const form = el('form');
  const titleInput = input('title', 'text', 'e.g. Design thinking workshop', true); titleInput.maxLength = 120;
  const categoryInput = document.createElement('select'); categoryInput.name = 'category';
  ['Workshop', 'Talk', 'Arts', 'Sports', 'Community', 'Career', 'Other'].forEach((value) => { const option = el('option', '', value); option.value = value; categoryInput.append(option); });
  const description = document.createElement('textarea'); description.name = 'description'; description.placeholder = 'What should attendees know?'; description.required = true; description.minLength = 10; description.maxLength = 2000;
  const venue = input('venue', 'text', 'Building and room', true); venue.maxLength = 120;
  const startsAt = input('startsAt', 'datetime-local', '', true);
  const capacity = input('capacity', 'number', 'e.g. 80', true); capacity.min = '1'; capacity.max = '5000'; capacity.value = '50';
  form.append(field('Event title', titleInput), field('Category', categoryInput), field('Description', description), field('Venue', venue));
  const row = el('div', 'form-row'); row.append(field('Date and time', startsAt), field('Seat capacity', capacity)); form.append(row);
  const error = el('div', 'error-note'); const submit = el('button', 'primary-button full-width', 'Publish event'); submit.type = 'submit'; form.append(error, submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); showError(error, ''); submit.disabled = true;
    const values = Object.fromEntries(new FormData(form).entries());
    values.capacity = Number(values.capacity);
    values.startsAt = new Date(values.startsAt).toISOString();
    try { await api('/api/events', { method: 'POST', body: JSON.stringify(values) }); showToast('Event published.'); await renderOrganizer(); }
    catch (failure) { showError(error, failure.message); submit.disabled = false; }
  });
  create.append(form); layout.append(create);
  const listPanel = panel('Your events', 'Review capacity and manage the guest list.');
  const list = el('div');
  if (!events.length) list.append(empty('No events yet', 'Publish your first event using the form.'));
  events.forEach((event) => {
    const item = el('article', 'organizer-event');
    const head = el('div', 'organizer-event-head');
    const copy = el('div'); copy.append(el('h3', '', event.title), el('p', '', `${dateLabel(event.startsAt)} · ${event.venue}`));
    const badge = el('span', `status-pill ${event.status}`, event.status === 'published' ? 'Published' : 'Cancelled');
    head.append(copy, badge); item.append(head);
    const remaining = Math.max(0, event.capacity - event.registeredCount);
    const info = el('p'); info.style.marginTop = '9px'; info.textContent = `${event.registeredCount} registered · ${remaining} seats available · ${event.capacity} total`;
    item.append(info);
    const actions = el('div', 'organizer-event-actions');
    const attendeeBox = el('div', 'attendee-list'); attendeeBox.hidden = true;
    actions.append(action('View guest list', 'secondary-button', async (buttonEvent) => {
      if (!attendeeBox.hidden) { attendeeBox.hidden = true; return; }
      attendeeBox.hidden = false; attendeeBox.replaceChildren(el('p', 'panel-desc', 'Loading guest list…'));
      try {
        const data = await api(`/api/registrations/event/${event._id}`);
        attendeeBox.replaceChildren();
        if (!data.registrations.length) attendeeBox.append(empty('No guests yet', 'Confirmed tickets will appear here.'));
        data.registrations.forEach((registration) => {
          const guest = el('div', 'attendee');
          const name = el('div'); name.append(el('strong', '', registration.student.name), el('span', '', registration.student.email));
          const status = el('div'); status.append(el('span', `status-pill ${registration.status}`, registration.status === 'attended' ? 'Checked in' : 'Confirmed'));
          if (registration.status === 'confirmed' && event.status === 'published') {
            status.append(action('Check in', 'quiet-button', async () => {
              try { await api(`/api/registrations/${registration._id}/check-in`, { method: 'POST', body: '{}' }); showToast(`${registration.student.name} checked in.`); await renderOrganizer(); }
              catch (failure) { showToast(failure.message, true); }
            }));
          }
          guest.append(name, status); attendeeBox.append(guest);
        });
      } catch (failure) { attendeeBox.replaceChildren(el('p', 'error-note', failure.message)); }
    }),
    event.status === 'published' ? action('Cancel event', 'danger-button', async () => {
      if (!window.confirm(`Cancel “${event.title}”? Students with tickets will see that the event is cancelled.`)) return;
      try { await api(`/api/events/${event._id}/cancel`, { method: 'POST', body: '{}' }); showToast('Event cancelled.'); await renderOrganizer(); }
      catch (failure) { showToast(failure.message, true); }
    }) : el('span'));
    item.append(actions, attendeeBox); list.append(item);
  });
  listPanel.append(list); layout.append(listPanel); dashboard.append(layout); app.append(dashboard);
}

async function boot() {
  if (!state.token) return showAuth('login');
  try {
    const { user } = await api('/api/auth/me');
    state.user = user;
    await renderDashboard();
  } catch (error) {
    signOut(false);
    showToast(error.message, true);
  }
}
boot();
