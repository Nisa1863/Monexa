import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");

  const onSubmit = async () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      setMessage("Lütfen e-posta gir.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const { data } = await forgotPassword({ email: e });
      setMessage(data?.message || "Şifre sıfırlama bağlantısı oluşturuldu.");
      setResetLink(data?.reset_link || "");
    } catch (err) {
      setMessage(err?.response?.data?.message || "İşlem başarısız.");
      setResetLink("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="title">Şifremi unuttum</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        E-posta adresini gir, şifre sıfırlama bağlantısı oluşturulsun.
      </p>
      <div className="card">
        <input className="input" type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={onSubmit} disabled={loading}>
          {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı oluştur"}
        </button>
        {message ? <p style={{ fontSize: 13, marginTop: 10 }}>{message}</p> : null}
        {resetLink ? (
          <p style={{ fontSize: 12, wordBreak: "break-all" }}>
            Demo link: <a href={resetLink}>{resetLink}</a>
          </p>
        ) : null}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        <Link to="/">Girişe dön</Link>
      </p>
    </>
  );
}
