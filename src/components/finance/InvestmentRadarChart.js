import { useMemo } from "react";
import { Radar } from "react-chartjs-2";
import { baseChartOptions, grad } from "./chartTheme";

export default function InvestmentRadarChart({ scores, height = 240 }) {
  const { likidite, disiplin, buyume, riskTol, cesit } = scores;
  const chartData = useMemo(
    () => ({
      labels: ["Likidite", "Disiplin", "Büyüme", "Risk tol.", "Çeşitlendirme"],
      datasets: [
        {
          label: "Profil",
          data: [likidite, disiplin, buyume, riskTol, cesit],
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderColor: grad.goldMid,
          backgroundColor: "rgba(99, 179, 237, 0.2)",
          pointBackgroundColor: grad.goldEnd
        }
      ]
    }),
    [likidite, disiplin, buyume, riskTol, cesit]
  );

  const options = useMemo(() => {
    const b = baseChartOptions();
    return {
      ...b,
      scales: {
        r: {
          min: 0,
          max: 100,
          angleLines: { color: "rgba(15, 23, 42, 0.06)" },
          grid: { color: "rgba(15, 23, 42, 0.06)" },
          pointLabels: {
            color: "#475569",
            font: { size: 9 }
          },
          ticks: {
            display: false,
            backdropColor: "transparent"
          }
        }
      },
      plugins: { ...b.plugins, legend: { display: false } }
    };
  }, []);

  return (
    <div style={{ height }}>
      <Radar data={chartData} options={options} />
    </div>
  );
}
