import React, { useState, useEffect } from "react";
import { compareAlgorithms, RateLimitError } from "../services/api";

const ALGO_COLORS = {
  bubble:    "#60a5fa",
  selection: "#f87171",
  insertion: "#fbbf24",
  merge:     "#4ade80",
  quick:     "#a78bfa",
};

const SORT_LABELS = {
  id:               "Pokédex (#)",
  name:             "Alfabético (A-Z)",
  type_primary:     "Tipo Primário",
  base_stats_total: "Base Stats (Total)",
  habitat:          "Habitat",
};

export default function CompareModal({ pokemon, sortBy = "id", onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // ─── Rate Limit Countdown ───────────────────────────────────────
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          setRateLimitError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  async function run() {
    setLoading(true);
    setError(null);
    setRateLimitError(null);
    try {
      const result = await compareAlgorithms([...pokemon], sortBy);
      setData(result);
    } catch (e) {
      // Tratamento específico para rate-limit
      if (e instanceof RateLimitError) {
        const waitTime = e.retryAfter || 60;
        setRateLimitError(e.message);
        setRetryCountdown(waitTime);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const maxOps = data
    ? Math.max(...Object.values(data.results).map((r) => r.stats.total))
    : 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#16213e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: 24, width: "min(600px, 95vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#f5c518" }}>Comparar Algoritmos</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        {!data && !loading && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>Roda todos os 5 algoritmos no mesmo array embaralhado e compara as operações.</p>
            <button 
              onClick={run} 
              disabled={retryCountdown > 0}
              style={{ 
                background: retryCountdown > 0 ? "#555555" : "#e94560", 
                color: "white", 
                border: "none", 
                borderRadius: 8, 
                padding: "10px 24px", 
                fontFamily: "'Nunito',sans-serif", 
                fontWeight: 700, 
                fontSize: 14, 
                cursor: retryCountdown > 0 ? "not-allowed" : "pointer",
                opacity: retryCountdown > 0 ? 0.6 : 1
              }}>
              {retryCountdown > 0 ? `⏳ Aguarde ${retryCountdown}s` : "▶ Executar Comparação"}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#f5c518", fontFamily: "'Press Start 2P',monospace", fontSize: 9 }}>Calculando...</div>
        )}

        {rateLimitError && (
          <div style={{ 
            background: "linear-gradient(135deg, #e94560 0%, #c1121f 100%)",
            border: "2px solid #ff6b6b",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            fontWeight: 600,
            color: "white",
            boxShadow: "0 0 15px rgba(233, 69, 96, 0.4)"
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <div>{rateLimitError}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                Tente novamente em: <strong style={{ color: "#fbbf24", fontSize: 13 }}>{retryCountdown}s</strong>
              </div>
            </div>
          </div>
        )}

        {error && <div style={{ color: "#f87171", fontSize: 13, padding: 12, background: "rgba(248, 113, 113, 0.1)", borderRadius: 6, border: "1px solid rgba(248, 113, 113, 0.3)", marginBottom: 12 }}>Erro: {error}</div>}

        {data && (() => {
          const maxCompares = Math.max(...Object.values(data.results).map((r) => r.stats.compares));
          const maxSwaps = Math.max(1, ...Object.values(data.results).map((r) => r.stats.swaps));
          const maxWrites = Math.max(1, ...Object.values(data.results).map((r) => r.stats.writes));

          return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>n = {data.n} Pokémon</p>
              <span style={{ fontSize: 10, color: "#f5c518", background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>
                Ordenando por: {SORT_LABELS[sortBy] || sortBy}
              </span>
            </div>

            {/* Tabela de resultados */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {Object.entries(data.results).map(([name, r]) => (
                <div key={name} style={{ background: "#0f3460", borderRadius: 8, padding: 12, border: `1px solid ${ALGO_COLORS[name]}33` }}>
                  {/* Cabeçalho do algoritmo */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: ALGO_COLORS[name], fontWeight: 800, fontSize: 13, textTransform: "capitalize" }}>
                      {r.complexity.name}
                    </span>
                    <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 12 }}>
                      {r.stats.total.toLocaleString()} ops total
                    </span>
                  </div>

                  {/* Barra total */}
                  <div style={{ height: 8, background: "#1a1a2e", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${Math.round((r.stats.total / maxOps) * 100)}%`, background: `linear-gradient(90deg, ${ALGO_COLORS[name]}, ${ALGO_COLORS[name]}88)`, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>

                  {/* Detalhes das operações */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {/* Comparações */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>
                        <span>Comparações</span>
                        <span style={{ color: "#60a5fa", fontWeight: 700 }}>{r.stats.compares.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((r.stats.compares / maxCompares) * 100)}%`, background: "#60a5fa", borderRadius: 2 }} />
                      </div>
                    </div>

                    {/* Trocas */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>
                        <span>Trocas</span>
                        <span style={{ color: "#f87171", fontWeight: 700 }}>{r.stats.swaps.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${maxSwaps > 0 ? Math.round((r.stats.swaps / maxSwaps) * 100) : 0}%`, background: "#f87171", borderRadius: 2 }} />
                      </div>
                    </div>

                    {/* Escritas */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>
                        <span>Escritas</span>
                        <span style={{ color: "#fbbf24", fontWeight: 700 }}>{r.stats.writes.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${maxWrites > 0 ? Math.round((r.stats.writes / maxWrites) * 100) : 0}%`, background: "#fbbf24", borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>

                  {/* Complexidade */}
                  <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 9, color: "#6b7280" }}>
                    <span>Melhor: {r.complexity.best}</span>
                    <span>Médio: {r.complexity.average}</span>
                    <span>Pior: {r.complexity.worst}</span>
                    <span>Espaço: {r.complexity.space}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={run} 
              disabled={retryCountdown > 0}
              style={{ 
                marginTop: 12, 
                background: retryCountdown > 0 ? "rgba(255,255,255,0.08)" : "transparent", 
                border: retryCountdown > 0 ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.15)", 
                color: retryCountdown > 0 ? "#666666" : "#9ca3af", 
                borderRadius: 8, 
                padding: "8px 16px", 
                fontSize: 12, 
                cursor: retryCountdown > 0 ? "not-allowed" : "pointer", 
                fontFamily: "'Nunito',sans-serif",
                opacity: retryCountdown > 0 ? 0.5 : 1
              }}>
              ↺ Novo Shuffle e Comparar
            </button>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
