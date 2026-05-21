import { useState } from "react";
import { storeIconEmoji } from "./storeIcons";

function formatMoney(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

export default function StoreDealCard({ store, onUse }) {
  const [expanded, setExpanded] = useState(false);
  const active = store.isActive !== false && store.status === "active";

  return (
    <article className="cashback-store-card">
      <div className="cashback-store-card__top">
        <div className="cashback-store-card__icon" aria-hidden>
          {storeIconEmoji(store.icon)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="cashback-store-card__name">{store.storeName}</p>
          <p className="cashback-store-card__category">{store.category}</p>
        </div>
        <span className="cashback-store-card__rate">%{store.cashbackRate}</span>
      </div>
      <p className="cashback-store-card__desc">{store.description}</p>
      <div className="cashback-store-card__meta">
        <span>Min. {formatMoney(store.minSpend)}</span>
        <span>Son: {formatDate(store.validUntil)}</span>
        {!active ? <span style={{ color: "#9b2c2c" }}>Süresi doldu</span> : null}
      </div>
      {expanded ? (
        <p className="muted" style={{ fontSize: 11, margin: "0 0 10px", lineHeight: 1.45 }}>
          Harcamanız mağaza adıyla eşleştiğinde cashback otomatik hesaplanır. Minimum tutarın altındaki işlemler kampanyaya dahil
          edilmez.
        </p>
      ) : null}
      <div className="cashback-store-card__actions">
        <button type="button" className="btn btn-secondary cashback-store-card__btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Kapat" : "Detayları Gör"}
        </button>
        <button
          type="button"
          className="btn btn-primary cashback-store-card__btn"
          disabled={!active}
          onClick={() => onUse?.(store)}
        >
          Kampanyayı Kullan
        </button>
      </div>
    </article>
  );
}
