const TREND_DEMO_VALUES = [42, 38, 45, 52, 48, 61, 55, 58, 63];

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function seededDemoTrend(email, monthlyTotal) {
  let seed = 0;
  const key = String(email || "demo");
  for (let i = 0; i < key.length; i += 1) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  const base = Math.max(Number(monthlyTotal) > 0 ? Number(monthlyTotal) / 7 : 1200, 400);
  const now = new Date();
  return TREND_DEMO_VALUES.map((ratio, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (TREND_DEMO_VALUES.length - 1 - i) * 4);
    const wave = 0.78 + ratio / 100 + (((seed + i * 19) % 23) / 100) * 0.35;
    return {
      label: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
      value: round2(base * wave)
    };
  });
}

export function trendPointsFromDashboard(dashboard) {
  const apiPoints = dashboard?.spendingTrend?.points;
  const monthlyTotal = dashboard?.spendingSummary?.monthlyTotal;
  const userEmail = dashboard?.user?.email;

  if (Array.isArray(apiPoints) && apiPoints.length >= 2) {
    const mapped = apiPoints.map((p, i) => ({
      label: p.date
        ? new Date(p.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
        : String(i + 1),
      value: typeof p.value === "number" ? p.value : typeof p.amount === "number" ? p.amount : 0
    }));
    const uniqueValues = new Set(mapped.map((p) => p.value));
    if (uniqueValues.size > 1) return mapped;
  }

  if (Array.isArray(apiPoints) && apiPoints.length === 1) {
    const only = apiPoints[0];
    const v = Number(only.value ?? only.amount) || 0;
    const d = new Date(only.date || Date.now());
    const prev = new Date(d);
    prev.setDate(d.getDate() - 4);
    return [
      {
        label: prev.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
        value: round2(Math.max(50, v * 0.7))
      },
      {
        label: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
        value: round2(v)
      }
    ];
  }

  return seededDemoTrend(userEmail, monthlyTotal);
}

export function weeklySpendingBars(trendPoints, monthlyTotal) {
  const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const n = 7;
  if (Array.isArray(trendPoints) && trendPoints.length >= n) {
    const slice = trendPoints.slice(-n);
    return {
      labels: slice.map((p, i) => p.label || labels[i] || labels[i]),
      data: slice.map((p) => round2(Number(p.value) || 0))
    };
  }
  const total = Math.max(0, Number(monthlyTotal) || 0);
  const w = [0.12, 0.13, 0.16, 0.15, 0.18, 0.14, 0.12];
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  return { labels, data: w.map((x) => round2((total * x) / sum)) };
}

export function incomeExpenseSlices(dashboard) {
  const spent = Math.max(0, Number(dashboard?.spendingSummary?.monthlyTotal) || 0);
  const save = Math.max(0, Number(dashboard?.suggestedSavings?.potential_monthly_saving) || 0);
  const cashback = Math.max(0, Number(dashboard?.spendingSummary?.cashbackTotal) || 0);
  const buffer = Math.max(spent * 0.08, save + cashback);
  const incomeEstimate = round2(spent + buffer);
  const remainder = Math.max(0, round2(incomeEstimate - spent));
  return {
    labels: ["Aylık harcama", "Bütçe tamponu / birikim alanı"],
    data: [round2(spent), remainder],
    incomeEstimate,
    spent
  };
}

export function cashflowThreeWay(dashboard) {
  const spent = Math.max(0, Number(dashboard?.spendingSummary?.monthlyTotal) || 0);
  const save = Math.max(0, Number(dashboard?.suggestedSavings?.potential_monthly_saving) || 0);
  const cb = Math.max(0, Number(dashboard?.spendingSummary?.cashbackTotal) || 0);
  return {
    labels: ["Harcama", "Tasarruf potansiyeli", "Cashback / geri kazanım"],
    data: [round2(spent), round2(save), round2(cb)]
  };
}

function linearForecast(values, ahead) {
  const n = values.length;
  if (n < 2) {
    const v = values[0] || 0;
    return Array.from({ length: ahead }, () => round2(v));
  }
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const out = [];
  for (let h = 1; h <= ahead; h += 1) {
    const x = n - 1 + h;
    out.push(round2(Math.max(0, slope * x + intercept)));
  }
  return out;
}

export function mlSpendingForecastSeries(trendPoints) {
  const values = (trendPoints || []).map((p) => Number(p.value) || 0);
  const labelsHist = (trendPoints || []).map((p) => p.label);
  const ahead = 3;
  const forecast = linearForecast(values.length ? values : [0], ahead);
  const extLabels = [...labelsHist, "Yakın 1", "Yakın 2", "Yakın 3"];
  const histData = [...values, ...Array(ahead).fill(null)];
  const predData = [...Array(values.length).fill(null), ...forecast];
  return { labels: extLabels, histData, predData };
}

export function riskTrendWithForecast(insights) {
  const rows = Array.isArray(insights?.monthlyTrend) ? insights.monthlyTrend : [];
  const labels = rows.map((r) => r.month || "");
  const risks = rows.map((r) => Number(r.riskScore) || 0);
  const ahead = 2;
  const fc = linearForecast(risks.length ? risks : [50], ahead);
  const extLabels = [...labels, "Gelecek 1", "Gelecek 2"];
  const hist = [...risks, ...Array(ahead).fill(null)];
  const pred = [...Array(risks.length).fill(null), ...fc];
  return { labels: extLabels, hist, pred };
}

export function investmentProfileScores(segment) {
  const s = String(segment || "Dengeli");
  if (s.includes("Temkinli")) {
    return { likidite: 82, disiplin: 88, buyume: 38, riskTol: 32, cesit: 55 };
  }
  if (s.includes("Agresif")) {
    return { likidite: 42, disiplin: 48, buyume: 86, riskTol: 78, cesit: 62 };
  }
  return { likidite: 62, disiplin: 68, buyume: 58, riskTol: 54, cesit: 58 };
}
