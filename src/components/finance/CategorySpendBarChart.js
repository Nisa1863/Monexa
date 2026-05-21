import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { baseChartOptions, cartesianScales, grad } from "./chartTheme";

export default function CategorySpendBarChart({ labels, data, horizontal = false, height = 220 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "₺",
          data,
          borderRadius: horizontal ? { topRight: 10, bottomRight: 10 } : { topLeft: 8, topRight: 8 },
          borderSkipped: false,
          maxBarThickness: horizontal ? 22 : 36,
          backgroundColor(context) {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return grad.goldMid;
            const g = horizontal
              ? ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
              : ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            g.addColorStop(0, "#63B3FF");
            g.addColorStop(0.45, "#6EC9B8");
            g.addColorStop(1, "#B8A9E8");
            return g;
          }
        }
      ]
    }),
    [labels, data, horizontal]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      indexAxis: horizontal ? "y" : "x",
      plugins: { ...b.plugins, legend: { display: false } },
      scales: cartesianScales()
    };
  }, [horizontal]);

  return <div style={{ height }}><Bar data={chartData} options={options} /></div>;
}
