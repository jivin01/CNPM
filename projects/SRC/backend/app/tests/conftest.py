import os
import pathlib

# Use in-memory database for tests to keep isolation
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
# ensure no lingering DB file
db_file = pathlib.Path("sp26se025.db")
if db_file.exists():
    try:
        db_file.unlink()
    except Exception:
        pass

# Ensure registration secret isn't set unless explicitly needed by a test
os.environ.setdefault("REGISTRATION_SECRET", "")
