const express = require("express");
const http = require("http");
const cors = require("cors");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawnSync, spawn } = require("child_process");

const app = express();
const BASE_PORT = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage() });
const USER_SPENDING_PATH = path.join(__dirname, "data", "user_spending.json");

app.use(cors());
app.use(express.json());

const mockUser = {
  id: "user-1",
  fullName: "Örnek kullanıcı",
  email: "demo@monexa.app"
};

const spendingSummary = {
  monthlyTotal: 14280,
  cashbackTotal: 382,
  categories: [
    { category: "Market", amount: 4300 },
    { category: "Ulaşım", amount: 1560 },
    { category: "Fatura", amount: 3120 },
    { category: "Eğlence", amount: 1980 },
    { category: "Diğer", amount: 3320 }
  ]
};

const behaviorSignals = {
  balanceManagement: 0.54,
  cashAdvanceRatio: 0.37,
  installmentHabit: 0.62,
  fullPaymentRate: 0.43
};

const sc = require("./spendingCategories");
const mockBank = require("./mockBank");
const cashback = require("./cashback");

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function ensureDataStore() {
  const dir = path.dirname(USER_SPENDING_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USER_SPENDING_PATH)) {
    fs.writeFileSync(USER_SPENDING_PATH, JSON.stringify({ users: {} }, null, 2), "utf-8");
  }
}

function readUserStore() {
  ensureDataStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(USER_SPENDING_PATH, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : { users: {} };
  } catch {
    return { users: {} };
  }
}

function writeUserStore(store) {
  ensureDataStore();
  fs.writeFileSync(USER_SPENDING_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function makeTokenForEmail(email) {
  const safeEmail = String(email || mockUser.email).trim().toLowerCase();
  return `demo:${Buffer.from(safeEmail, "utf-8").toString("base64")}`;
}

function decodeEmailFromToken(rawToken) {
  const token = String(rawToken || "");
  if (!token.startsWith("demo:")) return null;
  const encoded = token.slice("demo:".length);
  try {
    const email = Buffer.from(encoded, "base64").toString("utf-8").trim().toLowerCase();
    return email || null;
  } catch {
    return null;
  }
}

function getUserEmail(req) {
  const auth = String(req.headers.authorization || "");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return (
    decodeEmailFromToken(bearer) ||
    String(req.headers["x-user-email"] || req.body?.email || mockUser.email).trim().toLowerCase()
  );
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function aggregateTrendByDay(points) {
  const byDay = new Map();
  (points || []).forEach((p) => {
    const d = new Date(p.date || 0);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    const value = round2(Number(p.value) || 0);
    byDay.set(key, round2((byDay.get(key) || 0) + value));
  });
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ date: `${day}T12:00:00.000Z`, value }));
}

function buildDailyTrendWindow(transactions, dayCount = 14) {
  const byDay = aggregateTrendByDay(
    (transactions || []).map((t) => ({
      date: t.created_at,
      value: Number(t.amount) || 0
    }))
  );
  const dayMap = new Map(byDay.map((p) => [new Date(p.date).toISOString().slice(0, 10), p.value]));
  const now = new Date();
  const points = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    points.push({
      date: d.toISOString(),
      value: round2(dayMap.get(key) || 0)
    });
  }
  return points;
}

function buildWeeklyTrendWindow(transactions, weekCount = 6) {
  const now = new Date();
  const points = [];
  for (let w = weekCount - 1; w >= 0; w -= 1) {
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);
    let sum = 0;
    for (const t of transactions || []) {
      const d = new Date(t.created_at || 0);
      if (Number.isNaN(d.getTime())) continue;
      if (d >= weekStart && d <= weekEnd) sum += Number(t.amount) || 0;
    }
    points.push({ date: weekEnd.toISOString(), value: round2(sum) });
  }
  return points;
}

function buildSpendingTrendPoints(userEmail, record, monthlyTotal) {
  const txs = Array.isArray(record?.transactions) ? record.transactions : [];
  if (txs.length) {
    const daily = buildDailyTrendWindow(txs, 14);
    const daysWithSpend = daily.filter((p) => p.value > 0).length;
    if (daysWithSpend >= 3) return daily;
    const weekly = buildWeeklyTrendWindow(txs, 6);
    const weeksWithSpend = weekly.filter((p) => p.value > 0).length;
    if (weeksWithSpend >= 2) return weekly;
    if (daysWithSpend >= 1) return daily;
  }

  const analyses = Array.isArray(record?.analyses) ? record.analyses : [];
  const fromAnalyses = aggregateTrendByDay(
    analyses
      .filter((a) => a?.created_at != null)
      .map((a) => ({
        date: a.created_at,
        value: Number(a.total_spending) || 0
      }))
  );

  if (fromAnalyses.length >= 2) {
    const unique = new Set(fromAnalyses.map((p) => p.value));
    if (unique.size > 1) return fromAnalyses.slice(-14);
  }

  const seed = hashSeed(userEmail);
  const base = Math.max(monthlyTotal > 0 ? monthlyTotal / 7 : 1200, 350);
  const n = 8;
  const now = new Date();
  const points = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - (n - 1 - i) * 4);
    const wave = Math.sin((i + (seed % 11)) * 0.85) * 0.24;
    const drift = ((i - (n - 1) / 2) / (n - 1)) * 0.2;
    const jitter = (((seed + i * 23) % 97) / 97 - 0.5) * 0.14;
    const factor = Math.max(0.55, 1 + wave + drift + jitter);
    points.push({
      date: d.toISOString(),
      value: round2(base * factor)
    });
  }
  return points;
}

function getBankConnectionsForUser(userEmail) {
  const store = readUserStore();
  const record = store.users[userEmail];
  const mockState = mockBank.getMockBankState(record);
  if (mockState?.connected && mockState.account) {
    return [
      {
        id: "mock-bank-primary",
        bankName: mockState.account.bankName,
        iban: mockState.account.accountNumber,
        status: "connected",
        isMock: true
      }
    ];
  }
  const banks = record?.bankConnections;
  return Array.isArray(banks) ? banks : [];
}

function saveMockBankConnection(userEmail) {
  const store = readUserStore();
  const profile = getProfileForUser(userEmail);
  const state = mockBank.connectMockBank(userEmail, profile);
  const current = store.users[userEmail] || { analyses: [], transactions: [] };
  current.mockBank = state;
  const mockTx = mockBank.syncPaymentsToTransactions(state.payments);
  const existing = Array.isArray(current.transactions) ? current.transactions : [];
  const withoutMock = existing.filter((t) => t.source !== "mock_bank");
  current.transactions = [...withoutMock, ...mockTx];
  current.bankConnections = [
    {
      id: "mock-bank-primary",
      bankName: state.account.bankName,
      iban: state.account.accountNumber,
      status: "connected",
      isMock: true
    }
  ];
  store.users[userEmail] = current;
  writeUserStore(store);
  return state;
}

function getMockBankForUser(userEmail) {
  const store = readUserStore();
  return mockBank.getMockBankState(store.users[userEmail]);
}

function saveBankConnectionForUser(userEmail, connection) {
  const store = readUserStore();
  const current = store.users[userEmail] || { analyses: [] };
  const list = Array.isArray(current.bankConnections) ? current.bankConnections : [];
  const normalizedIban = String(connection.iban || "").replace(/\s+/g, "").toUpperCase();
  const next = [
    { ...connection, iban: connection.iban || normalizedIban },
    ...list.filter((b) => String(b.iban || "").replace(/\s+/g, "").toUpperCase() !== normalizedIban)
  ];
  current.bankConnections = next;
  store.users[userEmail] = current;
  writeUserStore(store);
  return next;
}

function buildCoachAnswer({ question, userEmail, dashboardData }) {
  const q = String(question || "").trim().toLowerCase();
  const riskScore = Number(dashboardData?.riskScore || 50);
  const segment = dashboardData?.segment || "Dengeli";
  const savings = Number(dashboardData?.suggestedSavings?.potential_monthly_saving || 0);
  const tips = Array.isArray(dashboardData?.personalizedTips) ? dashboardData.personalizedTips.slice(0, 2) : [];
  const categories = Array.isArray(dashboardData?.spendingSummary?.categories) ? dashboardData.spendingSummary.categories : [];
  const topCategory = [...categories].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];

  if (q.includes("yatirim") || q.includes("fon") || q.includes("hisse")) {
    const budgetPct = riskScore >= 70 ? 25 : riskScore >= 40 ? 35 : 45;
    return {
      coach_name: "Monexa AI Koc",
      answer: `Risk skorun ${riskScore} (${segment}). Bu profil icin yeni yatirim butcesini gelirinin yaklasik %${budgetPct} seviyesinde tutup kademeli alim yapman daha guvenli olur.`,
      quick_actions: ["Yatirim sayfasinda risk profilini guncelle", "Aylik otomatik birikim limiti belirle"],
      transfers: [
        { label: "Yatirima git", to: "/invest" },
        { label: "Analiz ekranina git", to: "/analytics" }
      ],
      context: { user: userEmail, riskScore, segment }
    };
  }

  if (q.includes("harcama") || q.includes("tasarruf") || q.includes("birikim")) {
    const topCatText = topCategory
      ? `En yuksek kalemin ${topCategory.category} (₺${Math.round(topCategory.amount || 0).toLocaleString("tr-TR")}).`
      : "";
    const tipText = tips.length ? `Oncelikli oneriler: ${tips.join(" ")}` : "";
    return {
      coach_name: "Monexa AI Koc",
      answer: `${topCatText} Bu ay potansiyel birikimin yaklasik ₺${Math.round(savings).toLocaleString("tr-TR")}. Kategori bazli %10-%20 azaltimla hedefe ulasabilirsin. ${tipText}`.trim(),
      quick_actions: ["Yuksek harcama kategorisine aylik limit koy", "Asgari yerine planli odeme kullan"],
      transfers: [
        { label: "Ana sayfaya git", to: "/home" },
        { label: "Analiz ekranina git", to: "/analytics" }
      ],
      context: { user: userEmail, savings }
    };
  }

  return {
    coach_name: "Monexa AI Koc",
    answer: `Finansal durumun icin kisa ozet: risk skorun ${riskScore}, segmentin ${segment}. Bu ay yaklasik ₺${Math.round(savings).toLocaleString("tr-TR")} tasarruf potansiyelin var. Harcama, odeme veya yatirim odakli spesifik bir soru sorarsan daha net plan verebilirim.`,
    quick_actions: ["Harcama dagilimini sor", "Yatirim butcesi sor", "Odeme plani sor"],
    transfers: [
      { label: "Kocta adimlari ac", to: "/coach?odak=adimlar" },
      { label: "Profil sayfasina git", to: "/profile" }
    ],
    context: { user: userEmail, riskScore, segment, savings }
  };
}

function fallbackPredictionFromInput(input) {
  const balance = Math.max(0, Number(input.BALANCE ?? input.balance ?? 0));
  const purchases = Math.max(0, Number(input.PURCHASES ?? input.purchases ?? 0));
  const payments = Math.max(0, Number(input.PAYMENTS ?? input.payments ?? 0));
  const utilization = purchases > 0 ? balance / (purchases + 1) : 0;
  const paymentRatio = purchases > 0 ? payments / (purchases + 1) : 0;
  const rawRisk = 55 + utilization * 25 - paymentRatio * 30;
  const riskScore = Math.max(5, Math.min(95, Math.round(rawRisk)));
  return normalizeMlPrediction({
    segment_name: riskScore >= 70 ? "Yuksek Harcayan" : riskScore >= 40 ? "Orta Riskli" : "Dusuk Riskli",
    risk_score: riskScore,
    payment_confidence: Math.max(5, Math.min(95, Math.round(paymentRatio * 100))),
    recommended_credit_limit: Math.max(1000, Math.round((purchases + payments) * 0.8))
  });
}

function buildDashboardForUser(userEmail) {
  const store = readUserStore();
  const record = store.users[userEmail];
  const latest = Array.isArray(record?.analyses) && record.analyses.length ? record.analyses[record.analyses.length - 1] : null;
  const fromLatest = latest?.categories
    ? sc.categoriesToUserMap(latest.categories)
    : sc.sanitizeUserCategories({
        market: 4300,
        transport: 1560,
        bills: 3120,
        entertainment: 1980,
        other: 3320,
        dining: 0,
        education: 0,
        health: 0,
        subscription: 0
      });
  const txMap = sc.sumTransactionsByCategoryThisMonth(record?.transactions || []);
  const categories = sc.mergeUserCategoryMaps(fromLatest, txMap);
  const recBundle = sc.buildPersonalizedRecommendationsFromUserMap(categories);
  const monthlyTotal = round2(sc.USER_CATEGORY_KEYS.reduce((sum, key) => sum + Number(categories[key] || 0), 0));
  const categoryItems = sc.USER_CATEGORY_KEYS.map((key) => ({
    category: sc.USER_CATEGORY_LABELS[key],
    amount: round2(categories[key])
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const trendPoints = buildSpendingTrendPoints(userEmail, record, monthlyTotal);
  const cashbackSummary = cashback.buildCashbackSummary(record || {});
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const manualTransactions = (Array.isArray(record?.transactions) ? record.transactions : [])
    .filter((t) => {
      const d = new Date(t.created_at || 0);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 40);
  return {
    user: { ...mockUser, email: userEmail },
    bankConnections: getBankConnectionsForUser(userEmail),
    spendingSummary: {
      monthlyTotal,
      cashbackTotal: cashbackSummary.totalEarned,
      categories: categoryItems.length ? categoryItems : [{ category: "Diğer", amount: 0 }]
    },
    cashbackPreview: {
      earnedThisMonth: cashbackSummary.earnedThisMonth,
      activeCampaignCount: cashbackSummary.activeCampaignCount
    },
    manualTransactions,
    spendingTrend: {
      points: trendPoints
    },
    suggestedSavings: recBundle.savings_suggestions,
    personalizedTips: recBundle.recommendations,
    ...buildUserRiskSummary(record, categories, monthlyTotal),
    shapLikeFeatures: buildRiskAnalysis().shapLikeFeatures,
    recommendations: latest?.recommendations || recBundle.recommendations
  };
}

function splitNameParts(fullName = "") {
  const clean = String(fullName || "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return { first_name: "", last_name: "" };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" ")
  };
}

function getProfileForUser(userEmail) {
  const store = readUserStore();
  const userEntry = store.users[userEmail] || {};
  const existingProfile = userEntry.profile;
  if (existingProfile && typeof existingProfile === "object") return existingProfile;
  const localPart = String(userEmail || "").split("@")[0] || "Kullanici";
  return {
    first_name: localPart,
    last_name: "",
    email: userEmail,
    phone: ""
  };
}

function buildUserPayload(userEmail) {
  const profile = getProfileForUser(userEmail);
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  return {
    id: `user-${userEmail}`,
    email: userEmail,
    fullName: fullName || String(userEmail).split("@")[0] || "Kullanıcı",
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone || ""
  };
}

function saveProfileForUser(userEmail, profile) {
  const store = readUserStore();
  const current = store.users[userEmail] || { analyses: [] };
  current.profile = {
    first_name: String(profile.first_name || "").trim(),
    last_name: String(profile.last_name || "").trim(),
    email: String(profile.email || userEmail).trim().toLowerCase(),
    phone: String(profile.phone || "").trim()
  };
  store.users[userEmail] = current;
  writeUserStore(store);
  return current.profile;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) return false;
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const actualHex = crypto.scryptSync(String(password), salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(actualHex, "hex"));
  } catch {
    return false;
  }
}

function getAuthForUser(userEmail) {
  const store = readUserStore();
  return store.users[userEmail]?.auth || null;
}

function saveAuthForUser(userEmail, password) {
  const store = readUserStore();
  const current = store.users[userEmail] || { analyses: [] };
  current.auth = {
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  store.users[userEmail] = current;
  writeUserStore(store);
  return current.auth;
}

function segmentFromRiskScore(riskScore) {
  const score = Number(riskScore) || 0;
  if (score < 35) return "Temkinli";
  if (score < 65) return "Dengeli";
  return "Agresif";
}

function riskLabelFromScore(riskScore) {
  const score = Number(riskScore) || 0;
  if (score >= 65) return "Yüksek dikkat";
  if (score >= 35) return "Orta düzey";
  return "Düşük dikkat";
}

function computeRiskFromCategories(categories, monthlyTotal) {
  const total =
    monthlyTotal > 0
      ? monthlyTotal
      : round2(sc.USER_CATEGORY_KEYS.reduce((sum, key) => sum + Number(categories[key] || 0), 0));
  if (total <= 0) {
    return { riskScore: 50, segment: "Dengeli", riskLabel: "Orta düzey" };
  }
  let pressure = 38;
  for (const key of sc.USER_CATEGORY_KEYS) {
    const amt = Number(categories[key]) || 0;
    const share = amt / total;
    const bench = sc.BENCHMARK_SHARE_USER[key] || 0.1;
    if (share > bench * 1.4) pressure += 14;
    else if (share > bench * 1.15) pressure += 6;
    else if (share < bench * 0.5 && amt > 0) pressure -= 2;
  }
  const riskScore = Math.max(5, Math.min(100, Math.round(pressure)));
  return {
    riskScore,
    segment: segmentFromRiskScore(riskScore),
    riskLabel: riskLabelFromScore(riskScore)
  };
}

function buildUserRiskSummary(record, categories, monthlyTotal) {
  const latest = Array.isArray(record?.analyses) && record.analyses.length ? record.analyses[record.analyses.length - 1] : null;
  if (latest?.prediction && latest.prediction.riskScore != null) {
    const riskScore = Math.max(0, Math.min(100, Math.round(Number(latest.prediction.riskScore))));
    return {
      riskScore,
      segment: latest.prediction.segment || segmentFromRiskScore(riskScore),
      riskLabel: latest.prediction.riskLabel || riskLabelFromScore(riskScore),
      updatedAt: latest.created_at || null
    };
  }
  const computed = computeRiskFromCategories(categories, monthlyTotal);
  return { ...computed, updatedAt: null };
}

function deriveMlInputFromUserData(categories, monthlyTotal) {
  const total = Math.max(
    monthlyTotal,
    round2(sc.USER_CATEGORY_KEYS.reduce((sum, key) => sum + Number(categories[key] || 0), 0))
  );
  const purchases = Math.max(500, Math.round(total * 1.05));
  const balance = Math.max(300, Math.round(purchases * 0.32));
  const payments = Math.max(200, Math.round(purchases * 0.58));
  const oneoff = Math.max(100, Math.round((categories.dining || 0) + (categories.market || 0) * 0.35));
  const installments = Math.max(80, Math.round((categories.subscription || 0) + (categories.education || 0) * 0.4));
  const cashAdvance = Math.max(0, Math.round((categories.other || 0) * 0.25));
  const creditLimit = Math.max(5000, Math.round(purchases * 2.2));
  const minPayments = Math.max(100, Math.round((categories.bills || 0) * 0.35 + purchases * 0.04));
  const prcFull = Math.max(0.15, Math.min(0.95, payments / (purchases + 1)));

  return {
    BALANCE: balance,
    PURCHASES: purchases,
    ONEOFF_PURCHASES: oneoff,
    INSTALLMENTS_PURCHASES: installments,
    CASH_ADVANCE: cashAdvance,
    CREDIT_LIMIT: creditLimit,
    PAYMENTS: payments,
    MINIMUM_PAYMENTS: minPayments,
    PRC_FULL_PAYMENT: round2(prcFull),
    TENURE: 12,
    BALANCE_FREQUENCY: 1,
    PURCHASES_FREQUENCY: 0.8,
    ONEOFF_PURCHASES_FREQUENCY: 0.5,
    PURCHASES_INSTALLMENTS_FREQUENCY: 0.6,
    CASH_ADVANCE_FREQUENCY: cashAdvance > 0 ? 0.35 : 0.15,
    CASH_ADVANCE_TRX: cashAdvance > 0 ? 4 : 1,
    PURCHASES_TRX: Math.max(8, Math.round(purchases / 220))
  };
}

function buildMonthlyRiskTrend(analyses) {
  const rows = (Array.isArray(analyses) ? analyses : [])
    .filter((a) => a?.prediction?.riskScore != null && a?.created_at)
    .slice(-6);
  if (rows.length >= 2) {
    return rows.map((a) => ({
      month: new Date(a.created_at).toLocaleDateString("tr-TR", { month: "short" }),
      riskScore: Math.round(Number(a.prediction.riskScore))
    }));
  }
  return [
    { month: "Oca", riskScore: 54 },
    { month: "Şub", riskScore: 58 },
    { month: "Mar", riskScore: 61 },
    { month: "Nis", riskScore: 64 },
    { month: "May", riskScore: 62 },
    { month: "Haz", riskScore: 68 }
  ];
}

function buildInsightsForUser(userEmail) {
  const store = readUserStore();
  const record = store.users[userEmail] || {};
  const latest = Array.isArray(record.analyses) && record.analyses.length ? record.analyses[record.analyses.length - 1] : null;
  const baseDefaults = sc.categoriesToUserMap({
    food: 1200,
    transport: 600,
    shopping: 900,
    bills: 1100,
    entertainment: 500
  });
  const fromLatest = latest?.categories ? sc.categoriesToUserMap(latest.categories) : baseDefaults;
  const txMap = sc.sumTransactionsByCategoryThisMonth(record.transactions || []);
  const categories = sc.mergeUserCategoryMaps(fromLatest, txMap);
  const monthlyTotal = round2(sc.USER_CATEGORY_KEYS.reduce((sum, key) => sum + Number(categories[key] || 0), 0));
  const bundle = sc.buildPersonalizedRecommendationsFromUserMap(categories);
  const risk = buildUserRiskSummary(record, categories, monthlyTotal);
  const shap = buildRiskAnalysis().shapLikeFeatures;

  const lastAnalysis = latest
    ? {
        created_at: latest.created_at,
        total_spending: latest.total_spending,
        categories: latest.categories,
        prediction: latest.prediction,
        recommendations: latest.recommendations || bundle.recommendations,
        savings_suggestions: latest.savings_suggestions || bundle.savings_suggestions,
        visual_data: sc.buildVisualizationDataUser(sc.categoriesToUserMap(latest.categories || categories)),
        recommendedCreditLimit: latest.prediction?.recommendedCreditLimit || null
      }
    : null;

  return {
    ...risk,
    categories,
    recommendations: latest?.recommendations || bundle.recommendations,
    savings_suggestions: latest?.savings_suggestions || bundle.savings_suggestions,
    shapLikeFeatures: shap,
    monthlyTrend: buildMonthlyRiskTrend(record.analyses),
    lastMlInput: record.lastMlInput || deriveMlInputFromUserData(categories, monthlyTotal),
    lastAnalysis
  };
}

function buildRiskAnalysis() {
  const riskScore = Math.round(
    100 *
      (0.35 * behaviorSignals.cashAdvanceRatio +
        0.25 * (1 - behaviorSignals.fullPaymentRate) +
        0.2 * behaviorSignals.installmentHabit +
        0.2 * behaviorSignals.balanceManagement)
  );

  const segment = segmentFromRiskScore(riskScore);

  const shapLikeFeatures = [
    {
      feature: "Nakit avans kullanımı",
      impact: 0.31,
      description: "Nakit avans alışkanlığı risk skorunu yukarı çeker."
    },
    {
      feature: "Tam ödeme davranışı",
      impact: -0.24,
      description: "Borcun tamamını düzenli ödemek riski azaltır."
    },
    {
      feature: "Taksitli harcama",
      impact: 0.14,
      description: "Taksit yoğunluğu orta düzeyde risk artışı yaratabilir."
    }
  ];

  const recommendations = [
    "Nakit avans kullanımını önümüzdeki ay en az %20 azaltmayı dene.",
    "Asgari ödeme yerine toplam borcunun en az %70'ini ödemeyi hedefle.",
    "Abonelik ve market harcamaları için aylık üst sınır belirle."
  ];

  return { riskScore, segment, shapLikeFeatures, recommendations };
}

function resolvePythonCmd(baseDir = __dirname) {
  const candidates = [
    process.env.PYTHON_CMD,
    process.env.PYTHON_PATH,
    path.join(baseDir, ".venv", "bin", "python"),
    path.join(baseDir, ".venv", "Scripts", "python.exe"),
    path.join(baseDir, ".venv", "python"),
    "python3",
    "python",
  ].filter(Boolean);

  for (const cmd of candidates) {
    // For absolute/relative paths, require they exist.
    if (cmd.includes(path.sep) || cmd.endsWith(".exe")) {
      if (fs.existsSync(cmd)) return cmd;
      continue;
    }

    // For PATH commands, probe with `-V`.
    try {
      const res = spawnSync(cmd, ["-V"], { timeout: 1000, encoding: "utf-8" });
      if (!res.error && res.status === 0) return cmd;
    } catch {
      // ignore and try next candidate
    }
  }

  // Final fallback; spawnSync/spawn will report a useful error upstream.
  return "python3";
}

function normalizeMlPrediction(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};

  const riskScoreRaw = parsed.riskScore ?? parsed.risk_score ?? null;
  const riskScoreNum =
    typeof riskScoreRaw === "string" ? Number(riskScoreRaw) : typeof riskScoreRaw === "number" ? riskScoreRaw : null;

  const segment = parsed.segment ?? parsed.segment_name ?? parsed.message ?? null;

  let riskLabel = parsed.riskLabel ?? null;
  if (!riskLabel && typeof riskScoreNum === "number" && Number.isFinite(riskScoreNum)) {
    if (riskScoreNum >= 65) riskLabel = "Yüksek dikkat";
    else if (riskScoreNum >= 35) riskLabel = "Orta düzey";
    else riskLabel = "Düşük dikkat";
  }

  let advice = parsed.advice ?? null;
  if (!advice && Array.isArray(parsed.recommendations)) advice = parsed.recommendations.join(" ");
  if (!advice && parsed.recommended_credit_limit != null) {
    const creditLimitNum = Number(parsed.recommended_credit_limit);
    advice = Number.isFinite(creditLimitNum)
      ? `Önerilen kredi limiti: ₺${creditLimitNum.toLocaleString("tr-TR")}`
      : "Skoruna göre ödeme planını düzenleyin ve nakit akışını takip edin.";
  }
  if (!advice) advice = "Skoruna göre ödeme planını düzenleyin ve nakit akışını takip edin.";

  return {
    ...parsed,
    segment,
    riskScore: riskScoreNum ?? parsed.riskScore ?? null,
    riskLabel,
    advice,
    paymentConfidence: parsed.paymentConfidence ?? parsed.payment_confidence ?? null,
    recommendedCreditLimit: parsed.recommendedCreditLimit ?? parsed.recommended_credit_limit ?? null
  };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "monexa-backend" });
});

app.post("/api/auth/register", (req, res) => {
  const payload = req.body || {};
  const first_name = String(payload.first_name ?? payload.firstName ?? "").trim();
  const last_name = String(payload.last_name ?? payload.lastName ?? "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const confirm_password = String(payload.confirm_password ?? payload.confirmPassword ?? "");

  if (!first_name || !last_name || !email || !password || !confirm_password) {
    return res.status(400).json({
      success: false,
      message: "Ad, soyad, e-posta ve şifre zorunludur."
    });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ success: false, message: "Geçerli bir e-posta gir." });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Şifre en az 6 karakter olmalı." });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ success: false, message: "Şifreler eşleşmiyor." });
  }

  const store = readUserStore();
  if (store.users[email]?.auth?.passwordHash) {
    return res.status(409).json({
      success: false,
      message: "Bu e-posta ile zaten hesap var."
    });
  }

  saveProfileForUser(email, { first_name, last_name, email, phone: "" });
  saveAuthForUser(email, password);

  return res.status(201).json({
    success: true,
    message: "Kayıt başarılı.",
    user: buildUserPayload(email)
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || mockUser.email).trim().toLowerCase();
  const auth = getAuthForUser(normalizedEmail);

  if (auth?.passwordHash) {
    if (!password || !verifyPassword(password, auth.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: "E-posta veya şifre hatalı."
      });
    }
  }

  res.json({
    token: makeTokenForEmail(normalizedEmail),
    user: buildUserPayload(normalizedEmail)
  });
});

app.get("/api/auth/profile", (req, res) => {
  const userEmail = getUserEmail(req);
  const user = buildUserPayload(userEmail);
  return res.json({
    success: true,
    user: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName
    }
  });
});

app.put("/api/auth/update-profile", (req, res) => {
  const userEmail = getUserEmail(req);
  const payload = req.body || {};
  const first_name = String(payload.first_name ?? payload.firstName ?? "").trim();
  const last_name = String(payload.last_name ?? payload.lastName ?? "").trim();
  const email = String(payload.email || userEmail).trim().toLowerCase();
  const phone = String(payload.phone || "").trim();

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ success: false, message: "first_name, last_name and email are required." });
  }

  const updatedProfile = saveProfileForUser(userEmail, {
    first_name,
    last_name,
    email,
    phone
  });
  const user = buildUserPayload(userEmail);
  return res.json({
    success: true,
    message: "Profile updated successfully.",
    user: {
      ...updatedProfile,
      fullName: user.fullName
    }
  });
});

app.get("/api/dashboard", (req, res) => {
  const userEmail = getUserEmail(req);
  res.json(buildDashboardForUser(userEmail));
});

app.post("/api/bank/connect", (req, res) => {
  const userEmail = getUserEmail(req);
  const state = saveMockBankConnection(userEmail);
  res.status(201).json({
    message: "Demo banka hesabı bağlandı.",
    connection: {
      id: "mock-bank-primary",
      bankName: state.account.bankName,
      iban: state.account.accountNumber,
      status: "connected",
      isMock: true
    },
    bankConnections: getBankConnectionsForUser(userEmail),
    account: state.account
  });
});

app.get("/api/mock-bank/status", (req, res) => {
  const userEmail = getUserEmail(req);
  const store = readUserStore();
  const state = mockBank.getMockBankState(store.users[userEmail]);
  res.json({
    connected: Boolean(state?.connected),
    connectedAt: state?.connectedAt || null
  });
});

app.post("/api/mock-bank/connect", (req, res) => {
  const userEmail = getUserEmail(req);
  const state = saveMockBankConnection(userEmail);
  res.status(201).json({
    success: true,
    message: "Demo banka hesabı güvenli şekilde bağlandı.",
    account: state.account,
    summary: state.summary,
    disclaimer: "Bu proje kapsamında gerçek banka bağlantısı kullanılmamaktadır. Gösterilen hesap ve ödeme verileri demo amaçlı mock verilerden oluşmaktadır."
  });
});

app.get("/api/mock-bank/account", (req, res) => {
  const userEmail = getUserEmail(req);
  const state = getMockBankForUser(userEmail);
  if (!state?.connected) {
    return res.status(404).json({ success: false, message: "Henüz demo hesap bağlı değil." });
  }
  res.json({
    success: true,
    account: state.account,
    disclaimer: "Demo amaçlı mock hesap verisi."
  });
});

app.get("/api/mock-bank/payments", (req, res) => {
  const userEmail = getUserEmail(req);
  const state = getMockBankForUser(userEmail);
  if (!state?.connected) {
    return res.status(404).json({ success: false, message: "Henüz demo hesap bağlı değil." });
  }
  const type = String(req.query.type || "").trim();
  let payments = state.payments || [];
  if (type) payments = payments.filter((p) => p.type === type);
  res.json({ success: true, payments, total: payments.length });
});

app.get("/api/mock-bank/payments/:id", (req, res) => {
  const userEmail = getUserEmail(req);
  const state = getMockBankForUser(userEmail);
  if (!state?.connected) {
    return res.status(404).json({ success: false, message: "Henüz demo hesap bağlı değil." });
  }
  const payment = (state.payments || []).find((p) => p.id === req.params.id || p.paymentNo === req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, message: "Ödeme kaydı bulunamadı." });
  }
  res.json({ success: true, payment });
});

app.get("/api/mock-bank/summary", (req, res) => {
  const userEmail = getUserEmail(req);
  const state = getMockBankForUser(userEmail);
  if (!state?.connected) {
    return res.status(404).json({ success: false, message: "Henüz demo hesap bağlı değil." });
  }
  const summary = mockBank.buildSummary(state.account, state.payments);
  res.json({
    success: true,
    ...summary,
    disclaimer: "Demo amaçlı mock özet verisi."
  });
});

function getUserRecord(userEmail) {
  const store = readUserStore();
  return store.users[userEmail] || { analyses: [], transactions: [] };
}

function saveCashbackCache(userEmail, payload) {
  const store = readUserStore();
  const current = store.users[userEmail] || { analyses: [], transactions: [] };
  current.cashback = {
    lastCalculatedAt: new Date().toISOString(),
    transactions: payload.transactions,
    summary: payload.summary
  };
  store.users[userEmail] = current;
  writeUserStore(store);
}

app.get("/api/cashback/stores", (req, res) => {
  res.json({
    success: true,
    stores: cashback.getCashbackStores(),
    disclaimer: cashback.DISCLAIMER
  });
});

app.get("/api/cashback/transactions", (req, res) => {
  const userEmail = getUserEmail(req);
  const record = getUserRecord(userEmail);
  const transactions = cashback.buildCashbackTransactions(record);
  res.json({
    success: true,
    transactions,
    total: transactions.length,
    disclaimer: cashback.DISCLAIMER
  });
});

app.get("/api/cashback/summary", (req, res) => {
  const userEmail = getUserEmail(req);
  const record = getUserRecord(userEmail);
  const stores = cashback.getCashbackStores();
  const summary = cashback.buildCashbackSummary(record);
  res.json({
    success: true,
    stores,
    summary,
    disclaimer: cashback.DISCLAIMER
  });
});

app.post("/api/cashback/calculate", (req, res) => {
  const userEmail = getUserEmail(req);
  const record = getUserRecord(userEmail);
  const result = cashback.calculateForUser(record);
  saveCashbackCache(userEmail, result);
  res.json(result);
});

app.post("/api/receipts/scan", upload.single("receipt"), (req, res) => {
  const sampleReceipt = {
    merchant: "Örnek market",
    totalAmount: 684.9,
    date: new Date().toISOString().split("T")[0],
    category: "Market",
    items: [
      { name: "Süt", amount: 42.5 },
      { name: "Yumurta", amount: 58.9 },
      { name: "Temizlik ürünü", amount: 189.0 }
    ],
    source: req.file ? "yuklenen_gorsel" : "manuel"
  };

  res.json({
    message: "Fiş analizi tamamlandı.",
    receipt: sampleReceipt
  });
});

app.post("/api/spending/entry", (req, res) => {
  const userEmail = getUserEmail(req);
  const amount = round2(Number(req.body.amount));
  const category = String(req.body.category || "").trim();
  const description = String(req.body.description || "")
    .trim()
    .slice(0, 500);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Geçerli bir tutar girin." });
  }
  if (!sc.USER_CATEGORY_KEYS.includes(category)) {
    return res.status(400).json({ message: "Geçersiz kategori." });
  }
  const store = readUserStore();
  const cur = store.users[userEmail] || { analyses: [], transactions: [] };
  cur.transactions = Array.isArray(cur.transactions) ? cur.transactions : [];
  cur.transactions.push({
    created_at: new Date().toISOString(),
    amount,
    category,
    description
  });
  store.users[userEmail] = cur;
  writeUserStore(store);
  res.json({ success: true, message: "Harcama kaydedildi." });
});

app.get("/api/insights", (req, res) => {
  const userEmail = getUserEmail(req);
  res.json(buildInsightsForUser(userEmail));
});

app.post("/api/ml/predict", (req, res) => {
  const input = req.body || {};
  const userEmail = getUserEmail(req);
  const pyScriptsDir = __dirname; // contains predict.py + model assets
  const pythonCmd = resolvePythonCmd(pyScriptsDir);

  let prediction = null;
  const result = spawnSync(pythonCmd, ["predict.py"], {
    cwd: pyScriptsDir,
    input: JSON.stringify(input),
    encoding: "utf-8",
    timeout: 20000
  });

  if (!result.error && result.status === 0) {
    try {
      prediction = normalizeMlPrediction(JSON.parse(result.stdout.trim()));
    } catch {
      prediction = null;
    }
  }

  // sklearn/model artifact sorunlarında servisi düşürmek yerine fallback çalıştır.
  if (!prediction) {
    prediction = fallbackPredictionFromInput(input);
  }

  const rawCats = input.category_spending || input.categories || {};
  let candidate = sc.categoriesToUserMap(rawCats);
  if (!sc.USER_CATEGORY_KEYS.some((key) => Number(candidate[key]) > 0)) {
    candidate = sc.categoriesToUserMap(sc.deriveLegacyFiveCategories(input));
  }
  const finalCategories = candidate;
  const recommendationBundle = sc.buildPersonalizedRecommendationsFromUserMap(finalCategories);
  const visual_data = sc.buildVisualizationDataUser(finalCategories);
  const total_spending = round2(sc.USER_CATEGORY_KEYS.reduce((sum, key) => sum + Number(finalCategories[key] || 0), 0));

  const store = readUserStore();
  const current = store.users[userEmail] || { analyses: [], transactions: [] };
  const mlInputSnapshot = { ...input };
  delete mlInputSnapshot.category_spending;
  current.lastMlInput = mlInputSnapshot;
  const entry = {
    created_at: new Date().toISOString(),
    categories: finalCategories,
    total_spending,
    prediction: {
      segment: prediction.segment,
      riskScore: prediction.riskScore,
      riskLabel: prediction.riskLabel,
      recommendedCreditLimit: prediction.recommendedCreditLimit ?? null
    },
    recommendations: recommendationBundle.recommendations,
    savings_suggestions: recommendationBundle.savings_suggestions
  };
  current.analyses = [...(current.analyses || []), entry].slice(-20);
  store.users[userEmail] = current;
  writeUserStore(store);

  return res.json({
    ...prediction,
    user: { email: userEmail },
    categories: finalCategories,
    recommendations: recommendationBundle.recommendations,
    savings_suggestions: recommendationBundle.savings_suggestions,
    visual_data,
    total_spending
  });
});

app.post("/api/coach/ask", (req, res) => {
  const userEmail = getUserEmail(req);
  const question = String(req.body?.question || "").trim();
  if (!question) {
    return res.status(400).json({ message: "question is required" });
  }
  const dashboardData = buildDashboardForUser(userEmail);
  const result = buildCoachAnswer({ question, userEmail, dashboardData });
  return res.json({
    success: true,
    question,
    ...result
  });
});

// --- Python/Flask ML proxy (Flask: http://localhost:5001) ---
// React frontend bu endpoint'leri doğrudan /predict şeklinde çağırır.
// Node burada Flask'a proxy yapar; böylece port çakışması olmaz.
const FLASK_PORT = Number(process.env.FLASK_PORT) || 5001;

let flaskProc = null;
function ensureFlaskRunning() {
  if (flaskProc) return;

  // Flask servisi yoksa arka planda başlat.
  // KMeans eğitimi bu sırada tetiklenmez; sadece API servisleri ayağa kalkar.
  const pythonCmd = resolvePythonCmd(__dirname);
  const env = { ...process.env, FLASK_PORT: String(FLASK_PORT) };
  try {
    flaskProc = spawn(pythonCmd, ["app.py"], {
      cwd: __dirname,
      env,
      stdio: "inherit",
      windowsHide: true
    });
  } catch (err) {
    flaskProc = null;
    console.error("Flask python process failed to spawn:", err.message);
    return;
  }

  flaskProc.on("error", (err) => {
    console.error("Flask python process error:", err.message);
    flaskProc = null;
  });

  flaskProc.on("exit", () => {
    flaskProc = null;
  });
}

function proxyFlaskJSON(method, flaskPath, body, res) {
  const payload = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: "localhost",
    port: FLASK_PORT,
    path: flaskPath,
    method,
    headers: payload
      ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
      : {}
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    let data = "";
    proxyRes.on("data", (chunk) => {
      data += chunk;
    });
    proxyRes.on("end", () => {
      try {
        const parsed = data ? JSON.parse(data) : null;
        res.status(proxyRes.statusCode || 200).json(parsed);
      } catch {
        res.status(proxyRes.statusCode || 200).send(data);
      }
    });
  });

  proxyReq.on("error", () => {
    // Flask ayağa kalkmamış olabilir; bir kez başlatmayı dene.
    try {
      ensureFlaskRunning();
    } catch {
      // ignore
    }
    res.status(502).json({ error: `Flask servisi calismiyor (port: ${FLASK_PORT}).` });
  });

  if (payload) proxyReq.write(payload);
  proxyReq.end();
}

// Node ayağa kalktığında Flask'ı da başlat.
ensureFlaskRunning();

app.post("/predict", (req, res) => {
  proxyFlaskJSON("POST", "/predict", req.body || {}, res);
});

app.post("/train", (req, res) => {
  proxyFlaskJSON("POST", "/train", null, res);
});

app.get("/metrics", (req, res) => {
  proxyFlaskJSON("GET", "/metrics", null, res);
});

function startHttpServer(port, attemptsLeft) {
  const server = http.createServer(app);
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 1) {
      startHttpServer(port + 1, attemptsLeft - 1);
    } else {
      console.error("Backend baslatilamadi:", err.message);
      console.error(
        "Port bosalt (PowerShell): Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"
      );
      process.exit(1);
    }
  });
  server.listen(port, () => {
    console.log(`Monexa backend listening on http://localhost:${port}`);
    if (port !== BASE_PORT) {
      console.log(
        `Not: Bu portta calisiyorsun. React icin monexa/.env dosyasina ekle:\n  REACT_APP_API_URL=http://localhost:${port}/api\nSonra frontend'i yeniden baslat (npm start).`
      );
    }
  });
}

startHttpServer(BASE_PORT, 6);
