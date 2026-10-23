<div align="center">

# Bondly
### Your UAE student circle

A student-focused web project for connecting with university peers, sharing notes and discovering opportunities across the UAE.

[Explore the website](https://bondly-flax.vercel.app) · [Browse the code](https://github.com/tosarishika/bondly)

**HTML · CSS · JavaScript · Supabase · PostgreSQL**

</div>

---

## Why Bondly?

University life brings together academics, friendships and career decisions, but the resources students need are often scattered. Bondly brings student profiles, course notes, conversations and opportunities into one interface designed around the UAE university community.

## Inside the project

| Area | What the code includes |
| --- | --- |
| Student profiles | University, course, study year, interests and profile editing |
| Connections | Send, accept and decline connection requests |
| Notes | Upload and browse PDFs labelled by subject, topic and study year |
| Highlights | Share photo posts, with code for likes, comments and sharing |
| Messaging | Direct chats, attachments and real-time message integration |
| Opportunities | Share internship posts and receive notifications |
| Helpbot | Keyword-based guidance for navigating Bondly |

The client also includes study-room and accommodation interfaces. These require additional database setup that is not included in the current SQL files.

## Technology

- **Interface:** HTML, CSS and vanilla JavaScript.
- **Backend services:** Supabase Auth, PostgreSQL, Storage and Realtime.
- **Hosting:** Vercel; the repository links to the website above.
- **Design:** A cream, sage and coral palette with responsive layouts.

The Helpbot uses predefined keyword responses. It does not use a trained machine learning model or an external language-model API.

## Run locally

You will need Git and Python 3, or another static HTTP server.

```bash
git clone https://github.com/tosarishika/bondly.git
cd bondly
python3 -m http.server 8000
```

Open **http://localhost:8000** in your browser. There is no npm install or build step.

Use an HTTP server because the app loads its Supabase client as a JavaScript module. An internet connection is needed for Supabase, the module CDN, web fonts and remote images.

### Use your own Supabase project

1. Create a Supabase project and configure email authentication.
2. On a fresh project, run `schema.sql` in the SQL editor.
3. Run `supabase-features.sql`, followed by `supabase-note-delete.sql`.
4. Replace the project URL and browser publishable key at the top of `supabase-client.js` with your own values.
5. Configure the authentication site URL and redirect URLs for your local or hosted address.

The SQL scripts create policies and publication entries and are intended to be applied once; they are not fully rerunnable migrations. The current client references some tables and fields beyond the bundled scripts, so this is not yet a complete one-command backend setup.

## Repository guide

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, styles, sample content and base interactions |
| `supabase-client.js` | Authentication, database access and connected app interactions |
| `schema.sql` | Core tables, access policies and storage buckets |
| `supabase-features.sql` | Notification table and additional internship fields |
| `supabase-note-delete.sql` | Policy allowing students to delete their own notes |

## Project status

Bondly is a student portfolio project with a front-end interface and Supabase integration. Features listed here are based on the repository code; their behaviour on the hosted deployment has not been independently verified.

Sample profiles and listings are demonstration content. They do not establish real users, available housing or verified internship opportunities.

### Next improvements

- Consolidate all required tables and fields into versioned database migrations.
- Add screenshots and a short walkthrough of the main student journeys.
- Test account creation, access policies, uploads and messaging with separate test accounts.
- Add automated checks and improve accessibility across screen sizes.

## About

A project in **[Ishika Tosar's](https://github.com/tosarishika)** portfolio, exploring student-focused software, interface design and database-backed applications.
