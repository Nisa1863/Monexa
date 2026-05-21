import PartnerStoreCard from "./PartnerStoreCard";
import { useCashbackData } from "./useCashbackData";
import "./cashback.css";

function formatMoney(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  } catch {
    return value;
  }
}

export default function CashbackSection() {
  const { summary, loading, partnerStores, recentTx } = useCashbackData({ loadAllTransactions: true });

  const earnedTx = recentTx.filter((tx) => tx.status === "earned").slice(0, 6);

  if (loading) {
    return (
      <div className="card mx-modern-surface advantages-block" style={{ marginBottom: 12 }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Yükleniyor…
        </p>
      </div>
    );
  }

  return (
    <div className="card mx-modern-surface advantages-block advantages-block--profile" style={{ marginBottom: 12 }}>
      <p className="advantages-block__eyebrow muted">Avantajlarım</p>

      <div className="advantages-summary">
        <p className="advantages-summary__label muted">Toplam geri kazanım</p>
        <p className="advantages-summary__value">{formatMoney(summary?.totalEarned)}</p>
        <p className="advantages-summary__month muted">
          Bu ay <strong>{formatMoney(summary?.earnedThisMonth)}</strong>
        </p>
      </div>

      {partnerStores.length ? (
        <section className="advantages-partners">
          <p className="advantages-section-label muted">Marka fırsatları</p>
          <div className="partner-grid">
            {partnerStores.map((store) => (
              <PartnerStoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="advantages-history">
        <p className="advantages-section-label muted">Son avantaj işlemleri</p>
        {earnedTx.length ? (
          <ul className="advantages-tx-list">
            {earnedTx.map((tx) => (
              <li key={`${tx.paymentNo}-${tx.storeId}`} className="advantages-tx-item">
                {tx.storeLogoUrl ? (
                  <img className="advantages-tx-item__logo" src={tx.storeLogoUrl} alt="" loading="lazy" />
                ) : (
                  <span className="advantages-tx-item__logo advantages-tx-item__logo--fallback">
                    {tx.storeName?.charAt(0)}
                  </span>
                )}
                <div className="advantages-tx-item__content">
                  <div className="advantages-tx-item__main">
                    <span className="advantages-tx-item__store">{tx.storeName}</span>
                    <span className="advantages-tx-item__amount">+{formatMoney(tx.cashbackAmount)}</span>
                  </div>
                  <span className="advantages-tx-item__meta muted">
                    {formatDate(tx.date)} · {formatMoney(tx.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted advantages-block__empty">Henüz işlem yok.</p>
        )}
      </section>
    </div>
  );
}
