import { insightCashbackMonthly, insightCashbackStores } from "../../utils/chartInsights";
import { ChartCard, CashbackMonthlyLineChart, CategorySpendBarChart } from "../finance";
import { useCashbackData } from "./useCashbackData";

export default function CashbackAnalyticsCharts() {
  const { summary, loading, monthlyChart, storeChart } = useCashbackData();

  if (loading) {
    return null;
  }

  const hasStoreData = (storeChart.data || []).some((v) => Number(v) > 0);
  const hasMonthlyData = (monthlyChart.data || []).some((v) => Number(v) > 0);

  if (!hasStoreData && !hasMonthlyData) {
    return null;
  }

  return (
    <>
      {hasMonthlyData ? (
        <ChartCard
          title="Aylık kazanım"
          subtitle="Son 6 ay."
          insight={insightCashbackMonthly(monthlyChart, summary)}
        >
          <CashbackMonthlyLineChart labels={monthlyChart.labels} data={monthlyChart.data} height={200} />
        </ChartCard>
      ) : null}

      {hasStoreData ? (
        <ChartCard
          title="Markalara göre kazanç"
          subtitle="Anlaşmalı markalardan elde ettiğin dağılım."
          insight={insightCashbackStores(storeChart, summary)}
        >
          <CategorySpendBarChart labels={storeChart.labels} data={storeChart.data} horizontal height={200} />
        </ChartCard>
      ) : null}
    </>
  );
}
