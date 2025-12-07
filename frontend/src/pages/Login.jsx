import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const nav = useNavigate()
  return (
    <div style={{maxWidth:900,margin:'40px auto'}}>
      <div className="nav">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontWeight:700,fontSize:18}}>ClassEngage</div>
          <div className="small">Classroom engagement monitoring</div>
        </div>
        <div className="small">Demo</div>
      </div>

      <div className="card" style={{display:'flex',gap:20,marginTop:24}}>
        <div style={{flex:1}}>
          <h2>Teacher Login</h2>
          <input placeholder="Email or ID" style={{width:'100%',padding:8,marginBottom:8}} />
          <input placeholder="Password" type="password" style={{width:'100%',padding:8,marginBottom:8}} />
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={()=>nav('/dashboard')}>Sign in</button>
            <button className="btn" onClick={()=>nav('/dashboard')} style={{background:'#666'}}>Continue as Guest (Demo)</button>
          </div>
        </div>
        <div style={{width:320}}>
          <h3>Admin</h3>
          <p className="small">Click below to open admin configuration (demo).</p>
          <button className="btn" onClick={()=>nav('/admin')}>Admin Login</button>
        </div>
      </div>
    </div>
  )
}
