import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { baseChartOptions } from "./chartTheme";

function riskColor(score) {
  const n = Number(score) || 0;
  if (n < 35) return ["#6EC9B8", "#4a9d8f"];
  if (n < 65) return ["#FFB38A", "#F59E0B"];
  return ["#F0A090", "#E07862"];
}

export default function RiskGaugeChart({ score, height = 180, tooltipScoreLabel = "Skor" }) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const rest = 100 - s;
  const [c0, c1] = riskColor(s);

  const chartData = useMemo(
    () => ({
      labels: ["Risk", "Kalan"],
      datasets: [
        {
          data: [s, rest],
          borderWidth: 0,
          circumference: 180,
          rotation: -90,
          hoverOffset: 4,
          backgroundColor(context) {
            if (context.dataIndex === 0) {
              const ctx = context.chart.ctx;
              const c = ctx.canvas;
              const g = ctx.createLinearGradient(0, c.height, c.width, 0);
              g.addColorStop(0, c0);
              g.addColorStop(1, c1);
              return g;
            }
            return "rgba(15, 23, 42, 0.06)";
          }
        }
      ]
    }),
    [s, rest, c0, c1]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      cutout: "72%",
      plugins: {
        ...b.plugins,
        legend: { display: false },
        tooltip: {
          ...b.plugins.tooltip,
          callbacks: {
            label(ctx) {
              if (ctx.dataIndex === 0) return `${tooltipScoreLabel}: ${s} / 100`;
              return "";
            }
          },
          filter: (item) => item.dataIndex === 0
        }
      }
    };
  }, [s, tooltipScoreLabel]);

  return (
    <div style={{ height, position: "relative" }}>
      <Doughnut data={chartData} options={options} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 8,
          textAlign: "center",
          pointerEvents: "none"
        }}
      >
        <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>{s}</span>
        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 4 }}>/ 100</span>
      </div>
    </div>
  );
}
