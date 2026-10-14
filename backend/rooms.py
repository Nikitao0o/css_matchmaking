from collections import defaultdict
from fastapi import WebSocket

class RoomManager:
    def __init__(self):
        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def join(self, room: str, ws: websocket):
        await ws.accept()
        self.rooms[room].append(ws)

    def leave(self, room: str, ws: WebSocket):
        if ws in self.rooms[room]:
            self.rooms[room].remove(ws)

    async def broadcast(self, room: str, message: str):
        for ws in self.rooms[room].copy():
            try:
                await ws.send_text(message)
            except:
                self.leave(room, ws)

manager = RoomManager()