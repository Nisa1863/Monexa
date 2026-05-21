import { useEffect, useMemo, useState } from "react";

function removeNearWhiteBg(data, { white = 246, softness = 18 } = {}) {
  // White-ish arka planı şeffaflaştır (logo “sticker” gibi durmasın)
  // white: eşik, softness: geçiş bandı
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;

    const max = r > g ? (r > b ? r : b) : g > b ? g : b;
    const min = r < g ? (r < b ? r : b) : g < b ? g : b;
    const sat = max - min; // düşükse gri/beyaz
    const lum = (r + g + b) / 3;

    // Hem parlak hem de düşük saturasyonlu ise “arka plan” kabul et
    if (lum >= white && sat <= 16) {
      data[i + 3] = 0;
      continue;
    }

    // Yumuşak geçiş: beyaza yaklaşınca alpha azalt
    const t = Math.max(0, Math.min(1, (lum - (white - softness)) / (softness || 1)));
    if (t > 0.01 && sat <= 26) {
      data[i + 3] = Math.round(a * (1 - t));
    }
  }
}

export default function MonexaLogo({ size = 56 }) {
  // Büyük ekranda: gönderilen PNG ama arka planı otomatik şeffaflaştırılmış
  const isWordmark = size >= 72;
  const src = useMemo(() => `${process.env.PUBLIC_URL}/monexa-logo.png`, []);
  const [processed, setProcessed] = useState(null);

  useEffect(() => {
    if (!isWordmark) return;
    let cancelled = false;

    (async () => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        await new Promise((res, rej) => {
          img.onload = () => res();
          img.onerror = rej;
        });
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        removeNearWhiteBg(imageData.data);
        ctx.putImageData(imageData, 0, 0);

        const out = canvas.toDataURL("image/png");
        if (!cancelled) setProcessed(out);
      } catch {
        if (!cancelled) setProcessed(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isWordmark, src]);

  if (isWordmark) {
    const h = Math.round(size * 0.52);
    return (
      <img
        src={processed || src}
        alt="Monexa"
        style={{ width: size, height: h, objectFit: "contain", display: "block" }}
        draggable={false}
      />
    );
  }

  const uid = `mx-${size}`;
  const gradId = `${uid}-grad`;
  const glowId = `${uid}-glow`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="12" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f97362" />
          <stop offset="0.32" stopColor="#f79a63" />
          <stop offset="0.7" stopColor="#f4c26a" />
          <stop offset="1" stopColor="#f1d18a" />
        </linearGradient>
        <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.22" />
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.08" />
        </filter>
      </defs>
      <path
        d="M14 48 V22 L28 36 L32 30 L36 36 L50 22 V48"
        stroke={`url(#${gradId})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
      <path
        d="M18 48 V26 L28 36 L32 32 L36 36 L46 26 V48"
        stroke="#faf8f4"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      {/* Dijital bağlantı düğümleri (sonsuzluk çağrışımı) */}
      <circle cx="26" cy="34" r="2.2" fill={`url(#${gradId})`} />
      <circle cx="38" cy="34" r="2.2" fill={`url(#${gradId})`} opacity="0.9" />
      <path
        d="M26 34 C29 31 35 31 38 34"
        stroke="#faf8f4"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
