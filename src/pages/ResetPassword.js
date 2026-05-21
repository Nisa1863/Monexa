import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

function useQueryToken() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
}

export default function ResetPassword() {
  const nav = useNavigate();
  const tokenFromQuery = useQueryToken();
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async () => {
    if (!token || !password || !confirmPassword) {
      setMessage("Tüm alanları doldur.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Şifreler eşleşmiyor.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      await resetPassword({ token, password, confirm_password: confirmPassword });
      setMessage("Şifre güncellendi. Giriş ekranına yönlendiriliyorsun...");
      setTimeout(() => nav("/"), 700);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Şifre sıfırlama başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="title">Şifre sıfırla</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Token ve yeni şifreni gir.
      </p>
      <div className="card">
        <input className="input" placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} />
        <input
          className="input"
          style={{ marginTop: 10 }}
          type="password"
          placeholder="Yeni şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input"
          style={{ marginTop: 10 }}
          type="password"
          placeholder="Yeni şifre (tekrar)"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={onSubmit} disabled={loading}>
          {loading ? "Güncelleniyor..." : "Şifreyi güncelle"}
        </button>
        {message ? <p style={{ fontSize: 13, marginTop: 10 }}>{message}</p> : null}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        <Link to="/">Girişe dön</Link>
      </p>
    </>
  );
}
