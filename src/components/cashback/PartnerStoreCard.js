import { useState } from "react";

export default function PartnerStoreCard({ store }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <article
      className="partner-card"
      style={{ "--partner-tint": store.accentColor || "#f7f3eb" }}
      aria-label={`${store.storeName} %${store.cashbackRate} avantaj`}
    >
      <div className="partner-card__logo" aria-hidden>
        {!logoFailed && store.logoUrl ? (
          <img src={store.logoUrl} alt="" loading="lazy" onError={() => setLogoFailed(true)} />
        ) : (
          <span className="partner-card__logo-fallback">{store.storeName?.charAt(0) || "?"}</span>
        )}
      </div>
      <p className="partner-card__rate">%{store.cashbackRate}</p>
      <p className="partner-card__tagline">{store.tagline || store.description}</p>
    </article>
  );
}
