import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PieChart from '../components/PieChart'

export default function Dashboard(){
  const nav = useNavigate()
  const [classroom,setClassroom] = useState('Lab-101')
  const [course,setCourse] = useState('CSE-A')
  const [section,setSection] = useState('DBMS')
  const [mode, setMode] = useState('lecture')
  const [error, setError] = useState('')
  const [teacher, setTeacher] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    const teacherData = localStorage.getItem('teacher')
    if (!teacherData) {
      nav('/')
      return
    }
    
    const teacherObj = JSON.parse(teacherData)
    setTeacher(teacherObj)
    fetchDashboardData(teacherObj.id)
  }, [nav])

  const fetchDashboardData = async (teacherId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/teacher/${teacherId}/dashboard`)
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    }
  }

  const startSession = async ()=>{
    if (!teacher) return
    
    try {
      setError('')
      const res = await fetch('http://localhost:4000/api/sessions',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          classroom,
          course,
          section,
          teacher: teacher.name,
          teacherId: teacher.id,
          mode
        })
      })
      
      const json = await res.json()
      if(json.ok){
        nav(`/session/live/${json.session.id}`)
      } else {
        setError('Failed to start session: ' + (json.error || 'unknown error'))
      }
    } catch (err) {
      setError('Error: ' + err.message)
    }
  }

  const logout = () => {
    localStorage.removeItem('teacher')
    nav('/')
  }

  if (!teacher) return <div>Loading...</div>

  return (
    <div style={{minHeight:'100vh',background:'var(--apple-light-gray)'}}>
      {/* Navigation */}
      <div className="nav">
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          <div style={{fontSize:21,fontWeight:700,color:'var(--apple-dark)'}}>ClassEngage</div>
          <div style={{fontSize:15,color:'var(--apple-gray)'}}>Teacher Dashboard</div>
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <div style={{fontSize:15,color:'var(--apple-dark)',fontWeight:500}}>{teacher.name}</div>
          <div style={{
            width:40,
            height:40,
            background:'linear-gradient(135deg, var(--apple-blue) 0%, var(--apple-purple) 100%)',
            borderRadius:'50%',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            color:'white',
            fontWeight:600,
            fontSize:16
          }}>
            {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <button className="btn" onClick={logout} style={{background:'var(--apple-gray)',boxShadow:'none',padding:'8px 16px',fontSize:14}}>
            Logout
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400,margin:'0 auto',padding:'40px 32px'}}>
        {/* Hero Section */}
        <div style={{marginBottom:48,textAlign:'center'}}>
          <h1 style={{marginBottom:16}}>Welcome back, {teacher.name.split(' ')[0]}</h1>
          <p style={{fontSize:21,color:'var(--apple-gray)',maxWidth:600,margin:'0 auto'}}>
            Start a new monitoring session or review your teaching analytics
          </p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:32}}>
          {/* Main Content */}
          <div>
            {/* Start Session Card */}
            <div className="card" style={{background:'linear-gradient(135deg, var(--apple-blue) 0%, var(--apple-purple) 100%)',color:'white',border:'none'}}>
              <h2 style={{color:'white',marginBottom:24}}>Start New Session</h2>
              
              <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:16,marginBottom:24}}>
                <div>
                  <label style={{display:'block',marginBottom:8,fontSize:14,opacity:0.9}}>Classroom</label>
                  <select 
                    value={classroom} 
                    onChange={e=>setClassroom(e.target.value)} 
                    style={{width:'100%',background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}
                  >
                    <option style={{color:'var(--apple-dark)'}}>Lab-101</option>
                    <option style={{color:'var(--apple-dark)'}}>Lab-102</option>
                    <option style={{color:'var(--apple-dark)'}}>Lab-201</option>
                    <option style={{color:'var(--apple-dark)'}}>Lab-202</option>
                    <option style={{color:'var(--apple-dark)'}}>Classroom-A</option>
                    <option style={{color:'var(--apple-dark)'}}>Classroom-B</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:8,fontSize:14,opacity:0.9}}>Course</label>
                  <input 
                    value={course} 
                    onChange={e=>setCourse(e.target.value)} 
                    placeholder="Course" 
                    style={{width:'100%',background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}} 
                  />
                </div>
                <div>
                  <label style={{display:'block',marginBottom:8,fontSize:14,opacity:0.9}}>Section</label>
                  <input 
                    value={section} 
                    onChange={e=>setSection(e.target.value)} 
                    placeholder="Section" 
                    style={{width:'100%',background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}} 
                  />
                </div>
              </div>

              <div style={{marginBottom:24}}>
                <label style={{display:'block',marginBottom:12,fontSize:17,fontWeight:600}}>Session Mode</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div 
                    onClick={() => setMode('lecture')}
                    style={{
                      padding:20,
                      background: mode === 'lecture' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      border: mode === 'lecture' ? '2px solid white' : '2px solid transparent',
                      borderRadius:16,
                      cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >
                    <div style={{fontSize:32,marginBottom:8}}>📚</div>
                    <div style={{fontWeight:600,marginBottom:4,fontSize:17}}>Lecture Mode</div>
                    <div style={{fontSize:14,opacity:0.9}}>Focus tracking & engagement</div>
                  </div>
                  
                  <div 
                    onClick={() => setMode('exam')}
                    style={{
                      padding:20,
                      background: mode === 'exam' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      border: mode === 'exam' ? '2px solid white' : '2px solid transparent',
                      borderRadius:16,
                      cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >
                    <div style={{fontSize:32,marginBottom:8}}>🎯</div>
                    <div style={{fontWeight:600,marginBottom:4,fontSize:17}}>Exam Mode</div>
                    <div style={{fontSize:14,opacity:0.9}}>Malpractice detection</div>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{background:'rgba(255,59,48,0.2)',padding:14,borderRadius:12,marginBottom:16,fontSize:14}}>
                  {error}
                </div>
              )}

              <button 
                className="btn" 
                onClick={startSession}
                style={{width:'100%',padding:'18px',fontSize:17,background:'white',color:'var(--apple-blue)',fontWeight:600}}
              >
                Start {mode === 'exam' ? 'Exam' : 'Lecture'} Monitoring →
              </button>
            </div>

            {/* Recent Sessions */}
            {dashboardData && dashboardData.stats.recentSessions.length > 0 && (
              <div className="card">
                <h3 style={{marginBottom:20}}>Recent Sessions</h3>
                <div style={{display:'grid',gap:12}}>
                  {dashboardData.stats.recentSessions.map(session => (
                    <div 
                      key={session.id} 
                      style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        padding:20,
                        background:'var(--apple-light-gray)',
                        borderRadius:12,
                        transition:'all 0.2s',
                        cursor:'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e8e8ed'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--apple-light-gray)'}
                    >
                      <div>
                        <div style={{fontWeight:600,fontSize:17,marginBottom:4}}>
                          {session.course} - {session.section}
                        </div>
                        <div style={{fontSize:14,color:'var(--apple-gray)'}}>
                          {session.classroom} • {new Date(session.startTime).toLocaleDateString()} • {session.mode} mode
                        </div>
                      </div>
                      <button 
                        className="btn" 
                        style={{padding:'10px 20px',fontSize:14}} 
                        onClick={() => nav(`/session/${session.id}/summary`)}
                      >
                        View Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Stats Card */}
            <div className="card">
              <h4 style={{marginBottom:20}}>Your Stats</h4>
              {dashboardData ? (
                <div style={{display:'grid',gap:16}}>
                  <div style={{padding:16,background:'var(--apple-light-gray)',borderRadius:12}}>
                    <div style={{fontSize:32,fontWeight:700,color:'var(--apple-blue)',marginBottom:4}}>
                      {dashboardData.stats.totalSessions}
                    </div>
                    <div style={{fontSize:14,color:'var(--apple-gray)'}}>Total Sessions</div>
                  </div>
                  <div style={{padding:16,background:'var(--apple-light-gray)',borderRadius:12}}>
                    <div style={{fontSize:32,fontWeight:700,color:'var(--apple-green)',marginBottom:4}}>
                      {dashboardData.stats.avgEngagement}%
                    </div>
                    <div style={{fontSize:14,color:'var(--apple-gray)'}}>Avg Engagement</div>
                  </div>
                  <div style={{padding:16,background:'var(--apple-light-gray)',borderRadius:12}}>
                    <div style={{fontSize:32,fontWeight:700,color:'var(--apple-purple)',marginBottom:4}}>
                      {dashboardData.stats.recentSessions.filter(s => 
                        new Date(s.startTime).toDateString() === new Date().toDateString()
                      ).length}
                    </div>
                    <div style={{fontSize:14,color:'var(--apple-gray)'}}>Today's Classes</div>
                  </div>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:20,color:'var(--apple-gray)'}}>Loading...</div>
              )}
            </div>

            {/* Pie Chart */}
            {dashboardData && dashboardData.stats.sessionPerformance && dashboardData.stats.sessionPerformance.length > 0 && (
              <div className="card">
                <PieChart 
                  title="Class Performance"
                  data={dashboardData.stats.sessionPerformance.slice(-6).map(session => ({
                    label: `${session.course}-${session.section}`,
                    value: session.engagement || 50
                  }))}
                />
              </div>
            )}

            {/* Info Card */}
            <div className="card" style={{background:'var(--apple-light-gray)',border:'none'}}>
              <h4 style={{marginBottom:16}}>Mode Features</h4>
              <div style={{marginBottom:16}}>
                <div style={{fontWeight:600,marginBottom:8,fontSize:15}}>📚 Lecture Mode</div>
                <div style={{fontSize:13,color:'var(--apple-gray)',lineHeight:1.5}}>
                  Engagement tracking, eye closure detection, head pose & gaze monitoring
                </div>
              </div>
              <div>
                <div style={{fontWeight:600,marginBottom:8,fontSize:15}}>🎯 Exam Mode</div>
                <div style={{fontSize:13,color:'var(--apple-gray)',lineHeight:1.5}}>
                  Malpractice detection with 5-warning system, behavior analysis
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
