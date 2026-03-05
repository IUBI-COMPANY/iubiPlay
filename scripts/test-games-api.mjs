const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Test Game ${stamp}`,
      slug,
      redirect_url: 'https://example.com/test-game',
      cover_image_url: 'https://placehold.co/600x400',
      platform: 'web',
      status: 'draft',
    }),
  });

  assert(createRes.res.ok, `POST /api/games failed with status ${createRes.res.status}`);
  assert(createRes.json.item && createRes.json.item.id, 'no se creo item con id');

  const createdId = createRes.json.item.id;

  // 3) Filtro por status draft
  const filterDraft = await requestJson('/api/games?status=draft&limit=10&offset=0');
  assert(filterDraft.res.ok, `GET /api/games?status=draft failed with status ${filterDraft.res.status}`);
  assert(filterDraft.json.items.some((g) => g.slug === slug), 'no encontro el juego en filtro draft');

  // 4) Buscar por slug
  const searchRes = await requestJson(`/api/games?search=${encodeURIComponent(slug)}&limit=10&offset=0`);
  assert(searchRes.res.ok, `GET /api/games?search failed with status ${searchRes.res.status}`);
  assert(searchRes.json.items.some((g) => g.slug === slug), 'no encontro el juego en busqueda');

  // 5) Paginacion real
  const pageRes = await requestJson('/api/games?limit=1&offset=0');
  assert(pageRes.res.ok, `GET /api/games (paginacion) failed with status ${pageRes.res.status}`);
  assert(pageRes.json.items.length <= 1, 'paginacion limit=1 no se respeta');
  assert(pageRes.json.total >= 1, 'total deberia ser >= 1');

  // 6) Limpieza (best-effort)
  const delRes = await requestJson(`/api/games/${createdId}`, { method: 'DELETE' });
  if (!delRes.res.ok) {
    const archiveRes = await requestJson(`/api/games/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
