import React, { useMemo } from "react";

const COLORS = {
  default:   "#60a5fa",
  comparing: "#fbbf24",
  swapping:  "#f87171",
  pivot:     "#a78bfa",
  sorted:    "#4ade80",
};

function getColor(i, highlights, sorted) {
  if (sorted.has(i))                                                  return COLORS.sorted;
  if (highlights.swapping  && highlights.swapping.includes(i))       return COLORS.swapping;
  if (highlights.pivot     === i)                                     return COLORS.pivot;
  if (highlights.comparing && highlights.comparing.includes(i))      return COLORS.comparing;
  return COLORS.default;
}

function getBarHeight(p, sortBy, maxVal) {
  if (!p) return 4;
  const val = p[sortBy];
  if (val === undefined || val === null) return 4;

  if (typeof val === "number") {
    return Math.max(4, Math.round((val / (maxVal || 1)) * 265));
  }

  // For strings: use charCode-based value for visual variety
  const str = String(val).toLowerCase();
  const charVal = str.charCodeAt(0) - 96; // a=1, z=26
  return Math.max(4, Math.round((charVal / 26) * 265));
}

export default function BarChart({ array, highlights, sorted, sortBy = "id" }) {
  const maxVal = useMemo(() => {
    if (!array.length) return 1;
    const key = sortBy;
    const first = array[0]?.[key];
    if (typeof first === "number") {
      return Math.max(...array.map((p) => p[key] || 0));
    }
    return 26; // alphabet
  }, [array, sortBy]);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-end",
      gap: "2px",
      height: "280px",
      padding: "8px 4px 0",
      overflow: "hidden",
    }}>
      {array.map((p, i) => {
        const h = getBarHeight(p, sortBy, maxVal);
        return (
          <div
            key={i}
            title={`#${p.id} ${p.name} (${sortBy}: ${p[sortBy]})`}
            style={{
              flex: 1,
              minWidth: "3px",
              height: `${h}px`,
              borderRadius: "2px 2px 0 0",
              background: getColor(i, highlights, sorted),
              transition: "background 0.08s",
            }}
          />
        );
      })}
    </div>
  );
}
