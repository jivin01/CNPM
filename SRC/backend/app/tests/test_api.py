import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_register_login_and_upload():
    # register
    r = client.post("/auth/register", json={"email": "test@example.com", "password": "secret"})
    assert r.status_code == 200

    # login
    r = client.post("/auth/login", data={"username": "test@example.com", "password": "secret"})
    assert r.status_code == 200
    token = r.json().get("access_token")
    assert token

    # create a small PNG in memory
    from PIL import Image
    img = Image.new("RGB", (64, 64), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("small.png", buf, "image/png")}
    r = client.post("/upload", headers=headers, files=files)
    assert r.status_code == 200
    data = r.json()
    assert "risk_score" in data
    assert data.get("annotated_image")

