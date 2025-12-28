from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_message_flow():
    # register two users
    r1 = client.post("/auth/register", json={"email": "alice@example.com", "password": "pass"})
    assert r1.status_code == 200
    r2 = client.post("/auth/register", json={"email": "bob@example.com", "password": "pass"})
    assert r2.status_code == 200

    # login as alice
    r = client.post("/auth/login", data={"username": "alice@example.com", "password": "pass"})
    assert r.status_code == 200
    token = r.json()["access_token"]

    # get bob id
    # There's no user listing endpoint; we trust bob has id=2 in this simple test environment
    bob_id = 2

    headers = {"Authorization": f"Bearer {token}"}
    msg_payload = {"receiver_id": bob_id, "content": "Hello Bob"}
    r = client.post("/messages/", json=msg_payload, headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data.get("content") == "Hello Bob"

    # retrieve conversation
    r = client.get(f"/messages/with/{bob_id}", headers=headers)
    assert r.status_code == 200
    conv = r.json()
    assert len(conv) >= 1
    assert conv[-1]["content"] == "Hello Bob"
