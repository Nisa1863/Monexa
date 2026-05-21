import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { baseChartOptions, cartesianScales, grad } from "./chartTheme";

export default function RiskForecastLineChart({ labels, hist, pred, height = 200 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Mevcut dönem",
          data: hist,
          spanGaps: false,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          borderColor: grad.goldStart,
          backgroundColor: "rgba(99, 179, 237, 0.12)",
          fill: true
        },
        {
          label: "Öngörü",
          data: pred,
          spanGaps: true,
          tension: 0.3,
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 4,
          borderColor: "#7eb8da",
          fill: false
        }
      ]
    }),
    [labels, hist, pred]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      plugins: {
        ...b.plugins,
        legend: { ...b.plugins.legend, position: "bottom" }
      },
      scales: {
        ...cartesianScales(),
        y: {
          ...cartesianScales().y,
          min: 0,
          max: 100,
          title: { display: true, text: "0–100", color: "#64748b", font: { size: 9 } }
        }
      }
    };
  }, []);

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
