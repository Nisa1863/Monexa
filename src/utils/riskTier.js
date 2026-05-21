/** API segment (Temkinli / Dengeli / Agresif) → iç mantık */
export function segmentToTier(segment, riskScore = 50) {
  if (!segment) return scoreToTier(riskScore);
  const s = String(segment).toLowerCase();
  if (s.includes("temkinli") || s.includes("dusuk") || s.includes("düşük")) return "low";
  if (s.includes("agresif") || s.includes("yuksek") || s.includes("yüksek")) return "high";
  if (s.includes("dengeli") || s.includes("orta")) return "medium";
  return scoreToTier(riskScore);
}

export function scoreToTier(score) {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export const TIER_TR = {
  low: { title: "Düşük dikkat", subtitle: "Profilin şu an güçlü görünüyor." },
  medium: { title: "Orta düzey", subtitle: "Birkaç hedefli adımla skoru iyileştirebilirsin." },
  high: { title: "Yüksek dikkat", subtitle: "Önce nakit akışı ve borç öncelikleri öne alınmalı." }
};

/** Koç ekranı: seviyeye göre sıralı adımlar (veri kümesi + uygulama akışıyla uyumlu) */
export function getPrioritySteps(tier, options = {}) {
  const fromPage = options.fromPage || "";

  if (fromPage === "analytics") {
    return [
      { to: "/invest", label: "Yatırım önerilerine göz at" },
      { to: "/insights", label: "Detaylı risk değerlendirmesini tamamla" },
      { to: "/home", label: "Ana sayfada harcama özetini kontrol et" },
      { to: "/profile", label: "Harcama kaydı ekle veya güncelle" }
    ];
  }

  if (tier === "high") {
    return [
      { to: "/insights", label: "Detaylı risk değerlendirmesini tamamla" },
      { to: "/home", label: "Ana sayfada harcama özetini kontrol et" },
      { to: "/connect", label: "Banka hesabını bağla" },
      { to: "/profile", label: "Harcama kayıtlarını güncelle" }
    ];
  }
  if (tier === "medium") {
    return [
      { to: "/insights", label: "Detaylı risk değerlendirmesini tamamla" },
      { to: "/home", label: "Ana sayfada harcama özetini kontrol et" },
      { to: "/connect", label: "Banka hesabını bağla" },
      { to: "/profile", label: "Harcama kayıtlarını güncelle" }
    ];
  }
  return [
    { to: "/insights", label: "Detaylı risk değerlendirmesini tamamla" },
    { to: "/home", label: "Ana sayfada harcama özetini kontrol et" },
    { to: "/profile", label: "Harcama kayıtlarını güncelle" },
    { to: "/invest", label: "İsteğe bağlı: yatırım önerilerine göz at" }
  ];
}
