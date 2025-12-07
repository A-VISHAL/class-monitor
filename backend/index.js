const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// In-memory stores for demo. Replace with DB for production.
const SESSIONS = {}; // id -> { meta, metrics: [] }

// Admin config (simple)
const CONFIG = {
  storeRawVideo: false, // demo default: do not store raw video
  blurFacesByDefault: true,
  engagementThreshold: 50,
  alertDurationSeconds: 300
};

app.get('/api/config', (req, res) => {
  res.json(CONFIG);
});

// Start a session
app.post('/api/sessions', (req, res) => {
  const { classroom, course, section, expectedDurationMinutes, teacher } = req.body;
  const id = uuidv4();
  SESSIONS[id] = {
    meta: {
      id,
      classroom: classroom || 'Unknown',
      course: course || 'Unknown',
      section: section || 'Unknown',
      teacher: teacher || 'Teacher',
      startTime: Date.now(),
      expectedDurationMinutes: expectedDurationMinutes || 60
    },
    metrics: []
  };
  res.json({ ok: true, session: SESSIONS[id].meta });
});

// Stop a session
app.post('/api/sessions/:id/stop', (req, res) => {
  const id = req.params.id;
  const session = SESSIONS[id];
  if (!session) return res.status(404).json({ error: 'Not found' });
  session.meta.endTime = Date.now();
  res.json({ ok: true, session: session.meta });
});

// Receive anonymized metrics for a session
// Expected payload: { timestamp, overall, zones: { "Front-Left": 82, ... } }
app.post('/api/sessions/:id/metrics', (req, res) => {
  const id = req.params.id;
  const session = SESSIONS[id];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const payload = req.body;
  // Do NOT persist raw frames here. We only accept numeric aggregated metrics.
  const record = {
    receivedAt: Date.now(),
    ts: payload.timestamp || Date.now(),
    overall: Number(payload.overall) || 0,
    zones: payload.zones || {}
  };
  session.metrics.push(record);
  res.json({ ok: true });
});

// List sessions
app.get('/api/sessions', (req, res) => {
  const list = Object.values(SESSIONS).map(s => s.meta);
  res.json(list);
});

// Get session report
app.get('/api/sessions/:id/report', (req, res) => {
  const id = req.params.id;
  const session = SESSIONS[id];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const metrics = session.metrics;
  if (!metrics.length) {
    return res.json({ meta: session.meta, summary: { average: null, zones: {}, points: [] } });
  }

  // Compute overall average and per-zone averages
  const overallAvg = Math.round(metrics.reduce((s, m) => s + m.overall, 0) / metrics.length);

  const zoneSums = {};
  const zoneCounts = {};
  metrics.forEach(m => {
    Object.entries(m.zones || {}).forEach(([k, v]) => {
      zoneSums[k] = (zoneSums[k] || 0) + v;
      zoneCounts[k] = (zoneCounts[k] || 0) + 1;
    });
  });

  const zoneAverages = {};
  Object.keys(zoneSums).forEach(k => {
    zoneAverages[k] = Math.round(zoneSums[k] / zoneCounts[k]);
  });

  // Provide time-series of points for charting
  const points = metrics.map(m => ({ ts: m.ts, overall: m.overall }));

  res.json({ meta: session.meta, summary: { average: overallAvg, zones: zoneAverages, points } });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ClassEngage backend running on port ${PORT}`);
});
