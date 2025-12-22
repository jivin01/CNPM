from sqlmodel import SQLModel, create_engine, Session

# === TÊN FILE DATABASE ===
sqlite_file_name = "aura_new.db" 
sqlite_url = f"sqlite:///{sqlite_file_name}"

# === TẠO ĐỘNG CƠ KẾT NỐI (BẢN CHUẨN) ===
# connect_args={"check_same_thread": False} -> Giúp tránh lỗi khi Frontend gọi nhiều lần
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session