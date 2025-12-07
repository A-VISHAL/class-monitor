const { SESSIONS } = require('../../_store')

function aggregate(session){
  const metrics = session.metrics || []
  if(metrics.length === 0) return { summary: { average: null, zones: {} }, detectionStats: null, meta: session.meta }

  // overall avg
  const overallAvg = Math.round(metrics.reduce((s,m)=> s + (m.overall||0), 0) / metrics.length)

  // zone averages
  const zoneAcc = {}
  metrics.forEach(m=>{
    if(!m.zones) return
    Object.entries(m.zones).forEach(([k,v])=>{
      zoneAcc[k] = zoneAcc[k] || { sum:0, count:0 }
      if(typeof v === 'number'){ zoneAcc[k].sum += v; zoneAcc[k].count++ }
    })
  })
  const zones = {}
  Object.entries(zoneAcc).forEach(([k,v])=>{ zones[k] = Math.round(v.sum / v.count) })

  // detection stats
  const faceCounts = metrics.map(m=>typeof m.facesDetected === 'number' ? m.facesDetected : 0)
  const detectionStats = {
    avgFacesDetected: Math.round(faceCounts.reduce((s,n)=>s+n,0)/faceCounts.length),
    minFaces: Math.min(...faceCounts),
    maxFaces: Math.max(...faceCounts),
    totalFrames: metrics.length
  }

  return { summary: { average: overallAvg, zones }, detectionStats, meta: session.meta }
}

module.exports = (req, res) => {
  const { id } = req.query || {}
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!id) return res.status(400).json({ error: 'missing id' })
  const session = SESSIONS[id]
  if (!session) return res.status(404).json({ error: 'not found' })

  const result = aggregate(session)
  return res.status(200).json(result)
}
