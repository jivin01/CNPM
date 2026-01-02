import socketio
from fastapi import FastAPI

# Khởi tạo Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"User connected: {sid}")

@sio.event
async def join_room(sid, data):
    # data: {"room_id": "doctor_patient_123"}
    room = data.get("room_id")
    await sio.enter_room(sid, room)
    print(f"SID {sid} joined room {room}")

@sio.event
async def send_message(sid, data):
    """
    Gửi tin nhắn trong phòng chat riêng
    data: {"room_id": "...", "message": "...", "sender_id": "..."}
    """
    room = data.get("room_id")
    message_content = {
        "sender_id": data.get("sender_id"),
        "text": data.get("message"),
        "timestamp": "now" # Có thể dùng datetime.now()
    }
    # Phát tin nhắn tới tất cả người trong phòng (bao gồm bác sĩ và bệnh nhân)
    await sio.emit("receive_message", message_content, room=room)

@sio.event
async def disconnect(sid):
    print(f"User disconnected: {sid}")