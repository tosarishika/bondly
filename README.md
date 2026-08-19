# Bondly

An interaction-ready front-end prototype for a UAE university student network.

Open `index.html` in a browser. The full journey is included: landing page, email sign-up, profile set-up, highlights feed, notes, messages, opportunities, search, profile, notifications, and the Bondly Helpbot.

## Database

`schema.sql` provides a PostgreSQL/Supabase-compatible relational model for accounts, university profiles, connections, weekly highlights, internship posts, notes, chats, messages, and notifications-ready activity.

To make this production-ready, connect an authentication service (such as Supabase Auth), run the schema, store photo/PDF uploads in object storage, and replace the static sample data in `index.html` with API calls. Keep row-level security enabled so students can only edit their own profile, posts, notes, and messages.
