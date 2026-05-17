const BASE = "/api";

export async function loadPokemon() {
  const res = await fetch(`${BASE}/pokemon/load`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger load");
  return res.json();
}

export async function getPokemonProgress() {
  const res = await fetch(`${BASE}/pokemon/progress`);
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function getAllPokemon() {
  const res = await fetch(`${BASE}/pokemon/`);
  if (!res.ok) throw new Error("Pokémon not loaded yet");
  return res.json();
}

export async function getPokemonDetails(identifier) {
  const res = await fetch(`${BASE}/pokemon/${encodeURIComponent(identifier)}`);
  if (!res.ok) {
    let err = {};
    try {
      err = await res.json();
    } catch (_) {
      err = {};
    }

    if (res.status === 429) {
      throw new Error(err.detail || "Muitas requisições. Tente novamente em 1 minuto.");
    }

    throw new Error(err.error || err.detail || "Pokémon não encontrado.");
  }
  return res.json();
}

export async function getAlgorithms() {
  const res = await fetch(`${BASE}/sort/algorithms`);
  if (!res.ok) throw new Error("Failed to fetch algorithms");
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Sort failed");
  }
  return res.json();
}

export async function compareAlgorithms(array) {
  const res = await fetch(`${BASE}/sort/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ array }),
  });
  if (!res.ok) throw new Error("Compare failed");
  return res.json();
}
