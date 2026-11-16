import base64
import binascii
from functools import lru_cache
from importlib import import_module
from math import ceil
from secrets import compare_digest, token_urlsafe
from threading import Lock
from time import time
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


router = APIRouter()
SESSION_TOKENS: dict[str, str] = {}
REQUEST_LOCK = Lock()


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=3000)
    crop: str = Field(default="", max_length=100)
    image: str | None = Field(default=None, max_length=14_000_000)
    thread_id: str | None = Field(default=None, max_length=100)


@lru_cache(maxsize=1)
def get_agent():
    """Load the existing graph once without affecting weather-only startup."""
    return import_module("ai_agents.router_graph").app


@router.post("/api/chat")
def chat(
    payload: ChatRequest, authorization: str = Header("")
) -> JSONResponse:
    """Receive photo bytes in JSON and resume an authorized conversation."""
    image_bytes = b""
    if payload.image is not None:
        try:
            image_bytes = base64.b64decode(payload.image, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(
                422, "Fotografia inválida. Envie uma imagem JPEG ou PNG."
            ) from None
        if not image_bytes or len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(422, "Envie uma fotografia de até 10 MB.")
    if not payload.message.strip() and not image_bytes:
        raise HTTPException(422, "Envie uma mensagem ou fotografia.")
    thread_id = payload.thread_id
    if thread_id:
        token = SESSION_TOKENS.get(thread_id)
        expected = f"Bearer {token}".encode()
        if not token or not compare_digest(authorization.encode(), expected):
            raise HTTPException(
                403, "Sessão inválida. Abra uma nova conversa."
            )
    if not REQUEST_LOCK.acquire(blocking=False):
        raise HTTPException(
            409, "O assistente está ocupado. Aguarde e tente novamente."
        )
    try:
        try:
            agent = get_agent()
        except (ImportError, ValueError):
            raise HTTPException(
                503, "O assistente não está configurado no servidor."
            ) from None
        if not thread_id:
            thread_id = str(uuid4())
            SESSION_TOKENS[thread_id] = token_urlsafe(32)
        inputs = {
            "farmer_question": payload.message.strip()
            or "Investigue esta folha."
        }
        if payload.crop.strip():
            inputs["crop"] = payload.crop.strip()
        if image_bytes:
            inputs["image_bytes"] = image_bytes
        state = agent.invoke(
            inputs, {"configurable": {"thread_id": thread_id}}
        )
        vision_error = state.get("vision_error", {})
        vision = vision_error or state.get("leaf_diagnosis", {})
        status_code = 200
        if vision.get("status") == "unavailable":
            status_code = 503
        elif vision.get("status") == "error":
            status_code = 422
        elif state.get("api_status") == "rate_limited":
            status_code = 429
        elif state.get("api_status") == "not_configured":
            status_code = 503
        elif state.get("api_status") not in {None, "ok"}:
            status_code = 502
        retry_after = max(0, ceil(state.get("retry_at", 0) - time()))
        return JSONResponse(
            status_code=status_code,
            content={
                "thread_id": thread_id,
                "session_token": SESSION_TOKENS[thread_id],
                "response": state["final_response"],
                "vision": vision,
                "sources": [
                    dict(title=source["title"], url=source["url"])
                    for source in state.get("research_data", {}).get(
                        "sources", []
                    )
                ],
                "api_status": state.get("api_status"),
                "retry_after": retry_after,
            },
            headers={"Retry-After": str(retry_after)} if retry_after else {},
        )
    finally:
        REQUEST_LOCK.release()
