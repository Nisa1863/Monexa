import os
import sqlite3
from datetime import datetime


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "users.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            balance REAL NOT NULL,
            purchases REAL NOT NULL,
            payments REAL NOT NULL,
            cluster INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
        )
        """
    )
    # Mevcut DB eski şemaysa created_at kolonunu ekle.
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    if "created_at" not in cols:
        # SQLite, ALTER TABLE ile eklenen kolonda dinamik DEFAULT'a izin vermez.
        # Bu yüzden kolonu ekleyip mevcut satırlara sonradan değer yazıyoruz.
        cursor.execute("ALTER TABLE users ADD COLUMN created_at TEXT")
        cursor.execute("UPDATE users SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE created_at IS NULL")

    conn.commit()
    conn.close()


def insert_user(balance, purchases, payments, cluster):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO users (balance, purchases, payments, cluster, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """,
        (balance, purchases, payments, cluster),
    )
    conn.commit()
    conn.close()
