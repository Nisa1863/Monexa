const ICON_EMOJI = {
  cart: "🛒",
  bag: "🛍️",
  shop: "🏪",
  coffee: "☕",
  play: "🎬",
  music: "🎵",
  fuel: "⛽",
  shirt: "👕",
  health: "💊",
  food: "🍽️"
};

export function storeIconEmoji(iconKey) {
  return ICON_EMOJI[iconKey] || "🏷️";
}
