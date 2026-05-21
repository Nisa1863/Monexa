import { useEffect, useMemo, useState } from "react";
import { getDashboard, getInsights } from "../services/api";
import {
  insightMonthlyTrend,
  insightWeekly,
  insightCategories,
  insightCategoryCompare,
  insightCashflow,
  insightRiskScore,
  insightMlForecast,
  insightRiskForecast,
  insightInvestment,
  insightShap
} from "../utils/chartInsights";
import "../components/finance/charts.css";
import {
  ChartCard,
  MonthlySpendLineChart,
  CashflowDonut,
  CategorySpendBarChart,
  RiskGaugeChart,
  MlForecastLineChart,
  RiskForecastLineChart,
  InvestmentRadarChart,
  ShapImpactBarChart,
  WeeklyFinancePolarChart
} from "../components/finance";
import { segmentToTier, TIER_TR, getPrioritySteps } from "../utils/riskTier";
import TierCtaCard from "../components/TierCtaCard";
import CashbackAnalyticsCharts from "../components/cashback/CashbackAnalyticsCharts";
import "../components/cashback/cashback.css";
import {
  trendPointsFromDashboard,
  weeklySpendingBars,
  cashflowThreeWay,
  mlSpendingForecastSeries,
  riskTrendWithForecast,
  investmentProfileScores
} from "../utils/financeSeries";

export default function Analytics() {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [d, i] = await Promise.all([getDashboard(), getInsights()]);
        if (!c) {
          setDashboard(d.data);
          setInsights(i.data);
        }
      } catch {
        if (!c) {
          setDashboard(null);
          setInsights(null);
        }
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const trendPoints = useMemo(() => (dashboard ? trendPointsFromDashboard(dashboard) : []), [dashboard]);
  const lineLabels = useMemo(() => trendPoints.map((p) => p.label), [trendPoints]);
  const lineValues = useMemo(() => trendPoints.map((p) => p.value), [trendPoints]);

  const weekly = useMemo(() => {
    if (!dashboard) return { labels: [], data: [] };
    return weeklySpendingBars(trendPoints, dashboard.spendingSummary.monthlyTotal);
  }, [dashboard, trendPoints]);

  const cashflow = useMemo(() => (dashboard ? cashflowThreeWay(dashboard) : { labels: [], data: [] }), [dashboard]);

  const categoryChart = useMemo(() => {
    if (!dashboard) return { labels: [], data: [] };
    const cats = [...dashboard.spendingSummary.categories].sort((a, b) => b.amount - a.amount);
    return { labels: cats.map((c) => c.category), data: cats.map((c) => c.amount) };
  }, [dashboard]);

  const categories = dashboard?.spendingSummary?.categories;
  const monthlyTotal = dashboard?.spendingSummary?.monthlyTotal || 0;

  const mlSpend = useMemo(() => mlSpendingForecastSeries(trendPoints), [trendPoints]);
  const riskForecast = useMemo(() => (insights ? riskTrendWithForecast(insights) : { labels: [], hist: [], pred: [] }), [insights]);

  const investScores = useMemo(
    () => investmentProfileScores(dashboard?.segment || insights?.segment),
    [dashboard, insights]
  );

  const shapFeatures = useMemo(() => {
    const raw = insights?.shapLikeFeatures;
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 5);
  }, [insights]);

  const tierMeta = useMemo(() => {
    if (!dashboard) return null;
    const t = segmentToTier(dashboard.segment, dashboard.riskScore);
    return { tier: t, info: TIER_TR[t], steps: getPrioritySteps(t, { fromPage: "analytics" }) };
  }, [dashboard]);

  if (!dashboard || !insights) {
    return <p className="muted">Analizler yükleniyor…</p>;
  }

  return (
    <>
      <h1 className="title">Akıllı finans analizi</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Harcamalarını daha net görmek için özetler ve tahminler burada. Her grafik altında kısa bir yorum bulacaksın.
      </p>

      <div className="finance-dashboard">
        <div id="monexa-oncelikli-grafik">
        <ChartCard
          title="Harcamaların zaman içindeki seyri"
          subtitle="Son günlerin veya haftaların harcama hareketini buradan izle."
          insight={insightMonthlyTrend(trendPoints, monthlyTotal)}
        >
          <MonthlySpendLineChart labels={lineLabels} data={lineValues} height={220} />
        </ChartCard>
        </div>

        <div className="finance-chart-grid finance-chart-grid--split">
          <ChartCard
            title="Harcama dağılımın"
            subtitle="Paranın harcama, tasarruf ve geri kazanım tarafına nasıl ayrıldığı."
            insight={insightCashflow(cashflow, dashboard)}
          >
            <CashflowDonut labels={cashflow.labels} data={cashflow.data} height={230} />
          </ChartCard>
          <ChartCard
            title="Finansal risk durumun"
            subtitle="Genel risk özetin; Koç sekmesinde daha fazla açıklama bulabilirsin."
            insight={insightRiskScore(insights.riskScore)}
          >
            <RiskGaugeChart score={insights.riskScore} height={230} tooltipScoreLabel="Finansal sağlık" />
          </ChartCard>
        </div>

        <ChartCard
          title="Hangi alana daha çok harcıyorsun?"
          subtitle="Kategorilere göre harcama karşılaştırması."
          insight={insightCategoryCompare(categories)}
        >
          <CategorySpendBarChart labels={categoryChart.labels} data={categoryChart.data} horizontal height={260} />
        </ChartCard>

        <div className="finance-chart-grid finance-chart-grid--split">
          <ChartCard
            className="finance-chart-card--span-2"
            title="Haftalık harcama özeti"
            subtitle="Haftanın günlerine göre dağılım."
            insight={insightWeekly(weekly)}
          >
            <WeeklyFinancePolarChart labels={weekly.labels} data={weekly.data} height={260} />
          </ChartCard>
        </div>

        <ChartCard
          title="Gelecek harcama tahmini"
          subtitle="Geçmiş verine dayalı kısa vadeli tahmin; kesin rakam değildir."
          insight={insightMlForecast(trendPoints)}
          footer="Tahminler yönlendirme içindir; gerçek harcama farklılık gösterebilir."
        >
          <MlForecastLineChart labels={mlSpend.labels} histData={mlSpend.histData} predData={mlSpend.predData} height={240} />
        </ChartCard>

        <ChartCard
          title="Risk durumunun seyri"
          subtitle="Son aylardaki risk göstergen ve kısa vadeli öngörü."
          insight={insightRiskForecast(insights)}
        >
          <RiskForecastLineChart labels={riskForecast.labels} hist={riskForecast.hist} pred={riskForecast.pred} height={220} />
        </ChartCard>

        <ChartCard
          title="Yatırım profilin"
          subtitle="Likidite, disiplin ve büyüme gibi alanlarda örnek profil özeti."
          insight={insightInvestment(segmentToTier(dashboard.segment, dashboard.riskScore))}
        >
          <InvestmentRadarChart scores={investScores} height={260} />
        </ChartCard>

        <ChartCard
          title="Skorunu etkileyen alışkanlıklar"
          subtitle="Harcama ve ödeme davranışlarından öne çıkan noktalar."
          insight={insightShap(shapFeatures)}
        >
          <ShapImpactBarChart features={shapFeatures} height={Math.max(180, shapFeatures.length * 52)} />
        </ChartCard>

        <CashbackAnalyticsCharts />

        <TierCtaCard tierMeta={tierMeta} />
      </div>
    </>
  );
}
