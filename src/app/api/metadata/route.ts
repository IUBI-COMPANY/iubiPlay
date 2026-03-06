import { NextRequest, NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';
import { load } from 'cheerio';

type OgResult = Record<string, unknown>;

function isValidUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isLikelyNoise(url: string) {
  return /logo|icon|sprite|rating|star|favicon|badge|emoji|pixel|placeholder|loading|spinner|blank/i.test(url);
}

function toAbsoluteUrl(src: string, baseUrl: string) {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

function getImageCandidates($: ReturnType<typeof load>, el: unknown, baseUrl: string) {
  const img = $(el as never);
  const raw = [
    img.attr('data-src'),
    img.attr('data-lazy-src'),
    img.attr('data-original'),
    img.attr('data-srcset'),
    img.attr('srcset'),
    img.attr('src'),
  ].filter(Boolean) as string[];

  const candidates: string[] = [];
  for (const value of raw) {
    const first = value.split(',')[0]?.trim().split(' ')[0];
    if (!first) continue;
    const absolute = toAbsoluteUrl(first, baseUrl);
    if (absolute) candidates.push(absolute);
  }

  return Array.from(new Set(candidates));
}

function findContentImage(html: string, baseUrl: string) {
  const $ = load(html);
  const selectors = ['article img', '.entry-content img', '.post-content img', 'main img'];

  for (const selector of selectors) {
    const images = $(selector).toArray();
    for (const el of images) {
      const candidates = getImageCandidates($, el, baseUrl);
      for (const candidate of candidates) {
        if (!candidate || isLikelyNoise(candidate)) continue;
        if (candidate.toLowerCase().endsWith('.gif')) continue;

        const img = $(el as never);
        const width = Number(img.attr('width') ?? 0);
        const height = Number(img.attr('height') ?? 0);
        if (width && width < 120 && height && height < 120) continue;

        return candidate;
      }
    }
  }

  return null;
}

function extractDescription(result: OgResult, html: string | null) {
  const ogDescription = typeof result.ogDescription === 'string' ? result.ogDescription : null;
  const twitterDescription = typeof result.twitterDescription === 'string' ? result.twitterDescription : null;
  const description = typeof result.description === 'string' ? result.description : null;

  if (ogDescription) return ogDescription;
  if (twitterDescription) return twitterDescription;
  if (description) return description;
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

function pickOgImage(result: OgResult): string | null {
  const ogImage = result.ogImage as unknown;
  if (Array.isArray(ogImage)) {
    const first = ogImage[0] as Record<string, unknown> | undefined;
    if (first && typeof first.url === 'string') return first.url;
  }
  if (ogImage && typeof (ogImage as Record<string, unknown>).url === 'string') {
    return (ogImage as Record<string, unknown>).url as string;
  }
  return null;
}

function pickTwitterImage(result: OgResult): string | null {
  const twitterImage = result.twitterImage as unknown;
  if (Array.isArray(twitterImage)) {
    const first = twitterImage[0] as Record<string, unknown> | undefined;
    if (first && typeof first.url === 'string') return first.url;
  }
  if (twitterImage && typeof (twitterImage as Record<string, unknown>).url === 'string') {
    return (twitterImage as Record<string, unknown>).url as string;
  }
  return null;
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'IubiPlayBot/1.0 (+https://example.com)' },
  });
  if (!res.ok) return null;
  return await res.text();
}

export async function GET(req: NextRequest) {
  const urlParam = new URL(req.url).searchParams.get('url');
  const url = isValidUrl(urlParam);
  if (!url) {
    return NextResponse.json({ ok: false, message: 'URL invalida' }, { status: 400 });
  }

  const { result, error } = await ogs({
    url,
    timeout: 10000,
  });

  if (error) {
    return NextResponse.json({ ok: false, message: 'No se pudo extraer metadatos' }, { status: 502 });
  }

  const ogResult = result as OgResult;
  const html = await fetchHtml(url);
  const description = extractDescription(ogResult, html);
  const ogImage = pickOgImage(ogResult);
  const twitterImage = pickTwitterImage(ogResult);
  const fallbackImage = html ? findContentImage(html, url) : null;
  const image = ogImage || twitterImage || fallbackImage || null;

  return NextResponse.json({
    ok: true,
    data: {
      url,
      title:
        (typeof ogResult.ogTitle === 'string' && ogResult.ogTitle) ||
        (typeof ogResult.twitterTitle === 'string' && ogResult.twitterTitle) ||
        (typeof ogResult.title === 'string' && ogResult.title) ||
        null,
      description,
      image,
      siteName: typeof ogResult.ogSiteName === 'string' ? ogResult.ogSiteName : null,
      canonical:
        (typeof ogResult.ogUrl === 'string' && ogResult.ogUrl) ||
        (typeof ogResult.requestUrl === 'string' && ogResult.requestUrl) ||
        url,
      type: typeof ogResult.ogType === 'string' ? ogResult.ogType : null,
    },
  });
}
