"""
Service layer for fetching and caching Pokémon data from PokeAPI.
Runs the fetch in a background thread with progress tracking.
"""
import requests
import threading
import time
import json
import os

from config import POKEAPI_BASE, POKEAPI_TIMEOUT, POKEAPI_TOTAL, POKEAPI_THROTTLE
from logger import get_logger

logger = get_logger("pokemon")

_caminho_json = "data.json"
_cache: list[dict] = []
_cache_lock = threading.Lock()
_loading = False
_load_progress = {"loaded": 0, "total": POKEAPI_TOTAL, "done": False, "error": None}


def _fetch_single(poke_id: int) -> dict:
    """Fetch a single Pokémon by ID from PokéAPI (pokemon + species data)."""
    try:
        # ── Main pokemon data ──
        res = requests.get(f"{POKEAPI_BASE}/{poke_id}", timeout=POKEAPI_TIMEOUT)
        res.raise_for_status()
        data = res.json()

        sprite = (
            data["sprites"]["front_default"]
            or data["sprites"]["other"]["official-artwork"]["front_default"]
            or ""
        )

        # Types
        types = [t["type"]["name"] for t in data.get("types", [])]
        type_primary = types[0] if types else "unknown"
        type_secondary = types[1] if len(types) > 1 else None

        # Base stats
        stats_map = {}
        for s in data.get("stats", []):
            stats_map[s["stat"]["name"]] = s["base_stat"]
        base_stats_total = sum(stats_map.values())

        # ── Species data (for habitat) ──
        habitat = "unknown"
        try:
            species_url = f"https://pokeapi.co/api/v2/pokemon-species/{poke_id}"
            species_res = requests.get(species_url, timeout=POKEAPI_TIMEOUT)
            species_res.raise_for_status()
            species_data = species_res.json()
            habitat = (species_data.get("habitat") or {}).get("name", "unknown")
        except Exception as se:
            logger.debug(f"Could not fetch species for #{poke_id}: {se}")

        return {
            "id": data["id"],
            "name": data["name"],
            "img": sprite,
            "type_primary": type_primary,
            "type_secondary": type_secondary,
            "base_stats_total": base_stats_total,
            "hp": stats_map.get("hp", 0),
            "attack": stats_map.get("attack", 0),
            "defense": stats_map.get("defense", 0),
            "sp_attack": stats_map.get("special-attack", 0),
            "sp_defense": stats_map.get("special-defense", 0),
            "speed": stats_map.get("speed", 0),
            "height": data.get("height", 0),
            "weight": data.get("weight", 0),
            "habitat": habitat,
        }
    except Exception as e:
        logger.warning(
            f"Failed to fetch Pokémon #{poke_id}: {e}",
            extra={
                "data": {
                    "event":   "pokemon_fetch_error",
                    "poke_id": poke_id,
                    "error":   str(e),
                },
            },
        )
        return {
            "id": poke_id, "name": f"pokemon-{poke_id}", "img": "",
            "type_primary": "unknown", "type_secondary": None,
            "base_stats_total": 0, "hp": 0, "attack": 0, "defense": 0,
            "sp_attack": 0, "sp_defense": 0, "speed": 0,
            "height": 0, "weight": 0, "habitat": "unknown",
        }


def _load_all_pokemon():
    """Background task: fetch all 151 Pokémon sequentially."""
    global _loading

    _load_progress["loaded"] = 0
    _load_progress["done"] = False
    _load_progress["error"] = None

    logger.info(f"Starting Pokémon load ({POKEAPI_TOTAL} total)", extra={
        "data": {"event": "pokemon_load_start", "total": POKEAPI_TOTAL},
    })

    t_start = time.perf_counter()
    result = []

    dados_arquivo = True
    
    try:
        with open(_caminho_json, "r") as arquivo:
            conteudo = arquivo.read()
            conteudo_json = json.loads(conteudo)
            
            if len(conteudo_json) == 0:
                raise FileNotFoundError("Arquivo vazio")
            
            result.extend(conteudo_json)
            _load_progress["loaded"] = len(result)
            
            elapsed = time.perf_counter() - t_start
            logger.info(
                f"Load progress: {len(result)}/{POKEAPI_TOTAL} ({len(result) / POKEAPI_TOTAL * 100:.0f}%) — {elapsed:.1f}s elapsed",
                extra={
                    "data": {
                        "event":      "pokemon_load_progress",
                        "loaded":     len(result),
                        "total":      POKEAPI_TOTAL,
                        "elapsed_s":  round(elapsed, 1),
                    },
                },
            )
            dados_arquivo = False
            print("\n\n=============================================================================\n")
            print("Dados carregados do arquivo.")
            print("\n\n=============================================================================\n")
    except FileNotFoundError:
        print("Erro: O arquivo não existe.")
        
    if dados_arquivo:
        print("\n\n=============================================================================\n")
        print("Entrei na condição de ler dadados da PokeAPI.")
        print("\n\n=============================================================================\n")
        for i in range(1, POKEAPI_TOTAL + 1):
            pokemon = _fetch_single(i)
            result.append(pokemon)
            _load_progress["loaded"] = i

            # Log progress every 25 Pokémon
            if i % 25 == 0 or i == POKEAPI_TOTAL:
                elapsed = time.perf_counter() - t_start
                logger.info(
                    f"Load progress: {i}/{POKEAPI_TOTAL} ({i / POKEAPI_TOTAL * 100:.0f}%) — {elapsed:.1f}s elapsed",
                    extra={
                        "data": {
                            "event":      "pokemon_load_progress",
                            "loaded":     i,
                            "total":      POKEAPI_TOTAL,
                            "elapsed_s":  round(elapsed, 1),
                        },
                    },
                )

            time.sleep(POKEAPI_THROTTLE)  # be kind to PokéAPI
    
        if os.path.exists(_caminho_json):
            with open(_caminho_json, "w") as outfile:
                json.dump(result, outfile)

    with _cache_lock:
        _cache.clear()
        _cache.extend(result)
    

    _load_progress["done"] = True
    _loading = False

    total_time = time.perf_counter() - t_start
    logger.info(
        f"Pokémon load complete — {len(result)} loaded in {total_time:.1f}s",
        extra={
            "data": {
                "event":       "pokemon_load_complete",
                "count":       len(result),
                "duration_s":  round(total_time, 1),
            },
        },
    )

def detail_pokemon(identifier: int | str) -> dict | None:
    
    try: 
        res = requests.get(f"{POKEAPI_BASE}/{identifier}", timeout=POKEAPI_TIMEOUT)
        res.raise_for_status()
        data = res.json()
        return data
    
    except requests.RequestException as e:
        logger.warning(f"Failed to fetch Pokémon details for {identifier}: {e}", extra={"data": {"event": "pokemon_detail_error", "identifier": identifier, "error": str(e)}})
        return None

def start_loading():
    """Start the background loading thread (if not already running)."""
    global _loading
    if not _loading and not _load_progress["done"]:
        _loading = True
        logger.info("Spawning background loader thread", extra={
            "data": {"event": "pokemon_thread_start"},
        })
        t = threading.Thread(target=_load_all_pokemon, daemon=True)
        t.start()


def get_progress() -> dict:
    return {
        "loaded": _load_progress["loaded"],
        "total":  _load_progress["total"],
        "done":   _load_progress["done"],
        "error":  _load_progress["error"],
    }


def get_all() -> list[dict]:
    with _cache_lock:
        return list(_cache)


def is_ready() -> bool:
    return _load_progress["done"] and len(_cache) == POKEAPI_TOTAL
