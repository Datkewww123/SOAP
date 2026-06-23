function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&oacute;/g, 'ó')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&uacute;/g, 'ú')
    .replace(/&yacute;/g, 'ý')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&acirc;/g, 'â')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&uuml;/g, 'ü')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'");
}

function extractTag(block, tag) {
  const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i').exec(block);
  if (cdata) return decodeEntities(cdata[1].trim());

  const plain = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i').exec(block);
  return plain ? decodeEntities(plain[1].trim()) : '';
}

function stripHtml(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extractImage(block, description) {
  const enclosure = /<enclosure[^>]+url="([^"]+)"/i.exec(block);
  if (enclosure) return decodeEntities(enclosure[1]);

  const media = /url="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i.exec(description);
  if (media) return decodeEntities(media[1]);

  const img = /<img[^>]+src="([^"]+)"/i.exec(description);
  return img ? decodeEntities(img[1]) : null;
}

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');
    const description = extractTag(block, 'description');

    if (!title || !link) continue;

    items.push({
      title,
      link,
      pubDate: pubDate ? new Date(pubDate) : new Date(),
      content: stripHtml(description).slice(0, 400),
      image_url: extractImage(block, description),
    });
  }

  return items;
}

async function fetchRssFeed(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'THSPORT-NewsSync/1.0' },
  });
  if (!response.ok) throw new Error(`RSS ${url} returned ${response.status}`);
  const xml = await response.text();
  if (!xml.includes('<rss')) throw new Error(`RSS ${url} is not valid XML`);
  return parseRssItems(xml);
}

module.exports = { fetchRssFeed, parseRssItems };
