# FILE: database.py
import sqlite3
import hashlib
from datetime import datetime

# Tên file Database
DB_NAME = "aura_system.db"

def init_db():
    """Khởi tạo database và bảng nếu chưa có"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Bảng Users (Bác sĩ/Bệnh nhân)
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY, 
                    password TEXT, 
                    role TEXT, 
                    fullname TEXT
                )''')
    
    # Bảng Records (Kết quả khám)
    c.execute('''CREATE TABLE IF NOT EXISTS records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    doctor_user TEXT,
                    patient_name TEXT,
                    image_name TEXT, 
                    risk_level TEXT, 
                    confidence REAL, 
                    created_at TEXT
                )''')
    
    # Tạo sẵn 1 tài khoản Admin để test
    # User: admin / Pass: 123456
    demo_pass = hashlib.sha256(str.encode("123456")).hexdigest()
    try:
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?)", 
                  ("admin", demo_pass, "Doctor", "Dr. Truong (Admin)"))
        conn.commit()
    except:
        pass # Đã tồn tại thì thôi
        
    conn.close()

def login_user(username, password):
    """Kiểm tra đăng nhập"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    hashed_pswd = hashlib.sha256(str.encode(password)).hexdigest()
    c.execute('SELECT * FROM users WHERE username =? AND password =?', (username, hashed_pswd))
    data = c.fetchall()
    conn.close()
    return data

def add_user(username, password, role, fullname):
    """Đăng ký tài khoản mới"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    hashed_pswd = hashlib.sha256(str.encode(password)).hexdigest()
    try:
        c.execute('INSERT INTO users(username, password, role, fullname) VALUES (?,?,?,?)', 
                  (username, hashed_pswd, role, fullname))
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

def save_record(doctor_user, patient_name, image_name, risk_level, confidence):
    """Lưu kết quả khám vào DB"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute('INSERT INTO records(doctor_user, patient_name, image_name, risk_level, confidence, created_at) VALUES (?,?,?,?,?,?)',
              (doctor_user, patient_name, image_name, risk_level, confidence, created_at))
    conn.commit()
    conn.close()

def get_all_records():
    """Lấy toàn bộ lịch sử để vẽ biểu đồ"""
    conn = sqlite3.connect(DB_NAME)
    import pandas as pd
    df = pd.read_sql_query("SELECT * FROM records", conn)
    conn.close()
    return df