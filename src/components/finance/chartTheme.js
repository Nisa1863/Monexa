const text = "#1e293b";
const textMuted = "#64748b";
const grid = "rgba(15, 23, 42, 0.06)";

export function baseChartOptions(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: "easeOutQuart"
    },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: textMuted,
          boxWidth: 10,
          padding: 12,
          font: { size: 10, family: "var(--mx-font-sans), system-ui, sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        titleColor: text,
        bodyColor: textMuted,
        borderColor: "rgba(99, 179, 237, 0.35)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        displayColors: true
      }
    },
    scales: {},
    ...overrides
  };
}

export function cartesianScales() {
  return {
    x: {
      grid: { color: grid, drawBorder: false },
      ticks: { color: textMuted, maxRotation: 45, minRotation: 0, font: { size: 9 } }
    },
    y: {
      grid: { color: grid, drawBorder: false },
      ticks: { color: textMuted, font: { size: 9 } }
    }
  };
}

/** Pastel fintech paleti: mavi, mint, mor, turuncu */
export const grad = {
  goldStart: "#7EB6FF",
  goldMid: "#6EC9B8",
  goldEnd: "#B8A9E8",
  mint: "#5DB9AA",
  danger: "#F0A090",
  ink: "#63B3FF"
};
