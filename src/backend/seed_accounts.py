from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import User
from auth_utils import get_password_hash


def create_if_not_exists(session: Session, email: str, full_name: str, password: str, role: str):
    statement = select(User).where(User.email == email)
    existing = session.exec(statement).first()
    if existing:
        print(f"Account already exists: {email} (role={existing.role})")
        return existing

    hashed = get_password_hash(password)
    u = User(email=email, full_name=full_name, hashed_password=hashed, role=role)
    session.add(u)
    session.commit()
    session.refresh(u)
    print(f"Created account: {email} (role={role})")
    return u


def main():
    # Ensure tables exist
    create_db_and_tables()

    # Choose credentials
    doctor_email = "doctor@gm.com"
    doctor_password = "123"

    user_email = "user@gm.com"
    user_password = "123"

    with Session(engine) as session:
        create_if_not_exists(session, doctor_email, "Dr. Seed", doctor_password, "doctor")
        create_if_not_exists(session, user_email, "Patient Seed", user_password, "patient")

    print("Seeding finished.")
    print("Doctor:", doctor_email, doctor_password)
    print("User:", user_email, user_password)


if __name__ == "__main__":
    main()
