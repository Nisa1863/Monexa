import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { baseChartOptions, cartesianScales } from "./chartTheme";

export default function WeeklyFinanceBarChart({ labels, data, height = 200 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Harcama (₺)",
          data,
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 28,
          backgroundColor(context) {
            const ctx = context.chart.ctx;
            const { chartArea } = context.chart;
            if (!chartArea) return "rgba(99, 179, 237, 0.55)";
            const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            g.addColorStop(0, "rgba(99, 179, 237, 0.95)");
            g.addColorStop(0.55, "rgba(110, 201, 184, 0.85)");
            g.addColorStop(1, "rgba(184, 169, 232, 0.9)");
            return g;
          }
        }
      ]
    }),
    [labels, data]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      plugins: { ...b.plugins, legend: { display: false } },
      scales: cartesianScales()
    };
  }, []);

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
