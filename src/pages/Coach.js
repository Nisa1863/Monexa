import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getInsights } from "../services/api";
import "../components/finance/charts.css";
import { RiskGaugeChart } from "../components/finance";
import { segmentToTier, getPrioritySteps, TIER_TR } from "../utils/riskTier";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }
};

const FEATURE_TR = {
  CASH_ADVANCE: "Nakit avans",
  PRC_FULL_PAYMENT: "Tam ödeme oranı",
  INSTALLMENTS_PURCHASES: "Taksitli alışveriş",
  ONEOFF_PAYMENT: "Tek seferlik ödeme",
  BALANCE_FREQUENCY: "Bakiye sıklığı",
  PURCHASES: "Alışveriş hacmi",
  PAYMENTS: "Ödeme davranışı",
  MINIMUM_PAYMENTS: "Asgari ödemeler"
};

function featureTitle(key) {
  return FEATURE_TR[key] || String(key).replace(/_/g, " ");
}

function copyForTier(tier) {
  if (tier === "high") {
    return {
      headline: "Risk ve baskı yüksek görünüyor.",
      summary:
        "Nakit avans ve taksit yoğunluğu skoru yukarı çekiyor. Önce borç maliyetini düşürmeye odaklanmak en net kazanımı verir."
    };
  }
  if (tier === "medium") {
    return {
      headline: "Dengeli ama iyileştirilebilir.",
      summary:
        "Harcama ile ödeme arasında küçük bir gerilim var. Birkaç alışkanlık değişikliğiyle skorunu rahatça iyileştirebilirsin."
    };
  }
  return {
    headline: "Genel görünüm iyi.",
    summary:
      "Ödeme disiplinin ve harcama tempon dengeli. Tasarruf ve yatırım tarafını güçlendirmek için uygun bir dönemdesin."
  };
}

export default function Coach() {
  const [searchParams] = useSearchParams();
  const actionsRef = useRef(null);
  const [insights, setInsights] = useState(null);
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const { data } = await getInsights();
        if (!c) setInsights(data);
      } catch {
        if (!c) {
          setInsights({
            riskScore: 58,
            segment: "Dengeli",
            shapLikeFeatures: [
              { feature: "CASH_ADVANCE", description: "Nakit avans kullanımı risk algısını yükseltir.", impact: 0.2 },
              { feature: "PRC_FULL_PAYMENT", description: "Tam ödeme oranı düşükse maliyet birikir.", impact: -0.15 },
              { feature: "INSTALLMENTS_PURCHASES", description: "Taksit yoğunluğu taahhütleri artırır.", impact: 0.1 }
            ]
          });
        }
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const score = insights?.riskScore ?? 58;
  const urlTier = searchParams.get("t");
  const tier =
    urlTier === "low" || urlTier === "medium" || urlTier === "high"
      ? urlTier
      : segmentToTier(insights?.segment, score);
  const copy = copyForTier(tier);
  const prioritySteps = getPrioritySteps(tier);

  useEffect(() => {
    if (searchParams.get("odak") !== "adimlar") return;
    const timer = setTimeout(() => {
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 480);
    return () => clearTimeout(timer);
  }, [searchParams, insights]);

  const reasons =
    insights?.shapLikeFeatures?.length > 0
      ? insights.shapLikeFeatures.slice(0, 3).map((f) => ({
          title: featureTitle(f.feature),
          text: f.description
        }))
      : [
          { title: "Nakit avans eğilimi", text: "Acil nakit ihtiyacı risk algısını artırır." },
          { title: "Tam ödeme oranı", text: "Asgari ödemede kalmak toplam maliyeti büyütür." },
          { title: "Taksit yoğunluğu", text: "Uzun vadeli taahhütler esnekliği azaltır." }
        ];

  const scrollToActions = () => {
    actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <h1 className="title">Koç</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Önce durumunu anla, sonra bağlantılı adımlarla ilerle.
      </p>

      <motion.div className="card card--elevated mx-modern-surface" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="muted" style={{ margin: "0 0 4px", fontSize: 12 }}>
          Finansal sağlık skoru
        </p>
        <div
          role="img"
          aria-label={`Finansal sağlık skoru ${score} üzerinden 100`}
          style={{ maxWidth: 280, margin: "0 auto 8px" }}
        >
          <RiskGaugeChart score={score} height={200} tooltipScoreLabel="Finansal sağlık" />
        </div>
        <p style={{ textAlign: "center", fontWeight: 600, color: "var(--mx-ink)", margin: "4px 0 0", fontSize: 14 }}>
          {copy.headline}
        </p>
        <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 6 }}>
          {copy.summary}
        </p>
      </motion.div>

      <div className="flow-connector" aria-hidden>
        <span className="flow-connector__line" />
      </div>

      <motion.section
        className="card card--why"
        id="neden"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="section-title">Durumun neden böyle?</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Aşağıdaki faktörler skorunu şekillendiriyor. Bunlar “suçlama” değil; öncelik sırası.
        </p>
        <motion.ul className="why-list" variants={container} initial="hidden" animate="show">
          {reasons.map((r, i) => (
            <motion.li key={i} className="why-list__item" variants={item}>
              <span className="why-list__dot">{i + 1}</span>
              <div>
                <strong style={{ fontSize: 14 }}>{r.title}</strong>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                  {r.text}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
        <button type="button" className="btn btn-linkflow" onClick={scrollToActions}>
          Bu durumda ne yapabilirim? ↓
        </button>
      </motion.section>

      <div className="flow-connector" aria-hidden>
        <span className="flow-connector__line" />
      </div>

      <motion.section
        className="card card--actions"
        id="actions"
        ref={actionsRef}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="section-title">Atılacak adımlar</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          <strong>{TIER_TR[tier].title}:</strong> {TIER_TR[tier].subtitle} Sıralama segmentin ve skorunla uyumlu; her
          satır ilgili ekrana gider.
        </p>
        <div className="action-chips">
          {prioritySteps.map((s, i) => (
            <Link key={`${s.to}-${i}`} to={s.to} className="action-chip">
              <span className={`action-chip__step ${i >= 1 ? "action-chip__step--accent" : ""}`}>{i + 1}</span>
              <span className="action-chip__text">{s.label}</span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Koç ekranı sadece rehberlik/öncelik adımlarına odaklı. */}
    </>
  );
}
