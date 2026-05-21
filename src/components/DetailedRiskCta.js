import { Link } from "react-router-dom";

export default function DetailedRiskCta({ className = "" }) {
  return (
    <div className={`card mx-modern-surface ${className}`.trim()} style={{ marginTop: 2 }}>
      <p className="muted" style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.5 }}>
        Daha ayrıntılı değerlendirme ve kişisel sorular için Koç veya detaylı risk ekranına geçebilirsin.
      </p>
      <Link to="/insights" className="btn btn-primary" style={{ display: "block", textAlign: "center" }}>
        Detaylı risk değerlendirmesi
      </Link>
    </div>
  );
}
