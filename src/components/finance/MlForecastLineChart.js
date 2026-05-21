import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { baseChartOptions, cartesianScales, grad } from "./chartTheme";

export default function MlForecastLineChart({ labels, histData, predData, height = 220 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Bugüne kadar",
          data: histData,
          spanGaps: false,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderColor: grad.goldMid,
          backgroundColor: "rgba(99, 179, 237, 0.08)",
          fill: true
        },
        {
          label: "Tahmin",
          data: predData,
          spanGaps: true,
          tension: 0.35,
          borderDash: [6, 4],
          borderWidth: 2.2,
          pointRadius: 4,
          pointHoverRadius: 7,
          borderColor: "#9b8bc9",
          backgroundColor: "transparent",
          fill: false
        }
      ]
    }),
    [labels, histData, predData]
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
          title: { display: true, text: "Tutar (₺)", color: "#64748b", font: { size: 9 } }
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
