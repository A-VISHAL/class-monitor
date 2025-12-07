import React from 'react'

function colorFor(score){
  if(score>=70) return '#27ae60'
  if(score>=45) return '#f1c40f'
  return '#e74c3c'
}

export default function EngagementGauge({score=0}){
  const color = colorFor(score)
  return (
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <div style={{width:110,height:110,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:60,background:'#fff',boxShadow:'0 2px 6px rgba(0,0,0,0.06)'}}>
        <div className="gauge" style={{color}}>{score}</div>
      </div>
      <div>
        <div style={{fontWeight:700}}>Overall engagement</div>
        <div className="small">{score>=70? 'High': score>=45 ? 'Moderate' : 'Needs attention'}</div>
      </div>
    </div>
  )
}
