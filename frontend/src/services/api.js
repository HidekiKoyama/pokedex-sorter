const BASE = "/api";

/**
 * Erro customizado para rate-limit com tempo de espera
 */
export class RateLimitError extends Error {
  constructor(message, retryAfter = null) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    this.isRateLimit = true;
  }
}

/**
 * Trata erros HTTP, especialmente rate-limit (429)
 */
async function handleResponse(res, endpoint = "") {
  if (res.ok) {
    return res.json();
  }

  let err = {};
  try {
    err = await res.json();
  } catch (_) {
    err = {};
  }

  // Tratamento específico para rate-limit (429)
  if (res.status === 429) {
    const message = err.detail || "Limite de requisições excedido. Tente novamente em breve.";
    const retryAfter = err.retry_after || null;
    throw new RateLimitError(message, retryAfter);
  }

  // Erros genéricos
  const errorMsg = err.error || err.detail || `Erro na requisição para ${endpoint}`;
  throw new Error(errorMsg);
}

export async function loadPokemon() {
  const res = await fetch(`${BASE}/pokemon/load`, { method: "POST" });
  return handleResponse(res, "pokemon/load");
}

export async function getPokemonProgress() {
  const res = await fetch(`${BASE}/pokemon/progress`);
  return handleResponse(res, "pokemon/progress");
}

export async function getAllPokemon() {
  const res = await fetch(`${BASE}/pokemon/`);
  return handleResponse(res, "pokemon");
}

export async function getPokemonDetails(identifier) {
  const res = await fetch(`${BASE}/pokemon/${encodeURIComponent(identifier)}`);
  return handleResponse(res, `pokemon/${identifier}`);
}

export async function getAlgorithms() {
  const res = await fetch(`${BASE}/sort/algorithms`);
  return handleResponse(res, "sort/algorithms");
}

/**
 * @param {string} algorithm - bubble | selection | insertion | merge | quick
 * @param {Array}  array     - shuffled pokemon array
 * @param {string} sortBy    - sort criterion: id | name | type_primary | base_stats_total | habitat
 * @returns {{ steps, stats, complexity, total_steps, sort_key }}
 */
export async function runSort(algorithm, array, sortBy = "id") {
  const res = await fetch(`${BASE}/sort/${algorithm}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ array, sort_by: sortBy }),
  });
  return handleResponse(res, `sort/${algorithm}`);
}

export async function compareAlgorithms(array) {
  const res = await fetch(`${BASE}/sort/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ array }),
  });
  return handleResponse(res, "sort/compare");
}
