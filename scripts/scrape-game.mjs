import ogs from 'open-graph-scraper';
import { load } from 'cheerio';

function fail(message) {
  console.error(`[scrape] ERROR: ${message}`);
  process.exit(1);
}

function getUrlArg() {
  const urlArg = process.argv.find((arg) => arg.startsWith('--url='));
  if (urlArg) return urlArg.split('=')[1];
  const plainArg = process.argv[2];
  return plainArg || '';
}

function validateUrl(raw) {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getFlag(name) {
  return process.argv.some((arg) => arg === `--${name}`);
}

function pickImage(ogResult, htmlFallback, baseUrl, allowLogo) {
  const ogImage = ogResult?.ogImage;
  const ogImageUrl = Array.isArray(ogImage) ? ogImage[0]?.url : ogImage?.url;
  const twitterImage = ogResult?.twitterImage?.url;
  const candidate = ogImageUrl || twitterImage || null;

  if (candidate && (allowLogo || !isLikelyNoise(candidate))) {
    return candidate;
  }

  if (htmlFallback) {
    return findContentImage(htmlFallback, baseUrl) || candidate;
  }

  return candidate;
}

function isLikelyNoise(url) {
  return /logo|icon|sprite|rating|star|favicon|badge|emoji|pixel|placeholder|loading|spinner|blank/i.test(url);
}

function findContentImage(html, baseUrl) {
  const $ = load(html);

  const selectors = [
    'article img',
    '.entry-content img',
    '.post-content img',
    'main img',
  ];

  for (const selector of selectors) {
    const images = $(selector).toArray();
    for (const el of images) {
      const img = $(el);
      const candidates = getImageCandidates(img, baseUrl);
      for (const candidate of candidates) {
        if (!candidate || isLikelyNoise(candidate)) continue;
        if (candidate.toLowerCase().endsWith('.gif')) continue;

        const width = Number(img.attr('width') ?? 0);
        const height = Number(img.attr('height') ?? 0);
        if (width && width < 120 && height && height < 120) continue;

        return candidate;
      }
    }
  }

  return null;
}

function getImageCandidates(img, baseUrl) {
  const raw = [
    img.attr('data-src'),
    img.attr('data-lazy-src'),
    img.attr('data-original'),
    img.attr('data-srcset'),
    img.attr('srcset'),
    img.attr('src'),
  ].filter(Boolean);

  const candidates = [];
  for (const value of raw) {
    const first = value.split(',')[0]?.trim().split(' ')[0];
    const absolute = toAbsoluteUrl(first, baseUrl);
    if (absolute) candidates.push(absolute);
  }

  return Array.from(new Set(candidates));
}

function toAbsoluteUrl(src, baseUrl) {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractDescription(result, html) {
  if (result?.ogDescription) return result.ogDescription;
  if (result?.twitterDescription) return result.twitterDescription;
  if (result?.description) return result.description;
  if (!html) return null;

  const $ = load(html);
  const meta = $('meta[name="description"]').attr('content');
  if (meta && meta.trim()) return meta.trim();

  const paragraph = $('article p, .entry-content p, .post-content p, main p')
    .map((_, el) => $(el).text().trim())
    .get()
    .find((text) => text.length >= 60);

  return paragraph ?? null;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'IubiPlayBot/1.0 (+https://example.com)' },
  });
  if (!res.ok) return null;
  return await res.text();
}

async function run() {
  const rawUrl = getUrlArg();
  const url = validateUrl(rawUrl);
  if (!url) {
    fail('Debes proporcionar una URL valida. Ejemplo: yarn scrape:game --url=https://example.com');
  }

  const allowLogo = getFlag('allow-logo');

  const { result, error } = await ogs({
    url,
    timeout: 10000,
    headers: {
      'user-agent': 'IubiPlayBot/1.0 (+https://example.com)'
    },
  });

  if (error) {
    fail('No se pudo extraer metadatos');
  }

  const html = await fetchHtml(url);
  const description = extractDescription(result, html);
  const image = pickImage(result, html, url, allowLogo);

  const payload = {
    url,
    title: result.ogTitle || result.twitterTitle || result.title || null,
    description,
    image,
    siteName: result.ogSiteName || null,
    canonical: result.ogUrl || result.requestUrl || url,
    type: result.ogType || null,
  };

  console.log(JSON.stringify(payload, null, 2));
}

run().catch((err) => {
  fail(err?.message || 'Error inesperado');
});
