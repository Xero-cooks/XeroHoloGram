import logging
from typing import Dict, Optional
from fastapi import WebSocket

logger = logging.getLogger("ConnectionManager")


class SessionContext:
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.in_flight_task: Optional[any] = None
        self.sequence_id: int = 0


class ConnectionManager:
    def __init__(self):
        self.active_sessions: Dict[str, SessionContext] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> SessionContext:
        await websocket.accept()
        session = SessionContext(session_id, websocket)
        self.active_sessions[session_id] = session
        logger.info(f"WebSocket session connected: {session_id}")
        return session

    def disconnect(self, session_id: str):
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info(f"WebSocket session disconnected: {session_id}")

    def get_session(self, session_id: str) -> Optional[SessionContext]:
        return self.active_sessions.get(session_id)

    async def send_json(self, session_id: str, data: dict):
        session = self.get_session(session_id)
        if session:
            await session.websocket.send_json(data)

    async def send_binary(self, session_id: str, data: bytes):
        session = self.get_session(session_id)
        if session:
            await session.websocket.send_bytes(data)
