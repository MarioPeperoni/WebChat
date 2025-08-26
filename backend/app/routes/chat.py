from fastapi import APIRouter
from starlette.websockets import WebSocket

from datetime import datetime
from pydantic import ValidationError

from starlette.websockets import WebSocketDisconnect

from app.services.database import save_message_to_db
from app.services.websocket import ConnectionManager

from app.models.message import MessageIn, MessageOut

manager = ConnectionManager()
router = APIRouter(prefix="/chat", tags=["chat"])

@router.websocket("/messages")
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
        await manager.disconnect(websocket)