import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";
import { insightInvestment, insightPortfolioBar } from "../utils/chartInsights";
import "../components/finance/charts.css";
import { ChartCard, PortfolioBarChart, PortfolioDonutChart } from "../components/finance";

const PORTFOLIOS = {
  low: [
    { label: "Düşük risk", pct: 45, color: "#63B3FF" },
    { label: "Fon", pct: 30, color: "#6EC9B8" },
    { label: "Hisse", pct: 15, color: "#FFB38A" },
    { label: "Nakit", pct: 10, color: "#B8A9E8" }
  ],
  medium: [
    { label: "Altın / fon", pct: 40, color: "#63B3FF" },
    { label: "Hisse", pct: 30, color: "#FFB38A" },
    { label: "Nakit", pct: 20, color: "#B8A9E8" },
    { label: "Kripto (düşük pay)", pct: 10, color: "#94a3b8" }
  ],
  high: [
    { label: "Hisse / tema", pct: 45, color: "#FFB38A" },
    { label: "Fon", pct: 25, color: "#63B3FF" },
    { label: "Nakit", pct: 20, color: "#B8A9E8" },
    { label: "Spekülatif", pct: 10, color: "#F0A090" }
  ]
};

export default function Invest() {
  const [risk, setRisk] = useState("medium");
  const [savingsBox, setSavingsBox] = useState({
    potential_monthly_saving: 0,
    save_rate_percent: 0,
    tips: []
  });
  const slices = PORTFOLIOS[risk];
  const maxNewInvestPct = risk === "low" ? 30 : risk === "high" ? 60 : 40;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getDashboard();
        if (cancelled) return;
        setSavingsBox({
          potential_monthly_saving: Number(data?.suggestedSavings?.potential_monthly_saving || 0),
          save_rate_percent: Number(data?.suggestedSavings?.save_rate_percent || 0),
          tips: Array.isArray(data?.personalizedTips) ? data.personalizedTips : []
        });
      } catch {
        if (cancelled) return;
        setSavingsBox((prev) => prev);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className="title">Yatırım</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Risk toleransına göre örnek bir dağılım gösteriyoruz. Gerçek yatırım kararı öncesi uzman görüşü almanı öneririz.
      </p>
      <p className="muted" style={{ marginTop: 10, marginBottom: 12, fontSize: 13, lineHeight: 1.5 }}>
        Yeni yatırımlarını toplam bütçenin yaklaşık <strong>%{maxNewInvestPct}</strong>’ini geçmeyecek şekilde kademeli artırmak daha güvenli bir başlangıç olabilir.
      </p>

      <div className="card mx-modern-surface" style={{ marginBottom: 12 }}>
        <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
          Risk profilin
        </p>
        <div className="pill-row">
          {[
            { id: "low", label: "Düşük" },
            { id: "medium", label: "Orta" },
            { id: "high", label: "Yüksek" }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pill ${risk === p.id ? "pill--on" : ""}`}
              onClick={() => setRisk(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="finance-dashboard">
        <ChartCard
          title="Önerilen portföy dağılımı"
          subtitle="Seçtiğin risk profiline göre örnek varlık dağılımı."
          insight={insightInvestment(risk)}
        >
          <PortfolioDonutChart key={risk} slices={slices} height={240} />
        </ChartCard>

        <ChartCard
          title="Varlık sınıflarına göre pay"
          subtitle="Her kalemin bütçendeki yüzdesi."
          insight={insightPortfolioBar(slices)}
        >
          <PortfolioBarChart key={`${risk}-bar`} slices={slices} height={220} />
        </ChartCard>
      </div>

      <div className="card mx-modern-surface" style={{ marginTop: 12 }}>
        <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
          Kişisel tasarruf fırsatı
        </p>
        <div className="row-stat" style={{ border: "none", padding: "0 0 8px" }}>
          <span className="muted">Aylık potansiyel birikim</span>
          <strong>₺{Number(savingsBox.potential_monthly_saving || 0).toLocaleString("tr-TR")}</strong>
        </div>
        <div className="row-stat" style={{ borderTop: "1px solid var(--mx-line)" }}>
          <span className="muted">Önerilen azaltım oranı</span>
          <strong>%{Number(savingsBox.save_rate_percent || 0)}</strong>
        </div>
        {(savingsBox.tips || []).slice(0, 2).map((tip, idx) => (
          <p key={`${idx}-${tip}`} style={{ margin: "6px 0", fontSize: 13 }}>
            · {tip}
          </p>
        ))}
      </div>
    </>
  );
}
