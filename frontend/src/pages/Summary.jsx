import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function Summary(){
  const { id } = useParams()
  const [report,setReport] = useState(null)

  useEffect(()=>{
    fetch(`http://localhost:4000/api/sessions/${id}/report`).then(r=>r.json()).then(setReport).catch(console.error)
  },[id])

  const downloadCSV = () => {
    if (!report) return
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Session ID', report.meta.id],
      ['Course', report.meta.course],
      ['Section', report.meta.section],
      ['Classroom', report.meta.classroom],
      ['Teacher', report.meta.teacher],
      ['Mode', report.meta.mode || 'lecture'],
      ['Start Time', new Date(report.meta.startTime).toLocaleString()],
      ['End Time', report.meta.endTime ? new Date(report.meta.endTime).toLocaleString() : 'N/A'],
      ['Duration (minutes)', report.meta.endTime ? Math.round((report.meta.endTime - report.meta.startTime) / 60000) : 'N/A'],
      ['Average Engagement', `${report.summary.average || 0}%`],
      ['Total People Detected', report.summary.totalPeople || 0],
      ['Eyes Closed Events', report.summary.eyesClosedCount || 0],
      ['Head Pose Warnings', report.summary.headPoseWarnings || 0],
      ['Gaze Warnings', report.summary.gazeWarnings || 0],
      ['Malpractice Warnings', report.summary.malpracticeWarnings || 0],
      ...Object.entries(report.summary.zones || {}).map(([zone, score]) => [`Zone ${zone}`, `${score}%`])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session_${report.meta.id}_report.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if(!report) return <div style={{maxWidth:900,margin:'20px auto'}} className="card">Loading...</div>

  const zones = report.summary?.zones || {}
  const zoneEntries = Object.entries(zones)
  const sortedZonesDesc = zoneEntries.slice().sort((a,b)=>b[1]-a[1])
  const sortedZonesAsc = zoneEntries.slice().sort((a,b)=>a[1]-b[1])
  const topZones = sortedZonesDesc.slice(0,3)
  const bottomZones = sortedZonesAsc.slice(0,3)
  const isExamMode = report.meta.mode === 'exam'
  const avgScore = report.summary.average ?? 0

  // Simple score interpretation
  const getScoreLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#27ae60' }
    if (score >= 70) return { label: 'Good', color: '#3498db' }
    if (score >= 45) return { label: 'Fair', color: '#f39c12' }
    return { label: 'Needs Attention', color: '#e74c3c' }
  }

  const scoreLevel = getScoreLevel(avgScore)

  return (
    <div style={{maxWidth:1100,margin:'20px auto',display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
      <div>
        <div className="nav">
          <div style={{fontWeight:700}}>ClassEngage - Session Report</div>
          <div />
        </div>

        {/* Main Summary Card */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <div>
              <h3 style={{margin:'0 0 8px 0'}}>Session Summary</h3>
              <div className="small" style={{color:'#7f8c8d'}}>
                {report.meta.course} / {report.meta.section} - {report.meta.classroom}
              </div>
              <div className="small" style={{color:'#7f8c8d'}}>
                Teacher: {report.meta.teacher}
              </div>
              <div className="small" style={{color:'#7f8c8d'}}>
                Duration: {report.meta.endTime ? Math.round((report.meta.endTime - report.meta.startTime) / 60000) : 'N/A'} minutes
              </div>
            </div>
            <button className="btn" onClick={downloadCSV} style={{background:'#27ae60',padding:'8px 16px'}}>
              Download CSV
            </button>
          </div>

          {/* Big Score Display */}
          <div style={{
            background: `${scoreLevel.color}15`,
            border: `2px solid ${scoreLevel.color}`,
            borderRadius: 8,
            padding: 20,
            textAlign: 'center',
            marginTop: 16
          }}>
            <div style={{fontSize: 48, fontWeight: 700, color: scoreLevel.color}}>
              {avgScore}%
            </div>
            <div style={{fontSize: 18, fontWeight: 600, color: scoreLevel.color, marginTop: 4}}>
              {scoreLevel.label}
            </div>
            <div className="small" style={{marginTop: 8, color: '#7f8c8d'}}>
              Overall {isExamMode ? 'Behavior Score' : 'Class Engagement'}
            </div>
          </div>
        </div>

        {/* What This Means */}
        <div className="card">
          <h4 style={{marginBottom:12}}>📊 What This Means</h4>
          <div style={{fontSize:15,lineHeight:1.6}}>
            {avgScore >= 90 && (
              <p>Your class showed {isExamMode ? 'excellent compliance' : 'outstanding engagement'}! Students were {isExamMode ? 'focused on their exam' : 'attentive and focused'} throughout the session.</p>
            )}
            {avgScore >= 70 && avgScore < 90 && (
              <p>Your class showed {isExamMode ? 'good behavior' : 'solid engagement'}. Most students were {isExamMode ? 'following exam protocols' : 'paying attention'}, with some minor distractions.</p>
            )}
            {avgScore >= 45 && avgScore < 70 && (
              <p>Your class showed {isExamMode ? 'mixed compliance' : 'moderate engagement'}. Some students were {isExamMode ? 'distracted or looking away' : 'less attentive'}. Consider the suggestions below.</p>
            )}
            {avgScore < 45 && (
              <p>Your class showed {isExamMode ? 'concerning behavior patterns' : 'low engagement'}. Many students appeared {isExamMode ? 'distracted or non-compliant' : 'disengaged or tired'}. Review the action items below.</p>
            )}
          </div>
        </div>

        {/* Classroom Zones */}
        {zoneEntries.length > 0 && (
          <div className="card">
            <h4 style={{marginBottom:12}}>📍 Classroom Zones</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:12}}>
              {zoneEntries.map(([zone, score]) => {
                const zoneLevel = getScoreLevel(score)
                return (
                  <div key={zone} style={{
                    background: `${zoneLevel.color}10`,
                    border: `1px solid ${zoneLevel.color}40`,
                    borderRadius: 6,
                    padding: 12,
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize:24,fontWeight:700,color:zoneLevel.color}}>{score}%</div>
                    <div className="small" style={{marginTop:4}}>Zone {zone}</div>
                  </div>
                )
              })}
            </div>
            {topZones.length > 0 && bottomZones.length > 0 && (
              <div style={{marginTop:16,fontSize:14}}>
                <div>✅ <strong>Best zones:</strong> {topZones.map(([k,v])=>`Zone ${k} (${v}%)`).join(', ')}</div>
                <div style={{marginTop:6}}>⚠️ <strong>Need attention:</strong> {bottomZones.map(([k,v])=>`Zone ${k} (${v}%)`).join(', ')}</div>
              </div>
            )}
          </div>
        )}

        {/* Action Items */}
        <div className="card">
          <h4 style={{marginBottom:12}}>💡 What You Can Do</h4>
          <div style={{fontSize:15,lineHeight:1.8}}>
            {avgScore < 70 && !isExamMode && (
              <>
                <div>• <strong>Ask questions</strong> to students in low-scoring zones</div>
                <div>• <strong>Try group activities</strong> to re-engage the class</div>
                <div>• <strong>Take a short break</strong> if students seem tired</div>
                <div>• <strong>Change your pace</strong> - speed up or slow down based on attention</div>
              </>
            )}
            {avgScore >= 70 && !isExamMode && (
              <>
                <div>• <strong>Keep up the good work!</strong> Your teaching style is working</div>
                <div>• <strong>Monitor low-scoring zones</strong> with occasional check-ins</div>
                <div>• <strong>Maintain your pace</strong> - students are following along</div>
              </>
            )}
            {isExamMode && (report.summary.malpracticeWarnings || 0) >= 5 && (
              <>
                <div style={{color:'#e74c3c'}}>• <strong>Review flagged behavior</strong> - potential exam violations detected</div>
                <div>• <strong>Check low-scoring zones</strong> for suspicious activity</div>
                <div>• <strong>Follow up</strong> with students who had multiple warnings</div>
              </>
            )}
            {isExamMode && (report.summary.malpracticeWarnings || 0) < 5 && (
              <>
                <div>• <strong>Exam went smoothly</strong> - no major concerns detected</div>
                <div>• <strong>Standard monitoring</strong> is sufficient for this group</div>
              </>
            )}
          </div>
        </div>

        {/* Detailed Metrics - Moved to bottom */}
        <div className="card" style={{background:'#f8f9fa'}}>
          <h4 style={{marginBottom:12}}>📈 Detailed Metrics</h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:16,fontSize:14}}>
            <div>
              <div style={{fontWeight:600,marginBottom:8}}>Detection Stats</div>
              <div className="small">People detected: {report.summary.totalPeople || 0}</div>
              <div className="small">Avg in frame: {report.summary.avgPeopleCount || 0}</div>
            </div>
            <div>
              <div style={{fontWeight:600,marginBottom:8}}>Behavior Events</div>
              <div className="small">Eyes closed: {report.summary.eyesClosedCount || 0}</div>
              <div className="small">Head pose warnings: {report.summary.headPoseWarnings || 0}</div>
              <div className="small">Gaze warnings: {report.summary.gazeWarnings || 0}</div>
              {isExamMode && (
                <div className="small" style={{color: (report.summary.malpracticeWarnings || 0) >= 5 ? '#e74c3c' : '#7f8c8d'}}>
                  Malpractice flags: {report.summary.malpracticeWarnings || 0}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <Link to="/dashboard"><button className="btn">Back to Dashboard</button></Link>
        </div>
      </div>

      {/* Sidebar Guide */}
      <div className="card" style={{position:'sticky',top:20,height:'fit-content'}}>
        <h4 style={{marginBottom:12}}>📖 Quick Guide</h4>
        
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:600,marginBottom:8}}>Understanding Scores</div>
          <div style={{fontSize:13,lineHeight:1.6}}>
            <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
              <div style={{width:12,height:12,background:'#27ae60',borderRadius:2,marginRight:8}}></div>
              <span><strong>90-100%:</strong> Excellent</span>
            </div>
            <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
              <div style={{width:12,height:12,background:'#3498db',borderRadius:2,marginRight:8}}></div>
              <span><strong>70-89%:</strong> Good</span>
            </div>
            <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
              <div style={{width:12,height:12,background:'#f39c12',borderRadius:2,marginRight:8}}></div>
              <span><strong>45-69%:</strong> Fair</span>
            </div>
            <div style={{display:'flex',alignItems:'center'}}>
              <div style={{width:12,height:12,background:'#e74c3c',borderRadius:2,marginRight:8}}></div>
              <span><strong>Below 45%:</strong> Needs Help</span>
            </div>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontWeight:600,marginBottom:8}}>What We Track</div>
          <div style={{fontSize:13,lineHeight:1.6}}>
            {isExamMode ? (
              <>
                <div>• Students looking at their exam</div>
                <div>• Head position and movement</div>
                <div>• Eye gaze direction</div>
                <div>• Suspicious behavior patterns</div>
              </>
            ) : (
              <>
                <div>• Students looking at the board</div>
                <div>• Eye contact and attention</div>
                <div>• Signs of fatigue or distraction</div>
                <div>• Overall class focus</div>
              </>
            )}
          </div>
        </div>

        <div style={{background:'#ecf0f1',padding:12,borderRadius:6,fontSize:13}}>
          <div style={{fontWeight:600,marginBottom:6}}>💡 Pro Tip</div>
          <div style={{lineHeight:1.5}}>
            {isExamMode ? 
              'Use zone scores to identify areas that may need closer monitoring during future exams.' :
              'Low scores don\'t mean bad teaching! They help you identify when students need a different approach.'
            }
          </div>
        </div>
      </div>
    </div>
  )
}
