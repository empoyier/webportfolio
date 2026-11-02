# Project Smile Website

This is a simple no-build fundraising website for **Project Smile**. It includes:

- A clean and happy landing page
- A donation form
- Campaign progress tracking
- A Supabase-ready database setup

## Files

- `index.html` - main website
- `styles.css` - theme and layout   
- `app.js` - donation logic and dashboard totals
- `config.js` - local configuration file
- `config.example.js` - example database configuration
- `database/schema.sql` - table and policy setup for Supabase

## How to connect the database

1. Create a project in [Supabase](https://supabase.com/).
2. Open the SQL editor and run the contents of `database/schema.sql`.
3. Copy `config.example.js` into `config.js`.
4. Paste your Supabase URL and anon key into `config.js`.
5. Open `index.html` in a browser or host the folder on Netlify, Vercel, or GitHub Pages.

## Important note

Right now, the site stores a donation record in the database, but it does **not** process real payments yet.
For live fundraising, you can connect:

- GCash payment instructions or QR code
- PayMongo
- Stripe
- Maya

## Suggested next upgrade

Add a real payment flow so users can complete the donation online before the donation is marked as confirmed.
