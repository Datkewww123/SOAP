module.exports = function internalAuth(req, res, next) {
  const internalKey = req.headers['x-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid internal key' });
  }
  next();
};
