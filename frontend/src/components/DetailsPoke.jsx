import React, { useEffect, useState } from "react";
import { getPokemonDetails } from "../services/api";

const SEARCH_COOLDOWN_SECONDS = 2;
const MAX_STAT = 255;

const TYPE_COLORS = {
  normal:   "#A8A878", fire:     "#F08030", water:    "#6890F0",
  electric: "#F8D030", grass:    "#78C850", ice:      "#98D8D8",
  fighting: "#C03028", poison:   "#A040A0", ground:   "#E0C068",
  flying:   "#A890F0", psychic:  "#F85888", bug:      "#A8B820",
  rock:     "#B8A038", ghost:    "#705898", dragon:   "#7038F8",
  dark:     "#705848", steel:    "#B8B8D0", fairy:    "#EE99AC",
  unknown:  "#68A090",
};

export default function DetailsPoke({ poke, onClose }) {
  const [open, setOpen] = useState(true);

  // Chamar onClose quando fechar, se callback foi fornecido
  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      // Pequeno delay para animar o fechamento
      setTimeout(onClose, 150);
    }
  };
  const [query, setQuery] = useState(poke?.id ? String(poke.id) : "");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  async function fetchPokemonDetails(identifier) {
    if (!identifier) return;
    
    setLoading(true);
    setError("");
    setCooldown(SEARCH_COOLDOWN_SECONDS);

    try {
      const data = await getPokemonDetails(identifier);
      setDetails(data);
    } catch (err) {
      setDetails(null);
      setError(err.message || "Erro ao buscar detalhes do Pokémon.");
    } finally {
      setLoading(false);
    }
  }

  // Se receber um poke por prop, preenche a query e busca automaticamente
  useEffect(() => {
    if (poke?.id) {
      const idStr = String(poke.id);
      setQuery(idStr);
      // Ignora o cooldown se veio pela prop (ex: clicou no card)
      fetchPokemonDetails(idStr);
    }
  }, [poke]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSearch(e) {
    if (e) e.preventDefault();

    const identifier = query.trim().toLowerCase();
    if (!identifier) {
      setError("Informe um id ou nome de Pokémon.");
      return;
    }
    if (loading || cooldown > 0) return;

    fetchPokemonDetails(identifier);
  }

  if (!open) {
    if (onClose) {
      return null; // Se veio do CardGrid, retorna null para limpar state
    }
    return (
      <div style={closedStateStyle}>
        <h2 style={closedTitleStyle}>Detalhes do Pokémon</h2>
        <button onClick={() => setOpen(true)} style={primaryButtonStyle}>
          Abrir busca
        </button>
      </div>
    );
  }

  const canSearch = Boolean(query.trim()) && !loading && cooldown === 0;

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-poke-title"
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>Pokédex</div>
            <h2 id="details-poke-title" style={modalTitleStyle}>Detalhes do Pokémon</h2>
          </div>
          <button onClick={handleClose} aria-label="Fechar" style={closeButtonStyle}>×</button>
        </div>

        <form onSubmit={handleSearch} style={searchFormStyle}>
          <input
            // value={query}
            onChange={(e) => setQuery(e.target.value)}
            // onChange={(e) => console.log(e.target.value)}
            placeholder="ID ou nome"
            aria-label="ID ou nome do Pokémon"
            style={searchInputStyle}
          />
          <button type="submit" disabled={!canSearch} style={{ ...primaryButtonStyle, opacity: canSearch ? 1 : 0.55 }}>
            {loading ? "Buscando..." : cooldown > 0 ? `Aguarde ${cooldown}s` : "Buscar"}
          </button>
        </form>

        {error && <div style={errorStyle}>{error}</div>}

        {loading && (
          <div style={loadingStyle}>Carregando detalhes...</div>
        )}

        {!details && !loading && (
          <EmptySearch poke={poke} onPick={(value) => setQuery(String(value))} />
        )}

        {details && !loading && <PokemonDetails pokemon={details} />}
      </div>
    </div>
  );
}

function EmptySearch({ poke, onPick }) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyPokeballStyle}>
        <div style={emptyPokeballCenterStyle} />
      </div>
      <div style={{ color: "#9ca3af", fontSize: 13 }}>
        Busque por id ou nome para visualizar os dados completos da API.
      </div>
      {poke?.id && (
        <button onClick={() => onPick(poke.id)} style={ghostButtonStyle}>
          Usar #{String(poke.id).padStart(3, "0")} {formatName(poke.name)}
        </button>
      )}
    </div>
  );
}

function PokemonDetails({ pokemon }) {
  const sprite = getBestSprite(pokemon);
  const statsTotal = (pokemon.stats || []).reduce((sum, item) => sum + (item.base_stat || 0), 0);
  const types = pokemon.types || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={summaryLayoutStyle}>
        <div style={spritePanelStyle}>
          {sprite
            ? <img src={sprite} alt={pokemon.name} style={mainSpriteStyle} />
            : <div style={spriteFallbackStyle}>?</div>
          }
        </div>

        <div>
          <div style={pokemonNumberStyle}>#{String(pokemon.id).padStart(3, "0")}</div>
          <h3 style={pokemonNameStyle}>{formatName(pokemon.name)}</h3>
          <div style={typeRowStyle}>
            {types.map((item) => (
              <TypeBadge key={`${item.slot}-${item.type?.name}`} type={item.type?.name} />
            ))}
          </div>

          <div style={metricsGridStyle}>
            <Metric label="Experiência" value={pokemon.base_experience ?? "—"} />
            <Metric label="Altura" value={formatHeight(pokemon.height)} />
            <Metric label="Peso" value={formatWeight(pokemon.weight)} />
            <Metric label="Stats total" value={statsTotal} />
            <Metric label="Ordem" value={pokemon.order ?? "—"} />
            <Metric label="Padrão" value={pokemon.is_default ? "Sim" : "Não"} />
          </div>
        </div>
      </div>

      <Section title="Status">
        <StatsList stats={pokemon.stats || []} />
      </Section>

      <Section title="Identidade">
        <div style={infoGridStyle}>
          <Info label="ID" value={pokemon.id} />
          <Info label="Nome" value={formatName(pokemon.name)} />
          <Info label="Espécie" value={<ResourceLink resource={pokemon.species} />} />
          <Info label="Encontros" value={<DataLink url={pokemon.location_area_encounters}>location_area_encounters</DataLink>} />
        </div>
      </Section>

      <Section title="Tipos e habilidades">
        <div style={twoColumnStyle}>
          <div>
            <SubTitle>Tipos</SubTitle>
            <div style={typeRowStyle}>
              {types.length
                ? types.map((item) => <TypeBadge key={item.slot} type={item.type?.name} />)
                : <EmptyValue />
              }
            </div>
          </div>
          <div>
            <SubTitle>Habilidades</SubTitle>
            <AbilityList abilities={pokemon.abilities || []} />
          </div>
        </div>
      </Section>

      <Section title="Sprites">
        <SpriteGallery pokemon={pokemon} />
      </Section>

      <Section title="Formas e itens">
        <div style={twoColumnStyle}>
          <div>
            <SubTitle>Formas</SubTitle>
            <NamedResourceList items={pokemon.forms || []} />
          </div>
          <div>
            <SubTitle>Itens segurados</SubTitle>
            <HeldItems items={pokemon.held_items || []} />
          </div>
        </div>
      </Section>

      <Section title="Jogos">
        <GameIndices items={pokemon.game_indices || []} />
      </Section>

      <Section title="Sons">
        <Cries cries={pokemon.cries || {}} />
      </Section>

      <Section title="Movimentos">
        <MovesList moves={pokemon.moves || []} />
      </Section>

      <Section title="Dados anteriores">
        <PastData pokemon={pokemon} />
      </Section>

      <Section title="JSON completo">
        <details style={detailsBlockStyle}>
          <summary style={summaryStyle}>Ver resposta original</summary>
          <pre style={jsonStyle}>{JSON.stringify(pokemon, null, 2)}</pre>
        </details>
      </Section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoItemStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h4 style={sectionTitleStyle}>{title}</h4>
      {children}
    </section>
  );
}

function SubTitle({ children }) {
  return <div style={subTitleStyle}>{children}</div>;
}

function EmptyValue() {
  return <span style={emptyValueStyle}>Nenhum</span>;
}

function TypeBadge({ type }) {
  if (!type) return null;
  const bg = TYPE_COLORS[type] || TYPE_COLORS.unknown;
  return (
    <span style={{ ...typeBadgeStyle, background: bg }}>
      {type}
    </span>
  );
}

function AbilityList({ abilities }) {
  if (!abilities.length) return <EmptyValue />;

  return (
    <div style={stackStyle}>
      {abilities.map((item) => (
        <div key={`${item.slot}-${item.ability?.name}`} style={lineItemStyle}>
          <span style={lineItemNameStyle}>{formatName(item.ability?.name)}</span>
          <span style={mutedStyle}>slot {item.slot}</span>
          {item.is_hidden && <span style={smallBadgeStyle}>oculta</span>}
        </div>
      ))}
    </div>
  );
}

function NamedResourceList({ items }) {
  if (!items.length) return <EmptyValue />;

  return (
    <div style={chipWrapStyle}>
      {items.map((item) => (
        <ResourceChip key={item.url || item.name} resource={item} />
      ))}
    </div>
  );
}

function HeldItems({ items }) {
  if (!items.length) return <EmptyValue />;

  return (
    <div style={stackStyle}>
      {items.map((item, index) => (
        <div key={`${item.item?.name}-${index}`} style={lineItemStyle}>
          <span style={lineItemNameStyle}>{formatName(item.item?.name)}</span>
          <span style={mutedStyle}>{(item.version_details || []).length} versões</span>
        </div>
      ))}
    </div>
  );
}

function StatsList({ stats }) {
  if (!stats.length) return <EmptyValue />;

  return (
    <div style={statsGridStyle}>
      {stats.map((item) => {
        const value = item.base_stat || 0;
        const pct = Math.min(100, Math.round((value / MAX_STAT) * 100));

        return (
          <div key={item.stat?.name} style={statItemStyle}>
            <div style={statTopLineStyle}>
              <span style={statNameStyle}>{formatName(item.stat?.name)}</span>
              <span style={statValueStyle}>{value}</span>
            </div>
            <div style={statBarTrackStyle}>
              <div style={{ ...statBarFillStyle, width: `${pct}%` }} />
            </div>
            <div style={mutedStyle}>effort {item.effort}</div>
          </div>
        );
      })}
    </div>
  );
}

function SpriteGallery({ pokemon }) {
  const sprites = pokemon.sprites || {};
  const other = sprites.other || {};
  const entries = [
    ["Frente", sprites.front_default],
    ["Shiny", sprites.front_shiny],
    ["Costas", sprites.back_default],
    ["Costas shiny", sprites.back_shiny],
    ["Oficial", other["official-artwork"]?.front_default],
    ["Oficial shiny", other["official-artwork"]?.front_shiny],
    ["Home", other.home?.front_default],
    ["Showdown", other.showdown?.front_default],
    ["Dream World", other.dream_world?.front_default],
  ].filter(([, url]) => Boolean(url));

  if (!entries.length) return <EmptyValue />;

  return (
    <div style={spriteGridStyle}>
      {entries.map(([label, url]) => (
        <div key={label} style={spriteItemStyle}>
          <img src={url} alt={`${pokemon.name} ${label}`} style={spriteImageStyle} />
          <span style={mutedStyle}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function GameIndices({ items }) {
  if (!items.length) return <EmptyValue />;

  return (
    <div style={chipWrapStyle}>
      {items.map((item) => (
        <span key={item.version?.name} style={chipStyle}>
          {formatName(item.version?.name)}: {item.game_index}
        </span>
      ))}
    </div>
  );
}

function Cries({ cries }) {
  const entries = Object.entries(cries).filter(([, url]) => Boolean(url));
  if (!entries.length) return <EmptyValue />;

  return (
    <div style={stackStyle}>
      {entries.map(([label, url]) => (
        <div key={label} style={audioItemStyle}>
          <span style={lineItemNameStyle}>{formatName(label)}</span>
          <audio controls src={url} style={{ width: "min(280px, 100%)" }} />
        </div>
      ))}
    </div>
  );
}

function MovesList({ moves }) {
  if (!moves.length) return <EmptyValue />;

  return (
    <div style={movesPanelStyle}>
      <div style={movesCountStyle}>{moves.length} movimentos</div>
      {moves.map((item) => {
        const details = item.version_group_details || [];
        return (
          <details key={item.move?.name} style={detailsBlockStyle}>
            <summary style={summaryStyle}>
              <span>{formatName(item.move?.name)}</span>
              <span style={mutedStyle}>{details.length} versões</span>
            </summary>
            <div style={moveDetailsStyle}>
              {details.length ? details.map((detail, index) => (
                <div key={`${detail.version_group?.name}-${index}`} style={moveDetailLineStyle}>
                  <span style={lineItemNameStyle}>{formatName(detail.version_group?.name)}</span>
                  <span style={mutedStyle}>método {formatName(detail.move_learn_method?.name)}</span>
                  <span style={mutedStyle}>nível {detail.level_learned_at}</span>
                  {detail.order !== null && detail.order !== undefined && (
                    <span style={mutedStyle}>ordem {detail.order}</span>
                  )}
                </div>
              )) : <EmptyValue />}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function PastData({ pokemon }) {
  const pastAbilities = pokemon.past_abilities || [];
  const pastStats = pokemon.past_stats || [];
  const pastTypes = pokemon.past_types || [];

  if (!pastAbilities.length && !pastStats.length && !pastTypes.length) {
    return <EmptyValue />;
  }

  return (
    <div style={stackStyle}>
      {pastAbilities.map((item, index) => (
        <details key={`ability-${item.generation?.name}-${index}`} style={detailsBlockStyle}>
          <summary style={summaryStyle}>Habilidades em {formatName(item.generation?.name)}</summary>
          <div style={chipWrapStyle}>
            {(item.abilities || []).map((ability, abilityIndex) => (
              <span key={abilityIndex} style={chipStyle}>
                {formatName(ability.ability?.name || "sem habilidade")}
                {ability.is_hidden ? " (oculta)" : ""}
              </span>
            ))}
          </div>
        </details>
      ))}

      {pastStats.map((item, index) => (
        <details key={`stats-${item.generation?.name}-${index}`} style={detailsBlockStyle}>
          <summary style={summaryStyle}>Stats em {formatName(item.generation?.name)}</summary>
          <div style={chipWrapStyle}>
            {(item.stats || []).map((stat) => (
              <span key={stat.stat?.name} style={chipStyle}>
                {formatName(stat.stat?.name)}: {stat.base_stat}
              </span>
            ))}
          </div>
        </details>
      ))}

      {pastTypes.map((item, index) => (
        <details key={`types-${item.generation?.name}-${index}`} style={detailsBlockStyle}>
          <summary style={summaryStyle}>Tipos em {formatName(item.generation?.name)}</summary>
          <div style={chipWrapStyle}>
            {(item.types || []).map((type) => <TypeBadge key={type.slot} type={type.type?.name} />)}
          </div>
        </details>
      ))}
    </div>
  );
}

function ResourceChip({ resource }) {
  if (!resource?.url) {
    return <span style={chipStyle}>{formatName(resource?.name)}</span>;
  }

  return (
    <a href={resource.url} target="_blank" rel="noreferrer" style={chipLinkStyle}>
      {formatName(resource.name)}
    </a>
  );
}

function ResourceLink({ resource }) {
  if (!resource) return "—";
  return <DataLink url={resource.url}>{formatName(resource.name)}</DataLink>;
}

function DataLink({ url, children }) {
  if (!url) return <span>—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={linkStyle}>
      {children || url}
    </a>
  );
}

function getBestSprite(pokemon) {
  const sprites = pokemon.sprites || {};
  return (
    sprites.other?.["official-artwork"]?.front_default
    || sprites.other?.home?.front_default
    || sprites.front_default
    || ""
  );
}

function formatName(value) {
  if (!value) return "—";
  return String(value).replace(/-/g, " ");
}

function formatHeight(value) {
  if (value === null || value === undefined) return "—";
  return `${(value / 10).toFixed(1)} m`;
}

function formatWeight(value) {
  if (value === null || value === undefined) return "—";
  return `${(value / 10).toFixed(1)} kg`;
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(0,0,0,0.74)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
};

const dialogStyle = {
  width: "min(980px, 96vw)",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "#16213e",
  color: "#f0f0f0",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
  padding: 22,
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
};

const eyebrowStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 8,
  color: "#f5c518",
  marginBottom: 7,
};

const modalTitleStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 13,
  lineHeight: 1.5,
  margin: 0,
  color: "#f0f0f0",
};

const closeButtonStyle = {
  background: "transparent",
  color: "#9ca3af",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  width: 34,
  height: 34,
  cursor: "pointer",
  fontSize: 24,
  lineHeight: 1,
};

const searchFormStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 140px",
  gap: 10,
  marginBottom: 12,
};

const searchInputStyle = {
  minWidth: 0,
  background: "#0f3460",
  color: "#f0f0f0",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "'Nunito',sans-serif",
  fontSize: 14,
  fontWeight: 700,
  outline: "none",
};

const primaryButtonStyle = {
  background: "#e94560",
  color: "white",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "10px 14px",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const ghostButtonStyle = {
  background: "transparent",
  color: "#60a5fa",
  border: "1px solid rgba(96,165,250,0.45)",
  borderRadius: 8,
  padding: "8px 12px",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  textTransform: "capitalize",
};

const errorStyle = {
  color: "#fecaca",
  background: "rgba(248,113,113,0.12)",
  border: "1px solid rgba(248,113,113,0.28)",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 12,
  fontSize: 13,
  fontWeight: 700,
};

const loadingStyle = {
  color: "#f5c518",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
  padding: "36px 0",
  textAlign: "center",
};

const emptyStateStyle = {
  minHeight: 260,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  textAlign: "center",
};

const emptyPokeballStyle = {
  width: 58,
  height: 58,
  background: "linear-gradient(180deg,#e94560 50%,white 50%)",
  borderRadius: "50%",
  border: "4px solid #222",
  position: "relative",
};

const emptyPokeballCenterStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%,-50%)",
  width: 14,
  height: 14,
  background: "white",
  borderRadius: "50%",
  border: "4px solid #222",
};

const closedStateStyle = {
  minHeight: 300,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
};

const closedTitleStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 11,
  color: "#f5c518",
};

const summaryLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "190px minmax(0, 1fr)",
  gap: 20,
  alignItems: "center",
};

const spritePanelStyle = {
  minHeight: 180,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
};

const mainSpriteStyle = {
  width: 160,
  height: 160,
  objectFit: "contain",
};

const spriteFallbackStyle = {
  width: 120,
  height: 120,
  borderRadius: "50%",
  background: "#1e293b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 46,
  fontWeight: 900,
  color: "#64748b",
};

const pokemonNumberStyle = {
  color: "#f5c518",
  fontWeight: 900,
  fontSize: 13,
};

const pokemonNameStyle = {
  margin: "2px 0 8px",
  fontSize: 30,
  lineHeight: 1.1,
  color: "#f8fafc",
  textTransform: "capitalize",
};

const typeRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 8,
  marginTop: 14,
};

const metricStyle = {
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "9px 10px",
};

const metricValueStyle = {
  color: "#f0f0f0",
  fontSize: 16,
  fontWeight: 900,
};

const metricLabelStyle = {
  color: "#9ca3af",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginTop: 2,
};

const sectionTitleStyle = {
  fontFamily: "'Press Start 2P', monospace",
  color: "#e94560",
  fontSize: 9,
  lineHeight: 1.5,
  margin: "0 0 10px",
  paddingTop: 15,
  borderTop: "1px solid rgba(255,255,255,0.09)",
};

const subTitleStyle = {
  color: "#f5c518",
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 8,
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 8,
};

const infoItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "9px 10px",
  minWidth: 0,
};

const infoLabelStyle = {
  color: "#9ca3af",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const infoValueStyle = {
  color: "#e5e7eb",
  fontSize: 13,
  fontWeight: 800,
  overflowWrap: "anywhere",
  textTransform: "capitalize",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const stackStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const lineItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "8px 10px",
};

const lineItemNameStyle = {
  color: "#f8fafc",
  fontWeight: 900,
  textTransform: "capitalize",
};

const mutedStyle = {
  color: "#9ca3af",
  fontSize: 11,
};

const smallBadgeStyle = {
  color: "#1c1917",
  background: "#f5c518",
  borderRadius: 6,
  padding: "2px 6px",
  fontSize: 10,
  fontWeight: 900,
};

const typeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 22,
  color: "#fff",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase",
  textShadow: "0 1px 1px rgba(0,0,0,0.35)",
};

const emptyValueStyle = {
  color: "#9ca3af",
  fontSize: 12,
};

const chipWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 24,
  color: "#e5e7eb",
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "capitalize",
};

const chipLinkStyle = {
  ...chipStyle,
  color: "#93c5fd",
  textDecoration: "none",
};

const linkStyle = {
  color: "#93c5fd",
  textDecoration: "none",
  overflowWrap: "anywhere",
  textTransform: "none",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 10,
};

const statItemStyle = {
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: 10,
};

const statTopLineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 6,
};

const statNameStyle = {
  color: "#e5e7eb",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "capitalize",
};

const statValueStyle = {
  color: "#f5c518",
  fontSize: 13,
  fontWeight: 900,
};

const statBarTrackStyle = {
  height: 6,
  background: "#1a1a2e",
  borderRadius: 3,
  overflow: "hidden",
  marginBottom: 5,
};

const statBarFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg,#e94560,#f5c518)",
  borderRadius: 3,
};

const spriteGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
  gap: 10,
};

const spriteItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  minHeight: 120,
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: 8,
};

const spriteImageStyle = {
  width: 80,
  height: 80,
  objectFit: "contain",
};

const audioItemStyle = {
  display: "grid",
  gridTemplateColumns: "110px minmax(0, 1fr)",
  gap: 10,
  alignItems: "center",
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: 10,
};

const movesPanelStyle = {
  maxHeight: 360,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingRight: 4,
};

const movesCountStyle = {
  color: "#9ca3af",
  fontSize: 12,
  fontWeight: 800,
};

const detailsBlockStyle = {
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "8px 10px",
};

const summaryStyle = {
  color: "#f8fafc",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "capitalize",
};

const moveDetailsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginTop: 8,
};

const moveDetailLineStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  paddingTop: 6,
};

const jsonStyle = {
  margin: "10px 0 0",
  maxHeight: 420,
  overflow: "auto",
  color: "#d1d5db",
  background: "#111827",
  borderRadius: 8,
  padding: 12,
  fontSize: 11,
};
