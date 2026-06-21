const Promotion = require('../models/Promotion');

exports.createPromotion = async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    await promotion.save();
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = active !== undefined ? { active: active === 'true' } : {};
    const promotions = await Promotion.find(filter);
    res.json(promotions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promotion deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
