import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard(){
  const nav = useNavigate()
  const [classroom,setClassroom] = useState('Lab-101')
  const [course,setCourse] = useState('CSE-A')
  const [section,setSection] = useState('DBMS')
  const [error, setError] = useState('')

  const startSession = async ()=>{
    try {
      setError('')
      console.log('Starting session with:', {classroom, course, section})
      // First, test the connection
      const testRes = await fetch('http://localhost:4000/api/config')
      console.log('Test connection status:', testRes.status)
      if (!testRes.ok) {
        throw new Error('Backend connection failed: ' + testRes.status)
      }
      const testData = await testRes.json()
      console.log('Backend config:', testData)
      
      // Call backend to create session
      const res = await fetch('http://localhost:4000/api/sessions',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({classroom,course,section,teacher:'Demo Teacher'})
      })
      console.log('Create session response status:', res.status)
      const json = await res.json()
      console.log('Create session response:', json)
      if(json.ok){
        console.log('Session created, navigating to:', `/session/live/${json.session.id}`)
        nav(`/session/live/${json.session.id}`)
      } else {
        setError('Failed to start session: ' + (json.error || 'unknown error'))
      }
    } catch (err) {
      console.error('Error starting session:', err)
      setError('Error: ' + err.message)
    }
  }

  return (
    <div style={{maxWidth:1100,margin:'20px auto'}}>
      <div className="nav">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontWeight:700,fontSize:18}}>ClassEngage</div>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div className="small">Demo Teacher</div>
          <div style={{width:36,height:36,background:'#ddd',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center'}}>DT</div>
        </div>
      </div>

      <div style={{display:'flex',gap:20,marginTop:20}}>
        <div style={{flex:1}}>
          <div className="card">
            <h3>Start New Session</h3>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <select value={classroom} onChange={e=>setClassroom(e.target.value)} style={{padding:8}}>
                <option>Lab-101</option>
                <option>Lab-202</option>
              </select>
              <input value={course} onChange={e=>setCourse(e.target.value)} placeholder="Course" style={{padding:8}} />
              <input value={section} onChange={e=>setSection(e.target.value)} placeholder="Section" style={{padding:8}} />
            </div>
            {error && <div style={{color:'#e74c3c',marginTop:8,padding:8,background:'#ffebee',borderRadius:4}}>{error}</div>}
            <div style={{marginTop:12}}>
              <button className="btn" onClick={startSession}>Start Monitoring</button>
            </div>
          </div>
        </div>
        <div style={{width:320}}>
          <div className="card">
            <h4>Today's Insights</h4>
            <div className="small">Classes monitored today: 0</div>
            <div className="small">Average engagement: --</div>
            <div className="small">Most engaged class: --</div>
          </div>
        </div>
      </div>
    </div>
  )
}
