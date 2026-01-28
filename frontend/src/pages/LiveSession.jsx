import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CameraPreview from '../components/CameraPreview'
import EngagementGauge from '../components/EngagementGauge'
import EngagementChart from '../components/EngagementChart'

export default function LiveSession(){
  const { id } = useParams()
  const nav = useNavigate()
  const [running,setRunning] = useState(true)
  const [anonymize,setAnonymize] = useState(true)
  const [points,setPoints] = useState([])
  const [zonesState,setZonesState] = useState({})
  const [overall,setOverall] = useState(0)
  const [sessionData, setSessionData] = useState(null)
  const [warnings, setWarnings] = useState({ malpractice: 0, eyesClosed: 0, headPose: 0, gaze: 0, sleeping: 0 })
  const [currentMetrics, setCurrentMetrics] = useState({
    peopleCount: 0,
    eyesClosedCount: 0,
    headPoseWarnings: 0,
    gazeWarnings: 0,
    malpracticeWarnings: 0,
    sleepingCount: 0
  })
  
  // Track cumulative session totals locally
  const sessionTotalsRef = useRef({ eyesClosed: 0, sleeping: 0, headPose: 0, gaze: 0, malpractice: 0 })

  // Fetch session data to get mode
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/sessions`)
        const sessions = await res.json()
        const session = sessions.find(s => s.id === id)
        if (session) {
          setSessionData(session)
        }
      } catch (err) {
        console.error('Failed to fetch session:', err)
      }
    }
    fetchSession()
  }, [id])

  const sendMetrics = async (payload)=>{
    try{
      const res = await fetch(`http://localhost:4000/api/sessions/${id}/metrics`,{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.warnings) {
        setWarnings(data.warnings)
      }
    }catch(e){console.warn('send error',e)}
  }

  const handleMetrics = useCallback((m)=>{
    setZonesState(m.zones)
    setOverall(m.overall)
    setCurrentMetrics({
      peopleCount: m.peopleCount || 0,
      eyesClosedCount: m.eyesClosedCount || 0,
      headPoseWarnings: m.headPoseWarnings || 0,
      gazeWarnings: m.gazeWarnings || 0,
      malpracticeWarnings: m.malpracticeWarnings || 0,
      sleepingCount: m.sleepingCount || 0
    })
    
    // Update session totals
    sessionTotalsRef.current.eyesClosed += m.eyesClosedCount || 0
    sessionTotalsRef.current.sleeping += m.sleepingCount || 0
    sessionTotalsRef.current.headPose += m.headPoseWarnings || 0
    sessionTotalsRef.current.gaze += m.gazeWarnings || 0
    sessionTotalsRef.current.malpractice += m.malpracticeWarnings || 0
    
    // Update warnings state for display
    setWarnings({
      eyesClosed: sessionTotalsRef.current.eyesClosed,
      sleeping: sessionTotalsRef.current.sleeping,
      headPose: sessionTotalsRef.current.headPose,
      gaze: sessionTotalsRef.current.gaze,
      malpractice: sessionTotalsRef.current.malpractice
    })
    
    setPoints(prev=>{
      const next = [...prev, {ts: m.timestamp, overall: m.overall}].slice(-120)
      return next
    })
    
    // send enhanced metrics to backend
    sendMetrics({ 
      timestamp: m.timestamp, 
      overall: m.overall, 
      zones: m.zones,
      peopleCount: m.peopleCount,
      eyesClosedCount: m.eyesClosedCount,
      headPoseWarnings: m.headPoseWarnings,
      gazeWarnings: m.gazeWarnings,
      malpracticeWarnings: m.malpracticeWarnings,
      sleepingCount: m.sleepingCount
    })
  },[])

  const endSession = async ()=>{
    // stop the camera first (update UI) so the component can release tracks
    setRunning(false)
    // small delay to allow cleanup to run
    await new Promise(r=>setTimeout(r, 200))
    await fetch(`http://localhost:4000/api/sessions/${id}/stop`,{method:'POST'})
    nav(`/session/${id}/summary`)
  }

  // compute zone list for display
  const zoneList = Object.entries(zonesState).map(([k,v])=>({key:k, score:v}))
  const mode = sessionData?.mode || 'lecture'
  const isExamMode = mode === 'exam'

  return (
    <div style={{minHeight:'100vh',background:'var(--apple-light-gray)'}}>
      {/* Navigation */}
      <div className="nav">
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontSize:21,fontWeight:700}}>ClassEngage</div>
          <div style={{
            padding:'6px 12px',
            background: isExamMode ? 'rgba(255,59,48,0.1)' : 'rgba(0,113,227,0.1)',
            color: isExamMode ? 'var(--apple-red)' : 'var(--apple-blue)',
            borderRadius:8,
            fontSize:14,
            fontWeight:600
          }}>
            {isExamMode ? '🎯 Exam Mode' : '📚 Lecture Mode'}
          </div>
          <span className="status-indicator green"></span>
          <span style={{fontSize:14,color:'var(--apple-gray)'}}>Live</span>
        </div>
        <div style={{display:'flex',gap:12}}>
          <button 
            className="btn" 
            onClick={()=>setRunning(s=>!s)}
            style={{background:running ? 'var(--apple-orange)' : 'var(--apple-green)',padding:'10px 20px'}}
          >
            {running? '⏸ Pause':'▶ Resume'}
          </button>
          <button 
            className="btn" 
            onClick={endSession} 
            style={{background:'var(--apple-red)',padding:'10px 20px'}}
          >
            ⏹ End Session
          </button>
        </div>
      </div>

      <div style={{maxWidth:1600,margin:'0 auto',padding:'32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 480px',gap:32}}>
          {/* Main Video Area */}
          <div>
            <div className="card" style={{padding:0,overflow:'hidden',position:'relative'}}>
              <div style={{
                position:'absolute',
                top:20,
                left:20,
                zIndex:10,
                background:'var(--blur-bg)',
                backdropFilter:'blur(20px)',
                padding:'12px 20px',
                borderRadius:12,
                fontSize:15,
                fontWeight:600,
                border:'1px solid rgba(0,0,0,0.06)'
              }}>
                {sessionData?.course} - {sessionData?.section} • {sessionData?.classroom}
              </div>
              
              <CameraPreview 
                onMetrics={handleMetrics} 
                running={running} 
                anonymize={anonymize} 
                zones={3} 
                rows={3} 
                sampleIntervalMs={3000}
                mode={mode}
              />
              
              {/* Overlay Grid */}
              <div className="overlay-grid" aria-hidden>
                {Array.from({length:3}).map((_,r)=> (
                  <div key={r} style={{display:'flex',height:`${100/3}%`}}>
                    {Array.from({length:3}).map((__,cidx)=>{
                      const key = `${r}-${cidx}`
                      const score = zonesState[key] ?? 50
                      const color = score>=70? 'rgba(48,209,88,0.2)': score>=45 ? 'rgba(255,149,0,0.25)' : 'rgba(255,59,48,0.25)'
                      return (<div key={cidx} style={{flex:1,background:color,border:'1px solid rgba(255,255,255,0.1)'}} />)
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Performance */}
            <div className="card">
              <h4 style={{marginBottom:20}}>Zone Performance</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:12}}>
                {zoneList.map(z=> (
                  <div key={z.key} style={{padding:16,background:'var(--apple-light-gray)',borderRadius:12}}>
                    <div style={{fontSize:13,color:'var(--apple-gray)',marginBottom:8}}>Zone {z.key}</div>
                    <div style={{fontSize:28,fontWeight:700,color: z.score>=70? 'var(--apple-green)': z.score>=45? 'var(--apple-orange)' : 'var(--apple-red)'}}>
                      {z.score}%
                    </div>
                    <div className="progress-bar" style={{marginTop:8}}>
                      <div 
                        className="progress-bar-fill" 
                        style={{
                          width:`${z.score}%`,
                          background: z.score>=70? 'var(--apple-green)': z.score>=45? 'var(--apple-orange)' : 'var(--apple-red)'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* Engagement Gauge */}
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h4>{isExamMode ? 'Compliance Score' : 'Engagement Score'}</h4>
                <label style={{display:'flex',alignItems:'center',gap:8,fontSize:14,cursor:'pointer'}}>
                  <input type="checkbox" checked={anonymize} onChange={e=>setAnonymize(e.target.checked)} />
                  <span>Blur Faces</span>
                </label>
              </div>
              <EngagementGauge score={overall} />
            </div>

            {/* Trend Chart */}
            <div className="card">
              <h4 style={{marginBottom:16}}>Trend</h4>
              <EngagementChart points={points.map(p=>({ts:p.ts, overall:p.overall}))} />
            </div>

            {/* Live Metrics */}
            <div className="card">
              <h4 style={{marginBottom:16}}>Live Metrics</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{padding:12,background:'var(--apple-light-gray)',borderRadius:10}}>
                  <div style={{fontSize:24,fontWeight:700,color:'var(--apple-blue)'}}>
                    {currentMetrics.peopleCount}
                  </div>
                  <div style={{fontSize:13,color:'var(--apple-gray)'}}>People</div>
                </div>
                <div style={{padding:12,background:'var(--apple-light-gray)',borderRadius:10}}>
                  <div style={{fontSize:24,fontWeight:700,color:'var(--apple-orange)'}}>
                    {currentMetrics.eyesClosedCount}
                  </div>
                  <div style={{fontSize:13,color:'var(--apple-gray)'}}>Eyes Closed (5s+)</div>
                </div>
                <div style={{padding:12,background:'var(--apple-light-gray)',borderRadius:10}}>
                  <div style={{fontSize:24,fontWeight:700,color:'var(--apple-red)'}}>
                    {currentMetrics.sleepingCount}
                  </div>
                  <div style={{fontSize:13,color:'var(--apple-gray)'}}>Sleeping (10s+)</div>
                </div>
                <div style={{padding:12,background:'var(--apple-light-gray)',borderRadius:10}}>
                  <div style={{fontSize:24,fontWeight:700,color:'var(--apple-purple)'}}>
                    {currentMetrics.headPoseWarnings}
                  </div>
                  <div style={{fontSize:13,color:'var(--apple-gray)'}}>Head Pose</div>
                </div>
              </div>
            </div>

            {/* Exam Mode Warnings */}
            {isExamMode && (
              <div className="card" style={{
                background: warnings.malpractice >= 5 ? 'rgba(255,59,48,0.1)' : 'rgba(255,149,0,0.1)',
                border: warnings.malpractice >= 5 ? '2px solid var(--apple-red)' : '2px solid var(--apple-orange)'
              }}>
                <h4 style={{color: warnings.malpractice >= 5 ? 'var(--apple-red)' : 'var(--apple-orange)',marginBottom:16}}>
                  ⚠️ Malpractice Detection
                </h4>
                <div style={{textAlign:'center',marginBottom:16}}>
                  <div style={{fontSize:48,fontWeight:700,color: warnings.malpractice >= 5 ? 'var(--apple-red)' : 'var(--apple-orange)'}}>
                    {warnings.malpractice}/5
                  </div>
                  <div style={{fontSize:14,color:'var(--apple-gray)'}}>Warnings</div>
                </div>
                {warnings.malpractice >= 5 && (
                  <div style={{
                    background:'var(--apple-red)',
                    color:'white',
                    padding:16,
                    borderRadius:12,
                    textAlign:'center',
                    fontWeight:600
                  }}>
                    🚨 MALPRACTICE DETECTED
                  </div>
                )}
              </div>
            )}

            {/* Session Totals */}
            <div className="card" style={{background:'var(--apple-light-gray)',border:'none'}}>
              <h4 style={{marginBottom:16}}>Session Totals</h4>
              <div style={{display:'grid',gap:8,fontSize:14}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'var(--apple-gray)'}}>Eyes Closed (5s+):</span>
                  <strong>{warnings.eyesClosed}</strong>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'var(--apple-gray)'}}>Sleeping (10s+):</span>
                  <strong style={{color: warnings.sleeping > 0 ? 'var(--apple-red)' : 'inherit'}}>{warnings.sleeping || 0}</strong>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'var(--apple-gray)'}}>Head Pose:</span>
                  <strong>{warnings.headPose}</strong>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'var(--apple-gray)'}}>Gaze Warnings:</span>
                  <strong>{warnings.gaze}</strong>
                </div>
                {isExamMode && (
                  <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid rgba(0,0,0,0.1)'}}>
                    <span style={{color:'var(--apple-gray)'}}>Malpractice:</span>
                    <strong style={{color: warnings.malpractice >= 5 ? 'var(--apple-red)' : 'inherit'}}>
                      {warnings.malpractice}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
