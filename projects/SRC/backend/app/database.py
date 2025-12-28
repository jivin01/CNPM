from sqlmodel import create_engine, Session, SQLModel
from contextlib import contextmanager
from .models.models import User, AnalysisRecord
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sp26se025.db")
# For in-memory SQLite used in tests, use StaticPool so the database persists across connections
if DATABASE_URL.startswith("sqlite:///:memory:") or DATABASE_URL == "sqlite:///:memory:":
    from sqlalchemy.pool import StaticPool
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def init_db():
    SQLModel.metadata.create_all(engine)

# Ensure tables exist on import (useful for tests and dev)
init_db()

@contextmanager
def get_session():
    with Session(engine) as session:
        yield session
