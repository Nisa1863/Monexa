import axios from "axios";

async function requestApi(method, url, data, options = {}) {
  const { headers = {}, timeout = 10000, ...rest } = options;
  const token = localStorage.getItem("monexa_token");
  let userEmail = "";
  try {
    const raw = localStorage.getItem("monexa_user");
    userEmail = raw ? JSON.parse(raw)?.email || "" : "";
  } catch {
    userEmail = "";
  }
  const client = axios.create({
    // Always same-origin: CRA dev server proxies /api to the selected backend.
    // This removes mobile/network/port mismatch issues.
    baseURL: "/api",
    withCredentials: true,
    timeout
  });

  return client.request({
    method,
    url,
    data,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userEmail ? { "X-User-Email": userEmail } : {}),
      ...headers
    },
    ...rest
  });
}

export const login = (payload) => requestApi("post", "/auth/login", payload);
export const register = (payload) => requestApi("post", "/auth/register", payload);
export const forgotPassword = (payload) => requestApi("post", "/auth/forgot-password", payload);
export const resetPassword = (payload) => requestApi("post", "/auth/reset-password", payload);
export const getProfile = () => requestApi("get", "/auth/profile");
export const updateProfile = (payload) => requestApi("put", "/auth/update-profile", payload);
export const getDashboard = () => requestApi("get", "/dashboard");
export const addSpendingEntry = (payload) => requestApi("post", "/spending/entry", payload);
export const connectBank = (payload) => requestApi("post", "/bank/connect", payload);
export const getMockBankStatus = () => requestApi("get", "/mock-bank/status");
export const connectMockBank = () => requestApi("post", "/mock-bank/connect");
export const getMockBankAccount = () => requestApi("get", "/mock-bank/account");
export const getMockBankPayments = (params) =>
  requestApi("get", `/mock-bank/payments${params?.type ? `?type=${encodeURIComponent(params.type)}` : ""}`);
export const getMockBankPayment = (id) => requestApi("get", `/mock-bank/payments/${encodeURIComponent(id)}`);
export const getMockBankSummary = () => requestApi("get", "/mock-bank/summary");
export const scanReceipt = (formData) =>
  requestApi("post", "/receipts/scan", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
export const getCashbackStores = () => requestApi("get", "/cashback/stores");
export const getCashbackTransactions = () => requestApi("get", "/cashback/transactions");
export const getCashbackSummary = () => requestApi("get", "/cashback/summary");
export const calculateCashback = () => requestApi("post", "/cashback/calculate");
export const getInsights = () => requestApi("get", "/insights");
export const predictRisk = (payload) => requestApi("post", "/ml/predict", payload);
export const autoSegmentUser = async ({
  balance = 1000,
  purchases = 300,
  payments = 200
}) => {
  const response = await fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ balance, purchases, payments })
  });
  if (!response.ok) {
    throw new Error("Kullanıcı segmentasyonu başarısız oldu.");
  }
  return response.json();
};

export default { requestApi };