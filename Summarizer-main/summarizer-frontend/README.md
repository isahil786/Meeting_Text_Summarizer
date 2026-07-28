# Marginal — Summarizer Frontend

A small React (Vite) client for the Flask summarization backend: register/login,
paste lecture or meeting text, choose abstractive (T5-small) or extractive
summarization, and view the result. Summaries are also emailed by the backend
on generation.

## Setup

```bash
cd summarizer-frontend
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend isn't on localhost:5000
npm run dev
```

The app runs at `http://localhost:5173` and expects the Flask backend
(`Backend/server.py`) running at `http://localhost:5000` with CORS enabled
(already configured in `server.py` via `CORS(app)`).

## What's implemented

- **Register / Login** — calls `/register` and `/login`, stores the returned
  JWT in `localStorage` so a refresh doesn't log you out.
- **Summarize** — calls `/get_summary` with the JWT in the `Authorization`
  header, lets you toggle between `abstractive` and `extractive` type.
- **Look up by meeting ID** — calls `/get_summary_by_id/:id` to re-fetch a
  past summary.
- **Sign out** — clears the stored token.

## Notes

- This talks to the backend as it exists today. The backend currently has
  hardcoded DB/mail credentials in `server.py` — worth moving those to
  environment variables before deploying anywhere public.
- The "extractive" mode on the backend is currently a plain text slice
  (first 30% of characters), not a real extractive algorithm — the frontend
  just reflects whatever the backend returns.
