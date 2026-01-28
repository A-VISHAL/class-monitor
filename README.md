# ClassEngage — Enhanced Classroom Monitoring System

ClassEngage is an advanced classroom monitoring system with two distinct modes for different educational scenarios.

## Features

### Two Operating Modes

#### 1. Lecture Mode
- **Engagement Tracking**: Real-time focus score calculation
- **Eye Closure Detection**: Monitors student fatigue levels
- **Head Pose Direction**: Tracks where students are looking
- **Gaze Direction**: Analyzes attention patterns
- **People Counting**: Counts number of students in camera view
- **Zone-based Analytics**: Divides classroom into zones for detailed analysis

#### 2. Exam Mode
- **Malpractice Detection**: Identifies suspicious behavior
- **5-Warning System**: Flags potential cheating after 5 warnings
- **Head Movement Tracking**: Monitors excessive head turning
- **Gaze Pattern Analysis**: Detects unusual eye movements
- **Behavior Scoring**: Compliance-based scoring system

### Teacher Dashboard
- **Individual Login System**: Each teacher has their own account
- **Personal Analytics**: View your own class history and performance
- **CSV Export**: Download detailed session reports
- **Pie Chart Visualization**: See performance across all your classes
- **Real-time Monitoring**: Live metrics during sessions

### Advanced Analytics
- **Face Detection**: Uses AI to detect and track faces
- **Occlusion Handling**: Doesn't count occluded people
- **Real-time Counters**: Live tracking of various metrics
- **CSV Data Export**: Automatic data saving for analysis
- **Historical Reports**: Detailed session summaries

## Privacy & Security
- Raw video frames are processed locally and never stored
- Only anonymized numeric metrics are sent to the server
- Face detection models run entirely in the browser
- Optional face blurring for additional privacy

## Quick Start (Windows PowerShell)

### 1. Backend
```powershell
cd backend
npm install
npm start
```
Server runs on http://localhost:4000

### 2. Frontend (in a separate terminal)
```powershell
cd frontend
npm install
npm run dev
```
Application runs on http://localhost:5173

## Usage

1. **Login**: Use any email/password combination (demo mode)
2. **Select Mode**: Choose between Lecture or Exam mode
3. **Start Session**: Enter class details and begin monitoring
4. **Monitor**: View real-time analytics and metrics
5. **End Session**: Stop monitoring and view detailed report
6. **Export Data**: Download CSV reports for further analysis

## Key Metrics Tracked

### Lecture Mode Metrics
- Overall engagement percentage
- Eyes closed events count
- Head pose warnings
- Gaze direction changes
- People count in frame
- Zone-wise attention levels

### Exam Mode Metrics
- Malpractice warning count (max 5)
- Suspicious behavior detection
- Head movement violations
- Gaze pattern anomalies
- Compliance scoring

## Technology Stack

### Frontend
- React 18 with Vite
- Face-API.js for AI-powered face detection
- Chart.js for data visualization
- React Router for navigation

### Backend
- Node.js with Express
- CORS enabled for cross-origin requests
- CSV file generation for data export
- In-memory session storage (demo)

## Data Export

All session data is automatically saved to CSV files in the `backend/csv_data/` directory, organized by teacher ID. Each CSV contains:

- Session metadata (course, section, classroom, duration)
- Engagement/compliance scores
- Behavioral metrics (eye closure, head pose, gaze)
- Warning counts and malpractice flags

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari (limited face detection support)
- Edge

**Note**: Camera access requires HTTPS in production environments.

## Demo Features

- No database required - uses in-memory storage
- Automatic face detection model loading
- Real-time video processing
- Anonymous face blurring option
- Responsive design for various screen sizes
