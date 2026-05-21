import { Link, useLocation, useNavigate } from "react-router-dom";

function pathOnly(route) {
  return String(route || "").split("?")[0];
}

export default function TierCtaCard({ tierMeta, scrollTargetId = "monexa-oncelikli-grafik" }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!tierMeta?.steps?.length) return null;

  const firstStep =
    tierMeta.steps.find((s) => s.samePageScroll && pathOnly(s.to) === location.pathname) ||
    tierMeta.steps.find((s) => pathOnly(s.to) !== location.pathname) ||
    tierMeta.steps[0];
  const samePage = Boolean(firstStep.samePageScroll) || pathOnly(firstStep.to) === location.pathname;

  const goFirstStep = () => {
    if (samePage) {
      const target = document.getElementById(scrollTargetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(firstStep.to);
  };

  return (
    <div className="card card--tier-cta" style={{ marginTop: 2 }}>
      <p
        className="muted"
        style={{ margin: "0 0 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}
      >
        Size uygun sıra
      </p>
      <h2 className="title" style={{ fontSize: "1.2rem", margin: "0 0 8px", fontFamily: "var(--mx-font-sans)", fontWeight: 700 }}>
        {tierMeta.info.title}
      </h2>
      <p className="muted" style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.5 }}>
        {tierMeta.info.subtitle}
      </p>
      <p className="muted" style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.45 }}>
        İlk adım: <strong>{firstStep.label}</strong>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Link to={`/coach?t=${tierMeta.tier}&odak=adimlar`} className="btn btn-primary" style={{ textAlign: "center" }}>
          Koç’ta tüm öncelikli adımlar
        </Link>
        <button type="button" className="btn btn-secondary" style={{ textAlign: "center", fontSize: 14, width: "100%" }} onClick={goFirstStep}>
          İlk adıma doğrudan git →
        </button>
      </div>
    </div>
  );
}
