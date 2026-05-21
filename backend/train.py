import os

import joblib
import json
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "CC GENERAL.csv")
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "model_metrics.json")
CLUSTER_PROFILES_PATH = os.path.join(MODEL_DIR, "cluster_profiles.json")

FEATURE_ORDER = ["BALANCE", "PURCHASES", "PAYMENTS"]
EXTRA_COLUMNS = ["CREDIT_LIMIT", "PRC_FULL_PAYMENT", "MINIMUM_PAYMENTS", "CASH_ADVANCE"]


def train_model():
    df = pd.read_csv(DATA_PATH)
    required_cols = FEATURE_ORDER + EXTRA_COLUMNS
    for c in required_cols:
        if c not in df.columns:
            raise ValueError(f"Dataset column missing: {c}")

    # Model için kullanılan çekirdek değişkenler + cluster profilleri için ekstra kolonlar.
    # Eksik verileri düşürmek yerine medyan ile doldurup daha stabil eğitim sağlarız.
    df = df.copy()
    for col in required_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].fillna(df[col].median())

    X_df = df[FEATURE_ORDER].astype(float)
    # Aşırı uç değerlerin etkisini azalt: her feature için %1-%99 arasında kırp.
    clip_bounds = {}
    for col in FEATURE_ORDER:
        q_low = float(X_df[col].quantile(0.01))
        q_high = float(X_df[col].quantile(0.99))
        X_df[col] = X_df[col].clip(lower=q_low, upper=q_high)
        clip_bounds[col] = {"low": q_low, "high": q_high}

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)

    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    silhouette = float(silhouette_score(X_scaled, labels))
    db_index = float(davies_bouldin_score(X_scaled, labels))
    accuracy = round(silhouette * 100, 2)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(kmeans, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    metrics = {"silhouette": silhouette, "accuracy": accuracy, "db_index": db_index}
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    # Cluster bazlı "kredi analizi" için profiller üret.
    eps = 1e-9
    cluster_stats = {}
    for cluster_id in range(kmeans.n_clusters):
        mask = labels == cluster_id
        cdf = df.loc[mask]
        if cdf.empty:
            cluster_stats[str(cluster_id)] = {
                "mean_balance": 0.0,
                "mean_purchases": 0.0,
                "mean_payments": 0.0,
                "mean_credit_limit": 0.0,
                "mean_full_payment_rate": 0.0,
                "mean_payment_ratio": 0.0,
                "mean_cash_advance": 0.0,
            }
            continue

        mean_balance = float(cdf["BALANCE"].mean())
        mean_purchases = float(cdf["PURCHASES"].mean())
        mean_payments = float(cdf["PAYMENTS"].mean())

        mean_credit_limit = float(cdf["CREDIT_LIMIT"].mean())
        mean_full_pay = float(cdf["PRC_FULL_PAYMENT"].mean())
        mean_min_pay = float(cdf["MINIMUM_PAYMENTS"].mean())
        mean_payment_ratio = float((cdf["PAYMENTS"] / (cdf["MINIMUM_PAYMENTS"] + eps)).mean())
        mean_cash_adv = float(cdf["CASH_ADVANCE"].mean())

        cluster_stats[str(cluster_id)] = {
            "mean_balance": mean_balance,
            "mean_purchases": mean_purchases,
            "mean_payments": mean_payments,
            "mean_credit_limit": mean_credit_limit,
            "mean_full_payment_rate": mean_full_pay,
            "mean_payment_ratio": mean_payment_ratio,
            "mean_cash_advance": mean_cash_adv,
        }

    def minmax(arr):
        arr = list(arr)
        mn = min(arr)
        mx = max(arr)
        if mx - mn < eps:
            return [0.0 for _ in arr]
        return [(x - mn) / (mx - mn) for x in arr]

    # Risk ve güven skorları için cluster'lar arası normalize değerler.
    balances = [cluster_stats[str(i)]["mean_balance"] for i in range(kmeans.n_clusters)]
    purchases = [cluster_stats[str(i)]["mean_purchases"] for i in range(kmeans.n_clusters)]
    cash_adv = [cluster_stats[str(i)]["mean_cash_advance"] for i in range(kmeans.n_clusters)]
    full_pay = [cluster_stats[str(i)]["mean_full_payment_rate"] for i in range(kmeans.n_clusters)]
    pay_ratio = [cluster_stats[str(i)]["mean_payment_ratio"] for i in range(kmeans.n_clusters)]
    credit_limits = [cluster_stats[str(i)]["mean_credit_limit"] for i in range(kmeans.n_clusters)]

    nb = minmax(balances)
    ns = minmax(purchases)
    nca = minmax(cash_adv)
    nfp = minmax(full_pay)
    npr = minmax(pay_ratio)

    risk_raw = []
    conf_raw = []
    for i in range(kmeans.n_clusters):
        # Daha yüksek balance/spending/cash advance => daha yüksek risk.
        # Daha yüksek full payment rate ve payment ratio => daha düşük risk, daha yüksek güven.
        rr = 0.45 * nb[i] + 0.30 * ns[i] + 0.15 * nca[i] - 0.30 * nfp[i] - 0.25 * npr[i]
        cr = 0.60 * nfp[i] + 0.40 * npr[i]
        risk_raw.append(rr)
        conf_raw.append(cr)

    nrisk = minmax(risk_raw)
    nconf = minmax(conf_raw)

    # Segment etiketleri için heuristik:
    # - En yüksek harcayan: spending max
    # - En düzensiz ödeyen: güven min
    # - Kalan ikisi: risk sırasına göre düşük/orta
    high_spender_cluster = int(max(range(kmeans.n_clusters), key=lambda i: purchases[i]))
    unreliable_cluster = int(min(range(kmeans.n_clusters), key=lambda i: nconf[i]))

    remaining = [i for i in range(kmeans.n_clusters) if i not in (high_spender_cluster, unreliable_cluster)]
    low_risk_cluster = int(min(remaining, key=lambda i: nrisk[i])) if remaining else high_spender_cluster
    medium_risk_cluster = int(max(remaining, key=lambda i: nrisk[i])) if remaining else unreliable_cluster

    segment_name_by_cluster = {}
    for i in range(kmeans.n_clusters):
        if i == low_risk_cluster:
            segment_name_by_cluster[i] = "Dusuk Riskli"
        elif i == medium_risk_cluster:
            segment_name_by_cluster[i] = "Orta Riskli"
        elif i == unreliable_cluster:
            segment_name_by_cluster[i] = "Duzensiz Odeyen"
        elif i == high_spender_cluster:
            segment_name_by_cluster[i] = "Yuksek Harcayan"
        else:
            segment_name_by_cluster[i] = "Segment"

    cluster_profiles = {}
    for i in range(kmeans.n_clusters):
        risk_score = float(round(100 * nrisk[i], 2))
        payment_confidence = float(round(100 * nconf[i], 2))

        base_limit = float(credit_limits[i])
        # Risk arttıkça limit düşsün.
        adjust_factor = 1.0 - 0.60 * (risk_score / 100.0)
        recommended_limit = float(max(0.0, base_limit * adjust_factor))

        cluster_profiles[str(i)] = {
            **cluster_stats[str(i)],
            "risk_score": risk_score,
            "payment_confidence": payment_confidence,
            "recommended_credit_limit": recommended_limit,
            "segment_name": segment_name_by_cluster[i],
        }

    payload = {
        "features": FEATURE_ORDER,
        "n_clusters": int(kmeans.n_clusters),
        "generated_at": pd.Timestamp.utcnow().isoformat(),
        "preprocessing": {"clip_bounds": clip_bounds},
        "cluster_profiles": cluster_profiles,
    }
    with open(CLUSTER_PROFILES_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print("Training completed.")
    print(f"Model saved to: {MODEL_PATH}")
    print(f"Scaler saved to: {SCALER_PATH}")
    print(f"Metrics saved to: {METRICS_PATH}")
    print(f"Cluster profiles saved to: {CLUSTER_PROFILES_PATH}")

    return metrics


def train():
    train_model()


if __name__ == "__main__":
    train()
