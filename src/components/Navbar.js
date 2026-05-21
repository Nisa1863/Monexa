import { FaHome, FaChartPie, FaLandmark, FaShieldAlt, FaUser } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/home", label: "Ana sayfa", Icon: FaHome },
  { path: "/analytics", label: "Analiz", Icon: FaChartPie },
  { path: "/invest", label: "Yatırım", Icon: FaLandmark },
  { path: "/coach", label: "Koç", Icon: FaShieldAlt },
  { path: "/profile", label: "Profil", Icon: FaUser }
];

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const active = location.pathname;

  return (
    <nav className="ios-tab-bar" aria-label="Sekmeler">
      <div className="ios-tab-bar__items">
        {tabs.map(({ path, label, Icon }) => {
          const isActive = active === path;
          const isCoach = path === "/coach";
          return (
            <button
              key={path}
              type="button"
              className={`ios-tab-bar__btn ${isActive ? "ios-tab-bar__btn--active" : ""} ${isCoach ? "ios-tab-bar__btn--coach" : ""}`}
              onClick={() => nav(path)}
            >
              <Icon className="ios-tab-bar__icon" aria-hidden />
              <span className="ios-tab-bar__label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
