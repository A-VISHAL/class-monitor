# ClassEngage — Classroom Engagement Monitoring (Demo)

This repository contains a minimal demo of a browser-based classroom engagement monitoring platform.

## What it includes
- A backend (Node + Express) that stores anonymized metrics and sessions. No raw video is stored.
- A frontend (React + Vite) that captures the lab PC camera, computes per-zone engagement scores locally, shows live overlays and charts, and sends anonymized aggregated metrics to the backend.

## Privacy
- Raw frames are not persisted by the backend. The frontend computes aggregated numeric metrics (per-zone averages and overall score) and sends only those numbers to the server.

## Quick start (Windows PowerShell):

### 1. Backend
```powershell
cd backend
npm install
npm start
```

### 2. Frontend (in a separate terminal)
```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL printed by Vite (usually http://localhost:5173).

## Notes
- This is a demo scaffold to show the flow, UI screens, and privacy-first architecture. The attention detection is a lightweight, explainable heuristic (motion/activity per zone). Replace this with a proper model for production.
