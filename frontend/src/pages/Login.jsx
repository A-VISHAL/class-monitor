import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        localStorage.setItem('teacher', JSON.stringify(data.teacher))
        nav('/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Connection error. Please check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    const demoTeacher = {
      id: 'demo',
      email: 'demo@school.edu',
      name: 'Demo Teacher',
      sessions: []
    }
    localStorage.setItem('teacher', JSON.stringify(demoTeacher))
    nav('/dashboard')
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px'}}>
      <div style={{maxWidth:480,width:'100%'}}>
        {/* Logo/Header */}
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:56,fontWeight:700,color:'white',marginBottom:12,letterSpacing:'-0.02em'}}>
            ClassEngage
          </div>
          <div style={{fontSize:21,color:'rgba(255,255,255,0.9)',fontWeight:400}}>
            Advanced Classroom Monitoring
          </div>
        </div>

        {/* Login Card */}
        <div className="card" style={{padding:48,boxShadow:'0 20px 60px rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)'}}>
          <h2 style={{textAlign:'center',marginBottom:32,fontSize:32}}>Welcome Back</h2>
          
          <div style={{marginBottom:20}}>
            <label style={{display:'block',marginBottom:8,fontSize:15,fontWeight:500,color:'var(--apple-dark)'}}>
              Email
            </label>
            <input 
              type="email"
              placeholder="teacher@school.edu" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{width:'100%',fontSize:16}} 
            />
          </div>

          <div style={{marginBottom:24}}>
            <label style={{display:'block',marginBottom:8,fontSize:15,fontWeight:500,color:'var(--apple-dark)'}}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              style={{width:'100%',fontSize:16}} 
            />
          </div>

          {error && (
            <div style={{
              color:'var(--apple-red)',
              marginBottom:20,
              padding:14,
              background:'rgba(255,59,48,0.1)',
              borderRadius:12,
              fontSize:14,
              textAlign:'center'
            }}>
              {error}
            </div>
          )}

          <button 
            className="btn" 
            onClick={handleLogin}
            disabled={loading}
            style={{width:'100%',padding:'16px',fontSize:17,marginBottom:12}}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button 
            className="btn" 
            onClick={handleDemoLogin} 
            style={{
              width:'100%',
              padding:'16px',
              fontSize:17,
              background:'rgba(0,0,0,0.05)',
              color:'var(--apple-dark)',
              boxShadow:'none'
            }}
          >
            Continue as Demo Teacher
          </button>
        </div>

        {/* Features */}
        <div style={{marginTop:40,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(20px)',
            padding:24,
            borderRadius:18,
            border:'1px solid rgba(255,255,255,0.2)',
            color:'white'
          }}>
            <div style={{fontSize:32,marginBottom:8}}>📚</div>
            <div style={{fontWeight:600,marginBottom:4,fontSize:17}}>Lecture Mode</div>
            <div style={{fontSize:14,opacity:0.9}}>Track engagement and focus</div>
          </div>
          
          <div style={{
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(20px)',
            padding:24,
            borderRadius:18,
            border:'1px solid rgba(255,255,255,0.2)',
            color:'white'
          }}>
            <div style={{fontSize:32,marginBottom:8}}>🎯</div>
            <div style={{fontWeight:600,marginBottom:4,fontSize:17}}>Exam Mode</div>
            <div style={{fontSize:14,opacity:0.9}}>Detect malpractice</div>
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:32,color:'rgba(255,255,255,0.8)',fontSize:14}}>
          Powered by AI • Privacy First • Real-time Analytics
        </div>
      </div>
    </div>
  )
}
