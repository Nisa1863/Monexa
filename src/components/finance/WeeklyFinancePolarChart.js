import { useMemo } from "react";
import { PolarArea } from "react-chartjs-2";
import { baseChartOptions } from "./chartTheme";

export default function WeeklyFinancePolarChart({ labels, data, height = 220 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          borderWidth: 2,
          borderColor: "rgba(15, 23, 42, 0.08)",
          backgroundColor: [
            "rgba(99, 179, 237, 0.45)",
            "rgba(110, 201, 184, 0.45)",
            "rgba(184, 169, 232, 0.45)",
            "rgba(255, 159, 112, 0.45)",
            "rgba(94, 185, 170, 0.4)",
            "rgba(129, 140, 248, 0.4)",
            "rgba(251, 191, 36, 0.35)"
          ].slice(0, data.length)
        }
      ]
    }),
    [labels, data]
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
        r: {
          min: 0,
          ticks: { display: false, backdropColor: "transparent" },
          grid: { color: "rgba(15, 23, 42, 0.06)" },
          angleLines: { color: "rgba(15, 23, 42, 0.05)" },
          pointLabels: { color: "#475569", font: { size: 9 } }
        }
      }
    };
  }, []);

  return (
    <div style={{ height }}>
      <PolarArea data={chartData} options={options} />
    </div>
  );
}
