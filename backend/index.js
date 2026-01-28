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
const TEACHERS = {}; // teacherId -> { sessions: [], profile: {} }

// Admin config (simple)
const CONFIG = {
  storeRawVideo: false, // demo default: do not store raw video
  blurFacesByDefault: true,
  engagementThreshold: 50,
  alertDurationSeconds: 300
};

// Ensure CSV directory exists
const csvDir = path.join(__dirname, 'csv_data');
if (!fs.existsSync(csvDir)) {
  fs.mkdirSync(csvDir);
}

// Teacher login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Simple demo authentication - in production use proper auth
  if (email && password) {
    const teacherId = email.split('@')[0]; // Use email prefix as ID
    if (!TEACHERS[teacherId]) {
      TEACHERS[teacherId] = {
        id: teacherId,
        email: email,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        sessions: [],
        profile: {}
      };
    }
    res.json({ ok: true, teacher: TEACHERS[teacherId] });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get teacher dashboard data
app.get('/api/teacher/:teacherId/dashboard', (req, res) => {
  const teacherId = req.params.teacherId;
  const teacher = TEACHERS[teacherId];
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  
  const teacherSessions = Object.values(SESSIONS).filter(s => s.meta.teacherId === teacherId);
  const totalSessions = teacherSessions.length;
  
  // Calculate session performance for pie chart
  const sessionPerformance = teacherSessions.map(session => {
    const avgEngagement = session.metrics.length > 0 
      ? Math.round(session.metrics.reduce((sum, m) => sum + m.overall, 0) / session.metrics.length)
      : 0;
    return {
      id: session.meta.id,
      course: session.meta.course,
      section: session.meta.section,
      engagement: avgEngagement,
      startTime: session.meta.startTime
    };
  });
  
  const avgEngagement = sessionPerformance.length > 0 
    ? Math.round(sessionPerformance.reduce((sum, s) => sum + s.engagement, 0) / sessionPerformance.length)
    : 0;
  
  res.json({
    teacher,
    stats: {
      totalSessions,
      avgEngagement,
      recentSessions: teacherSessions.slice(-5).map(s => s.meta),
      sessionPerformance
    }
  });
});

// Save session data to CSV
function saveSessionToCSV(session) {
  const teacherId = session.meta.teacherId || 'unknown';
  const csvFile = path.join(csvDir, `${teacherId}_sessions.csv`);
  
  const csvHeader = 'SessionId,Course,Section,Classroom,StartTime,EndTime,Duration,AvgEngagement,PeopleCount,EyesClosedCount,HeadPoseWarnings,GazeWarnings,MalpracticeWarnings\n';
  
  const avgEngagement = session.metrics.length > 0 
    ? Math.round(session.metrics.reduce((sum, m) => sum + m.overall, 0) / session.metrics.length)
    : 0;
  
  const duration = session.meta.endTime ? Math.round((session.meta.endTime - session.meta.startTime) / 60000) : 0;
  const peopleCount = session.metrics.length > 0 ? Math.round(session.metrics.reduce((sum, m) => sum + (m.peopleCount || 0), 0) / session.metrics.length) : 0;
  const eyesClosedCount = session.metrics.reduce((sum, m) => sum + (m.eyesClosedCount || 0), 0);
  const headPoseWarnings = session.metrics.reduce((sum, m) => sum + (m.headPoseWarnings || 0), 0);
  const gazeWarnings = session.metrics.reduce((sum, m) => sum + (m.gazeWarnings || 0), 0);
  const malpracticeWarnings = session.metrics.reduce((sum, m) => sum + (m.malpracticeWarnings || 0), 0);
  
  const csvRow = `${session.meta.id},${session.meta.course},${session.meta.section},${session.meta.classroom},${new Date(session.meta.startTime).toISOString()},${session.meta.endTime ? new Date(session.meta.endTime).toISOString() : ''},${duration},${avgEngagement},${peopleCount},${eyesClosedCount},${headPoseWarnings},${gazeWarnings},${malpracticeWarnings}\n`;
  
  if (!fs.existsSync(csvFile)) {
    fs.writeFileSync(csvFile, csvHeader);
  }
  fs.appendFileSync(csvFile, csvRow);
}

app.get('/api/config', (req, res) => {
  res.json(CONFIG);
});

// Start a session
app.post('/api/sessions', (req, res) => {
  const { classroom, course, section, expectedDurationMinutes, teacher, teacherId, mode } = req.body;
  const id = uuidv4();
  SESSIONS[id] = {
    meta: {
      id,
      classroom: classroom || 'Unknown',
      course: course || 'Unknown',
      section: section || 'Unknown',
      teacher: teacher || 'Teacher',
      teacherId: teacherId || 'demo',
      mode: mode || 'lecture', // 'lecture' or 'exam'
      startTime: Date.now(),
      expectedDurationMinutes: expectedDurationMinutes || 60
    },
    metrics: [],
    warnings: {
      malpractice: 0,
      eyesClosed: 0,
      headPose: 0,
      gaze: 0,
      sleeping: 0
    }
  };
  
  // Add session to teacher's record
  if (teacherId && TEACHERS[teacherId]) {
    TEACHERS[teacherId].sessions.push(id);
  }
  
  res.json({ ok: true, session: SESSIONS[id].meta });
});

// Stop a session
app.post('/api/sessions/:id/stop', (req, res) => {
  const id = req.params.id;
  const session = SESSIONS[id];
  if (!session) return res.status(404).json({ error: 'Not found' });
  session.meta.endTime = Date.now();
  
  // Save to CSV
  saveSessionToCSV(session);
  
  res.json({ ok: true, session: session.meta });
});

// Receive enhanced metrics for a session
app.post('/api/sessions/:id/metrics', (req, res) => {
  const id = req.params.id;
  const session = SESSIONS[id];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const payload = req.body;
  const record = {
    receivedAt: Date.now(),
    ts: payload.timestamp || Date.now(),
    overall: Number(payload.overall) || 0,
    zones: payload.zones || {},
    peopleCount: payload.peopleCount || 0,
    eyesClosedCount: payload.eyesClosedCount || 0,
    sleepingCount: payload.sleepingCount || 0,
    headPoseWarnings: payload.headPoseWarnings || 0,
    gazeWarnings: payload.gazeWarnings || 0,
    malpracticeWarnings: payload.malpracticeWarnings || 0,
    mode: session.meta.mode
  };
  
  session.metrics.push(record);
  
  // Update warning counters
  session.warnings.eyesClosed += payload.eyesClosedCount || 0;
  session.warnings.sleeping += payload.sleepingCount || 0;
  session.warnings.headPose += payload.headPoseWarnings || 0;
  session.warnings.gaze += payload.gazeWarnings || 0;
  session.warnings.malpractice += payload.malpracticeWarnings || 0;
  
  res.json({ ok: true, warnings: session.warnings });
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
    return res.json({ 
      meta: session.meta, 
      summary: { 
        average: null, 
        zones: {}, 
        points: [],
        totalPeople: 0,
        avgPeopleCount: 0,
        eyesClosedCount: 0,
        headPoseWarnings: 0,
        gazeWarnings: 0,
        malpracticeWarnings: 0
      } 
    });
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

  // Enhanced metrics calculations
  const totalPeople = metrics.reduce((sum, m) => sum + (m.peopleCount || 0), 0);
  const avgPeopleCount = Math.round(totalPeople / metrics.length);
  const eyesClosedCount = metrics.reduce((sum, m) => sum + (m.eyesClosedCount || 0), 0);
  const headPoseWarnings = metrics.reduce((sum, m) => sum + (m.headPoseWarnings || 0), 0);
  const gazeWarnings = metrics.reduce((sum, m) => sum + (m.gazeWarnings || 0), 0);
  const malpracticeWarnings = metrics.reduce((sum, m) => sum + (m.malpracticeWarnings || 0), 0);

  // Provide time-series of points for charting
  const points = metrics.map(m => ({ ts: m.ts, overall: m.overall }));

  res.json({ 
    meta: session.meta, 
    summary: { 
      average: overallAvg, 
      zones: zoneAverages, 
      points,
      totalPeople,
      avgPeopleCount,
      eyesClosedCount,
      headPoseWarnings,
      gazeWarnings,
      malpracticeWarnings
    } 
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ClassEngage backend running on port ${PORT}`);
});
