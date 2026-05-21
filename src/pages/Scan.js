import { useState } from "react";
import { scanReceipt } from "../services/api";

export default function Scan() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onScan = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      if (file) formData.append("receipt", file);
      const { data } = await scanReceipt(formData);
      setResult(data.receipt);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="title">Fiş tarama</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Fişini yükle; harcamalar otomatik çıkarılsın.
      </p>

      <div className="card" style={{ marginBottom: 14 }}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="button" className="btn btn-primary" onClick={onScan} style={{ marginTop: 12, width: "100%" }}>
          {loading ? "Analiz ediliyor…" : "Fişi tara"}
        </button>
      </div>

      {result ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{result.merchant}</h3>
          <p className="muted">Kategori: {result.category}</p>
          <p>
            Toplam tutar: <strong>₺{result.totalAmount}</strong>
          </p>
          <p className="muted">Tarih: {result.date}</p>
          {result.items.map((item, idx) => (
            <div key={`${item.name}-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>{item.name}</span>
              <strong>₺{item.amount}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="card muted">Henüz fiş analizi yok.</div>
      )}
      <div style={{ height: 12 }} />
      <div className="card muted" style={{ fontSize: 13 }}>
        Not: Üretim sürümünde satır satır fiş çıkarma (optik tanıma) eklenebilir.
      </div>
    </>
  );
}
