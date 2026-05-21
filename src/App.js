import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PhoneLayout from "./components/PhoneLayout";
import Login from "./pages/Login";
import ConnectAccounts from "./pages/ConnectAccounts";
import Onboarding from "./pages/Onboarding";
import FaceLogin from "./pages/FaceLogin";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Invest from "./pages/Invest";
import Coach from "./pages/Coach";
import Profile from "./pages/Profile";
import Insights from "./pages/Insights";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Hakkinda from "./pages/Hakkinda";
import MockBankPage from "./pages/MockBankPage";

function App() {
  return (
    <div className="app-fill">
      <BrowserRouter>
        <div className="app-router-outlet">
          <Routes>
            <Route element={<PhoneLayout />}>
              <Route path="/" element={<Login />} />
              <Route path="/welcome" element={<Onboarding />} />
              <Route path="/scan" element={<FaceLogin />} />
              <Route path="/connect" element={<ConnectAccounts />} />
              <Route path="/bank" element={<MockBankPage />} />
              <Route path="/home" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/invest" element={<Invest />} />
              <Route path="/coach" element={<Coach />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/hakkinda" element={<Hakkinda />} />
            </Route>
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
