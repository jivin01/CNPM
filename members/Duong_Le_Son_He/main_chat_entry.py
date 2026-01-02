from fastapi import FastAPI
from services.chat_service import socket_app

app = FastAPI()

# Mount app chat vào đường dẫn /ws
app.mount("/ws", socket_app)

@app.get("/")
async def root():
    return {"message": "AURA Chat & Storage Service is running"}