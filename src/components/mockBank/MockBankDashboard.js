import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMockBankAccount, getMockBankPayments, getMockBankSummary } from "../../services/api";
import { CategorySpendBarChart } from "../finance";
import "./mock-bank.css";

const DISCLAIMER =
  "Bu proje kapsamında gerçek banka bağlantısı kullanılmamaktadır. Gösterilen hesap ve ödeme verileri demo amaçlı mock verilerden oluşmaktadır.";

function formatMoney(value, currency = "TRY") {
  const sym = currency === "TRY" ? "₺" : "";
  return `${sym}${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return value;
  }
}

export default function MockBankDashboard({ onContinue }) {
  const [account, setAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [accRes, payRes, sumRes] = await Promise.all([
          getMockBankAccount(),
          getMockBankPayments(),
          getMockBankSummary()
        ]);
        if (cancelled) return;
        setAccount(accRes.data.account);
        setPayments(payRes.data.payments || []);
        setSummary(sumRes.data);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Demo hesap verileri yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryChart = useMemo(() => {
    const rows = summary?.categoryBreakdown || [];
    return {
      labels: rows.map((r) => r.category),
      data: rows.map((r) => r.amount)
    };
  }, [summary]);

  const subscriptions = summary?.subscriptions || [];

  if (loading) {
    return <p className="muted">Demo hesap bilgileri yükleniyor…</p>;
  }

  if (error || !account) {
    return (
      <div className="card">
        <p style={{ color: "#9b2c2c", fontSize: 14 }}>{error || "Hesap bulunamadı."}</p>
        <Link to="/connect" className="btn btn-secondary" style={{ display: "block", textAlign: "center", marginTop: 12 }}>
          Bağlantı ekranına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="mock-bank">
      <p className="mock-bank__disclaimer">{DISCLAIMER}</p>

      <div className="mock-bank__account-card">
        <div className="mock-bank__account-top">
          <div>
            <p className="mock-bank__bank-name">{account.bankName}</p>
            <p className="mock-bank__owner">{account.ownerName}</p>
          </div>
          <span className="mock-bank__badge">Demo bağlı</span>
        </div>
        <p className="mock-bank__balance">{formatMoney(account.balance, account.currency)}</p>
        <p className="mock-bank__meta">
          {account.accountType} · {account.accountNumber}
        </p>
      </div>

      {summary ? (
        <div className="mock-bank__stats-grid">
          <div className="mock-bank__stat">
            <span className="mock-bank__stat-label">Toplam harcama</span>
            <strong>{formatMoney(summary.totalExpense)}</strong>
          </div>
          <div className="mock-bank__stat">
            <span className="mock-bank__stat-label">Toplam gelir</span>
            <strong>{formatMoney(summary.totalIncome)}</strong>
          </div>
          <div className="mock-bank__stat">
            <span className="mock-bank__stat-label">En çok harcama</span>
            <strong>{summary.topCategory}</strong>
          </div>
          <div className="mock-bank__stat">
            <span className="mock-bank__stat-label">Aylık değişim</span>
            <strong>
              {summary.monthlyChangePercent > 0 ? "+" : ""}
              {summary.monthlyChangePercent}%
            </strong>
          </div>
        </div>
      ) : null}

      {categoryChart.labels.length ? (
        <div className="card mock-bank__section">
          <h3 className="mock-bank__section-title">Kategori bazlı harcama</h3>
          <CategorySpendBarChart labels={categoryChart.labels} data={categoryChart.data} horizontal height={220} />
        </div>
      ) : null}

      {subscriptions.length ? (
        <div className="card mock-bank__section">
          <h3 className="mock-bank__section-title">Abonelik ödemeleri</h3>
          {subscriptions.map((p) => (
            <div key={p.paymentNo} className="mock-bank__payment-row">
              <div>
                <strong>{p.title}</strong>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                  {formatDate(p.date)}
                </p>
              </div>
              <span className="mock-bank__amount expense">-{formatMoney(p.amount)}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card mock-bank__section">
        <h3 className="mock-bank__section-title">Son işlemler</h3>
        <div className="mock-bank__payments-list">
          {payments.slice(0, 12).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`mock-bank__payment-row mock-bank__payment-btn${selectedPayment?.id === p.id ? " is-active" : ""}`}
              onClick={() => setSelectedPayment(p)}
            >
              <div>
                <strong>{p.title}</strong>
                <p className="muted" style={{ margin: 0, fontSize: 11 }}>
                  {p.paymentNo} · {p.category} · {p.paymentMethod}
                </p>
              </div>
              <span className={`mock-bank__amount ${p.type === "income" ? "income" : "expense"}`}>
                {p.type === "income" ? "+" : "-"}
                {formatMoney(p.amount)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedPayment ? (
        <div className="card mock-bank__section">
          <h3 className="mock-bank__section-title">İşlem detayı</h3>
          <p style={{ margin: "4px 0", fontSize: 14 }}>
            <strong>{selectedPayment.title}</strong>
          </p>
          <p className="muted" style={{ fontSize: 13 }}>{selectedPayment.description}</p>
          <div className="mock-bank__detail-grid">
            <span>Tutar</span>
            <strong>{formatMoney(selectedPayment.amount)}</strong>
            <span>Tarih</span>
            <strong>{formatDate(selectedPayment.date)}</strong>
            <span>Kategori</span>
            <strong>{selectedPayment.category}</strong>
            <span>Durum</span>
            <strong>{selectedPayment.status === "completed" ? "Tamamlandı" : selectedPayment.status}</strong>
          </div>
        </div>
      ) : null}

      <div className="mock-bank__actions">
        {onContinue ? (
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={onContinue}>
            Ana sayfaya geç
          </button>
        ) : (
          <Link to="/home" className="btn btn-primary" style={{ display: "block", textAlign: "center" }}>
            Ana sayfaya geç
          </Link>
        )}
        <Link to="/analytics" className="btn btn-secondary" style={{ display: "block", textAlign: "center", marginTop: 8 }}>
          Harcama analizlerini gör
        </Link>
      </div>
    </div>
  );
}
