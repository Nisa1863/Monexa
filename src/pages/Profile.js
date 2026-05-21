import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboard, getProfile, updateProfile } from "../services/api";
import { buildFullName, persistUserSession } from "../utils/userSession";
import "../components/finance/charts.css";
import CashbackSection from "../components/cashback/CashbackSection";
import "../components/cashback/cashback.css";

export default function Profile() {
  const nav = useNavigate();
  const raw = localStorage.getItem("monexa_user");
  const user = raw ? JSON.parse(raw) : { fullName: "Misafir", email: "-" };
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [originalProfile, setOriginalProfile] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [editMode, setEditMode] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);

  const formatPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "-";
    if (digits.length === 11) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }
    return value;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getProfile();
        if (cancelled) return;
        const p = data?.user || {};
        persistUserSession(p, p.email || user.email);
        setProfileForm({
          first_name: p.first_name || user.fullName?.split(" ")[0] || "",
          last_name: p.last_name || user.fullName?.split(" ").slice(1).join(" ") || "",
          email: p.email || user.email || "",
          phone: p.phone || user.phone || ""
        });
        setOriginalProfile({
          first_name: p.first_name || user.fullName?.split(" ")[0] || "",
          last_name: p.last_name || user.fullName?.split(" ").slice(1).join(" ") || "",
          email: p.email || user.email || "",
          phone: p.phone || user.phone || ""
        });
      } catch {
        if (cancelled) return;
        setProfileForm({
          first_name: user.fullName?.split(" ")[0] || "",
          last_name: user.fullName?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
          phone: user.phone || ""
        });
        setOriginalProfile({
          first_name: user.fullName?.split(" ")[0] || "",
          last_name: user.fullName?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
          phone: user.phone || ""
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.email, user.fullName]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getDashboard();
        if (!cancelled) setDashboard(data);
      } finally {
        if (!cancelled) setLoadingDash(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async () => {
    const firstName = profileForm.first_name.trim();
    const lastName = profileForm.last_name.trim();
    const email = profileForm.email.trim().toLowerCase();
    const phone = profileForm.phone.trim();

    if (!firstName || !lastName || !email) {
      setProfileMsg("Ad, soyad ve e-posta zorunlu.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMsg("");
      const { data } = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        phone
      });
      const updated = data?.user || {};
      persistUserSession(
        {
          ...user,
          first_name: updated.first_name || firstName,
          last_name: updated.last_name || lastName,
          email: updated.email || email,
          phone: updated.phone || phone,
          fullName: buildFullName({
            first_name: updated.first_name || firstName,
            last_name: updated.last_name || lastName
          })
        },
        updated.email || email
      );
      setProfileMsg("Profil güncellendi.");
      setProfileForm({
        first_name: updated.first_name || firstName,
        last_name: updated.last_name || lastName,
        email: updated.email || email,
        phone: updated.phone || phone
      });
      setOriginalProfile({
        first_name: updated.first_name || firstName,
        last_name: updated.last_name || lastName,
        email: updated.email || email,
        phone: updated.phone || phone
      });
      setEditMode(false);
    } catch (err) {
      const status = err?.response?.status;
      // If backend is running an older build without profile endpoints,
      // keep profile editable by saving locally.
      if (status === 404) {
        persistUserSession(
          {
            ...user,
            first_name: firstName,
            last_name: lastName,
            email,
            phone
          },
          email
        );
        setProfileForm({
          first_name: firstName,
          last_name: lastName,
          email,
          phone
        });
        setOriginalProfile({
          first_name: firstName,
          last_name: lastName,
          email,
          phone
        });
        setEditMode(false);
        setProfileMsg("Profil güncellendi.");
      } else {
        setProfileMsg(err?.response?.data?.message || "Profil güncellenemedi.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const startEdit = () => {
    setProfileMsg("");
    setOriginalProfile({ ...profileForm });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setProfileForm({ ...originalProfile });
    setProfileMsg("");
    setEditMode(false);
  };

  const logout = () => {
    localStorage.removeItem("monexa_token");
    localStorage.removeItem("monexa_user");
    nav("/");
  };

  return (
    <>
      <h1 className="title">Profil</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Hesap bilgilerin ve güvenlik.
      </p>

      <div className="card mx-modern-surface" style={{ marginBottom: 12 }}>
        <div className="row-stat" style={{ border: "none", paddingTop: 0, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Profil bilgileri
          </span>
          {!editMode ? (
            <button
              type="button"
              onClick={startEdit}
              className="btn btn-secondary"
              style={{ padding: "4px 10px", fontSize: 12 }}
              aria-label="Profili düzenle"
            >
              ✏️ Düzenle
            </button>
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>
              Düzenleme modu
            </span>
          )}
        </div>
        <div className="row-stat" style={{ borderTop: "1px solid var(--mx-line)" }}>
          <span className="muted">Ad</span>
          {!editMode ? (
            <strong>{profileForm.first_name || "-"}</strong>
          ) : (
            <input
              className="input"
              style={{ maxWidth: 230, padding: 8, fontSize: 13 }}
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
            />
          )}
        </div>
        <div className="row-stat">
          <span className="muted">Soyad</span>
          {!editMode ? (
            <strong>{profileForm.last_name || "-"}</strong>
          ) : (
            <input
              className="input"
              style={{ maxWidth: 230, padding: 8, fontSize: 13 }}
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
            />
          )}
        </div>
        <div className="row-stat">
          <span className="muted">E-posta</span>
          {!editMode ? (
            <strong style={{ fontSize: 13 }}>{profileForm.email || user.email}</strong>
          ) : (
            <input
              className="input"
              type="email"
              style={{ maxWidth: 230, padding: 8, fontSize: 13 }}
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          )}
        </div>
        <div className="row-stat">
          <span className="muted">Telefon</span>
          {!editMode ? (
            <strong style={{ fontSize: 13 }}>{formatPhone(profileForm.phone || user.phone)}</strong>
          ) : (
            <input
              className="input"
              style={{ maxWidth: 230, padding: 8, fontSize: 13 }}
              placeholder="05xx xxx xx xx"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          )}
        </div>
        <div className="row-stat">
          <span className="muted">Güvenlik</span>
          <span style={{ fontSize: 13 }}>Yüz tanıma (demo)</span>
        </div>
        {editMode ? (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={cancelEdit} disabled={savingProfile}>
              İptal
            </button>
          </div>
        ) : null}
        {profileMsg ? (
          <p className="muted" style={{ marginTop: 8, fontSize: 12, color: profileMsg.includes("güncellendi") ? "#2d6a4f" : "#9b2c2c" }}>
            {profileMsg}
          </p>
        ) : null}
      </div>

      <div className="card mx-modern-surface" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Bağlı hesaplar
          </p>
          <Link to="/bank" style={{ fontSize: 12 }}>
            Demo hesabı gör
          </Link>
        </div>
        {loadingDash || !dashboard ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Hesaplar yükleniyor…
          </p>
        ) : (
          dashboard.bankConnections.map((bank) => (
            <div key={bank.id} className="row-stat">
              <div>
                <strong>{bank.bankName}</strong>
                <div className="muted" style={{ fontSize: 11 }}>
                  {bank.iban}
                </div>
              </div>
              <span
                style={{
                  color: bank.status === "connected" ? "#2d6a4f" : "#c56c39",
                  fontWeight: 700,
                  fontSize: 12
                }}
              >
                {bank.status === "connected" ? "Aktif" : "Bekliyor"}
              </span>
            </div>
          ))
        )}
      </div>

      <CashbackSection />

      <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} onClick={logout}>
        Çıkış yap
      </button>
    </>
  );
}
