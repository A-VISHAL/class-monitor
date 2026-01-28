# Requirements Document

## Introduction

ClassEngage is a computer vision-powered educational monitoring application that provides real-time engagement tracking and exam proctoring capabilities. The system operates in two distinct modes to serve different classroom scenarios: monitoring student engagement during lectures and detecting malpractice during examinations.

## Glossary

- **ClassEngage_System**: The complete application including computer vision, authentication, and data management components
- **Exam_Mode**: Operational mode focused on detecting and tracking exam malpractice
- **Lecture_Mode**: Operational mode focused on measuring and displaying student engagement metrics
- **Teacher**: Authenticated user who can access dashboards and manage class data
- **Engagement_Score**: Real-time calculated metric representing student focus and attention levels
- **Malpractice_Event**: Detected suspicious behavior during exam monitoring
- **Computer_Vision_Engine**: Component responsible for face detection, pose estimation, and gaze tracking
- **Dashboard**: Web interface displaying real-time analytics and historical data for teachers

## Requirements

### Requirement 1: System Mode Management

**User Story:** As a teacher, I want to switch between exam and lecture monitoring modes, so that I can use appropriate monitoring for different classroom activities.

#### Acceptance Criteria

1. THE ClassEngage_System SHALL provide exactly two operational modes: Exam_Mode and Lecture_Mode
2. WHEN a Teacher selects a mode, THE ClassEngage_System SHALL activate the corresponding monitoring capabilities
3. WHEN switching modes, THE ClassEngage_System SHALL preserve existing session data and maintain user authentication
4. THE ClassEngage_System SHALL display the current active mode clearly in the user interface

### Requirement 2: Teacher Authentication and Access Control

**User Story:** As a teacher, I want to securely log into my individual account, so that I can access my class data and maintain privacy from other teachers.

#### Acceptance Criteria

1. WHEN a Teacher provides valid credentials, THE ClassEngage_System SHALL authenticate the user and grant access to their dashboard
2. WHEN authentication fails, THE ClassEngage_System SHALL deny access and display an appropriate error message
3. THE ClassEngage_System SHALL maintain separate data storage for each authenticated Teacher
4. WHEN a Teacher logs out, THE ClassEngage_System SHALL terminate the session and require re-authentication for access
5. THE ClassEngage_System SHALL prevent unauthorized access to other teachers' data and analytics

### Requirement 3: Computer Vision Integration

**User Story:** As a system administrator, I want the application to use computer vision for real-time student monitoring, so that engagement and behavior can be automatically tracked without manual intervention.

#### Acceptance Criteria

1. THE Computer_Vision_Engine SHALL detect and track human faces in real-time video streams
2. WHEN faces are detected, THE Computer_Vision_Engine SHALL analyze head pose direction and gaze direction
3. THE Computer_Vision_Engine SHALL detect when eyes are closed and measure duration
4. WHEN people are occluded or partially visible, THE Computer_Vision_Engine SHALL exclude them from person counts
5. THE Computer_Vision_Engine SHALL provide real-time analysis results to the monitoring system

### Requirement 4: Exam Mode Malpractice Detection

**User Story:** As a teacher, I want to monitor students during exams and detect suspicious behavior, so that I can maintain exam integrity and identify potential cheating.

#### Acceptance Criteria

1. WHEN Exam_Mode is active, THE ClassEngage_System SHALL monitor for suspicious behaviors and classify them as potential malpractice events
2. WHEN a Malpractice_Event is detected, THE ClassEngage_System SHALL issue a warning to the student
3. WHEN a student receives their 5th warning, THE ClassEngage_System SHALL mark them as having committed malpractice
4. THE ClassEngage_System SHALL maintain a count of warnings issued to each student during an exam session
5. THE ClassEngage_System SHALL log all Malpractice_Events with timestamps for later review

### Requirement 5: Lecture Mode Engagement Tracking

**User Story:** As a teacher, I want to see real-time engagement metrics during lectures, so that I can adjust my teaching approach based on student attention levels.

#### Acceptance Criteria

1. WHEN Lecture_Mode is active, THE ClassEngage_System SHALL calculate and display a real-time Engagement_Score
2. THE ClassEngage_System SHALL track eyes closed duration and maintain running counters
3. THE ClassEngage_System SHALL monitor head pose direction and maintain directional counters
4. THE ClassEngage_System SHALL track gaze direction and maintain gaze pattern counters
5. THE ClassEngage_System SHALL count the number of people visible in the camera feed
6. WHEN people become occluded, THE ClassEngage_System SHALL update the person count to exclude occluded individuals

### Requirement 6: Real-time Data Visualization

**User Story:** As a teacher, I want to see live updating graphs and metrics on my dashboard, so that I can monitor classroom dynamics as they happen.

#### Acceptance Criteria

1. THE Dashboard SHALL display real-time engagement metrics with live updating visualizations
2. WHEN new data is available, THE Dashboard SHALL update graphs and charts without requiring page refresh
3. THE Dashboard SHALL show current person count and engagement statistics in real-time
4. WHEN in Exam_Mode, THE Dashboard SHALL display current warning counts and malpractice status
5. THE Dashboard SHALL maintain responsive performance during continuous real-time updates

### Requirement 7: Data Export and Analytics

**User Story:** As a teacher, I want to export engagement data and view historical analytics, so that I can analyze student performance trends and generate reports.

#### Acceptance Criteria

1. THE ClassEngage_System SHALL export engagement data to CSV format files
2. WHEN exporting data, THE ClassEngage_System SHALL include timestamps, engagement scores, and behavioral metrics
3. THE Dashboard SHALL display historical data analysis with trend visualizations
4. THE Dashboard SHALL show a pie chart representing average engagement across all of the teacher's classes
5. THE ClassEngage_System SHALL maintain class records for each Teacher with historical session data

### Requirement 8: Data Persistence and Storage

**User Story:** As a teacher, I want my class data to be saved and retrievable, so that I can access historical information and maintain continuity across sessions.

#### Acceptance Criteria

1. THE ClassEngage_System SHALL persist all engagement data, malpractice events, and session information to a database
2. WHEN a Teacher logs in, THE ClassEngage_System SHALL retrieve and display their historical class data
3. THE ClassEngage_System SHALL maintain data integrity and prevent data loss during system operations
4. THE ClassEngage_System SHALL store data separately for each Teacher to ensure privacy and access control
5. WHEN data is updated, THE ClassEngage_System SHALL immediately persist changes to prevent data loss

### Requirement 9: Web Interface and User Experience

**User Story:** As a teacher, I want an intuitive and responsive web interface, so that I can easily navigate the system and access features efficiently.

#### Acceptance Criteria

1. THE ClassEngage_System SHALL provide a responsive web interface that works across different screen sizes
2. THE Dashboard SHALL organize information clearly with intuitive navigation between different views
3. WHEN displaying real-time data, THE Dashboard SHALL maintain smooth performance without lag or freezing
4. THE ClassEngage_System SHALL provide clear visual feedback for all user interactions and system status
5. THE Dashboard SHALL display error messages and system notifications in a user-friendly manner