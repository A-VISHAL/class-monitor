const { SESSIONS } = require('../../_store')

module.exports = (req, res) => {
  const { id } = req.query || {}
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!id) return res.status(400).json({ error: 'missing id' })
  const session = SESSIONS[id]
  if (!session) return res.status(404).json({ error: 'not found' })

  const payload = req.body || {}
  // sanitize: only accept numeric overall and zones map
  const rec = {
    ts: payload.timestamp || Date.now(),
    overall: typeof payload.overall === 'number' ? payload.overall : null,
    zones: typeof payload.zones === 'object' ? payload.zones : {},
    facesDetected: typeof payload.facesDetected === 'number' ? payload.facesDetected : null
  }
  session.metrics.push(rec)
  return res.status(200).json({ ok: true })
}
