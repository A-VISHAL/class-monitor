import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function Summary(){
  const { id } = useParams()
  const [report,setReport] = useState(null)

  useEffect(()=>{
    fetch(`http://localhost:4000/api/sessions/${id}/report`).then(r=>r.json()).then(setReport).catch(console.error)
  },[id])

  if(!report) return <div style={{maxWidth:900,margin:'20px auto'}} className="card">Loading...</div>

  // derive insights
  const zones = report.summary?.zones || {}
  const zoneEntries = Object.entries(zones)
  const sortedZonesDesc = zoneEntries.slice().sort((a,b)=>b[1]-a[1])
  const sortedZonesAsc = zoneEntries.slice().sort((a,b)=>a[1]-b[1])
  const topZones = sortedZonesDesc.slice(0,3)
  const bottomZones = sortedZonesAsc.slice(0,3)

  return (
    <div style={{maxWidth:1100,margin:'20px auto',display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
      <div>
        <div className="nav">
          <div style={{fontWeight:700}}>ClassEngage</div>
          <div />
        </div>

        <div className="card">
          <h3>Session summary</h3>
          <div className="small">Class: {report.meta.classroom} - {report.meta.course} / {report.meta.section}</div>
          <div className="small">Teacher: {report.meta.teacher}</div>
          <div style={{marginTop:8}}>
            <strong>Overall engagement: {report.summary.average ?? 'N/A'}%</strong>
          </div>
        </div>

        <div className="card">
          <h4>Key insights</h4>
          <ul>
            <li><strong>Average engagement:</strong> {report.summary.average ?? 'N/A'}% — the average attention across the whole classroom during the session.</li>
            <li><strong>Best-performing zones:</strong> {topZones.length? topZones.map(([k,v])=>`${k} (${v}%)`).join(', '): 'No data'}</li>
            <li><strong>Lowest-performing zones:</strong> {bottomZones.length? bottomZones.map(([k,v])=>`${k} (${v}%)`).join(', '): 'No data'}</li>
            <li><strong>Detection stats:</strong> {report.detectionStats ? `avg faces seen: ${report.detectionStats.avgFacesDetected ?? 'N/A'}` : 'Not available'}</li>
          </ul>
        </div>

        <div style={{marginTop:12}}>
          <Link to="/dashboard"><button className="btn">Back to dashboard</button></Link>
        </div>
      </div>

      <div className="card">
        <h4>What these numbers mean</h4>
        <div className="small" style={{marginBottom:8}}>
          The values shown are anonymized engagement scores (0–100%) computed on the client. They represent the estimated attention level in each camera zone over the session. A higher percentage means students in that area were generally more attentive.
        </div>
        <div style={{marginTop:8}}>
          <strong>Quick interpretation</strong>
          <ul>
            <li>90–100%: Very engaged — keep up the current approach.</li>
            <li>70–89%: Generally attentive — consider quick checks or Q&A to keep engagement high.</li>
            <li>45–69%: Mixed attention — try calling on students in that area or vary activity.</li>
            <li>&lt;45%: Low attention — consider moving closer, asking a direct question, or changing activity.</li>
          </ul>
        </div>

        <div style={{marginTop:8}}>
          <strong>Teacher actions</strong>
          <ul>
            <li>Call out or ask a question aimed at a low-performing zone to re-engage.</li>
            <li>Use group activities, short breaks, or targeted checks on zones with persistent low scores.</li>
            <li>Review detection stats to confirm faces were visible; low face counts can bias zone averages.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
