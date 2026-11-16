import base64
import copy
import importlib.util
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest.mock import Mock

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from groq import APIConnectionError, RateLimitError
from langchain_groq import ChatGroq

from services import agent_chat


PHOTO = base64.b64encode(b"synthetic photo for mocked CNN").decode()
SUSPICION = {
    "source": "vision",
    "status": "analyzed",
    "suspected_disease": "early_blight",
    "confidence": 0.87,
    "is_definitive_diagnosis": False,
}


@pytest.fixture
def chat_flow(monkeypatch):
    root = Path(__file__).resolve().parents[2]
    monkeypatch.syspath_prepend(str(root))
    monkeypatch.setattr("dotenv.load_dotenv", Mock(return_value=False))
    monkeypatch.setenv("LANGSMITH_TRACING", "false")
    monkeypatch.setenv("LANGCHAIN_TRACING_V2", "false")
    monkeypatch.setattr(
        httpx.HTTPTransport,
        "handle_request",
        Mock(side_effect=AssertionError("External HTTP is forbidden")),
    )
    monkeypatch.setattr(
        httpx.AsyncHTTPTransport,
        "handle_async_request",
        Mock(side_effect=AssertionError("External HTTP is forbidden")),
    )
    vision = ModuleType("vision.symptom_output")
    vision.build_agent_input = Mock(
        return_value={
            "source": "vision",
            "status": "not_analyzed",
            "is_definitive_diagnosis": False,
        }
    )
    vision.classify_leaf = Mock(return_value=SUSPICION.copy())
    monkeypatch.setitem(sys.modules, "vision.symptom_output", vision)
    spec = importlib.util.spec_from_file_location(
        "cin_test_router_graph",
        root / "ai_agents/router_graph.py",
    )
    graph = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, spec.name, graph)
    spec.loader.exec_module(graph)

    source = {
        "name": "browser.open",
        "arguments": "{}",
        "search_results": {
            "results": [
                {
                    "url": "https://example.edu/synthetic-source",
                    "title": "SIMULATED SOURCE",
                    "content": "SIMULATED EVIDENCE",
                }
            ]
        },
    }
    message = SimpleNamespace(
        content="SIMULATED ASSISTANT RESPONSE",
        model_dump=lambda: {"executed_tools": [source]},
    )
    provider = Mock(
        return_value=SimpleNamespace(
            choices=[SimpleNamespace(message=message)],
        )
    )
    constructor = Mock(
        return_value=SimpleNamespace(
            model_name="synthetic-model",
            client=SimpleNamespace(create=provider),
        )
    )
    monkeypatch.setattr(graph, "ChatGroq", constructor)
    monkeypatch.setattr(agent_chat, "get_agent", lambda: graph.app)
    monkeypatch.setattr(agent_chat, "SESSION_TOKENS", {})
    app = FastAPI()
    app.include_router(agent_chat.router)
    with TestClient(app) as client:
        yield SimpleNamespace(
            client=client,
            graph=graph,
            classifier=vision.classify_leaf,
            provider=provider,
            constructor=constructor,
        )


def test_groq_is_lazy_and_text_turns_do_not_repeat_cnn(chat_flow):
    flow = chat_flow
    assert flow.constructor.call_count == 0
    first = flow.client.post("/api/chat", json={"image": PHOTO}).json()
    headers = {"Authorization": "Bearer " + first["session_token"]}
    for message in ["Synthetic follow-up one", "Synthetic follow-up two"]:
        response = flow.client.post(
            "/api/chat",
            json={
                "thread_id": first["thread_id"],
                "message": message,
            },
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["vision"] == SUSPICION
        assert response.json()["session_token"] == first["session_token"]
    assert flow.classifier.call_count == 1
    assert flow.constructor.call_count == 1
    state = flow.graph.app.get_state(
        {
            "configurable": {"thread_id": first["thread_id"]},
        }
    ).values
    assert len(state["chat_history"]) == 6


def test_invalid_new_photo_preserves_prior_suspicion_and_resumes_text(
    chat_flow,
):
    flow = chat_flow
    first = flow.client.post("/api/chat", json={"image": PHOTO}).json()
    config = {"configurable": {"thread_id": first["thread_id"]}}
    before = copy.deepcopy(flow.graph.app.get_state(config).values)
    headers = {"Authorization": "Bearer " + first["session_token"]}
    flow.classifier.return_value = {
        "source": "vision",
        "status": "error",
        "is_definitive_diagnosis": False,
        "error": "Synthetic decode failure",
    }
    invalid = flow.client.post(
        "/api/chat",
        json={
            "thread_id": first["thread_id"],
            "image": PHOTO,
        },
        headers=headers,
    )
    assert invalid.status_code == 422
    assert invalid.json()["vision"]["status"] == "error"
    state = flow.graph.app.get_state(config).values
    assert state["leaf_diagnosis"] == before["leaf_diagnosis"]
    assert state["research_data"] == before["research_data"]
    followup = flow.client.post(
        "/api/chat",
        json={
            "thread_id": first["thread_id"],
            "message": "Continue investigation",
        },
        headers=headers,
    )
    assert followup.status_code == 200
    assert followup.json()["vision"] == SUSPICION
    assert flow.classifier.call_count == 2
    assert flow.provider.call_count == 2
    assert len(flow.graph.app.get_state(config).values["chat_history"]) == 6


def test_model_unavailable_is_a_server_error_not_an_invalid_photo(chat_flow):
    flow = chat_flow
    flow.classifier.return_value = {
        "source": "vision",
        "status": "unavailable",
        "is_definitive_diagnosis": False,
        "error": "Synthetic missing checkpoint",
    }
    response = flow.client.post("/api/chat", json={"image": PHOTO})
    assert response.status_code == 503
    data = response.json()
    assert data["vision"]["status"] == "unavailable"
    assert "servidor" in data["response"]
    assert "JPEG" not in data["response"]
    assert flow.constructor.call_count == 0
    followup = flow.client.post(
        "/api/chat",
        json={
            "thread_id": data["thread_id"],
            "message": "A general question",
        },
        headers={"Authorization": "Bearer " + data["session_token"]},
    )
    assert followup.status_code == 200
    assert followup.json()["vision"]["status"] == "not_analyzed"
    assert flow.classifier.call_count == 1


def test_missing_groq_configuration_preserves_visual_result(chat_flow):
    flow = chat_flow
    flow.constructor.side_effect = ValueError("Synthetic missing Groq key")
    response = flow.client.post("/api/chat", json={"image": PHOTO})
    assert response.status_code == 503
    data = response.json()
    assert data["api_status"] == "not_configured"
    assert data["vision"] == SUSPICION
    assert flow.provider.call_count == 0
    flow.constructor.side_effect = None
    followup = flow.client.post(
        "/api/chat",
        json={
            "thread_id": data["thread_id"],
            "message": "Resume this conversation",
        },
        headers={"Authorization": "Bearer " + data["session_token"]},
    )
    assert followup.status_code == 200
    assert followup.json()["vision"] == SUSPICION
    assert flow.classifier.call_count == 1


def test_real_groq_constructor_without_key_does_not_erase_cnn(
    chat_flow, monkeypatch,
):
    flow = chat_flow
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setattr(flow.graph, "ChatGroq", ChatGroq)
    response = flow.client.post("/api/chat", json={"image": PHOTO})
    assert response.status_code == 503
    assert response.json()["api_status"] == "not_configured"
    assert response.json()["vision"] == SUSPICION
    assert flow.classifier.call_count == 1
    assert flow.provider.call_count == 0


def test_groq_outage_preserves_visual_result_and_can_be_retried(chat_flow):
    flow = chat_flow
    flow.provider.side_effect = APIConnectionError(
        request=httpx.Request("POST", "https://example.invalid/synthetic"),
    )
    response = flow.client.post("/api/chat", json={"image": PHOTO})
    assert response.status_code == 502
    data = response.json()
    assert data["vision"] == SUSPICION
    flow.provider.side_effect = None
    followup = flow.client.post(
        "/api/chat",
        json={
            "thread_id": data["thread_id"],
            "message": "Try the assistant again",
        },
        headers={"Authorization": "Bearer " + data["session_token"]},
    )
    assert followup.status_code == 200
    assert flow.classifier.call_count == 1


def test_rate_limit_preserves_vision_and_honors_cooldown(chat_flow):
    flow = chat_flow
    flow.provider.side_effect = RateLimitError(
        "Synthetic rate limit",
        response=httpx.Response(
            429,
            headers={"Retry-After": "30"},
            request=httpx.Request("POST", "https://example.invalid"),
        ),
        body=None,
    )
    limited = flow.client.post("/api/chat", json={"image": PHOTO})
    assert limited.status_code == 429
    data = limited.json()
    assert data["vision"] == SUSPICION
    assert int(limited.headers["Retry-After"]) > 0
    waiting = flow.client.post(
        "/api/chat",
        json={
            "thread_id": data["thread_id"],
            "message": "Wait without retrying",
        },
        headers={"Authorization": "Bearer " + data["session_token"]},
    )
    assert waiting.status_code == 429
    assert waiting.json()["vision"] == SUSPICION
    assert flow.provider.call_count == 1
    assert flow.classifier.call_count == 1


def test_invalid_requests_never_reach_cnn_or_groq(chat_flow):
    flow = chat_flow
    assert flow.client.post("/api/chat", json={}).status_code == 422
    assert (
        flow.client.post(
            "/api/chat",
            json={"image": "invalid base64"},
        ).status_code
        == 422
    )
    assert (
        flow.client.post(
            "/api/chat",
            json={
                "thread_id": "unknown-session",
                "message": "Unauthorized",
            },
        ).status_code
        == 403
    )
    assert flow.classifier.call_count == 0
    assert flow.provider.call_count == 0
