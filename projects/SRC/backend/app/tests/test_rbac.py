from fastapi.testclient import TestClient
from app.main import app
from app.database import get_session
from app.models.models import User
from app.api.auth import get_password_hash

client = TestClient(app)


from sqlmodel import select

def create_admin():
    with get_session() as session:
        admin = session.exec(select(User).where(User.email == 'admin@example.com')).first()
        # simple raw check; create admin if missing
        if not admin:
            a = User(email='admin@example.com', hashed_password=get_password_hash('adminpass'), role='admin')
            session.add(a)
            session.commit()
            session.refresh(a)
            return a
        return admin


def test_rbac_admin_required():
    # register a normal user
    r = client.post("/auth/register", json={"email": "user1@example.com", "password": "pass"})
    assert r.status_code == 200

    # login as user1
    r = client.post("/auth/login", data={"username": "user1@example.com", "password": "pass"})
    assert r.status_code == 200
    token_user = r.json()["access_token"]

    # create/find admin by direct DB insert
    admin = create_admin()

    # login as admin
    r = client.post("/auth/login", data={"username": "admin@example.com", "password": "adminpass"})
    assert r.status_code == 200
    token_admin = r.json()["access_token"]

    # user should not be able to list users
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {token_user}"})
    assert r.status_code == 403

    # admin can list users
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {token_admin}"})
    assert r.status_code == 200
    users = r.json()
    assert any(u["email"] == "user1@example.com" for u in users)

    # admin can update role
    user_id = next(u["id"] for u in users if u["email"] == "user1@example.com")
    r = client.post(f"/admin/users/{user_id}/role", params={"role": "doctor"}, headers={"Authorization": f"Bearer {token_admin}"})
    assert r.status_code == 200
    assert r.json()["role"] == "doctor"
