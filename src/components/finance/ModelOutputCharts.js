import { useMemo } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import { baseChartOptions, grad } from "./chartTheme";

export function ModelOutputDonut({ items, height = 220 }) {
  const labels = items.map((i) => i.label);
  const values = items.map((i) => Number(i.value) || 0);
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          borderWidth: 0,
          hoverOffset: 8,
          backgroundColor: [
            "#7EB6FF",
            "#4a6fa5",
            "#B8A9E8",
            "#F0A090",
            "#94a3b8",
            "#6EC9B8"
          ].slice(0, values.length)
        }
      ]
    }),
    [labels, values]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      cutout: "52%",
      plugins: {
        ...b.plugins,
        legend: {
          ...b.plugins.legend,
          position: "right",
          labels: { ...b.plugins.legend.labels, color: "rgba(44, 39, 36, 0.78)" }
        },
        tooltip: {
          ...b.plugins.tooltip,
          backgroundColor: "rgba(255, 252, 248, 0.96)",
          titleColor: "#2c2724",
          bodyColor: "#5c534c",
          borderColor: "rgba(44, 39, 36, 0.12)"
        }
      }
    };
  }, []);

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export function ModelOutputBar({ items, height = 220 }) {
  const labels = items.map((i) => i.label);
  const values = items.map((i) => Number(i.spent) || 0);
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "₺",
          data: values,
          borderRadius: 8,
          maxBarThickness: 32,
          backgroundColor(context) {
            const ctx = context.chart.ctx;
            const { chartArea } = context.chart;
            if (!chartArea) return grad.goldMid;
            const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            g.addColorStop(0, grad.ink);
            g.addColorStop(1, grad.goldEnd);
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
      plugins: { ...b.plugins, legend: { display: false } },
      scales: {
        x: {
          grid: { color: "rgba(44,39,36,0.08)", drawBorder: false },
          ticks: { color: "rgba(92,83,76,0.9)", font: { size: 10 } }
        },
        y: {
          grid: { color: "rgba(44,39,36,0.08)", drawBorder: false },
          ticks: { color: "rgba(92,83,76,0.9)", font: { size: 10 } }
        }
      }
    };
  }, []);

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
