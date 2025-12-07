import React, { useState, useCallback, useEffect } from 'react'
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

  const sendMetrics = async (payload)=>{
    try{
      await fetch(`http://localhost:4000/api/sessions/${id}/metrics`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})
    }catch(e){console.warn('send error',e)}
  }

  const handleMetrics = useCallback((m)=>{
    setZonesState(m.zones)
    setOverall(m.overall)
    setPoints(prev=>{
      const next = [...prev, {ts: m.timestamp, overall: m.overall}].slice(-120)
      return next
    })
    // send anonymized numeric metrics to backend
    sendMetrics({ timestamp: m.timestamp, overall: m.overall, zones: m.zones })
  },[id])

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

  return (
    <div style={{maxWidth:1200,margin:'18px auto',display:'flex',gap:18}}>
      <div style={{flex:1}}>
        <div className="nav">
          <div style={{fontWeight:700}}>ClassEngage</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={()=>setRunning(s=>!s)}>{running? 'Pause':'Resume'}</button>
            <button className="btn" onClick={endSession} style={{background:'#c0392b'}}>End session</button>
          </div>
        </div>

        <div style={{display:'flex',gap:16,marginTop:12}}>
          <div style={{flex:1}}>
            <div className="card video-wrap">
              <div style={{position:'absolute',left:8,top:8,background:'rgba(255,255,255,0.9)',padding:6,borderRadius:6,zIndex:10}}>Session: demo</div>
              <CameraPreview onMetrics={handleMetrics} running={running} anonymize={anonymize} zones={3} rows={3} sampleIntervalMs={3000} />
              {/* overlay grid */}
              <div className="overlay-grid" aria-hidden>
                {/* Render 3x3 grid with tinted backgrounds according to latest zone score */}
                {Array.from({length:3}).map((_,r)=> (
                  <div key={r} style={{display:'flex',height:`${100/3}%`}}>
                    {Array.from({length:3}).map((__,cidx)=>{
                      const key = `${r}-${cidx}`
                      const score = zonesState[key] ?? 50
                      const color = score>=70? 'rgba(39,174,96,0.25)': score>=45 ? 'rgba(241,196,15,0.3)' : 'rgba(231,76,60,0.3)'
                      return (<div key={cidx} style={{flex:1,background:color,border:'1px solid rgba(255,255,255,0.06)'}} />)
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-panel col">
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700}}>Realtime analytics</div>
                <div>
                  <label className="small" style={{marginRight:4}}>Anonymize faces</label>
                  <input type="checkbox" checked={anonymize} onChange={e=>setAnonymize(e.target.checked)} />
                </div>
              </div>
              <EngagementGauge score={overall} />
            </div>

            <div className="card">
              <div style={{fontWeight:700,marginBottom:12}}>Engagement trend</div>
              <EngagementChart points={points.map(p=>({ts:p.ts, overall:p.overall}))} />
            </div>

            <div className="card">
              <div style={{fontWeight:700}}>Zones</div>
              <div>
                {zoneList.map(z=> (
                  <div key={z.key} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',alignItems:'center'}}>
                    <div className="small">{z.key}</div>
                    <div style={{width:120,background:'#eee',height:8,borderRadius:4,overflow:'hidden'}}>
                      <div style={{width:`${z.score}%`,height:'100%',background: z.score>=70? '#27ae60': z.score>=45? '#f1c40f' : '#e74c3c'}} />
                    </div>
                    <div style={{width:36,textAlign:'right',fontSize:12}}>{z.score}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700}}>Camera controls</div>
                <button className="btn" onClick={()=>setRunning(false)} style={{background:'#95a5a6'}}>Force stop camera</button>
              </div>
              <div className="small" style={{marginTop:8}}>If the browser camera indicator stays on after ending the session, click "Force stop camera" to immediately release the device.</div>
            </div>

            <div className="card">
              <div style={{fontWeight:700}}>Alerts</div>
              <div className="small">No active alerts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
