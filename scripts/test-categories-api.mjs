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
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

async function run() {
  console.log(`[test] Base URL: ${BASE_URL}`);

  // 1) Listado base
  const listBase = await requestJson('/api/categories?limit=1&offset=0');
  assert(listBase.res.ok, `GET /api/categories failed with status ${listBase.res.status}`);
  assert(Array.isArray(listBase.json.items), 'items no es un array');
  assert(typeof listBase.json.total === 'number', 'total no es number');

  // 2) Crear categoria de prueba
  const stamp = Date.now();
  const slug = `test-cat-${stamp}`;
  const createRes = await requestJson('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Test Categoria ${stamp}`,
      slug,
      type: 'course',
      is_active: true,
      sort_order: 999,
    }),
  });

  assert(createRes.res.ok, `POST /api/categories failed with status ${createRes.res.status}`);
  assert(createRes.json.item && createRes.json.item.id, 'no se creo item con id');

  const createdId = createRes.json.item.id;

  // 3) Buscar por slug
  const searchRes = await requestJson(`/api/categories?search=${encodeURIComponent(slug)}&limit=10&offset=0`);
  assert(searchRes.res.ok, `GET /api/categories?search failed with status ${searchRes.res.status}`);
  assert(searchRes.json.items.some((c) => c.slug === slug), 'no encontro la categoria en busqueda');

  // 4) Actualizar estado
  const patchRes = await requestJson(`/api/categories/${createdId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: false }),
  });
  assert(patchRes.res.ok, `PATCH /api/categories failed with status ${patchRes.res.status}`);
  assert(patchRes.json.item && patchRes.json.item.is_active === false, 'no actualizo el estado');

  // 5) Limpieza
  const delRes = await requestJson(`/api/categories/${createdId}`, { method: 'DELETE' });
  if (!delRes.res.ok) {
    console.warn(`[test] WARN: no se pudo eliminar (status ${delRes.res.status})`);
  }

  console.log('[test] OK', {
    total: listBase.json.total,
    sampleCount: listBase.json.items.length,
  });
}

run().catch((err) => {
  console.error('TEST FAILED:', err?.message ?? err);
  process.exit(1);
});
