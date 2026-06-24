module.exports = (req, res, next) => {
  const key = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'internal123';
  if (!key || key !== expectedKey) {
    return res.status(403).json({ success: false, error: 'Forbidden: invalid internal key' });
  }
  next();
};
