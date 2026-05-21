/** Frontend: harcama kategorileri (backend USER_CATEGORY_KEYS ile aynı id'ler) */

export const SPENDING_CATEGORIES = [
  { id: "market", label: "Market" },
  { id: "transport", label: "Ulaşım" },
  { id: "bills", label: "Fatura" },
  { id: "dining", label: "Yeme-İçme" },
  { id: "education", label: "Eğitim" },
  { id: "health", label: "Sağlık" },
  { id: "entertainment", label: "Eğlence" },
  { id: "subscription", label: "Abonelik" },
  { id: "other", label: "Diğer" }
];

const RULES = [
  {
    id: "market",
    words: [
      "migros",
      "a101",
      "bim",
      "carrefour",
      "şok",
      "sok",
      "hakmar",
      "real",
      "metro market",
      "macro center",
      "groseri",
      "grocery"
    ]
  },
  {
    id: "subscription",
    words: ["netflix", "spotify", "youtube premium", "apple music", "apple müzik", "exxen", "blutv", "disney", "hbo", "prime video", "amazon prime"]
  },
  {
    id: "transport",
    words: [
      "otobüs",
      "otobus",
      "metro",
      "tramvay",
      "taksi",
      "uber",
      "bolt",
      "benzin",
      "lpg",
      "opet",
      "shell",
      "bp benzin",
      "park",
      "otopark",
      "hgs",
      "ogs",
      "marmaray"
    ]
  },
  {
    id: "bills",
    words: [
      "elektrik",
      "su faturası",
      "su faturasi",
      "doğalgaz",
      "dogalgaz",
      "internet",
      "turkcell",
      "vodafone",
      "türk telekom",
      "turk telekom",
      "ttnet",
      "superonline",
      "fatura",
      "aidat"
    ]
  },
  {
    id: "dining",
    words: [
      "kahve",
      "starbucks",
      "restoran",
      "cafe",
      "kafe",
      "yemek",
      "kebap",
      "burger",
      "pizza",
      "mcDonald",
      "mcdonald",
      "subway",
      "kfc",
      "yemeksepeti",
      "trendyol yemek",
      "getir yemek"
    ]
  },
  {
    id: "education",
    words: ["üniversite", "universite", "kurs", "udemy", "coursera", "kitap", "eğitim", "egitim", "dershane", "okul"]
  },
  {
    id: "health",
    words: ["eczane", "hastane", "doktor", "sağlık", "saglik", "muayene", "göz", "goz", "diş", "dis ", " medikal", "optik"]
  },
  {
    id: "entertainment",
    words: ["sinema", "tiyatro", "konser", "oyun", "steam", "playstation", "xbox", "bowling", "bilardo", "eğlence", "eglence"]
  }
];

function normalize(text) {
  return String(text || "").toLocaleLowerCase("tr-TR");
}

/**
 * Açıklamaya göre kategori tahmini. Birden fazla kural eşleşirse veya hiçbiri eşleşmezse "other".
 */
export function guessCategoryFromDescription(description) {
  const t = normalize(description).trim();
  if (!t) return "other";

  const matchedIds = new Set();
  for (const rule of RULES) {
    if (rule.words.some((w) => normalize(w) && t.includes(normalize(w)))) {
      matchedIds.add(rule.id);
    }
  }
  if (matchedIds.size === 1) return [...matchedIds][0];
  return "other";
}

export function labelForCategoryId(id) {
  return SPENDING_CATEGORIES.find((c) => c.id === id)?.label || "Diğer";
}
