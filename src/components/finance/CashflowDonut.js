import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { baseChartOptions } from "./chartTheme";

const colors = [
  ["#7EB6FF", "#B8A9E8"],
  ["#A594E3", "#C4B5FD"],
  ["#6EC9B8", "#5DB9AA"]
];

export default function CashflowDonut({ labels, data, height = 220 }) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          borderWidth: 0,
          hoverOffset: 12,
          backgroundColor(context) {
            const i = context.dataIndex % colors.length;
            const ctx = context.chart.ctx;
            const c = ctx.canvas;
            const g = ctx.createLinearGradient(0, 0, c.width, c.height);
            g.addColorStop(0, colors[i][0]);
            g.addColorStop(1, colors[i][1]);
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
      cutout: "58%",
      plugins: {
        ...b.plugins,
        legend: { ...b.plugins.legend, position: "bottom" }
      }
    };
  }, []);

  return <div style={{ height }}><Doughnut data={chartData} options={options} /></div>;
}
