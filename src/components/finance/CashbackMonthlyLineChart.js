import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { baseChartOptions, cartesianScales, grad } from "./chartTheme";

export default function CashbackMonthlyLineChart({ labels, data, height = 200 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Cashback (₺)",
          data,
          tension: 0.38,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: grad.goldEnd,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 2.5,
          borderColor: "#e07862",
          backgroundColor(context) {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return "rgba(224, 120, 98, 0.12)";
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(224, 120, 98, 0.35)");
            g.addColorStop(1, "rgba(224, 120, 98, 0)");
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
      <Line data={chartData} options={options} />
    </div>
  );
}
