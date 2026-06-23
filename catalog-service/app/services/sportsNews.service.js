const { Op } = require('sequelize');
const { getNews } = require('../models');
const { fetchRssFeed } = require('../utils/rssParser');

const SPORTS_RSS_FEEDS = [
  'https://vnexpress.net/rss/the-thao.rss',
  'https://thanhnien.vn/rss/the-thao.rss',
];

const MAX_ACTIVE_NEWS = 30;
const DISPLAY_NEWS = 12;

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
}

function linkHash(link) {
  let hash = 0;
  for (let i = 0; i < link.length; i++) {
    hash = (hash * 31 + link.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

async function syncSportsNews() {
  const News = getNews();
  const collected = [];

  for (const feedUrl of SPORTS_RSS_FEEDS) {
    try {
      const items = await fetchRssFeed(feedUrl);
      collected.push(...items);
      console.log(`📰 RSS OK: ${feedUrl} (${items.length} bài)`);
    } catch (err) {
      console.warn(`⚠️ RSS lỗi ${feedUrl}: ${err.message}`);
    }
  }

  const uniqueByLink = new Map();
  for (const item of collected) {
    if (!item.link?.startsWith('http')) continue;
    if (!uniqueByLink.has(item.link)) uniqueByLink.set(item.link, item);
  }

  const sorted = [...uniqueByLink.values()]
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, MAX_ACTIVE_NEWS);

  let created = 0;
  let updated = 0;

  for (const item of sorted) {
    const slug = `${slugify(item.title)}-${linkHash(item.link)}`;
    const existing = await News.findOne({ where: { link_url: item.link } });

    if (existing) {
      await existing.update({
        title: item.title,
        content: item.content,
        image_url: item.image_url || existing.image_url,
        is_active: true,
      });
      updated++;
      continue;
    }

    await News.create({
      title: item.title,
      slug,
      content: item.content,
      image_url: item.image_url,
      link_url: item.link,
      is_active: true,
      createdAt: item.pubDate,
      updatedAt: new Date(),
    });
    created++;
  }

  const activeLinks = sorted.map((i) => i.link);
  if (activeLinks.length > 0) {
    await News.update(
      { is_active: false },
      { where: { link_url: { [Op.notIn]: activeLinks }, is_active: true } }
    );
  }

  console.log(`✅ Đồng bộ tin thể thao: ${created} mới, ${updated} cập nhật, ${sorted.length} đang hiển thị`);
  return { created, updated, total: sorted.length };
}

module.exports = { syncSportsNews, DISPLAY_NEWS, SPORTS_RSS_FEEDS };
