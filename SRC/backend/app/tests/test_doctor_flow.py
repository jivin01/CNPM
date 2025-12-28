from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_doctor_review_flow():
    # register patient
    r = client.post("/auth/register", json={"email": "patient1@example.com", "password": "pass"})
    assert r.status_code == 200

    # register doctor (use registration secret env var not provided in tests) -> instead create doctor via admin
    r = client.post("/auth/register", json={"email": "doc@example.com", "password": "pass"})
    assert r.status_code == 200

    # create admin and promote doc to doctor
    # create admin
    r = client.post("/auth/register", json={"email": "admin2@example.com", "password": "adminpass"})
    assert r.status_code == 200
    # make admin via DB
    r = client.post("/auth/login", data={"username": "admin2@example.com", "password": "adminpass"})
    token_admin = r.json()["access_token"]
    # promote admin2 to admin via direct DB manipulation (simple test helper): create a new admin in DB
    # we will promote doc by using the admin role assignment endpoint, but first ensure admin2 is admin
    from app.database import get_session
    from app.models.models import User
    from app.api.auth import get_password_hash
    from sqlmodel import select
    with get_session() as session:
        u = session.exec(select(User).where(User.email == 'admin2@example.com')).first()
        if not u:
            a = User(email='admin2@example.com', hashed_password=get_password_hash('adminpass'), role='admin')
            session.add(a)
            session.commit()
            session.refresh(a)
        else:
            u.role = 'admin'
            session.add(u)
            session.commit()

    # login as admin
    r = client.post("/auth/login", data={"username": "admin2@example.com", "password": "adminpass"})
    token_admin = r.json()["access_token"]

    # login as doc and get doc id
    r = client.post("/auth/login", data={"username": "doc@example.com", "password": "pass"})
    token_doc = r.json()["access_token"]

    # get user list to find doc id
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {token_admin}"})
    users = r.json()
    doc_id = next(u['id'] for u in users if u['email'] == 'doc@example.com')

    # promote doc to doctor
    r = client.post(f"/admin/users/{doc_id}/role", params={"role": "doctor"}, headers={"Authorization": f"Bearer {token_admin}"})
    assert r.status_code == 200

    # login as patient and upload an image
    r = client.post("/auth/login", data={"username": "patient1@example.com", "password": "pass"})
    token_patient = r.json()["access_token"]

    from PIL import Image
    import io
    img = Image.new("RGB", (64, 64), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    headers = {"Authorization": f"Bearer {token_patient}"}
    files = {"file": ("small.png", buf, "image/png")}
    r = client.post("/upload", headers=headers, files=files)
    assert r.status_code == 200

    # login as doctor and get pending
    r = client.post("/auth/login", data={"username": "doc@example.com", "password": "pass"})
    token_doc = r.json()["access_token"]

    r = client.get("/doctor/records/pending", headers={"Authorization": f"Bearer {token_doc}"})
    assert r.status_code == 200
    pending = r.json()
    assert len(pending) >= 1
    rec_id = pending[0]['id']

    # validate record
    r = client.post(f"/doctor/records/{rec_id}/validate", json={"validated": True, "notes": "Looks good"}, headers={"Authorization": f"Bearer {token_doc}"})
    assert r.status_code == 200
    assert r.json()['status'] == 'validated'
