import React, { useState } from "react";

const TYPE_COLORS = {
  normal:   "#A8A878", fire:     "#F08030", water:    "#6890F0",
  electric: "#F8D030", grass:    "#78C850", ice:      "#98D8D8",
  fighting: "#C03028", poison:   "#A040A0", ground:   "#E0C068",
  flying:   "#A890F0", psychic:  "#F85888", bug:      "#A8B820",
  rock:     "#B8A038", ghost:    "#705898", dragon:   "#7038F8",
  dark:     "#705848", steel:    "#B8B8D0", fairy:    "#EE99AC",
  unknown:  "#68A090",
};

/**
 * StackQueueControls
 * 
 * Demonstra operações de Pilha (LIFO) e Fila (FIFO) sobre o array de Pokémon.
 * - Adicionar (push/enqueue): insere um Pokémon aleatório (que não está na lista) no final
 * - Remover LIFO (pop): remove o último elemento (topo da pilha)
 * - Remover FIFO (dequeue): remove o primeiro elemento (frente da fila)
 */
export default function StackQueueControls({ array, allPokemon, onUpdate, disabled }) {
  const [history, setHistory] = useState([]);
  const [lastAction, setLastAction] = useState(null);

  function getRandomAvailable() {
    const currentIds = new Set(array.map((p) => p.id));
    const available = allPokemon.filter((p) => !currentIds.has(p.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function addEntry(type, poke, position) {
    const entry = {
      id: Date.now(),
      type,
      pokeName: poke.name,
      pokeId: poke.id,
      pokeImg: poke.img,
      pokeType: poke.type_primary,
      position,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      arraySize: type.includes("Remov") ? array.length - 1 : array.length + 1,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 20));
    setLastAction(entry);

    // Limpa a animação após 1.5s
    setTimeout(() => setLastAction((cur) => (cur?.id === entry.id ? null : cur)), 1500);
  }

  // ─── PUSH (Adicionar no final = enqueue/push) ──────────────────
  function handleAdd() {
    const poke = getRandomAvailable();
    if (!poke) return;
    const newArr = [...array, poke];
    addEntry("➕ Adicionado (push)", poke, `índice ${newArr.length - 1}`);
    onUpdate(newArr);
  }

  // ─── POP (Remover LIFO = último) ───────────────────────────────
  function handleRemoveLIFO() {
    if (array.length === 0) return;
    const removed = array[array.length - 1];
    const newArr = array.slice(0, -1);
    addEntry("🔴 Removido LIFO (pop)", removed, `índice ${array.length - 1}`);
    onUpdate(newArr);
  }

  // ─── DEQUEUE (Remover FIFO = primeiro) ─────────────────────────
  function handleRemoveFIFO() {
    if (array.length === 0) return;
    const removed = array[0];
    const newArr = array.slice(1);
    addEntry("🟡 Removido FIFO (dequeue)", removed, "índice 0");
    onUpdate(newArr);
  }

  const noAvailable = allPokemon.length > 0 && array.length >= allPokemon.length;

  return (
    <div style={containerStyle}>
      {/* Título */}
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <span style={iconStyle}>📚</span>
          <div>
            <div style={labelStyle}>Estruturas de Dados</div>
            <div style={subtitleStyle}>Pilha (LIFO) & Fila (FIFO)</div>
          </div>
        </div>
        <div style={counterStyle}>
          {array.length} itens
        </div>
      </div>

      {/* Botões */}
      <div style={buttonsContainerStyle}>
        {/* Adicionar */}
        <button
          onClick={handleAdd}
          disabled={disabled || noAvailable}
          style={{
            ...btnStyle,
            background: disabled || noAvailable ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: disabled || noAvailable ? "#6b7280" : "#052e16",
            cursor: disabled || noAvailable ? "not-allowed" : "pointer",
          }}
          title="Adiciona um Pokémon aleatório no final do array (push/enqueue)"
        >
          <span style={{ fontSize: 14 }}>➕</span>
          <span>Adicionar</span>
          <span style={badgeStyle}>push</span>
        </button>

        {/* Remover LIFO */}
        <button
          onClick={handleRemoveLIFO}
          disabled={disabled || array.length === 0}
          style={{
            ...btnStyle,
            background: disabled || array.length === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #e94560, #c1121f)",
            color: disabled || array.length === 0 ? "#6b7280" : "white",
            cursor: disabled || array.length === 0 ? "not-allowed" : "pointer",
          }}
          title="Remove o último elemento (topo da pilha — LIFO)"
        >
          <span style={{ fontSize: 14 }}>🔴</span>
          <span>Remover LIFO</span>
          <span style={badgeStyle}>pop</span>
        </button>

        {/* Remover FIFO */}
        <button
          onClick={handleRemoveFIFO}
          disabled={disabled || array.length === 0}
          style={{
            ...btnStyle,
            background: disabled || array.length === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #f5c518, #d97706)",
            color: disabled || array.length === 0 ? "#6b7280" : "#1c1917",
            cursor: disabled || array.length === 0 ? "not-allowed" : "pointer",
          }}
          title="Remove o primeiro elemento (frente da fila — FIFO)"
        >
          <span style={{ fontSize: 14 }}>🟡</span>
          <span>Remover FIFO</span>
          <span style={badgeStyle}>dequeue</span>
        </button>
      </div>

      {/* Diagrama visual */}
      <div style={diagramContainerStyle}>
        <div style={diagramHeaderStyle}>
          <span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Visualização da estrutura
          </span>
        </div>
        <div style={diagramStyle}>
          {/* Marcador FIFO (frente) */}
          <div style={markerStyle}>
            <div style={{ ...markerArrowStyle, background: "#f5c518" }}>▼</div>
            <div style={{ fontSize: 7, color: "#f5c518", fontWeight: 800 }}>FIFO</div>
            <div style={{ fontSize: 6, color: "#9ca3af" }}>frente</div>
          </div>

          {/* Elementos do array (mostra até 8) */}
          <div style={elementsRowStyle}>
            {array.length === 0 ? (
              <div style={emptySlotStyle}>vazio</div>
            ) : (
              array.slice(0, 8).map((p, i) => (
                <div
                  key={`${p.id}-${i}`}
                  style={{
                    ...elementStyle,
                    borderColor: lastAction?.pokeId === p.id && lastAction?.type.includes("Adicionado")
                      ? "#4ade80" : "rgba(255,255,255,0.15)",
                    animation: lastAction?.pokeId === p.id ? "pulse 0.4s ease" : "none",
                  }}
                >
                  {p.img
                    ? <img src={p.img} alt={p.name} style={{ width: 22, height: 22, imageRendering: "pixelated" }} />
                    : <div style={{ width: 22, height: 22, background: "#334155", borderRadius: 4 }} />
                  }
                  <div style={{ fontSize: 6, color: "#94a3b8", fontWeight: 700 }}>#{String(p.id).padStart(3, "0")}</div>
                </div>
              ))
            )}
            {array.length > 8 && (
              <div style={moreStyle}>+{array.length - 8}</div>
            )}
          </div>

          {/* Marcador LIFO (topo) */}
          <div style={markerStyle}>
            <div style={{ ...markerArrowStyle, background: "#e94560" }}>▼</div>
            <div style={{ fontSize: 7, color: "#e94560", fontWeight: 800 }}>LIFO</div>
            <div style={{ fontSize: 6, color: "#9ca3af" }}>topo</div>
          </div>
        </div>
      </div>

      {/* Última ação */}
      {lastAction && (
        <div style={lastActionStyle}>
          <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }`}</style>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {lastAction.pokeImg && (
              <img src={lastAction.pokeImg} alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#e2e8f0" }}>
                {lastAction.type}
              </div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>
                #{String(lastAction.pokeId).padStart(3, "0")} {lastAction.pokeName} • {lastAction.position}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <details style={detailsStyle}>
          <summary style={summaryBtnStyle}>
            📜 Histórico ({history.length})
          </summary>
          <div style={historyListStyle}>
            {history.map((entry) => (
              <div key={entry.id} style={historyItemStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {entry.pokeImg && (
                    <img src={entry.pokeImg} alt="" style={{ width: 18, height: 18, imageRendering: "pixelated" }} />
                  )}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#e2e8f0" }}>
                      {entry.type}
                    </div>
                    <div style={{ fontSize: 8, color: "#9ca3af" }}>
                      #{String(entry.pokeId).padStart(3, "0")} {entry.pokeName} • {entry.position} • tamanho: {entry.arraySize}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 8, color: "#6b7280" }}>{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Explicação didática */}
      <div style={infoBoxStyle}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#f5c518", marginBottom: 4 }}>💡 Como funciona?</div>
        <div style={{ fontSize: 8, color: "#9ca3af", lineHeight: 1.5 }}>
          <strong style={{ color: "#4ade80" }}>Pilha (LIFO)</strong>: Last In, First Out — o último a entrar é o primeiro a sair (como uma pilha de pratos).<br />
          <strong style={{ color: "#fbbf24" }}>Fila (FIFO)</strong>: First In, First Out — o primeiro a entrar é o primeiro a sair (como uma fila de banco).
        </div>
      </div>
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────

const containerStyle = {
  background: "#16213e",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const titleRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const iconStyle = {
  fontSize: 18,
};

const labelStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7,
  color: "#e94560",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const subtitleStyle = {
  fontSize: 11,
  color: "#e2e8f0",
  fontWeight: 700,
  marginTop: 1,
};

const counterStyle = {
  background: "#0f3460",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 800,
  color: "#60a5fa",
  fontFamily: "'Nunito', sans-serif",
};

const buttonsContainerStyle = {
  display: "flex",
  gap: 5,
};

const btnStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  padding: "8px 4px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  fontFamily: "'Nunito', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  transition: "all 0.15s",
};

const badgeStyle = {
  fontSize: 7,
  fontWeight: 800,
  opacity: 0.7,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const diagramContainerStyle = {
  background: "rgba(15,52,96,0.4)",
  borderRadius: 8,
  padding: "8px 10px",
  border: "1px solid rgba(255,255,255,0.06)",
};

const diagramHeaderStyle = {
  marginBottom: 6,
};

const diagramStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
};

const markerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
  flexShrink: 0,
};

const markerArrowStyle = {
  fontSize: 8,
  width: 14,
  height: 14,
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  color: "#1a1a2e",
};

const elementsRowStyle = {
  display: "flex",
  gap: 3,
  flex: 1,
  overflowX: "auto",
  alignItems: "center",
};

const elementStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
  padding: 3,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "#1a1a2e",
  transition: "all 0.2s",
  flexShrink: 0,
};

const emptySlotStyle = {
  fontSize: 9,
  color: "#6b7280",
  fontStyle: "italic",
  padding: "8px 16px",
};

const moreStyle = {
  fontSize: 9,
  color: "#60a5fa",
  fontWeight: 700,
  padding: "4px 6px",
  flexShrink: 0,
};

const lastActionStyle = {
  background: "rgba(96,165,250,0.08)",
  border: "1px solid rgba(96,165,250,0.2)",
  borderRadius: 8,
  padding: "6px 8px",
  animation: "pulse 0.4s ease",
};

const detailsStyle = {
  background: "rgba(15,52,96,0.3)",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.06)",
};

const summaryBtnStyle = {
  padding: "6px 8px",
  fontSize: 10,
  fontWeight: 700,
  color: "#9ca3af",
  cursor: "pointer",
  listStyle: "none",
  fontFamily: "'Nunito', sans-serif",
};

const historyListStyle = {
  maxHeight: 140,
  overflowY: "auto",
  padding: "0 8px 8px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const historyItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 6px",
  borderRadius: 6,
  background: "rgba(26,26,46,0.6)",
  border: "1px solid rgba(255,255,255,0.04)",
};

const infoBoxStyle = {
  background: "rgba(245,197,24,0.06)",
  border: "1px solid rgba(245,197,24,0.15)",
  borderRadius: 8,
  padding: "8px 10px",
};
