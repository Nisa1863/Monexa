import json
import os
import socket
from datetime import datetime, timedelta
from functools import wraps
from secrets import token_urlsafe

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

from db import init_db, insert_user


app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "change-this-in-production")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'auth.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app, supports_credentials=True)
db = SQLAlchemy(app)
init_db()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
METRICS_PATH = os.path.join(BASE_DIR, "model", "model_metrics.json")

mock_user = {
    "id": "user-1",
    "fullName": "Ornek kullanici",
    "email": "demo@monexa.app",
}

bank_connections = [
    {"id": "bank-1", "bankName": "Ziraat Bankasi", "iban": "TR12 0001 0000 0000 0000 0001", "status": "connected"},
    {"id": "bank-2", "bankName": "Is Bankasi", "iban": "TR24 0006 7000 0000 0000 0002", "status": "pending"},
]

spending_summary = {
    "monthlyTotal": 14280,
    "cashbackTotal": 382,
    "categories": [
        {"category": "Market", "amount": 4300},
        {"category": "Ulasim", "amount": 1560},
        {"category": "Fatura", "amount": 3120},
        {"category": "Eglence", "amount": 1980},
        {"category": "Diger", "amount": 3320},
    ],
}

behavior_signals = {
    "balanceManagement": 0.54,
    "cashAdvanceRatio": 0.37,
    "installmentHabit": 0.62,
    "fullPaymentRate": 0.43,
}


def build_risk_analysis():
    risk_score = round(
        100
        * (
            0.35 * behavior_signals["cashAdvanceRatio"]
            + 0.25 * (1 - behavior_signals["fullPaymentRate"])
            + 0.2 * behavior_signals["installmentHabit"]
            + 0.2 * behavior_signals["balanceManagement"]
        )
    )
    segment = "Temkinli" if risk_score < 35 else ("Dengeli" if risk_score < 65 else "Agresif")
    return {
        "riskScore": risk_score,
        "segment": segment,
        "shapLikeFeatures": [
            {
                "feature": "Nakit avans kullanimi",
                "impact": 0.31,
                "description": "Nakit avans aliskanligi risk skorunu yukari ceker.",
            },
            {
                "feature": "Tam odeme davranisi",
                "impact": -0.24,
                "description": "Borcun tamamini duzenli odemek riski azaltir.",
            },
            {
                "feature": "Taksitli harcama",
                "impact": 0.14,
                "description": "Taksit yogunlugu orta duzeyde risk artisi yaratabilir.",
            },
        ],
        "recommendations": [
            "Nakit avans kullanimini onumuzdeki ay en az %20 azaltmayi dene.",
            "Asgari odeme yerine toplam borcunun en az %70'ini odemeyi hedefle.",
            "Abonelik ve market harcamalari icin aylik ust sinir belirle.",
        ],
    }


class User(db.Model):
    __tablename__ = "auth_users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(32), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    login_history = db.relationship("LoginHistory", backref="user", lazy=True, cascade="all, delete-orphan")
    password_reset_tokens = db.relationship("PasswordResetToken", backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        full_name = " ".join([p for p in [self.first_name, self.last_name] if p]).strip()
        return {
            "id": self.id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "fullName": full_name or self.username,
            "email": self.email,
            "phone": self.phone,
        }


class LoginHistory(db.Model):
    __tablename__ = "login_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("auth_users.id"), nullable=False, index=True)
    login_timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("auth_users.id"), nullable=False, index=True)
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


with app.app_context():
    db.create_all()
    # Lightweight migration for existing SQLite files.
    inspector = db.inspect(db.engine)
    if "auth_users" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("auth_users")}
        with db.engine.begin() as conn:
            if "first_name" not in columns:
                conn.exec_driver_sql("ALTER TABLE auth_users ADD COLUMN first_name VARCHAR(80)")
            if "last_name" not in columns:
                conn.exec_driver_sql("ALTER TABLE auth_users ADD COLUMN last_name VARCHAR(80)")
            if "phone" not in columns:
                conn.exec_driver_sql("ALTER TABLE auth_users ADD COLUMN phone VARCHAR(32)")


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "Authentication required."}), 401
        user = db.session.get(User, user_id)
        if not user:
            session.pop("user_id", None)
            return jsonify({"success": False, "message": "Invalid session."}), 401
        return view_func(user, *args, **kwargs)

    return wrapped


def _read_metrics():
    if not os.path.exists(METRICS_PATH):
        return None
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/", methods=["GET"])
def root():
    return jsonify(
        {
            "success": True,
            "message": "Monexa Flask API is running.",
            "endpoints": ["/register", "/login", "/profile", "/predict", "/train", "/metrics"],
        }
    ), 200


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "monexa-backend"}), 200


@app.route("/favicon.ico", methods=["GET"])
def favicon():
    return "", 204


@app.route("/predict", methods=["POST"])
def predict():
    from predict import predict_user

    payload = request.get_json(silent=True) or {}

    try:
        balance = float(payload["balance"])
        purchases = float(payload.get("purchases", payload.get("spending")))
        payments = float(payload["payments"])
    except (KeyError, TypeError, ValueError):
        return jsonify(
            {
                "error": "balance and payments are required numeric fields. purchases (or spending) is also required."
            }
        ), 400

    pred = predict_user({"BALANCE": balance, "PURCHASES": purchases, "PAYMENTS": payments})
    cluster = int(pred["cluster"])

    insert_user(balance, purchases, payments, cluster)

    message = pred.get("segment_name") or "Bilinmeyen Segment"
    risk_score = pred.get("risk_score")
    payment_confidence = pred.get("payment_confidence")
    recommended_credit_limit = pred.get("recommended_credit_limit")

    return jsonify(
        {
            "cluster": cluster,
            "message": message,
            "riskScore": risk_score,
            "paymentConfidence": payment_confidence,
            "recommendedCreditLimit": recommended_credit_limit,
        }
    )


@app.route("/train", methods=["POST"])
def train():
    from train import train_model

    metrics = train_model()
    return jsonify(metrics)


@app.route("/metrics", methods=["GET"])
def metrics():
    m = _read_metrics()
    if m is None:
        return jsonify({"error": "model_metrics.json bulunamadi. Once /train endpoint'ini calistirin."}), 404
    return jsonify(m)


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    return jsonify(
        {
            "user": mock_user,
            "bankConnections": bank_connections,
            "spendingSummary": spending_summary,
            **build_risk_analysis(),
        }
    )


@app.route("/api/insights", methods=["GET"])
def insights():
    return jsonify(
        {
            **build_risk_analysis(),
            "monthlyTrend": [
                {"month": "Oca", "riskScore": 58},
                {"month": "Sub", "riskScore": 61},
                {"month": "Mar", "riskScore": 68},
            ],
        }
    )


@app.route("/api/bank/connect", methods=["POST"])
def bank_connect():
    payload = request.get_json(silent=True) or {}
    bank_name = payload.get("bankName") or "Yeni Banka"
    iban = payload.get("iban") or "TR00 0000 0000 0000 0000 0000"
    new_conn = {
        "id": f"bank-{int(datetime.utcnow().timestamp())}",
        "bankName": bank_name,
        "iban": iban,
        "status": "connected",
    }
    bank_connections.insert(0, new_conn)
    return jsonify({"message": "Banka hesabi baglandi.", "connection": new_conn}), 201


@app.route("/api/receipts/scan", methods=["POST"])
def receipts_scan():
    sample_receipt = {
        "merchant": "Ornek market",
        "totalAmount": 684.9,
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "category": "Market",
        "items": [
            {"name": "Sut", "amount": 42.5},
            {"name": "Yumurta", "amount": 58.9},
            {"name": "Temizlik urunu", "amount": 189.0},
        ],
        "source": "yuklenen_gorsel",
    }
    return jsonify({"message": "Fis analizi tamamlandi.", "receipt": sample_receipt})


@app.route("/api/ml/predict", methods=["POST"])
def ml_predict():
    from predict import predict_user

    payload = request.get_json(silent=True) or {}

    def pick(*keys, default=None):
        for k in keys:
            if k in payload and payload[k] not in (None, ""):
                return payload[k]
        return default

    try:
        # Insights form sends uppercase keys; keep lowercase compatibility too.
        balance = float(pick("BALANCE", "balance"))
        purchases = float(pick("PURCHASES", "purchases", "spending"))
        payments = float(pick("PAYMENTS", "payments"))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "BALANCE/PURCHASES/PAYMENTS numeric values are required."}), 400

    pred = predict_user({"BALANCE": balance, "PURCHASES": purchases, "PAYMENTS": payments})
    cluster = int(pred.get("cluster", 0))
    segment = pred.get("segment_name") or f"Segment {cluster}"
    risk_score = pred.get("risk_score")
    risk_score_num = float(risk_score) if risk_score is not None else 50.0

    if risk_score_num >= 65:
        risk_label = "Yüksek dikkat"
    elif risk_score_num >= 35:
        risk_label = "Orta düzey"
    else:
        risk_label = "Düşük dikkat"

    advice = "Skoruna göre ödeme planını düzenleyin ve nakit akışını takip edin."
    if pred.get("recommended_credit_limit") is not None:
        advice = f"Önerilen kredi limiti: ₺{float(pred['recommended_credit_limit']):.2f}"

    return jsonify(
        {
            "success": True,
            "cluster": cluster,
            "segment": segment,
            "riskScore": round(risk_score_num, 2),
            "riskLabel": risk_label,
            "advice": advice,
            "paymentConfidence": pred.get("payment_confidence"),
            "recommendedCreditLimit": pred.get("recommended_credit_limit"),
        }
    ), 200


@app.route("/register", methods=["POST"])
@app.route("/api/auth/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    first_name = str(payload.get("first_name", payload.get("firstName", ""))).strip()
    last_name = str(payload.get("last_name", payload.get("lastName", ""))).strip()
    username = str(payload.get("username", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    confirm_password = str(payload.get("confirm_password", payload.get("confirmPassword", "")))

    if not username:
        username = " ".join([p for p in [first_name, last_name] if p]).strip()
    if not username and email:
        username = email.split("@")[0]

    if not first_name or not last_name or not email or not password or not confirm_password:
        return jsonify({"success": False, "message": "first_name, last_name, email, password and confirm_password are required."}), 400
    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters."}), 400
    if password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match."}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"success": False, "message": "Email already registered."}), 409

    # Some Python builds (notably older macOS system Python) don't expose hashlib.scrypt.
    # Use PBKDF2 explicitly for compatibility while keeping password hashing secure.
    user = User(
        first_name=first_name,
        last_name=last_name,
        username=username,
        email=email,
        password_hash=generate_password_hash(password, method="pbkdf2:sha256"),
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True, "user": user.to_dict()}), 201


@app.route("/login", methods=["POST"])
@app.route("/api/auth/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        return jsonify({"success": False, "message": "email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    session["user_id"] = user.id
    db.session.add(LoginHistory(user_id=user.id))
    db.session.commit()

    return jsonify({"success": True, "user": user.to_dict()}), 200


@app.route("/forgot-password", methods=["POST"])
@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return jsonify({"success": False, "message": "email is required."}), 400

    user = User.query.filter_by(email=email).first()
    # Do not leak whether the email exists.
    if not user:
        return jsonify({"success": True, "message": "If the account exists, a reset link has been generated."}), 200

    token = token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    row = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at, used=False)
    db.session.add(row)
    db.session.commit()

    reset_link = f"http://localhost:3000/reset-password?token={token}"
    # Email provider not configured: simulate send by returning link in response.
    return jsonify(
        {
            "success": True,
            "message": "Password reset link generated.",
            "reset_link": reset_link,
            "token_expires_in_minutes": 30,
        }
    ), 200


@app.route("/reset-password", methods=["POST"])
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    payload = request.get_json(silent=True) or {}
    token = str(payload.get("token", "")).strip()
    password = str(payload.get("password", ""))
    confirm_password = str(payload.get("confirm_password", payload.get("confirmPassword", "")))

    if not token or not password or not confirm_password:
        return jsonify({"success": False, "message": "token, password and confirm_password are required."}), 400
    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters."}), 400
    if password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match."}), 400

    row = PasswordResetToken.query.filter_by(token=token).first()
    if not row or row.used or row.expires_at < datetime.utcnow():
        return jsonify({"success": False, "message": "Invalid or expired reset token."}), 400

    user = db.session.get(User, row.user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    user.password_hash = generate_password_hash(password, method="pbkdf2:sha256")
    row.used = True
    db.session.commit()

    return jsonify({"success": True, "message": "Password reset successful."}), 200


@app.route("/profile", methods=["GET"])
@app.route("/api/auth/profile", methods=["GET"])
@login_required
def profile(current_user):
    user_data = current_user.to_dict()
    return (
        jsonify(
            {
                "success": True,
                "user": {
                    "first_name": user_data.get("first_name"),
                    "last_name": user_data.get("last_name"),
                    "email": user_data.get("email"),
                    "phone": user_data.get("phone"),
                },
            }
        ),
        200,
    )


@app.route("/update-profile", methods=["PUT", "POST"])
@app.route("/api/auth/update-profile", methods=["PUT", "POST"])
@login_required
def update_profile(current_user):
    payload = request.get_json(silent=True) or {}
    first_name = str(payload.get("first_name", payload.get("firstName", ""))).strip()
    last_name = str(payload.get("last_name", payload.get("lastName", ""))).strip()
    email = str(payload.get("email", "")).strip().lower()
    phone = str(payload.get("phone", "")).strip()

    if not first_name or not last_name or not email:
        return jsonify({"success": False, "message": "first_name, last_name and email are required."}), 400

    existing = User.query.filter(User.email == email, User.id != current_user.id).first()
    if existing:
        return jsonify({"success": False, "message": "Email already in use."}), 409

    current_user.first_name = first_name
    current_user.last_name = last_name
    current_user.email = email
    current_user.phone = phone or None
    # Keep username aligned with displayed full name.
    current_user.username = f"{first_name} {last_name}".strip()
    db.session.commit()

    user_data = current_user.to_dict()
    return (
        jsonify(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "user": {
                    "first_name": user_data.get("first_name"),
                    "last_name": user_data.get("last_name"),
                    "email": user_data.get("email"),
                    "phone": user_data.get("phone"),
                },
            }
        ),
        200,
    )


if __name__ == "__main__":
    def _find_free_port(start_port):
        port = int(start_port)
        while port <= 65535:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                try:
                    sock.bind(("0.0.0.0", port))
                    return port
                except OSError:
                    port += 1
        raise RuntimeError("No free port found.")

    requested_port = int(os.environ.get("FLASK_PORT", "5001"))
    port = _find_free_port(requested_port)
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
