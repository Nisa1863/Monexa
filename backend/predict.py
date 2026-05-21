import json
import os
import joblib
import pandas as pd
import sys


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "kmeans_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "model", "scaler.pkl")
CLUSTER_PROFILES_PATH = os.path.join(BASE_DIR, "model", "cluster_profiles.json")

FEATURE_ORDER = ["BALANCE", "PURCHASES", "PAYMENTS"]


def _load_artifacts():
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(CLUSTER_PROFILES_PATH, "r", encoding="utf-8") as f:
        cluster_profiles = json.load(f)
    cluster_by_id = cluster_profiles.get("cluster_profiles", {})
    clip_bounds = (cluster_profiles.get("preprocessing", {}) or {}).get("clip_bounds", {})
    return model, scaler, cluster_by_id, clip_bounds


def predict_user(data):
    model, scaler, cluster_by_id, clip_bounds = _load_artifacts()
    vec = [float(data.get(k, 0.0)) for k in FEATURE_ORDER]
    input_df = pd.DataFrame([vec], columns=FEATURE_ORDER)
    for col in FEATURE_ORDER:
        bounds = clip_bounds.get(col)
        if bounds:
            input_df[col] = input_df[col].clip(lower=float(bounds["low"]), upper=float(bounds["high"]))

    scaled_input = scaler.transform(input_df)
    cluster = int(model.predict(scaled_input)[0])

    profile = cluster_by_id.get(str(cluster), {})

    risk_score = profile.get("risk_score", None)
    payment_confidence = profile.get("payment_confidence", None)
    recommended_credit_limit = profile.get("recommended_credit_limit", None)
    segment_name = profile.get("segment_name", f"Segment {cluster}")

    # KMeans merkezine olan uzaklıktan ek "gösterim" amaçlı skoru çıkarabiliriz,
    # ama asıl güven skoru/riski cluster profile'dan geliyor.
    return {
        "cluster": cluster,
        "segment_name": segment_name,
        "risk_score": risk_score,
        "payment_confidence": payment_confidence,
        "recommended_credit_limit": recommended_credit_limit,
    }


if __name__ == "__main__":
    # Expected input: JSON payload on stdin.
    # Expected output: prediction JSON on stdout.
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw else {}
        result = predict_user(payload)
        sys.stdout.write(json.dumps(result))
    except Exception as e:
        # Keep error clear for caller (Node backend can fallback when artifacts mismatch).
        sys.stderr.write(f"predict_error: {str(e)}")
        sys.exit(1)
