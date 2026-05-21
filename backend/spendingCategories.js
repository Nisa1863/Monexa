/** Kullanıcıya gösterilen harcama kategorileri (API + depolama) */

const USER_CATEGORY_KEYS = [
  "market",
  "transport",
  "bills",
  "dining",
  "education",
  "health",
  "entertainment",
  "subscription",
  "other"
];

const USER_CATEGORY_LABELS = {
  market: "Market",
  transport: "Ulaşım",
  bills: "Fatura",
  dining: "Yeme-İçme",
  education: "Eğitim",
  health: "Sağlık",
  entertainment: "Eğlence",
  subscription: "Abonelik",
  other: "Diğer"
};

const BENCHMARK_SHARE_USER = {
  market: 0.16,
  transport: 0.1,
  bills: 0.14,
  dining: 0.2,
  education: 0.08,
  health: 0.1,
  entertainment: 0.08,
  subscription: 0.06,
  other: 0.08
};

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function emptyUserCategoryMap() {
  return USER_CATEGORY_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
}

function sanitizeUserCategories(raw) {
  const base = emptyUserCategoryMap();
  const input = raw && typeof raw === "object" ? raw : {};
  for (const key of USER_CATEGORY_KEYS) {
    const value = Number(input[key]);
    base[key] = Number.isFinite(value) && value >= 0 ? round2(value) : 0;
  }
  return base;
}

function categoriesToUserMap(raw) {
  if (!raw || typeof raw !== "object") return emptyUserCategoryMap();
  const asUser = sanitizeUserCategories(raw);
  if (USER_CATEGORY_KEYS.some((k) => asUser[k] > 0)) return asUser;
  const legacyKeys = ["food", "transport", "shopping", "bills", "entertainment"];
  if (!legacyKeys.some((k) => Number(raw[k]) > 0)) return emptyUserCategoryMap();
  const food = Number(raw.food) || 0;
  const transport = Number(raw.transport) || 0;
  const shopping = Number(raw.shopping) || 0;
  const bills = Number(raw.bills) || 0;
  const entertainment = Number(raw.entertainment) || 0;
  return sanitizeUserCategories({
    market: round2(shopping * 0.65),
    dining: round2(food),
    transport,
    bills,
    entertainment,
    education: 0,
    health: 0,
    subscription: 0,
    other: round2(shopping * 0.35)
  });
}

function deriveLegacyFiveCategories(input) {
  const purchases = Math.max(0, Number(input.PURCHASES ?? input.purchases ?? 0));
  const oneoff = Math.max(0, Number(input.ONEOFF_PURCHASES ?? input.oneoff_purchases ?? 0));
  const installments = Math.max(0, Number(input.INSTALLMENTS_PURCHASES ?? input.installments_purchases ?? 0));
  const minPayments = Math.max(0, Number(input.MINIMUM_PAYMENTS ?? input.minimum_payments ?? 0));
  const cashAdvance = Math.max(0, Number(input.CASH_ADVANCE ?? input.cash_advance ?? 0));
  const food = purchases * 0.28 + oneoff * 0.08;
  const transport = purchases * 0.14;
  const shopping = oneoff * 0.52 + installments * 0.26;
  const bills = minPayments * 0.75 + purchases * 0.12;
  const entertainment = Math.max(0, purchases + installments * 0.2 + cashAdvance * 0.05 - (food + transport + shopping + bills));
  return { food, transport, shopping, bills, entertainment };
}

function summarizeUserCategories(categories) {
  const total = round2(USER_CATEGORY_KEYS.reduce((sum, key) => sum + Number(categories[key] || 0), 0));
  const breakdown = {};
  for (const key of USER_CATEGORY_KEYS) {
    const amount = round2(categories[key] || 0);
    breakdown[key] = {
      label: USER_CATEGORY_LABELS[key],
      amount,
      percentage: total > 0 ? round2((amount / total) * 100) : 0
    };
  }
  return { total, breakdown };
}

function mergeUserCategoryMaps(base, addon) {
  const out = emptyUserCategoryMap();
  for (const key of USER_CATEGORY_KEYS) {
    out[key] = round2(Number(base[key] || 0) + Number(addon[key] || 0));
  }
  return out;
}

function sumTransactionsByCategoryThisMonth(transactions, now = new Date()) {
  const out = emptyUserCategoryMap();
  if (!Array.isArray(transactions)) return out;
  const y = now.getFullYear();
  const m = now.getMonth();
  for (const t of transactions) {
    const d = new Date(t.created_at || t.date || 0);
    if (d.getFullYear() !== y || d.getMonth() !== m) continue;
    const key = String(t.category || "").trim();
    if (!USER_CATEGORY_KEYS.includes(key)) continue;
    out[key] = round2(out[key] + (Number(t.amount) || 0));
  }
  return out;
}

function buildPersonalizedRecommendationsFromUserMap(categories) {
  const { total, breakdown } = summarizeUserCategories(categories);
  const recommendations = [];
  const reductionTargets = {};
  for (const key of USER_CATEGORY_KEYS) {
    const actualShare = (breakdown[key].percentage || 0) / 100;
    const target = BENCHMARK_SHARE_USER[key];
    const diffPct = Math.round((actualShare - target) * 100);
    if (diffPct >= 6) {
      const reduceBy = Math.min(25, Math.max(10, diffPct));
      reductionTargets[key] = reduceBy;
      recommendations.push(`${USER_CATEGORY_LABELS[key]} harcaman ortalamanın üstünde. %${reduceBy} azaltmayı dene.`);
    } else if (diffPct <= -6) {
      recommendations.push(`${USER_CATEGORY_LABELS[key]} harcaman kontrollü seviyede, bu disiplini koruyorsun.`);
    }
  }
  if (!recommendations.length) {
    recommendations.push("Kategori dağılımın dengeli. Mevcut planı koruyup küçük optimizasyonlarla ilerleyebilirsin.");
  }
  const suggestedRate = Object.values(reductionTargets).length
    ? Math.min(
        35,
        Math.max(10, Math.round(Object.values(reductionTargets).reduce((a, b) => a + b, 0) / Object.values(reductionTargets).length))
      )
    : 10;
  return {
    recommendations,
    savings_suggestions: {
      save_rate_percent: suggestedRate,
      potential_monthly_saving: round2((total * suggestedRate) / 100),
      reduction_targets: reductionTargets
    }
  };
}

function buildVisualizationDataUser(categories) {
  const { breakdown } = summarizeUserCategories(categories);
  return {
    pie: USER_CATEGORY_KEYS.map((key) => ({
      label: USER_CATEGORY_LABELS[key],
      value: breakdown[key].amount
    })),
    bar: USER_CATEGORY_KEYS.map((key) => ({
      label: USER_CATEGORY_LABELS[key],
      spent: breakdown[key].amount,
      benchmark: round2(
        (USER_CATEGORY_KEYS.reduce((s, k) => s + breakdown[k].amount, 0) || 1) * BENCHMARK_SHARE_USER[key]
      )
    }))
  };
}

module.exports = {
  USER_CATEGORY_KEYS,
  USER_CATEGORY_LABELS,
  BENCHMARK_SHARE_USER,
  round2,
  emptyUserCategoryMap,
  sanitizeUserCategories,
  categoriesToUserMap,
  deriveLegacyFiveCategories,
  summarizeUserCategories,
  mergeUserCategoryMaps,
  sumTransactionsByCategoryThisMonth,
  buildPersonalizedRecommendationsFromUserMap,
  buildVisualizationDataUser
};
