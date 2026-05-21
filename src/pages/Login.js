import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import MonexaLogo from "../components/MonexaLogo";
import { login, register } from "../services/api";
import { persistUserSession } from "../utils/userSession";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState(() => {
    const raw = localStorage.getItem("monexa_login_form");
    if (!raw) return { email: "", password: "" };
    try {
      const parsed = JSON.parse(raw);
      return {
        email: parsed?.email || "",
        password: ""
      };
    } catch {
      return { email: "", password: "" };
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Never persist password locally; keep only email convenience.
    localStorage.setItem("monexa_login_form", JSON.stringify({ email: form.email || "" }));
  }, [form.email]);

  const onSubmit = async () => {
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    if (!email || !password) {
      setError("Lütfen e-posta ve şifre gir.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const { data } = await login({ email, password });
      localStorage.setItem("monexa_token", data.token);
      persistUserSession(data.user, email);
      nav("/connect");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        try {
          const username = email.split("@")[0] || "kullanici";
          await register({
            first_name: username,
            last_name: "User",
            username,
            email,
            password,
            confirm_password: password
          });
          const { data } = await login({ email, password });
          localStorage.setItem("monexa_token", data.token);
          persistUserSession(data.user, email);
          nav("/connect");
          return;
        } catch (registerErr) {
          const msg = registerErr?.response?.data?.message;
          setError(msg || "Giriş başarısız. Bilgilerini kontrol et.");
          return;
        }
      }
      if (status === 400) {
        setError("E-posta ve şifre zorunlu.");
        return;
      }
      setError("Giriş başarısız. Sunucunun çalıştığından emin ol.");
    } finally {
      setLoading(false);
    }
  };

  const demoFaceId = () => {
    nav("/scan");
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "min(460px, 99%)", marginLeft: "auto", marginRight: "auto" }}>
            <MonexaLogo size={460} />
          </div>
        </div>
      </div>

      <div className="card card--elevated login-card">
        <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 15, textAlign: "center" }}>
          Hoş geldin. E-posta ve şifrenle devam et.
        </p>

        <div className="input-wrap">
          <input
            type="email"
            placeholder="E-posta"
            className="input input--inset"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <span className="input-icon" aria-hidden>
            <FaEnvelope />
          </span>
        </div>
        <div className="input-wrap">
          <input
            type="password"
            placeholder="Şifre"
            className="input input--inset"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span className="input-icon" aria-hidden>
            <FaLock />
          </span>
        </div>

        {error ? (
          <p style={{ color: "#9b2c2c", fontSize: 13, marginTop: 0 }}>{error}</p>
        ) : null}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: -4,
            marginBottom: 10,
            gap: 12
          }}
        >
          <Link to="/hakkinda" className="muted" style={{ fontSize: 12 }}>
            Hakkında
          </Link>
          <Link to="/forgot-password" className="muted" style={{ fontSize: 12 }}>
            Şifremi unuttum
          </Link>
        </div>

        <button type="button" onClick={onSubmit} className="btn btn-primary btn-login btn-login--premium" style={{ width: "100%" }}>
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>

        <button type="button" onClick={demoFaceId} className="btn btn-faceid btn-faceid--premium" style={{ width: "100%", marginTop: 12 }}>
          <span className="btn-faceid__icon" aria-hidden />
          Yüz tanıma ile giriş
        </button>
      </div>

      <p style={{ textAlign: "center", marginTop: 18 }}>
        <span className="muted" style={{ fontSize: 14 }}>
          Hesabın yok mu?{" "}
        </span>
        <Link to="/welcome" className="link-gold">
          Hesap oluştur
        </Link>
      </p>
    </div>
  );
}
