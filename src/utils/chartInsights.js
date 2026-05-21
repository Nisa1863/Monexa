function fmt(n) {
  return Math.round(Number(n) || 0).toLocaleString("tr-TR");
}

function topCategory(categories) {
  if (!Array.isArray(categories) || !categories.length) return null;
  return [...categories].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
}

function secondCategory(categories) {
  if (!Array.isArray(categories) || categories.length < 2) return null;
  const sorted = [...categories].sort((a, b) => Number(b.amount) - Number(a.amount));
  return sorted[1];
}

export function insightMonthlyTrend(trendPoints, monthlyTotal) {
  const series = (trendPoints || []).map((p) => Number(p.value) || 0);
  const nonZeroDays = series.filter((v) => v > 0).length;

  if (series.length < 2) {
    return `Bu ay toplam harcaman yaklaşık ₺${fmt(monthlyTotal)}.`;
  }

  if (nonZeroDays <= 2) {
    return `Henüz az sayıda harcama günün var; grafik kayıtlı günleri gösteriyor (her gün aynı eğilimde olmayabilir). Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
  }

  if (series.length >= 8) {
    const half = Math.floor(series.length / 2);
    const prior = series.slice(0, half).reduce((a, b) => a + b, 0);
    const recent = series.slice(half).reduce((a, b) => a + b, 0);
    if (prior > 0) {
      const pct = Math.round(((recent - prior) / prior) * 100);
      if (Math.abs(pct) < 8) {
        return `Son dönemde harcamaların dengeli seyrediyor. Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
      }
      if (pct > 0) {
        return `Son döneme göre harcamaların artış eğiliminde (yaklaşık %${pct}). Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
      }
      return `Son döneme göre harcamaların azalma eğiliminde (yaklaşık %${Math.abs(pct)}). Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
    }
  }

  const first = series.find((v) => v > 0) ?? series[0];
  const last = [...series].reverse().find((v) => v > 0) ?? series[series.length - 1];
  const diff = last - first;
  const pct = first > 0 ? Math.round((diff / first) * 100) : 0;
  if (Math.abs(pct) < 8) {
    return `Harcamaların son dönemde dengeli seyrediyor. Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
  }
  if (diff > 0) {
    return `Son kayıtlarda harcama artışı görülüyor (yaklaşık %${Math.abs(pct)}). Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
  }
  return `Son kayıtlarda harcama azalışı görülüyor (yaklaşık %${Math.abs(pct)}). Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
}

export function insightWeekly(weekly) {
  const labels = weekly?.labels || [];
  const data = weekly?.data || [];
  if (!data.length) return "Haftalık dağılımını buradan takip edebilirsin.";
  let maxIdx = 0;
  for (let i = 1; i < data.length; i += 1) {
    if (Number(data[i]) > Number(data[maxIdx])) maxIdx = i;
  }
  const day = labels[maxIdx] || "bu gün";
  const weekendLabels = ["Cmt", "Paz", "Cum", "Cumartesi", "Pazar"];
  const isWeekend = weekendLabels.some((w) => String(day).includes(w));
  if (isWeekend) {
    return `Hafta sonlarına doğru harcama yoğunluğu artıyor; en yüksek gün: ${day}.`;
  }
  return `${day} günü bu haftanın en yüksek harcama günü gibi görünüyor.`;
}

export function insightCategories(categories) {
  const top = topCategory(categories);
  if (!top || !top.category) return "Kategori dağılımın burada özetleniyor.";
  const second = secondCategory(categories);
  if (second && second.amount > 0) {
    const gap = Math.round(((top.amount - second.amount) / top.amount) * 100);
    if (gap < 15) {
      return `Bu ay en çok ${top.category} ve ${second.category} kalemlerinde harcama yapıyorsun.`;
    }
  }
  return `Bu ay en fazla harcaman ${top.category} kategorisinde (₺${fmt(top.amount)}).`;
}

export function insightCategoryCompare(categories, transportName = "Ulaşım") {
  const top = topCategory(categories);
  const transport = (categories || []).find((c) => String(c.category).includes("Ulaşım") || c.category === transportName);
  if (transport && top && transport.category !== top.category) {
    const tAmt = Number(transport.amount) || 0;
    const topAmt = Number(top.amount) || 0;
    if (tAmt > 0 && topAmt > 0 && transport.category === transportName) {
      if (tAmt >= topAmt * 0.85) {
        return `${transportName} giderlerin bu ay öne çıkıyor; bütçeni gözden geçirmek iyi olabilir.`;
      }
    }
  }
  return insightCategories(categories);
}

export function insightIncomeExpense(incomeExpense, monthlyTotal) {
  if (!incomeExpense) return "Harcama ve birikim alanının kabaca dağılımı burada.";
  const spent = incomeExpense.spent || 0;
  const remainder = incomeExpense.data?.[1] || 0;
  if (remainder > spent * 0.15) {
    return `Harcamandan sonra tahmini bir tampon alanın var; aylık harcaman ₺${fmt(monthlyTotal)}.`;
  }
  return `Harcamaların bütçenin büyük kısmını oluşturuyor. Bu ay toplam: ₺${fmt(monthlyTotal)}.`;
}

export function insightCashflow(cashflow, dashboard) {
  const labels = cashflow?.labels || [];
  const data = cashflow?.data || [];
  const maxIdx = data.reduce((best, v, i) => (Number(v) > Number(data[best]) ? i : best), 0);
  const label = labels[maxIdx] || "harcama";
  const save = Number(dashboard?.suggestedSavings?.potential_monthly_saving) || 0;
  if (save > 0) {
    return `En büyük pay ${label.toLowerCase()} tarafında. Bu ay yaklaşık ₺${fmt(save)} tasarruf potansiyelin var.`;
  }
  return `Paranın en çok gittiği alan: ${label.toLowerCase()}. Diğer kalemleri de buradan karşılaştırabilirsin.`;
}

export function insightRiskScore(score) {
  const s = Number(score) || 0;
  if (s < 35) return "Finansal risk durumun düşük görünüyor; ödeme alışkanlıkların genel olarak iyi.";
  if (s < 65) return "Finansal risk durumun orta düzeyde; küçük düzenlemelerle skorunu iyileştirebilirsin.";
  return "Finansal risk durumun yüksek görünüyor; önce borç ve nakit akışına odaklanman faydalı olur.";
}

export function insightMlForecast(trendPoints) {
  const values = (trendPoints || []).map((p) => Number(p.value) || 0).filter((v) => v > 0);
  if (values.length < 2) return "Önümüzdeki dönem için harcama tahmini burada; gerçek tutarlar değişebilir.";
  const first = values[0];
  const last = values[values.length - 1];
  if (last < first * 0.9) {
    return "Geçen döneme göre harcama eğilimin düşüş yönünde; önümüzdeki günlerde de benzer bir tempo beklenebilir.";
  }
  if (last > first * 1.1) {
    return "Harcamaların artış eğiliminde; önümüzdeki dönem için bütçeni sıkı tutman iyi olabilir.";
  }
  return "Harcamaların istikrarlı görünüyor; tahminler yönlendirme içindir, kesin rakam değildir.";
}

export function insightRiskForecast(insights) {
  const rows = insights?.monthlyTrend || [];
  if (rows.length < 2) return "Risk durumunun zaman içindeki seyri burada özetleniyor.";
  const last = Number(rows[rows.length - 1]?.riskScore) || 0;
  const prev = Number(rows[rows.length - 2]?.riskScore) || 0;
  if (last > prev + 3) return "Son aylarda finansal risk göstergen hafif yükselmiş görünüyor.";
  if (last < prev - 3) return "Son aylarda finansal risk göstergen iyileşme yönünde.";
  return "Risk durumun son aylarda dengeli seyrediyor.";
}

export function insightInvestment(riskLevel) {
  if (riskLevel === "low") return "Düşük risk profiline göre daha koruyucu bir dağılım öneriliyor.";
  if (riskLevel === "high") return "Yüksek risk profiline göre büyüme odaklı bir dağılım öneriliyor; karar öncesi uzman görüşü al.";
  return "Orta risk profiline göre dengeli bir dağılım öneriliyor.";
}

export function insightPortfolioBar(slices) {
  const top = [...(slices || [])].sort((a, b) => b.pct - a.pct)[0];
  if (!top) return "Varlık sınıflarına göre örnek dağılım burada.";
  return `Önerilen dağılımda en yüksek pay: ${top.label} (%${top.pct}).`;
}

export function insightShap(features) {
  if (!Array.isArray(features) || !features.length) {
    return "Harcama ve ödeme alışkanlıkların skorunu etkileyen başlıca faktörler burada.";
  }
  const top = [...features].sort((a, b) => Math.abs(Number(b.impact)) - Math.abs(Number(a.impact)))[0];
  const name = top?.feature || "bu alan";
  const positive = Number(top?.impact) >= 0;
  if (positive) {
    return `Dikkat etmen gereken başlıca konu: ${name}. Küçük bir düzenleme bile fark yaratabilir.`;
  }
  return `Finansal durumunu destekleyen güçlü yanın: ${name}. Bu alışkanlığı sürdürmek iyi bir fikir.`;
}

export function insightCashbackMonthly(chart) {
  const data = chart?.data || [];
  const total = data.reduce((a, b) => a + Number(b || 0), 0);
  if (!total) return "Aylık kazanım verisi henüz oluşmadı.";
  const maxIdx = data.indexOf(Math.max(...data));
  const label = chart?.labels?.[maxIdx];
  return `Son 6 ayda ₺${fmt(total)}. En yüksek: ${label || "—"}.`;
}

export function insightCashbackStores(chart, summary) {
  const labels = chart?.labels || [];
  const data = chart?.data || [];
  if (!labels.length) {
    const top = summary?.topStore;
    if (top) return `En çok kazanç: ${top.storeName}.`;
    return "Henüz marka bazlı kazanç verisi yok.";
  }
  const topIdx = data.indexOf(Math.max(...data));
  if (data[topIdx] <= 0) return "Anlaşmalı marka harcamaların arttıkça dağılım burada görünür.";
  return `En yüksek kazanç ${labels[topIdx]} markasında (₺${fmt(data[topIdx])}).`;
}
