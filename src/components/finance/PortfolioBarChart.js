import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { baseChartOptions, cartesianScales } from "./chartTheme";

const DEFAULT_COLORS = ["#7EB6FF", "#6EC9B8", "#FFB38A", "#B8A9E8", "#94a3b8", "#F0A090"];

export default function PortfolioBarChart({ slices, height = 200 }) {
  const chartData = useMemo(
    () => ({
      labels: slices.map((s) => s.label),
      datasets: [
        {
          label: "Pay (%)",
          data: slices.map((s) => s.pct),
          borderRadius: 10,
          maxBarThickness: 36,
          backgroundColor: slices.map((s, i) => s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length])
        }
      ]
    }),
    [slices]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      plugins: { ...b.plugins, legend: { display: false } },
      scales: {
        ...cartesianScales(),
        y: {
          ...cartesianScales().y,
          max: 100,
          title: { display: true, text: "%", color: "#64748b", font: { size: 10 } }
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
