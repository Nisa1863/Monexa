import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { baseChartOptions, grad } from "./chartTheme";

export default function ShapImpactBarChart({ features, height = 200 }) {
  const labels = features.map((f) => f.feature);
  const values = features.map((f) => Number(f.impact) || 0);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Etki",
          data: values,
          borderRadius: { topRight: 8, bottomRight: 8 },
          maxBarThickness: 18,
          backgroundColor(context) {
            const v = context.parsed.x;
            const ctx = context.chart.ctx;
            const { chartArea } = context.chart;
            if (!chartArea) return grad.goldMid;
            const g = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
            if (v >= 0) {
              g.addColorStop(0, grad.goldEnd);
              g.addColorStop(1, grad.goldStart);
            } else {
              g.addColorStop(0, grad.danger);
              g.addColorStop(1, "#F0A090");
            }
            return g;
          }
        }
      ]
    }),
    [labels, values]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      indexAxis: "y",
      plugins: {
        ...b.plugins,
        legend: { display: false },
        tooltip: {
          ...b.plugins.tooltip,
          callbacks: {
            afterLabel(ctx) {
              const f = features[ctx.dataIndex];
              return f?.description || "";
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(15, 23, 42, 0.06)", drawBorder: false },
          ticks: { color: "#64748b", font: { size: 9 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#475569", font: { size: 9 } }
        }
      }
    };
  }, [features]);

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
