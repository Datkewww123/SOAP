const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', newsController.getNews);
router.post('/sync', auth, admin, newsController.syncSportsNews);
router.post('/', auth, admin, newsController.createNews);
router.get('/slug/:slug', newsController.getNewsBySlug);
router.get('/:id', newsController.getNewsDetail);
router.put('/:id', auth, admin, newsController.updateNews);
router.delete('/:id', auth, admin, newsController.deleteNews);

module.exports = router;
