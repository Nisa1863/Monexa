import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { baseChartOptions } from "./chartTheme";

const DEFAULT_COLORS = ["#7EB6FF", "#6EC9B8", "#FFB38A", "#B8A9E8", "#94a3b8", "#F0A090"];

export default function PortfolioDonutChart({ slices, height = 220 }) {
  const chartData = useMemo(
    () => ({
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.pct),
          borderWidth: 0,
          hoverOffset: 8,
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
      cutout: "58%",
      plugins: {
        ...b.plugins,
        legend: { ...b.plugins.legend, position: "bottom" },
        tooltip: {
          ...b.plugins.tooltip,
          callbacks: {
            label(ctx) {
              const v = ctx.raw;
              return ` ${ctx.label}: %${v}`;
            }
          }
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
