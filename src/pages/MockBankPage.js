import { Link } from "react-router-dom";
import MockBankDashboard from "../components/mockBank/MockBankDashboard";
import "../components/mockBank/mock-bank.css";

export default function MockBankPage() {
  return (
    <>
      <h1 className="title">Bağlı hesap</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Demo banka hesabı ve işlem geçmişin.
      </p>
      <MockBankDashboard />
      <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 12 }}>
        <Link to="/profile">Profile dön</Link>
      </p>
    </>
  );
}
