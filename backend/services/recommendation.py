import json
import sys
from importlib import import_module
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter()
PROJECT_ROOT = str(Path(__file__).resolve().parents[2])
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)


class RecommendationRequest(BaseModel):
    lat: float = Field(ge=-90, le=90, allow_inf_nan=False)
    lon: float = Field(ge=-180, le=180, allow_inf_nan=False)
    planting_month: int = Field(ge=1, le=12, strict=True)
    previous_crop: Literal[
        'Corn', 'Cassava', 'Cowpea', 'Forage Cactus', 'Soybean',
        'Wheat', 'Quinoa', 'Potato', 'None',
    ]


@router.post('/api/recommendation')
def recommendation(payload: RecommendationRequest) -> dict:
    try:
        engine = import_module('data_ml.src.rotation_engine')
        result = json.loads(engine.generate_mvp_recommendation(
            payload.lat, payload.lon, payload.previous_crop, strict_data=True,
        ))
        if not isinstance(result, dict) or not result.get('ml_top5'):
            raise ValueError('Invalid recommendation result.')
    except (ImportError, RuntimeError, ValueError, TypeError, OSError):
        raise HTTPException(
            status_code=503,
            detail='Historical crop assessment is temporarily unavailable.',
        ) from None

    result['message'] = (
        'Historical annual assessment using NASA POWER data for 2023; '
        'pending agronomic validation. Planting month is accepted but '
        'is not used by this model. Soil suitability has not been assessed.'
    )
    return result
