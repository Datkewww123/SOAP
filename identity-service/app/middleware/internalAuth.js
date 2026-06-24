module.exports = function internalAuth(req, res, next) {
  const internalKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'internal123';
  if (!internalKey || internalKey !== expectedKey) {
    return res.status(403).json({ error: 'Forbidden: Invalid internal key' });
  }
  next();
};
