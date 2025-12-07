Deploying to Vercel (frontend + serverless API)

Overview
- This repository has a Vite React frontend in `frontend/` and a demo server in `backend/`.
- For Vercel, we place lightweight serverless API functions under `frontend/api/` so the frontend and API can be deployed together.
- NOTE: The API uses an in-memory store (demo only). Serverless functions are ephemeral — do not use this for production data.

Steps to deploy the frontend + API to Vercel
1. Ensure `frontend/package.json` has build scripts (Vite default):
   - "build": "vite build"
   - "dev": "vite"

2. Create a new project in Vercel and point it to the `frontend/` folder (select "Import Project" -> choose your Git repo -> set Root Directory to `frontend`).

3. Vercel will detect a static site and run `npm install` then `npm run build`. The `api/` folder under `frontend/` will be deployed as serverless functions.

4. After deployment you'll get a URL where the frontend is hosted and API endpoints live under `/api/sessions` and `/api/sessions/:id/*`.

Local testing (before deploy)
- Start the frontend dev server and the local API (Vite doesn't run serverless functions locally). To fully test the API locally use `vercel dev` (Vercel CLI) which emulates serverless functions locally.

Install Vercel CLI and run locally
```powershell
# install globally (if not installed)
npm i -g vercel
cd 'C:\Users\56vis\OneDrive\Desktop\ccp class monitor\frontend'
vercel login
vercel dev
```

Caveats
- The in-memory `SESSIONS`store won't persist across cold starts or different serverless instances. For production use, swap this to a DB (Firebase, Supabase, Mongo, Postgres, etc.).
- If you need long-running or socket-style behavior, use a separate backend host (Render, Heroku, DigitalOcean) and keep Vercel for the frontend + lightweight APIs.

If you want, I can:
- Convert the demo API to use a hosted DB and add environment-variable-based configuration (recommended next step).
- Help create a Vercel project file (`vercel.json`) with custom build settings.
