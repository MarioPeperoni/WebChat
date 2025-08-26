from fastapi import WebSocket
from starlette.websockets import WebSocketState

from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await self.broadcast_user_count()

    async def broadcast_user_count(self):
        count = len(self.active_connections)
        message = {"type": "users_count", "count": count}
        for connection in self.active_connections[:]:  # iterate over a copy
            if connection.application_state == WebSocketState.CONNECTED:
                try:
                    await connection.send_json(message)
                except:
                    self.active_connections.remove(connection)

    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            # Broadcast updated count after someone disconnects
            await self.broadcast_user_count()

    async def send_message(self, message: dict):
        message = {"type": "message", "data": message}
        for connection in self.active_connections:
            if connection.application_state == WebSocketState.CONNECTED:
                await connection.send_json(message)