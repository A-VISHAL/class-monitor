import React, { useEffect, useState } from 'react'

export default function Admin(){
  const [config,setConfig] = useState(null)
  useEffect(()=>{ fetch('http://localhost:4000/api/config').then(r=>r.json()).then(setConfig).catch(()=> setConfig({storeRawVideo: false, blurFacesByDefault: true, engagementThreshold: 50})) },[])
  if(!config) return <div style={{maxWidth:900,margin:'20px auto'}} className="card">Loading...</div>
  return (
    <div style={{maxWidth:900,margin:'20px auto'}}>
      <div className="nav"><div style={{fontWeight:700}}>Admin</div></div>
      <div className="card">
        <h3>Policy settings</h3>
        <div className="small">Store raw video: {config.storeRawVideo ? 'Yes' : 'No (Privacy default)'}</div>
        <div className="small">Blur faces by default: {config.blurFacesByDefault ? 'Yes' : 'No'}</div>
        <div className="small">Engagement threshold: {config.engagementThreshold}%</div>
      </div>
    </div>
  )
}
