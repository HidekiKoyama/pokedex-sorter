import React from "react";
// import { useNavigate } from "react-router-dom";

const TYPE_COLORS = {
  normal:   "#A8A878", fire:     "#F08030", water:    "#6890F0",
  electric: "#F8D030", grass:    "#78C850", ice:      "#98D8D8",
  fighting: "#C03028", poison:   "#A040A0", ground:   "#E0C068",
  flying:   "#A890F0", psychic:  "#F85888", bug:      "#A8B820",
  rock:     "#B8A038", ghost:    "#705898", dragon:   "#7038F8",
  dark:     "#705848", steel:    "#B8B8D0", fairy:    "#EE99AC",
  unknown:  "#68A090",
};

function getClass(i, highlights, sorted) {
  if (sorted.has(i))                                              return "sorted";
  if (highlights.swapping  && highlights.swapping.includes(i))  return "swapping";
  if (highlights.pivot     === i)                                return "pivot";
  if (highlights.comparing && highlights.comparing.includes(i)) return "comparing";
  return "";
}

const STATE_STYLES = {
  sorted:    { border: "2px solid #4ade80", background: "rgba(74,222,128,0.1)" },
  swapping:  { border: "2px solid #f87171", background: "rgba(248,113,113,0.15)" },
  pivot:     { border: "2px solid #a78bfa", background: "rgba(167,139,250,0.15)" },
  comparing: { border: "2px solid #fbbf24", background: "rgba(251,191,36,0.15)" },
  "":        { border: "2px solid transparent", background: "#1e293b" },
};

function TypeBadge({ type }) {
  if (!type) return null;
  const bg = TYPE_COLORS[type] || TYPE_COLORS.unknown;
  return (
    <span style={{
      display: "inline-block",
      fontSize: 7,
      fontWeight: 700,
      color: "#fff",
      background: bg,
      borderRadius: 4,
      padding: "1px 4px",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      textShadow: "0 1px 1px rgba(0,0,0,0.3)",
    }}>
      {type}
    </span>
  );
}

function SortInfo({ p, sortBy }) {
  if (sortBy === "type_primary") {
    return (
      <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 2, flexWrap: "wrap" }}>
        <TypeBadge type={p.type_primary} />
        {p.type_secondary && <TypeBadge type={p.type_secondary} />}
      </div>
    );
  }
  if (sortBy === "base_stats_total") {
    return (
      <div style={{ fontSize: 8, color: "#fbbf24", fontWeight: 700, marginTop: 1 }}>
        ⚔ {p.base_stats_total}
      </div>
    );
  }
  if (sortBy === "habitat") {
    return (
      <div style={{ fontSize: 7, color: "#a78bfa", fontWeight: 600, textTransform: "capitalize", marginTop: 1 }}>
        🏠 {p.habitat || "?"}
      </div>
    );
  }
  return null;
}

export default function CardGrid({ array, highlights, sorted, sortBy = "id" }) {
  // const navigate = useNavigate();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
      gap: "4px",
      maxHeight: "420px",
      overflowY: "auto",
    }}>
      {array.map((p, i) => {
        const state = getClass(i, highlights, sorted);
        const style = STATE_STYLES[state];
        return (
          <div key={i} style={{
            borderRadius: "8px",
            padding: "4px",
            textAlign: "center",
            transition: "border-color 0.12s, background 0.12s",
            ...style,
          }}>
            {p.img
              ? <img src={p.img} alt={p.name} style={{ width: 48, height: 48, imageRendering: "pixelated" }} />
              : <div style={{ width: 48, height: 48, margin: "0 auto", background: "#334155", borderRadius: 6 }} />
            }
            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>#{String(p.id).padStart(3, "0")}</div>
            <div style={{ fontSize: 8, color: "#e2e8f0", fontWeight: 600, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            <SortInfo p={p} sortBy={sortBy} />
          </div>
        );
      })}
    </div>
  );
}
