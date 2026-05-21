import { useEffect, useState } from "react";
import { getInsights, predictRisk } from "../services/api";
import { ModelOutputDonut, ModelOutputBar } from "../components/finance";
import { ALAN_ETIKET } from "./insightsFieldLabels";
import { readStoredUser } from "../utils/userSession";

const DEFAULT_FORM = {
  BALANCE: 3000,
  PURCHASES: 5000,
  ONEOFF_PURCHASES: 2000,
  INSTALLMENTS_PURCHASES: 1500,
  CASH_ADVANCE: 500,
  CREDIT_LIMIT: 10000,
  PAYMENTS: 4000,
  MINIMUM_PAYMENTS: 1000,
  PRC_FULL_PAYMENT: 0.5,
  TENURE: 12,
  BALANCE_FREQUENCY: 1,
  PURCHASES_FREQUENCY: 0.8,
  ONEOFF_PURCHASES_FREQUENCY: 0.5,
  PURCHASES_INSTALLMENTS_FREQUENCY: 0.6,
  CASH_ADVANCE_FREQUENCY: 0.2,
  CASH_ADVANCE_TRX: 3,
  PURCHASES_TRX: 25
};

function cleanText(value) {
  if (typeof value !== "string") return value;
  return value
    .replaceAll("Yüksek", "Yüksek")
    .replaceAll("yüksek", "yüksek")
    .replaceAll("düzeyi", "düzeyi")
    .replaceAll("yönetimine", "yönetimine")
    .replaceAll("yoğunluğunu", "yoğunluğunu")
    .replaceAll("Ã¼", "ü")
    .replaceAll("Ã¶", "ö")
    .replaceAll("Ã§", "ç")
    .replaceAll("Ä±", "ı")
    .replaceAll("ÅŸ", "ş")
    .replaceAll("ÄŸ", "ğ");
}

function formStorageKey() {
  const email = String(readStoredUser()?.email || "").trim().toLowerCase();
  return email ? `monexa_insights_form_${email}` : "monexa_insights_form";
}

function normalizeFormInput(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FORM };
  const merged = { ...DEFAULT_FORM };
  Object.keys(DEFAULT_FORM).forEach((key) => {
    if (raw[key] != null && raw[key] !== "") merged[key] = raw[key];
  });
  return merged;
}

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);
  const [predError, setPredError] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);

  const VISIBLE_KEYS = [
    "BALANCE",
    "PURCHASES",
    "ONEOFF_PURCHASES",
    "INSTALLMENTS_PURCHASES",
    "CASH_ADVANCE",
    "CREDIT_LIMIT",
    "PAYMENTS",
    "MINIMUM_PAYMENTS",
    "PRC_FULL_PAYMENT",
    "TENURE"
  ];
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await getInsights();
      setInsights(data);

      const savedRaw = localStorage.getItem(formStorageKey());
      let nextForm = normalizeFormInput(data?.lastMlInput);
      if (savedRaw) {
        try {
          nextForm = normalizeFormInput({ ...nextForm, ...JSON.parse(savedRaw) });
        } catch {
          // ignore corrupt local cache
        }
      }
      setForm(nextForm);
    };
    load();
  }, []);

  const onPredict = async () => {
    try {
      setLoadingPred(true);
      setPredError("");
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)]));
      payload.category_spending = {
        food: Number(form.ONEOFF_PURCHASES) * 0.22 + Number(form.PURCHASES) * 0.2,
        transport: Number(form.PURCHASES) * 0.15,
        shopping: Number(form.ONEOFF_PURCHASES) * 0.55 + Number(form.INSTALLMENTS_PURCHASES) * 0.2,
        bills: Number(form.MINIMUM_PAYMENTS) * 0.8 + Number(form.BALANCE) * 0.02,
        entertainment: Math.max(
          0,
          Number(form.PURCHASES) -
            (Number(form.ONEOFF_PURCHASES) * 0.22 +
              Number(form.PURCHASES) * 0.2 +
              Number(form.PURCHASES) * 0.15 +
              (Number(form.ONEOFF_PURCHASES) * 0.55 + Number(form.INSTALLMENTS_PURCHASES) * 0.2) +
              (Number(form.MINIMUM_PAYMENTS) * 0.8 + Number(form.BALANCE) * 0.02))
        )
      };
      localStorage.setItem(formStorageKey(), JSON.stringify(form));

      const { data } = await predictRisk(payload);
      setPrediction(data);
      setShowResults(true);
      setInsights((prev) => ({
        ...prev,
        riskScore: data.riskScore,
        segment: data.segment,
        riskLabel: data.riskLabel,
        recommendations: data.recommendations,
        savings_suggestions: data.savings_suggestions,
        recommendedCreditLimit: data.recommendedCreditLimit,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      setPredError(err?.response?.data?.message || "Analiz çalışmadı. Lütfen tekrar dene.");
    } finally {
      setLoadingPred(false);
    }
  };

  if (!insights) {
    return <p className="muted">Yapay zekâ özeti yükleniyor…</p>;
  }

  const displayScore = showResults && prediction?.riskScore != null ? prediction.riskScore : insights.riskScore;
  const displayLabel =
    showResults && prediction?.riskLabel
      ? prediction.riskLabel
      : insights.riskLabel || cleanText(insights.segment);
  const displaySegment = showResults && prediction?.segment ? prediction.segment : insights.segment;

  return (
    <>
      <h1 className="title">Detaylı risk değerlendirmesi</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Kart ve harcama alışkanlıklarına göre kişisel bir özet. Aşağıdaki bilgileri doldurarak güncel bir değerlendirme alabilirsin.
      </p>

      <div className="card mx-modern-surface" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
          Finansal risk durumun: {displayScore} / 100
        </h3>
        <p className="muted" style={{ margin: "4px 0" }}>
          Profil özeti: <strong>{cleanText(displayLabel)}</strong>
          {displaySegment && displaySegment !== displayLabel ? (
            <span> ({cleanText(displaySegment)})</span>
          ) : null}
        </p>
        {insights.updatedAt ? (
          <p className="muted" style={{ fontSize: 11, margin: "0 0 8px" }}>
            Son analiz: {new Date(insights.updatedAt).toLocaleString("tr-TR")}
          </p>
        ) : null}
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "rgba(44, 39, 36, 0.10)",
            overflow: "hidden",
            marginTop: 8
          }}
          aria-label={`Risk skoru barı: ${displayScore} / 100`}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, Number(displayScore) || 0))}%`,
              height: "100%",
              background: "linear-gradient(90deg, #4a2c2a 0%, #c9a227 100%)"
            }}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Kişisel analizini oluştur</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Temel bilgileri gir; istersen ayrıntılı alanları da ekleyebilirsin. Son girdiğin değerler kaydedilir.
        </p>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? "Ayrıntıları gizle" : "Ayrıntıları göster"}
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 8
          }}
        >
          {(showAdvanced ? Object.keys(form) : VISIBLE_KEYS).map((key) => (
            <label key={key} style={{ fontSize: 11 }}>
              {ALAN_ETIKET[key] || key}
              <input
                className="input"
                style={{ marginTop: 4, padding: 8, fontSize: 12 }}
                type="number"
                step="any"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={onPredict} style={{ width: "100%", marginTop: 8 }}>
          {loadingPred ? "Analiz ediliyor…" : "Analizimi yap"}
        </button>
        {predError ? <p style={{ color: "#9b2c2c", fontSize: 13 }}>{predError}</p> : null}
        {!showResults ? (
          <p className="muted" style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>
            Sonuçları görmek için &quot;Analizimi yap&quot; düğmesine bas.
          </p>
        ) : null}
        {showResults && prediction ? (
          <div style={{ marginTop: 10, borderTop: "1px solid var(--mx-line)", paddingTop: 10 }}>
            <p style={{ fontSize: 14 }}>
              Profil özeti: <strong>{cleanText(prediction.segment)}</strong>
            </p>
            <p style={{ fontSize: 14 }}>
              Finansal risk durumun: <strong>{cleanText(prediction.riskLabel)}</strong> (skor: {prediction.riskScore})
            </p>
            {prediction.recommendedCreditLimit != null ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Önerilen kredi limiti: ₺{Number(prediction.recommendedCreditLimit).toLocaleString("tr-TR")}
              </p>
            ) : null}
            <p className="muted" style={{ fontSize: 13 }}>
              {cleanText(prediction.advice)}
            </p>
            {prediction?.savings_suggestions ? (
              <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                Aylık potansiyel tasarruf: ₺
                <strong>{Number(prediction.savings_suggestions.potential_monthly_saving || 0).toLocaleString("tr-TR")}</strong>
                {" "}(%{prediction.savings_suggestions.save_rate_percent})
              </p>
            ) : null}
            {Array.isArray(prediction?.recommendations) ? (
              <div style={{ marginTop: 8 }}>
                {prediction.recommendations.map((rec, idx) => (
                  <p key={`${idx}-${rec}`} style={{ fontSize: 12, margin: "4px 0" }}>
                    · {cleanText(rec)}
                  </p>
                ))}
              </div>
            ) : null}
            {prediction?.visual_data?.pie?.length ? (
              <div className="card" style={{ marginTop: 10, padding: 12 }}>
                <h4 style={{ marginTop: 0, fontSize: 14 }}>Harcama dağılımın</h4>
                <ModelOutputDonut items={prediction.visual_data.pie.map((i) => ({ label: i.label, value: i.value }))} height={240} />
              </div>
            ) : null}
            {prediction?.visual_data?.bar?.length ? (
              <div className="card" style={{ marginTop: 10, padding: 12 }}>
                <h4 style={{ marginTop: 0, fontSize: 14 }}>Kategori karşılaştırması</h4>
                <ModelOutputBar items={prediction.visual_data.bar} height={240} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
