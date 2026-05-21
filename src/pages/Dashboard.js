import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../services/api";
import { getDisplayNameFromStorage, refreshUserDisplayName } from "../utils/userSession";
import DetailedRiskCta from "../components/DetailedRiskCta";
import {
  insightMonthlyTrend,
  insightWeekly,
  insightCategories,
  insightIncomeExpense,
  insightRiskScore
} from "../utils/chartInsights";
import "../components/finance/charts.css";
import {
  ChartCard,
  MonthlySpendLineChart,
  IncomeExpenseDonut,
  CategorySpendBarChart,
  RiskGaugeChart,
  WeeklyFinanceBarChart
} from "../components/finance";
import {
  trendPointsFromDashboard,
  weeklySpendingBars,
  incomeExpenseSlices
} from "../utils/financeSeries";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [displayName, setDisplayName] = useState(getDisplayNameFromStorage);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await refreshUserDisplayName();
      if (!cancelled && refreshed?.fullName) {
        setDisplayName(refreshed.fullName);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getDashboard();
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || "Veriler alınamadı. Sunucuyu tekrar başlatıp yenile.";
          setLoadError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trendPoints = useMemo(() => (dashboard ? trendPointsFromDashboard(dashboard) : []), [dashboard]);

  const lineLabels = useMemo(() => trendPoints.map((p) => p.label), [trendPoints]);
  const lineValues = useMemo(() => trendPoints.map((p) => p.value), [trendPoints]);

  const weekly = useMemo(() => {
    if (!dashboard) return { labels: [], data: [] };
    return weeklySpendingBars(trendPoints, dashboard.spendingSummary.monthlyTotal);
  }, [dashboard, trendPoints]);

  const incomeExpense = useMemo(() => (dashboard ? incomeExpenseSlices(dashboard) : null), [dashboard]);

  const categoryChart = useMemo(() => {
    if (!dashboard) return { labels: [], data: [] };
    const cats = [...dashboard.spendingSummary.categories].sort((a, b) => b.amount - a.amount);
    return {
      labels: cats.map((c) => c.category),
      data: cats.map((c) => c.amount)
    };
  }, [dashboard]);

  const categories = dashboard?.spendingSummary?.categories;

  if (loading || !dashboard) {
    return <p className="muted">{loadError || "Özet yükleniyor…"}</p>;
  }

  const monthlyTotal = dashboard.spendingSummary.monthlyTotal;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Merhaba
          </p>
          <h1 className="title" style={{ fontSize: "1.5rem", margin: 0 }}>
            {displayName}
          </h1>
        </div>
        <Link to="/connect" className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }}>
          + Hesap
        </Link>
      </div>

      <div className="finance-dashboard">
        <div className="finance-dashboard__hero">
          <div className="finance-stat-pill">
            <p className="finance-stat-pill__label">Bu ay harcama</p>
            <p className="finance-stat-pill__value">₺{monthlyTotal.toLocaleString("tr-TR")}</p>
          </div>
          <div className="finance-stat-pill">
            <p className="finance-stat-pill__label">Finansal risk durumun</p>
            <p className="finance-stat-pill__value">{dashboard.riskScore}</p>
          </div>
        </div>

        <ChartCard
          title="Harcamaların nasıl değişiyor?"
          subtitle="Son günlerin veya haftaların harcama hareketini buradan takip edebilirsin."
          insight={insightMonthlyTrend(trendPoints, monthlyTotal)}
        >
          <MonthlySpendLineChart labels={lineLabels} data={lineValues} height={210} />
        </ChartCard>

        <div className="finance-chart-grid finance-chart-grid--split">
          <ChartCard
            title="Haftalık harcama özeti"
            subtitle="Gün gün harcama dağılımın."
            insight={insightWeekly(weekly)}
          >
            <WeeklyFinanceBarChart labels={weekly.labels} data={weekly.data} height={200} />
          </ChartCard>
          <ChartCard
            title="Finansal risk durumun"
            subtitle="0–100 arası özet skor; düşük olması genelde daha rahat bir tablo demektir."
            insight={insightRiskScore(dashboard.riskScore)}
          >
            <RiskGaugeChart score={dashboard.riskScore} height={200} tooltipScoreLabel="Finansal sağlık" />
          </ChartCard>
        </div>

        <ChartCard
          title="Paranın nereye gittiği"
          subtitle="Harcama ve birikim alanının kabaca dağılımı."
          insight={insightIncomeExpense(incomeExpense, monthlyTotal)}
        >
          <IncomeExpenseDonut labels={incomeExpense.labels} data={incomeExpense.data} height={220} />
        </ChartCard>

        <ChartCard
          title="Hangi alana daha çok harcıyorsun?"
          subtitle="Kategorilere göre harcama dağılımın."
          insight={insightCategories(categories)}
        >
          <CategorySpendBarChart labels={categoryChart.labels} data={categoryChart.data} horizontal={false} height={240} />
        </ChartCard>

        <DetailedRiskCta />

        <p className="muted" style={{ fontSize: 12, margin: "4px 0 8px", textAlign: "center" }}>
          <Link to="/analytics" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            Grafikler ve öneriler için Analiz sekmesine geç
          </Link>
        </p>
      </div>
    </>
  );
}
