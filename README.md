# CampusConnect

CampusConnect is a full-stack campus event discovery and ticket booking application. Students browse upcoming events and reserve or cancel a seat. Organizers publish events, review guest lists, and check attendees in.

## Technology stack

- **Front end:** HTML5, CSS3, vanilla JavaScript, Fetch API
- **Runtime and API:** Node.js 18+, Express 4
- **Database:** MongoDB Atlas or local MongoDB, with Mongoose 8
- **Authentication:** JSON Web Tokens, bcryptjs password hashing
- **Configuration:** dotenv
- **API workflow:** Postman collection in `docs/CampusConnect.postman_collection.json`
- **Browser workflow:** Playwright end-to-end scripts in `tests/`
- **Version control/editor:** Git, GitHub, VS Code, npm

## Run locally

1. Install Node.js 18 or newer and npm. Start MongoDB locally or create a MongoDB Atlas database.
2. From this project folder, copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`. Use a long random secret for `JWT_SECRET`; do not commit `.env`.
3. Install dependencies with `npm install`.
4. Load the demo users and events with `npm run seed`.
5. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The production-style start command is `npm start`. The health endpoint is `/api/health`.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | `student@campusconnect.demo` | `demo1234` |
| Organizer | `organizer@campusconnect.demo` | `demo1234` |

The seed script refreshes only these demo accounts, their events, and the registrations attached to those events. Do not use demo credentials in a deployed environment.

## Main workflows

### Student

1. Create an account as a student or sign in.
2. Search and filter published upcoming events.
3. Reserve a seat while capacity remains.
4. Review confirmed, cancelled, or checked-in tickets in **My tickets**.
5. Cancel a confirmed ticket before the event to release the seat.

### Organizer

1. Create an account as an organizer or sign in.
2. Publish an event with a future date, venue, category, description, and seat capacity.
3. Review registrations and check in confirmed attendees.
4. Cancel an event if it can no longer go ahead; students see the cancelled status on their tickets.

An event owner can view and manage only their own event guest lists. A user cannot create a second active ticket for the same event. Cancelled tickets remain in the history and can be booked again if seats are available.

## API overview

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a student or organizer account |
| `POST` | `/api/auth/login` | Public | Sign in and receive a JWT |
| `GET` | `/api/auth/me` | Signed in | Read the current account |
| `GET` | `/api/events` | Public | List upcoming published events; optional `search` and `category` filters |
| `GET` | `/api/events/:eventId` | Signed in | Read an event |
| `GET` | `/api/events/mine` | Organizer | List the organizer's events |
| `POST` | `/api/events` | Organizer | Publish an event |
| `PATCH` | `/api/events/:eventId` | Event organizer | Update an event while capacity remains valid |
| `POST` | `/api/events/:eventId/cancel` | Event organizer | Cancel an event |
| `POST` | `/api/registrations/event/:eventId` | Student | Reserve one seat |
| `GET` | `/api/registrations/mine` | Student | List the student's tickets |
| `GET` | `/api/registrations/event/:eventId` | Event organizer | View active tickets for an event |
| `POST` | `/api/registrations/:registrationId/cancel` | Ticket owner | Cancel a confirmed ticket |
| `POST` | `/api/registrations/:registrationId/check-in` | Event organizer | Check in a confirmed attendee |

Send protected requests with `Authorization: Bearer <token>` and JSON request bodies.

## Postman

Import `docs/CampusConnect.postman_collection.json` into Postman. Set the collection variables if prompted, then run the requests in order: health, student login, list events, reserve a seat, student tickets, organizer login, organizer events, and guest list. The login and event-list requests store their tokens and a sample event id for later requests.

## Playwright browser checks and screenshots

After the database is running and seeded, install the browser once with `npx playwright install chromium`, then run `npm run test:e2e`. The scripts sign in as both demo roles and save full-page screenshots to `docs/screenshots/`.

The project includes screenshot capture scripts; screenshots appear after the browser checks run locally.

## Data consistency and security notes

- Passwords are stored as bcrypt hashes; API tokens expire after seven days by default.
- Route middleware checks authentication and role ownership for protected operations.
- Request strings, dates, quantities, and MongoDB identifiers are validated before use.
- The browser creates dynamic UI with DOM nodes and `textContent` instead of inserting event data as HTML.
- Seat reservation uses a conditional atomic update against the event document, then creates the ticket. If the ticket cannot be created, the seat count is rolled back.
- Cancellation first claims a confirmed ticket and then decrements the event count; a failed count update restores the ticket status.
- A partial unique index prevents more than one active ticket for a student and event while preserving cancelled history.

For a classroom demonstration, users may select the organizer role during self-registration. A production deployment should grant organizer privileges through an administrator or a verified invitation.

## Repository layout

```text
config/       MongoDB connection
models/       User, Event, and Registration schemas
middleware/   JWT authentication and role checks
routes/       Authentication, event, and registration API
utils/        Validation and async route helpers
scripts/      Demo data seeder
public/       Responsive HTML, CSS, and browser JavaScript
docs/         Project report and Postman collection
tests/        Playwright browser checks
```

## Repository

The public repository is [nandanvinayan/campusconnect-event-booking](https://github.com/nandanvinayan/campusconnect-event-booking). Clone it with `git clone https://github.com/nandanvinayan/campusconnect-event-booking.git`, then follow the local setup steps above. Keep `.env` out of version control.
