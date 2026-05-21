import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  DoughnutController,
  RadarController,
  PieController,
  PolarAreaController
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  DoughnutController,
  RadarController,
  PieController,
  PolarAreaController
);

export default ChartJS;
