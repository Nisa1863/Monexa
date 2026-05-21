import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MonexaLogo from "../components/MonexaLogo";
import { register } from "../services/api";

export default function Onboarding() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onRegister = async () => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirm = form.confirm_password;

    if (!firstName || !lastName || !email || !password || !confirm) {
      setMsg("Lütfen tüm alanları doldur.");
      return;
    }
    if (password !== confirm) {
      setMsg("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setMsg("Şifre en az 6 karakter olmalı.");
      return;
    }

    try {
      setLoading(true);
      setMsg("");
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirm
      });
      setMsg("Kayıt başarılı. Giriş ekranına yönlendiriliyorsun...");
      setTimeout(() => nav("/"), 500);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setMsg("Bu e-posta ile zaten hesap var. Giriş yapmayı dene.");
      } else if (status === 404) {
        setMsg("Kayıt servisi bulunamadı. Sunucuyu yeniden başlatıp tekrar dene.");
      } else {
        setMsg(err?.response?.data?.message || "Kayıt başarısız. Bilgilerini kontrol et.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", paddingTop: 8 }}>
      <MonexaLogo size={64} />
      <h1 className="title title--hero" style={{ marginTop: 12 }}>
        Monexa
      </h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        Hesap oluştur
      </p>

      <div className="card" style={{ textAlign: "left", marginBottom: 14 }}>
        <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Ad
        </label>
        <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />

        <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4, marginTop: 10 }}>
          Soyad
        </label>
        <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />

        <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4, marginTop: 10 }}>
          E-posta
        </label>
        <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

        <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4, marginTop: 10 }}>
          Şifre
        </label>
        <input
          className="input"
          type="password"
          minLength={6}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4, marginTop: 10 }}>
          Şifre (Tekrar)
        </label>
        <input
          className="input"
          type="password"
          minLength={6}
          autoComplete="new-password"
          value={form.confirm_password}
          onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
        />
        <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>
          Şifre en az 6 karakter olmalı.
        </p>

        <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={onRegister} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Hesap oluştur"}
        </button>
      </div>

      {msg ? <p style={{ color: "#9b2c2c", marginTop: 0, fontSize: 13 }}>{msg}</p> : null}

      <p className="muted" style={{ marginTop: 12 }}>
        Zaten hesabın var mı? <Link to="/">Giriş yap</Link>
      </p>
    </div>
  );
}