const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

function extractCookieValue(setCookieHeader, name) {
  if (!setCookieHeader) return null;
  const matches = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return matches ? matches[1] : null;
}

async function loginAndGetCookie() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    fail('TEST_EMAIL y TEST_PASSWORD son requeridos para pruebas con auth');
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  const setCookie = res.headers.get('set-cookie');
  if (!res.ok || !setCookie) {
    const json = await res.json().catch(() => null);
    fail(`login failed (${res.status}): ${json?.message ?? 'sin cookies'}`);
  }

  const access = extractCookieValue(setCookie, 'sb-access-token');
  const refresh = extractCookieValue(setCookie, 'sb-refresh-token');
  if (!access || !refresh) {
    fail('no se pudo extraer cookies de auth');
  }

  return `sb-access-token=${access}; sb-refresh-token=${refresh}`;
}

function fail(message) {
  console.error(`TEST FAILED: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function requestJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Accept': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

async function run() {
  console.log(`[test] Base URL: ${BASE_URL}`);

  const cookie = await loginAndGetCookie();

  // 0) Obtener categorias activas para niveles y cursos
  const categoriesRes = await requestJson('/api/categories?is_active=true&limit=500');
  assert(categoriesRes.res.ok, `GET /api/categories failed with status ${categoriesRes.res.status}`);
  const categories = Array.isArray(categoriesRes.json.items) ? categoriesRes.json.items : [];
  const levels = categories.filter((c) => c.type === 'level');
  const courses = categories.filter((c) => c.type === 'course');
  assert(levels.length > 0, 'no hay categorias de nivel para pruebas');
  assert(courses.length > 0, 'no hay categorias de curso para pruebas');

  // 1) Paginacion base
  const listBase = await requestJson('/api/games?limit=1&offset=0');
  assert(listBase.res.ok, `GET /api/games failed with status ${listBase.res.status}`);
  assert(Array.isArray(listBase.json.items), 'items no es un array');
  assert(typeof listBase.json.total === 'number', 'total no es number');
  assert(listBase.json.summary && typeof listBase.json.summary.total === 'number', 'summary.total no es number');

  // 2) Crear juego de prueba
  const stamp = Date.now();
  const slug = `test-game-${stamp}`;
  const createRes = await requestJson('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: `Test Game ${stamp}`,
      slug,
      redirect_url: 'https://example.com/test-game',
      cover_image_url: 'https://placehold.co/600x400',
      platform: 'web',
      status: 'draft',
      levels: [levels[0].id],
      courses: [courses[0].id],
    }),
  });

  assert(createRes.res.ok, `POST /api/games failed with status ${createRes.res.status}`);
  assert(createRes.json.item && createRes.json.item.id, 'no se creo item con id');

  const createdId = createRes.json.item.id;

  // 3) Editar juego
  const editRes = await requestJson(`/api/games/${createdId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ title: `Test Game ${stamp} (editado)` }),
  });
  assert(editRes.res.ok, `PATCH /api/games/:id failed with status ${editRes.res.status}`);

  // 4) Filtro por status draft
  const filterDraft = await requestJson('/api/games?status=draft&limit=10&offset=0');
  assert(filterDraft.res.ok, `GET /api/games?status=draft failed with status ${filterDraft.res.status}`);
  assert(filterDraft.json.items.some((g) => g.slug === slug), 'no encontro el juego en filtro draft');

  // 5) Buscar por slug
  const searchRes = await requestJson(`/api/games?search=${encodeURIComponent(slug)}&limit=10&offset=0`);
  assert(searchRes.res.ok, `GET /api/games?search failed with status ${searchRes.res.status}`);
  assert(searchRes.json.items.some((g) => g.slug === slug), 'no encontro el juego en busqueda');

  // 6) Paginacion real
  const pageRes = await requestJson('/api/games?limit=1&offset=0');
  assert(pageRes.res.ok, `GET /api/games (paginacion) failed with status ${pageRes.res.status}`);
  assert(pageRes.json.items.length <= 1, 'paginacion limit=1 no se respeta');
  assert(pageRes.json.total >= 1, 'total deberia ser >= 1');

  // 7) Limpieza (best-effort)
  const delRes = await requestJson(`/api/games/${createdId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  if (!delRes.res.ok) {
    const archiveRes = await requestJson(`/api/games/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ status: 'archived' }),
    });
    if (!archiveRes.res.ok) {
      console.warn(`[test] WARN: no se pudo limpiar el registro (status ${delRes.res.status})`);
    }
  }

  console.log('[test] OK', {
    total: pageRes.json.total,
    summary: pageRes.json.summary,
    sampleCount: pageRes.json.items.length,
  });
}

run().catch((err) => {
  console.error('TEST FAILED:', err?.message ?? err);
  process.exit(1);
});
