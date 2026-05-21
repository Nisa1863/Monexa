import { getProfile } from "../services/api";

const PLACEHOLDER_NAMES = new Set([
  "örnek kullanıcı",
  "ornek kullanici",
  "örnek kullanici",
  "ornek kullanıcı",
  "example user",
  "misafir"
]);

export function isPlaceholderDisplayName(name) {
  const normalized = String(name || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  return !normalized || PLACEHOLDER_NAMES.has(normalized);
}

export function buildFullName(user) {
  if (!user || typeof user !== "object") return "";
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  const direct = String(user.fullName || user.full_name || "").trim();
  if (direct && !isPlaceholderDisplayName(direct)) return direct;
  return "";
}

export function readStoredUser() {
  try {
    const raw = localStorage.getItem("monexa_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getDisplayNameFromStorage() {
  const stored = readStoredUser();
  const name = buildFullName(stored);
  if (name) return name;
  const email = String(stored?.email || "").trim();
  if (email.includes("@")) return email.split("@")[0];
  return "Kullanıcı";
}

export function persistUserSession(apiUser, email) {
  const existing = readStoredUser();
  const fromApi = buildFullName(apiUser);
  const fromExisting = buildFullName(existing);
  const fallbackEmail = String(email || apiUser?.email || existing?.email || "").trim().toLowerCase();
  const fallbackName = fallbackEmail.includes("@") ? fallbackEmail.split("@")[0] : "Kullanıcı";

  const fullName = fromApi || fromExisting || fallbackName;
  const merged = {
    ...existing,
    ...apiUser,
    fullName,
    email: apiUser?.email || fallbackEmail || existing?.email || ""
  };

  localStorage.setItem("monexa_user", JSON.stringify(merged));
  return merged;
}

export async function refreshUserDisplayName() {
  const existing = readStoredUser();
  try {
    const { data } = await getProfile();
    const profile = data?.user;
    if (!profile) return existing;

    const fullName = buildFullName(profile);
    if (!fullName) return existing;

    const merged = {
      ...existing,
      ...profile,
      fullName,
      email: profile.email || existing?.email || ""
    };
    localStorage.setItem("monexa_user", JSON.stringify(merged));
    return merged;
  } catch {
    return existing;
  }
}
