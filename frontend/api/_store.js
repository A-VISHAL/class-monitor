// Simple in-memory store for demo purposes only.
// NOTE: On Vercel serverless functions this store is ephemeral and will not persist across cold starts.

const SESSIONS = {}

module.exports = { SESSIONS }
