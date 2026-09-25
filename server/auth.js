const jwt = require('jsonwebtoken')
function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '')
  if (!match) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] })
    if (!decoded?.id || typeof decoded.username !== 'string') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    req.admin = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
module.exports = requireAuth
