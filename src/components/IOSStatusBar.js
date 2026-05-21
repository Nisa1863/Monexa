import { useEffect, useState } from "react";

function formatClock(d) {
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Durum çubuğu: saat solda, sistem ikonları sağda */
export default function IOSStatusBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const time = formatClock(now);

  return (
    <header className="ios-status-bar">
      <div className="ios-status-bar__row">
        <time className="ios-status-bar__time" dateTime={now.toISOString()} aria-label={`Saat ${time}`}>
          {time}
        </time>
        <div className="ios-status-bar__icons" aria-hidden>
          <span className="ios-status-bar__cell">
            <i />
            <i />
            <i />
            <i />
          </span>
          <svg className="ios-status-bar__wifi" viewBox="0 0 18 14" width="17" height="13" fill="currentColor">
            <path d="M9 12.2L1.8 5.4a10.5 10.5 0 0114.4 0L9 12.2z" opacity="0.32" />
            <path d="M9 9.2L4.4 4.9a6.5 6.5 0 019.2 0L9 9.2z" opacity="0.55" />
            <path d="M9 6.3L6.9 4.3a3.8 3.8 0 014.2 0L9 6.3z" />
          </svg>
          <span className="ios-status-bar__battery">
            <span className="ios-status-bar__battery-fill" />
            <span className="ios-status-bar__battery-cap" />
          </span>
        </div>
      </div>
    </header>
  );
}
