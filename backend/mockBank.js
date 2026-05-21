const sc = require("./spendingCategories");

const DISPLAY_CATEGORIES = [
  "Market",
  "Ulaşım",
  "Fatura",
  "Abonelik",
  "Sağlık",
  "Eğitim",
  "Eğlence",
  "Kafe / Restoran",
  "Alışveriş",
  "Diğer"
];

const CATEGORY_TO_KEY = {
  Market: "market",
  Ulaşım: "transport",
  Fatura: "bills",
  Abonelik: "subscription",
  Sağlık: "health",
  Eğitim: "education",
  Eğlence: "entertainment",
  "Kafe / Restoran": "dining",
  Alışveriş: "market",
  Diğer: "other"
};

const PAYMENT_TEMPLATES = [
  { title: "Migros Market", description: "Haftalık market alışverişi", category: "Market", amount: 865.4 },
  { title: "Netflix Abonelik", description: "Aylık dijital abonelik", category: "Abonelik", amount: 229.99 },
  { title: "Shell Benzin", description: "Araç yakıt gideri", category: "Ulaşım", amount: 1450 },
  { title: "İSKİ Faturası", description: "Su faturası ödemesi", category: "Fatura", amount: 312.5 },
  { title: "Eczane", description: "Sağlık ürünleri", category: "Sağlık", amount: 189.9 },
  { title: "Udemy Kurs", description: "Online eğitim", category: "Eğitim", amount: 449 },
  { title: "Sinema Bileti", description: "Hafta sonu etkinliği", category: "Eğlence", amount: 320 },
  { title: "Starbucks", description: "Kafe harcaması", category: "Kafe / Restoran", amount: 165 },
  { title: "Zara Alışveriş", description: "Giyim alışverişi", category: "Alışveriş", amount: 1280 },
  { title: "Spotify", description: "Müzik aboneliği", category: "Abonelik", amount: 59.99 },
  { title: "BİM Market", description: "Günlük alışveriş", category: "Market", amount: 245.6 },
  { title: "Metro Kart", description: "Toplu taşıma", category: "Ulaşım", amount: 580 },
  { title: "Turkcell Fatura", description: "Mobil hat ödemesi", category: "Fatura", amount: 420 },
  { title: "Hastane", description: "Muayene ücreti", category: "Sağlık", amount: 750 },
  { title: "Kitapçı", description: "Ders kitabı", category: "Eğitim", amount: 295 },
  { title: "Konser", description: "Etkinlik bileti", category: "Eğlence", amount: 890 },
  { title: "Restoran", description: "Akşam yemeği", category: "Kafe / Restoran", amount: 540 },
  { title: "Teknosa", description: "Elektronik aksesuar", category: "Alışveriş", amount: 2100 },
  { title: "Bakkal", description: "Küçük alışveriş", category: "Diğer", amount: 78.5 }
];

const INCOME_TEMPLATES = [
  { title: "Maaş Ödemesi", description: "Aylık maaş transferi", amount: 28500 },
  { title: "Freelance Gelir", description: "Proje ödemesi", amount: 4500 }
];

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatAccountNumber(seed) {
  const parts = [];
  for (let i = 0; i < 6; i += 1) {
    const chunk = String((seed + i * 7919) % 10000).padStart(4, "0");
    parts.push(chunk);
  }
  return `TR${String(10 + (seed % 80)).padStart(2, "0")} ${parts.join(" ")}`;
}

function buildMockAccount(userEmail, profile) {
  const seed = hashSeed(userEmail);
  const first = String(profile?.first_name || "").trim();
  const last = String(profile?.last_name || "").trim();
  const ownerName = `${first} ${last}`.trim() || userEmail.split("@")[0] || "Kullanıcı";

  return {
    ownerName,
    bankName: "Monexa Bank",
    accountNumber: formatAccountNumber(seed),
    accountType: "Vadesiz Hesap",
    balance: round2(18500 + (seed % 12000) + (seed % 97) / 100),
    currency: "TRY",
    connectedAt: new Date().toISOString()
  };
}

function buildMockPayments(userEmail) {
  const seed = hashSeed(userEmail);
  const now = new Date();
  const payments = [];
  let payIndex = 1001;

  PAYMENT_TEMPLATES.forEach((tpl, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - ((seed + i * 3) % 28) - 1);
    const jitter = ((seed + i * 17) % 40) / 100;
    payments.push({
      id: `pay-${userEmail}-${payIndex}`,
      paymentNo: `PAY-${payIndex}`,
      title: tpl.title,
      description: tpl.description,
      amount: round2(tpl.amount * (1 + jitter * 0.15)),
      category: tpl.category,
      date: d.toISOString().slice(0, 10),
      paymentMethod: i % 3 === 0 ? "Havale" : "Banka Kartı",
      type: "expense",
      status: "completed"
    });
    payIndex += 1;
  });

  INCOME_TEMPLATES.forEach((tpl, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1 + i);
    payments.push({
      id: `pay-${userEmail}-${payIndex}`,
      paymentNo: `PAY-${payIndex}`,
      title: tpl.title,
      description: tpl.description,
      amount: round2(tpl.amount),
      category: "Gelir",
      date: d.toISOString().slice(0, 10),
      paymentMethod: "Havale",
      type: "income",
      status: "completed"
    });
    payIndex += 1;
  });

  return payments.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function buildSummary(account, payments) {
  const expenses = payments.filter((p) => p.type === "expense" && p.status === "completed");
  const incomes = payments.filter((p) => p.type === "income" && p.status === "completed");
  const totalExpense = round2(expenses.reduce((s, p) => s + p.amount, 0));
  const totalIncome = round2(incomes.reduce((s, p) => s + p.amount, 0));

  const byCategory = {};
  expenses.forEach((p) => {
    byCategory[p.category] = round2((byCategory[p.category] || 0) + p.amount);
  });
  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown[0]?.category || "—";

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  let currentMonth = 0;
  let priorMonth = 0;
  expenses.forEach((p) => {
    const d = new Date(p.date);
    if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) currentMonth += p.amount;
    if (d.getFullYear() === thisYear && d.getMonth() === thisMonth - 1) priorMonth += p.amount;
    if (thisMonth === 0 && d.getFullYear() === thisYear - 1 && d.getMonth() === 11) priorMonth += p.amount;
  });
  currentMonth = round2(currentMonth);
  priorMonth = round2(priorMonth);
  const monthlyChangePercent =
    priorMonth > 0 ? Math.round(((currentMonth - priorMonth) / priorMonth) * 100) : currentMonth > 0 ? 100 : 0;

  const subscriptions = expenses.filter((p) => p.category === "Abonelik").slice(0, 6);

  return {
    balance: account.balance,
    totalExpense,
    totalIncome,
    topCategory,
    monthlyChangePercent,
    currentMonthSpending: currentMonth,
    priorMonthSpending: priorMonth,
    categoryBreakdown,
    subscriptions,
    recentPayments: payments.slice(0, 8)
  };
}

function getMockBankState(record) {
  if (!record?.mockBank?.connected) return null;
  return record.mockBank;
}

function connectMockBank(userEmail, profile) {
  const account = buildMockAccount(userEmail, profile);
  const payments = buildMockPayments(userEmail);
  const summary = buildSummary(account, payments);
  return {
    connected: true,
    connectedAt: new Date().toISOString(),
    account,
    payments,
    summary
  };
}

function syncPaymentsToTransactions(payments) {
  return payments
    .filter((p) => p.type === "expense" && p.status === "completed")
    .map((p) => ({
      created_at: new Date(`${p.date}T12:00:00.000Z`).toISOString(),
      amount: p.amount,
      category: CATEGORY_TO_KEY[p.category] || "other",
      description: p.title,
      source: "mock_bank"
    }));
}

module.exports = {
  DISPLAY_CATEGORIES,
  CATEGORY_TO_KEY,
  buildMockAccount,
  buildMockPayments,
  buildSummary,
  getMockBankState,
  connectMockBank,
  syncPaymentsToTransactions
};
