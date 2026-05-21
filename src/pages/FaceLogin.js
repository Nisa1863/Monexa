import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MonexaLogo from "../components/MonexaLogo";
import { persistUserSession, readStoredUser } from "../utils/userSession";

function generateAuthToken() {
  const bytes = new Uint8Array(16);
  window.crypto?.getRandomValues?.(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function FaceLogin() {
  const nav = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState({ state: "idle", error: "" });
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const startCamera = async () => {
      try {
        setCameraStatus({ state: "idle", error: "" });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraStatus({ state: "ready", error: "" });
      } catch {
        setCameraStatus({ state: "error", error: "Kamera izni alınamadı." });
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startScan = () => {
    if (scanning || verified) return;
    setMsg("");
    setScanning(true);
    setProgress(0);

    const startedAt = Date.now();
    const totalMs = 3000;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const p = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setProgress(p);

      if (p >= 100) {
        clearInterval(timer);
        try {
          const videoEl = videoRef.current;
          const canvasEl = canvasRef.current;
          if (videoEl && canvasEl && videoEl.videoWidth && videoEl.videoHeight) {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            const ctx = canvasEl.getContext("2d");
            ctx?.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
            setSnapshot(canvasEl.toDataURL("image/png"));
          }
        } catch {
          // Snapshot optional.
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        setScanning(false);
        setVerified(true);
      }
    }, 90);
  };

  const onContinue = () => {
    if (!verified) {
      setMsg("Önce yüz taramasını tamamla.");
      return;
    }

    const token = generateAuthToken();
    localStorage.setItem("monexa_token", token);
    const current = readStoredUser();
    persistUserSession(current || {}, current?.email || "demo@monexa.app");
    nav("/connect");
  };

  return (
    <div style={{ textAlign: "center", paddingTop: 8 }}>
      <MonexaLogo size={64} />
      <h1 className="title title--hero" style={{ marginTop: 12 }}>
        Monexa
      </h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        Face ID ile giriş
      </p>

      <div className="card" style={{ textAlign: "left", marginBottom: 14 }}>
        <p className="muted" style={{ margin: "0 0 10px", fontSize: 12 }}>
          Kamera açılır, yüz taraması yapılır.
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: 320,
            margin: "0 auto 10px",
            aspectRatio: "3 / 4",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--mx-line)",
            background: "rgba(0,0,0,0.04)",
            position: "relative"
          }}
        >
          {verified && snapshot ? (
            <img
              src={snapshot}
              alt="Yüz doğrulama"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Durum:{" "}
            {cameraStatus.state === "ready"
              ? "Kamera hazır"
              : cameraStatus.state === "error"
                ? cameraStatus.error
                : "Kamera hazırlanıyor..."}
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(44, 39, 36, 0.10)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--mx-accent-start) 0%, var(--mx-accent-mid) 100%)"
              }}
            />
          </div>
        </div>

        <button type="button" className="btn btn-secondary" style={{ width: "100%", marginBottom: 10 }} onClick={startScan} disabled={scanning}>
          {verified ? "Yüz doğrulandı" : scanning ? `Tarama sürüyor... ${progress}%` : "Yüzümü tara"}
        </button>

        <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={onContinue}>
          {verified ? "Giriş yap ve devam et" : "Önce taramayı tamamla"}
        </button>
      </div>

      {msg ? <p style={{ color: "#9b2c2c", marginTop: 0, fontSize: 13 }}>{msg}</p> : null}
    </div>
  );
}
