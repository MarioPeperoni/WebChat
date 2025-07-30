from fastapi import FastAPI, WebSocket

from datetime import datetime
from pydantic import ValidationError

from starlette.websockets import WebSocketDisconnect

from services.database import save_message_to_db
from services.websocket import ConnectionManager

from models.message import MessageIn, MessageOut

app = FastAPI()

manager = ConnectionManager()

@app.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()

            try:
                message_in = MessageIn(**data)
            except ValidationError:
                continue
            message_out = MessageOut(**message_in.model_dump(mode="json"), timestamp=datetime.now().isoformat())
            await save_message_to_db(message_out)
            await manager.send_message(message_out.model_dump(mode="json"))

    except WebSocketDisconnect:
        manager.disconnect(websocket)