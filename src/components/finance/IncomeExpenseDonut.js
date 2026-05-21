import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { baseChartOptions, grad } from "./chartTheme";

export default function IncomeExpenseDonut({ labels, data, height = 200 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          borderWidth: 0,
          hoverOffset: 10,
          backgroundColor(context) {
            const i = context.dataIndex;
            const ctx = context.chart.ctx;
            const c = ctx.canvas;
            const g = ctx.createRadialGradient(c.width * 0.45, c.height * 0.35, 0, c.width * 0.5, c.height * 0.5, c.width * 0.65);
            if (i === 0) {
              g.addColorStop(0, grad.goldStart);
              g.addColorStop(1, grad.goldEnd);
            } else {
              g.addColorStop(0, "#7EC8BC");
              g.addColorStop(1, "#5DB9AA");
            }
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
      cutout: "62%",
      plugins: {
        ...b.plugins,
        legend: { ...b.plugins.legend, position: "bottom" }
      }
    };
  }, []);

  return <div style={{ height }}><Doughnut data={chartData} options={options} /></div>;
}
