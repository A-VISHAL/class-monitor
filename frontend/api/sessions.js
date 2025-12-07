const { SESSIONS } = require('./_store')

// create a new session
module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`
    const meta = req.body?.meta || { classroom: 'demo', course: 'demo', section: 'A', teacher: 'Demo' }
    SESSIONS[id] = { id, meta, createdAt: Date.now(), metrics: [], endTime: null }
    return res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal' })
  }
}
