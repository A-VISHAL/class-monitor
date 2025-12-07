const { SESSIONS } = require('../../_store')

module.exports = (req, res) => {
  const { id } = req.query || {}
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!id) return res.status(400).json({ error: 'missing id' })
  const session = SESSIONS[id]
  if (!session) return res.status(404).json({ error: 'not found' })

  session.endTime = Date.now()
  return res.status(200).json({ ok: true })
}
