import logging
from functools import lru_cache
from pathlib import Path
from threading import Lock

import cv2
import numpy as np
import torch
from ultralytics import YOLO


MODEL_PATH = (
    Path(__file__).resolve().parent
    / 'runs/leaf_diseases_yolov8n_cls/weights/best.pt'
)
DISEASE_CLASSES = {
    'healthy', 'late_blight', 'early_blight', 'bacterial_spot_solanaceae',
}
MODEL_LOCK = Lock()
LOGGER = logging.getLogger(__name__)


def build_agent_input(
    visual_suspicions: dict[str, float] | None = None,
    model_source: str | None = None,
) -> dict:
    """Format the strongest visual suspicion for the existing agent."""
    visual_suspicions = visual_suspicions or {}
    payload = {
        'source': 'vision',
        'status': 'not_analyzed',
        'is_definitive_diagnosis': False,
    }
    if model_source:
        payload['model_source'] = model_source
    if visual_suspicions:
        if not set(visual_suspicions) <= DISEASE_CLASSES:
            raise ValueError('Unsupported disease class')
        if any(not 0 <= score <= 1 for score in visual_suspicions.values()):
            raise ValueError('Confidence must be between zero and one')
        suspected_disease = max(visual_suspicions, key=visual_suspicions.get)
        payload.update(
            status='analyzed', suspected_disease=suspected_disease,
            confidence=visual_suspicions[suspected_disease],
        )
    return payload


@lru_cache(maxsize=1)
def load_model() -> YOLO:
    """Load the four-class checkpoint once per process, on first use."""
    model = YOLO(str(MODEL_PATH))
    if set(model.names.values()) != DISEASE_CLASSES:
        raise ValueError('Checkpoint does not contain the four disease classes')
    return model


def classify_leaf(image_bytes: bytes) -> dict:
    """Classify one uploaded photo without passing a remote file path."""
    payload = build_agent_input()
    if not image_bytes:
        return dict(payload, status='unavailable', error='No photo was received')
    try:
        photo = cv2.imdecode(
            np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR,
        )
    except (cv2.error, ValueError):
        photo = None
    if photo is None:
        return dict(payload, status='error', error='The photo could not be decoded')

    try:
        with MODEL_LOCK:
            model = load_model()
            result = model.predict(
                photo, device=0 if torch.cuda.is_available() else 'cpu',
                imgsz=224, batch=1, workers=0, save=False, verbose=False,
            )[0]
            suspected_disease = result.names[result.probs.top1]
            confidence = result.probs.top1conf.item()
        return build_agent_input({suspected_disease: confidence})
    except (OSError, RuntimeError, ValueError) as error:
        LOGGER.exception('Leaf classification unavailable: %s', error)
        return dict(payload, status='unavailable', error='Visual analysis unavailable')
