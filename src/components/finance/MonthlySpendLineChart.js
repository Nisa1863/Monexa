import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { baseChartOptions, cartesianScales, grad } from "./chartTheme";

export default function MonthlySpendLineChart({ labels, data, height = 200 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Harcama (₺)",
          data,
          tension: 0.42,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: grad.goldEnd,
          pointBorderColor: "#e2e8f0",
          pointBorderWidth: 2,
          borderWidth: 2.5,
          borderColor: grad.goldMid,
          backgroundColor(context) {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return "rgba(99, 179, 237, 0.12)";
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(99, 179, 237, 0.35)");
            g.addColorStop(0.5, "rgba(110, 201, 184, 0.15)");
            g.addColorStop(1, "rgba(184, 169, 232, 0)");
            return g;
          }
        }
      ]
    }),
    [labels, data]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    const nums = (data || []).map((v) => Number(v)).filter((v) => Number.isFinite(v));
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 0;
    const padding = Math.max((max - min) * 0.12, max * 0.05, 80);
    return {
      ...b,
      plugins: { ...b.plugins, legend: { display: false } },
      scales: {
        ...cartesianScales(),
        y: {
          ...cartesianScales().y,
          suggestedMin: Math.max(0, min - padding),
          suggestedMax: max + padding
        }
      }
    };
  }, [data]);

  return <div style={{ height }}><Line data={chartData} options={options} /></div>;
}
