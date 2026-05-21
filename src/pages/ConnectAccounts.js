import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MonexaLogo from "../components/MonexaLogo";
import MockBankDashboard from "../components/mockBank/MockBankDashboard";
import { connectMockBank, getMockBankStatus } from "../services/api";
import "../components/mockBank/mock-bank.css";

export default function ConnectAccounts() {
  const nav = useNavigate();
  const [phase, setPhase] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getMockBankStatus();
        if (!cancelled) {
          setPhase(data.connected ? "connected" : "idle");
        }
      } catch {
        if (!cancelled) setPhase("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onConnect = async () => {
    try {
      setPhase("connecting");
      setMsg("");
      await new Promise((r) => setTimeout(r, 1800));
      await connectMockBank();
      setPhase("connected");
    } catch {
      setPhase("idle");
      setMsg("Bağlantı başarısız. Sunucunun çalıştığından emin ol.");
    }
  };

  const goHome = () => nav("/home");

  if (phase === "loading") {
    return <p className="muted">Yükleniyor…</p>;
  }

  if (phase === "connecting") {
    return (
      <div className="mock-bank-connect">
        <div className="card mock-bank-connect__loading">
          <div className="mock-bank-connect__spinner" aria-hidden />
          <p className="mock-bank-connect__loading-text">Banka hesabı güvenli şekilde bağlanıyor…</p>
          <p className="mock-bank-connect__loading-sub">Demo veriler hazırlanıyor, lütfen bekleyin.</p>
        </div>
      </div>
    );
  }

  if (phase === "connected") {
    return (
      <>
        <h1 className="title" style={{ fontSize: "1.35rem", marginBottom: 8 }}>
          Bağlı demo hesabın
        </h1>
        <MockBankDashboard onContinue={goHome} />
      </>
    );
  }

  return (
    <div className="mock-bank-connect">
      <div style={{ textAlign: "center", paddingBottom: 8 }}>
        <MonexaLogo size={48} />
        <h1 className="title" style={{ marginTop: 12 }}>
          Hesap Bağla
        </h1>
        <p className="muted" style={{ margin: "0 auto", maxWidth: 300 }}>
          Tek tıkla demo banka hesabını bağla; harcamaların ve özetlerin otomatik yüklensin. Gerçek banka bilgisi istenmez.
        </p>
      </div>

      <div className="card">
        <p className="muted" style={{ fontSize: 12, marginTop: 0, lineHeight: 1.5 }}>
          Monexa Bank üzerinden örnek hesap ve işlem geçmişi gösterilir. Tüm veriler sunucudan demo amaçlı gelir.
        </p>

        {msg ? <p style={{ color: "#9b2c2c", fontSize: 13 }}>{msg}</p> : null}

        <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={onConnect}>
          Hesabı Bağla
        </button>

        <button type="button" className="btn btn-secondary" style={{ width: "100%", marginTop: 10 }} onClick={goHome}>
          Ana sayfaya geç
        </button>

        <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 6 }} onClick={goHome}>
          Şimdi değil, atla
        </button>
      </div>
    </div>
  );
}
