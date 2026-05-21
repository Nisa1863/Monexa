const mockBank = require("./mockBank");

const DISCLAIMER =
  "Cashback sistemi, anlaşmalı mağazalardan yapılan harcamalarda kullanıcının belirli bir yüzdelik oranla geri kazanım elde etmesini sağlar. Bu proje kapsamında cashback verileri demo amaçlı mock data üzerinden hesaplanmaktadır.";

const CASHBACK_STORES = [
  {
    id: "migros",
    storeName: "Migros",
    category: "Market",
    cashbackRate: 5,
    tagline: "Market alışverişlerinde %5 avantaj",
    description: "Migros alışverişlerinde %5 cashback fırsatı",
    minSpend: 500,
    validUntil: "2026-06-30",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=migros.com.tr&sz=128",
    accentColor: "#eef6f0",
    matchKeywords: ["migros"]
  },
  {
    id: "trendyol",
    storeName: "Trendyol",
    category: "Alışveriş",
    cashbackRate: 8,
    tagline: "Online alışverişte %8 avantaj",
    description: "Trendyol'da seçili kategorilerde %8 cashback",
    minSpend: 300,
    validUntil: "2026-07-15",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=trendyol.com&sz=128",
    accentColor: "#fff4ee",
    matchKeywords: ["trendyol"]
  },
  {
    id: "starbucks",
    storeName: "Starbucks",
    category: "Kafe / Restoran",
    cashbackRate: 3,
    tagline: "Kafe harcamalarında %3 avantaj",
    description: "Starbucks harcamalarında %3 cashback",
    minSpend: 100,
    validUntil: "2026-08-31",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=starbucks.com&sz=128",
    accentColor: "#f2f7f0",
    matchKeywords: ["starbucks"]
  },
  {
    id: "shell",
    storeName: "Shell",
    category: "Ulaşım",
    cashbackRate: 4,
    tagline: "Yakıt alımlarında %4 avantaj",
    description: "Shell istasyonlarında yakıt alımlarında %4 cashback",
    minSpend: 400,
    validUntil: "2026-09-30",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=shell.com&sz=128",
    accentColor: "#fff8e8",
    matchKeywords: ["shell"]
  },
  {
    id: "watsons",
    storeName: "Watsons",
    category: "Sağlık",
    cashbackRate: 5,
    tagline: "Kişisel bakımda %5 avantaj",
    description: "Watsons kişisel bakım alışverişlerinde %5 cashback",
    minSpend: 200,
    validUntil: "2026-06-30",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=watsons.com.tr&sz=128",
    accentColor: "#f5f0fa",
    matchKeywords: ["watsons"]
  },
  {
    id: "yemeksepeti",
    storeName: "Yemeksepeti",
    category: "Kafe / Restoran",
    cashbackRate: 6,
    tagline: "Yemek siparişlerinde %6 avantaj",
    description: "Yemeksepeti siparişlerinde %6 cashback",
    minSpend: 150,
    validUntil: "2026-08-15",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=yemeksepeti.com&sz=128",
    accentColor: "#fff0f2",
    matchKeywords: ["yemeksepeti", "yemek sepeti"]
  },
  {
    id: "spotify",
    storeName: "Spotify",
    category: "Abonelik",
    cashbackRate: 3,
    tagline: "Premium abonelikte %3 avantaj",
    description: "Spotify Premium ödemelerinde %3 cashback",
    minSpend: 50,
    validUntil: "2026-12-31",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=spotify.com&sz=128",
    accentColor: "#eef8f1",
    matchKeywords: ["spotify"]
  },
  {
    id: "netflix",
    storeName: "Netflix",
    category: "Abonelik",
    cashbackRate: 4,
    tagline: "Aylık üyelikte %4 avantaj",
    description: "Netflix abonelik ödemelerinde %4 cashback",
    minSpend: 50,
    validUntil: "2026-12-31",
    status: "active",
    logoUrl: "https://www.google.com/s2/favicons?domain=netflix.com&sz=128",
    accentColor: "#faf0f0",
    matchKeywords: ["netflix"]
  }
];

const MONTH_LABELS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStoreActive(store) {
  if (store.status !== "active") return false;
  const until = new Date(`${store.validUntil}T23:59:59`);
  return !Number.isNaN(until.getTime()) && until >= new Date();
}

function getCashbackStores() {
  return CASHBACK_STORES.map((store) => ({
    ...store,
    isActive: isStoreActive(store)
  }));
}

function matchStoreFromText(...parts) {
  const haystack = normalizeText(parts.filter(Boolean).join(" "));
  if (!haystack) return null;

  for (const store of CASHBACK_STORES) {
    if (!isStoreActive(store)) continue;
    const keywords = store.matchKeywords?.length ? store.matchKeywords : [store.storeName];
    const hit = keywords.some((kw) => haystack.includes(normalizeText(kw)));
    if (hit) return store;
  }
  return null;
}

function collectSpendEvents(record) {
  const events = [];
  const mockState = mockBank.getMockBankState(record);

  if (mockState?.connected && Array.isArray(mockState.payments)) {
    mockState.payments
      .filter((p) => p.type === "expense")
      .forEach((p) => {
        events.push({
          paymentNo: p.paymentNo || p.id,
          title: p.title,
          description: p.description,
          amount: round2(p.amount),
          date: p.date,
          source: "mock_bank"
        });
      });
  }

  const txs = Array.isArray(record?.transactions) ? record.transactions : [];
  txs
    .filter((t) => t.source !== "mock_bank")
    .forEach((t, idx) => {
      const d = new Date(t.created_at || Date.now());
      events.push({
        paymentNo: `TX-${String(idx + 1).padStart(4, "0")}`,
        title: t.description || "Manuel harcama",
        description: t.description || "",
        amount: round2(t.amount),
        date: d.toISOString().slice(0, 10),
        source: "manual"
      });
    });

  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calculateCashbackAmount(amount, rate) {
  return round2((Number(amount) * Number(rate)) / 100);
}

function buildCashbackTransactions(record) {
  const events = collectSpendEvents(record);
  const seen = new Set();
  const transactions = [];

  events.forEach((ev) => {
    const store = matchStoreFromText(ev.title, ev.description);
    if (!store) return;

    const key = `${ev.paymentNo}-${store.id}`;
    if (seen.has(key)) return;
    seen.add(key);

    const amount = round2(ev.amount);
    const eligible = amount >= Number(store.minSpend);
    const cashbackAmount = eligible ? calculateCashbackAmount(amount, store.cashbackRate) : 0;

    transactions.push({
      paymentNo: ev.paymentNo,
      storeId: store.id,
      storeName: store.storeName,
      storeLogoUrl: store.logoUrl,
      category: store.category,
      amount,
      cashbackRate: store.cashbackRate,
      cashbackAmount,
      date: ev.date,
      status: eligible ? "earned" : "ineligible",
      minSpend: store.minSpend,
      source: ev.source
    });
  });

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function sumEarned(transactions) {
  return round2(
    transactions.filter((t) => t.status === "earned").reduce((sum, t) => sum + Number(t.cashbackAmount || 0), 0)
  );
}

function earnedThisMonth(transactions) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return round2(
    transactions
      .filter((t) => {
        if (t.status !== "earned") return false;
        const d = new Date(t.date);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((sum, t) => sum + Number(t.cashbackAmount || 0), 0)
  );
}

function topEarnedStore(transactions) {
  const map = {};
  transactions
    .filter((t) => t.status === "earned")
    .forEach((t) => {
      map[t.storeName] = (map[t.storeName] || 0) + Number(t.cashbackAmount || 0);
    });
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  return { storeName: entries[0][0], cashbackAmount: round2(entries[0][1]) };
}

function buildMonthlyChart(transactions) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS_TR[d.getMonth()],
      total: 0
    });
  }

  transactions
    .filter((t) => t.status === "earned")
    .forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.total += Number(t.cashbackAmount || 0);
    });

  return {
    labels: buckets.map((b) => b.label),
    data: buckets.map((b) => round2(b.total))
  };
}

function aggregateByField(transactions, field) {
  const map = {};
  transactions
    .filter((t) => t.status === "earned")
    .forEach((t) => {
      const key = t[field] || "Diğer";
      map[key] = (map[key] || 0) + Number(t.cashbackAmount || 0);
    });
  const entries = Object.entries(map)
    .map(([label, amount]) => ({ label, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
  return {
    labels: entries.map((e) => e.label),
    data: entries.map((e) => e.amount)
  };
}

function getRecommendedStores(transactions, stores) {
  const used = new Set(transactions.map((t) => t.storeId));
  const active = stores.filter((s) => s.isActive);
  const unused = active.filter((s) => !used.has(s.id)).sort((a, b) => b.cashbackRate - a.cashbackRate);
  if (unused.length >= 3) return unused.slice(0, 4);
  return [...active].sort((a, b) => b.cashbackRate - a.cashbackRate).slice(0, 4);
}

function getTopRateStores(stores) {
  return [...stores]
    .filter((s) => s.isActive)
    .sort((a, b) => b.cashbackRate - a.cashbackRate)
    .slice(0, 5);
}

function buildCashbackSummary(record) {
  const stores = getCashbackStores();
  const transactions = buildCashbackTransactions(record);
  const totalEarned = sumEarned(transactions);
  const monthEarned = earnedThisMonth(transactions);
  const topStore = topEarnedStore(transactions);
  const activeCampaignCount = stores.filter((s) => s.isActive).length;

  return {
    disclaimer: DISCLAIMER,
    totalEarned,
    earnedThisMonth: monthEarned,
    topStore,
    activeCampaignCount,
    recommendedStores: getRecommendedStores(transactions, stores),
    topRateStores: getTopRateStores(stores),
    recentTransactions: transactions.slice(0, 8),
    charts: {
      monthly: buildMonthlyChart(transactions),
      byCategory: aggregateByField(transactions, "category"),
      byStore: aggregateByField(transactions, "storeName")
    },
    transactionCount: transactions.length,
    earnedTransactionCount: transactions.filter((t) => t.status === "earned").length
  };
}

function calculateForUser(record) {
  const stores = getCashbackStores();
  const transactions = buildCashbackTransactions(record);
  const summary = buildCashbackSummary(record);
  return {
    success: true,
    disclaimer: DISCLAIMER,
    stores,
    transactions,
    summary
  };
}

module.exports = {
  DISCLAIMER,
  getCashbackStores,
  buildCashbackTransactions,
  buildCashbackSummary,
  calculateForUser,
  calculateCashbackAmount,
  matchStoreFromText
};
