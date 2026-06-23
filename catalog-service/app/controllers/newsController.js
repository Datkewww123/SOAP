const { getNews } = require('../models');

exports.createNews = async (req, res) => {
  try {
    const News = getNews();
    const news = await News.create(req.body);
    res.status(201).json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getNews = async (req, res) => {
  try {
    const News = getNews();
    const newsList = await News.findAll({
      where: { is_active: true },
      order: [['createdAt', 'DESC']],
      limit: 12,
    });
    res.json(newsList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.syncSportsNews = async (req, res) => {
  try {
    const { runSyncSafely } = require('../jobs/syncSportsNews.job');
    await runSyncSafely();
    const News = getNews();
    const count = await News.count({ where: { is_active: true } });
    res.json({ message: 'Sports news synced', activeCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNewsBySlug = async (req, res) => {
  try {
    const News = getNews();
    const news = await News.findOne({
      where: { slug: req.params.slug, is_active: true },
    });
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getNewsDetail = async (req, res) => {
  try {
    const News = getNews();
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const News = getNews();
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found' });
    await news.update(req.body);
    res.json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const News = getNews();
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found' });
    await news.destroy();
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};