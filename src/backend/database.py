from sqlmodel import SQLModel, create_engine, Session

# Tên file database sẽ là aura.db
sqlite_file_name = "aura.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Tạo động cơ kết nối
engine = create_engine(sqlite_url)

# Hàm này để tạo bảng khi khởi động app
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Hàm này để các chức năng khác mượn kết nối dùng
def get_session():
    with Session(engine) as session:
        yield session