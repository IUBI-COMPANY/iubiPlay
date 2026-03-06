type AutofillInput = {
  url?: string | null;
  title?: string | null;
  description?: string | null;
};

type AutofillResult = {
  levelSlugs: string[];
  courseSlugs: string[];
};

const COURSE_KEYWORDS: Array<{ slug: string; keywords: string[] }> = [
  { slug: 'matematica', keywords: ['suma', 'sumas', 'resta', 'restas', 'multiplica', 'division', 'fraccion', 'matemat'] },
  { slug: 'comunicacion', keywords: ['lectura', 'leer', 'ortografia', 'escritura', 'comprension', 'lengua', 'comunic'] },
  { slug: 'ciencia-y-tecnologia', keywords: ['ciencia', 'tecnologia', 'experimento'] },
  { slug: 'biologia', keywords: ['biologia', 'celula', 'ecosistema', 'plantas', 'animales'] },
  { slug: 'quimica', keywords: ['quimica', 'atomo', 'molecula', 'reaccion'] },
  { slug: 'fisica', keywords: ['fisica', 'energia', 'fuerza', 'movimiento'] },
  { slug: 'historia', keywords: ['historia', 'civilizacion', 'independencia'] },
];

const LEVEL_PATTERNS: Array<{ slug: string; pattern: RegExp }> = [
  { slug: '1ro-primaria', pattern: /(1ro|1er|primero|1°)\s*primaria/i },
  { slug: '2do-primaria', pattern: /(2do|segundo|2°)\s*primaria/i },
  { slug: '3ro-primaria', pattern: /(3ro|tercero|3°)\s*primaria/i },
  { slug: '4to-primaria', pattern: /(4to|cuarto|4°)\s*primaria/i },
  { slug: '5to-primaria', pattern: /(5to|quinto|5°)\s*primaria/i },
  { slug: '1ro-secundaria', pattern: /(1ro|1er|primero|1°)\s*secundaria/i },
  { slug: '2do-secundaria', pattern: /(2do|segundo|2°)\s*secundaria/i },
  { slug: '3ro-secundaria', pattern: /(3ro|tercero|3°)\s*secundaria/i },
  { slug: '4to-secundaria', pattern: /(4to|cuarto|4°)\s*secundaria/i },
  { slug: '5to-secundaria', pattern: /(5to|quinto|5°)\s*secundaria/i },
];

function normalize(text: string | null | undefined) {
  return (text ?? '').toLowerCase();
}

function extractDomain(url: string | null | undefined): string {
  try {
    if (!url) return '';
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export function inferCategorySlugs(input: AutofillInput): AutofillResult {
  const text = `${normalize(input.title)} ${normalize(input.description)} ${normalize(input.url)}`;
  const domain = extractDomain(input.url);

  const courseSlugs = new Set<string>();
  const levelSlugs = new Set<string>();

  for (const { slug, keywords } of COURSE_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      courseSlugs.add(slug);
    }
  }

  for (const { slug, pattern } of LEVEL_PATTERNS) {
    if (pattern.test(text)) {
      levelSlugs.add(slug);
    }
  }

  if (domain.includes('cokitos')) {
    if (text.includes('tabla de sumar') || text.includes('sumar') || text.includes('sumas')) {
      courseSlugs.add('matematica');
    }
  }

  return {
    courseSlugs: Array.from(courseSlugs),
    levelSlugs: Array.from(levelSlugs),
  };
}
