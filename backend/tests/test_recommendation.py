import json
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
import requests
from fastapi import FastAPI
from fastapi.testclient import TestClient

from data_ml.src import rotation_engine
from services import recommendation


@pytest.fixture
def historical_data():
    return {
        'properties': {
            'parameter': {
                'PRECTOTCORR': {'20230101': 3.5, '20230102': 4.0},
                'T2M_MIN': {'20230101': 18.0, '20230102': 20.0},
            },
        },
    }


@pytest.fixture
def recommendation_client(monkeypatch, historical_data):
    monkeypatch.setattr(rotation_engine.time, 'sleep', lambda _delay: None)
    monkeypatch.setattr(
        rotation_engine.requests, 'get',
        lambda *_args, **_kwargs: SimpleNamespace(
            raise_for_status=lambda: None, json=lambda: historical_data,
        ),
    )
    app = FastAPI()
    app.include_router(recommendation.router)
    with TestClient(app) as client:
        yield client


def request_payload(**overrides):
    return {
        'lat': -9.3828, 'lon': -40.5028,
        'planting_month': 1, 'previous_crop': 'Corn', **overrides,
    }


def test_route_reuses_engine_and_preserves_response(
    recommendation_client, monkeypatch, historical_data,
):
    provider_requests = []

    def request_history(url, *, params, timeout):
        provider_requests.append((url, params, timeout))
        return SimpleNamespace(
            raise_for_status=lambda: None, json=lambda: historical_data,
        )

    monkeypatch.setattr(rotation_engine.requests, 'get', request_history)
    response = recommendation_client.post(
        '/api/recommendation', json=request_payload(),
    )

    assert response.status_code == 200
    result = response.json()
    assert result['location'] == {
        'latitude': -9.3828, 'longitude': -40.5028,
    }
    assert result['recommendation_status'] == 'success'
    assert {item['crop'] for item in result['ml_top5'][:2]} == {
        'Cowpea', 'Soybean',
    }
    assert [item['rank'] for item in result['ml_top5']] == [1, 2, 3, 4, 5]
    assert result['soil_analysis'] == {
        'soil_type': None, 'status': 'unidentified',
        'confidence': None, 'requires_followup': True,
    }
    assert result['climate_assessment'] == {
        'status': 'pending_validation',
        'planting_window': 'Assumed annual average',
        'irrigation_assumed': False,
    }
    assert '2023' in result['message']
    assert 'not used by this model' in result['message']
    assert 'Soil suitability has not been assessed' in result['message']
    assert len(provider_requests) == 1
    url, params, timeout = provider_requests[0]
    assert url == 'https://power.larc.nasa.gov/api/temporal/daily/point'
    assert params['start'] == '20230101'
    assert params['end'] == '20231231'
    assert params['latitude'] == -9.3828
    assert params['longitude'] == -40.5028
    assert timeout == 10


def test_month_does_not_change_annual_model_result(recommendation_client):
    january = recommendation_client.post(
        '/api/recommendation', json=request_payload(planting_month=1),
    )
    december = recommendation_client.post(
        '/api/recommendation', json=request_payload(planting_month=12),
    )
    assert january.status_code == december.status_code == 200
    assert january.json() == december.json()


@pytest.mark.parametrize('overrides', [
    {'lat': -90.1}, {'lat': 90.1}, {'lat': 'NaN'},
    {'lon': -180.1}, {'lon': 180.1}, {'lon': 'Infinity'},
    {'planting_month': 0}, {'planting_month': 13},
    {'planting_month': 1.5}, {'planting_month': '1'},
    {'previous_crop': 'Unsupported crop'}, {'previous_crop': None},
])
def test_invalid_request_returns_422(recommendation_client, overrides):
    response = recommendation_client.post(
        '/api/recommendation', json=request_payload(**overrides),
    )
    assert response.status_code == 422


def test_provider_failure_returns_sanitized_503(
    recommendation_client, monkeypatch,
):
    def fail_request(*_args, **_kwargs):
        raise requests.Timeout('private upstream request details')

    monkeypatch.setattr(rotation_engine.requests, 'get', fail_request)
    response = recommendation_client.post(
        '/api/recommendation', json=request_payload(),
    )
    assert response.status_code == 503
    assert response.json() == {
        'detail': 'Historical crop assessment is temporarily unavailable.',
    }
    assert 'private' not in response.text
    assert 'ml_top5' not in response.json()


def test_missing_dependency_returns_503(recommendation_client, monkeypatch):
    def fail_import(_name):
        raise ImportError('private dependency details')

    monkeypatch.setattr(recommendation, 'import_module', fail_import)
    response = recommendation_client.post(
        '/api/recommendation', json=request_payload(),
    )
    assert response.status_code == 503
    assert 'private' not in response.text


@pytest.mark.parametrize(('rain', 'minimum_temperature'), [
    ({}, {}),
    ({'20230101': -999}, {'20230101': 20}),
    ({'20230101': 3}, {'20230101': -999}),
    ({'20230101': float('nan')}, {'20230101': 20}),
    ({'20230101': 3}, {'20230101': float('inf')}),
    ({'20230101': 3}, {'20230102': 20}),
])
def test_invalid_provider_data_never_returns_fabricated_assessment(
    recommendation_client, historical_data, rain, minimum_temperature,
):
    parameters = historical_data['properties']['parameter']
    parameters['PRECTOTCORR'] = rain
    parameters['T2M_MIN'] = minimum_temperature

    with pytest.raises(RuntimeError, match='unavailable or invalid'):
        rotation_engine.generate_mvp_recommendation(
            0, 0, 'Corn', strict_data=True,
        )

    response = recommendation_client.post(
        '/api/recommendation', json=request_payload(),
    )
    assert response.status_code == 503
    assert 'ml_top5' not in response.json()


def test_legacy_call_keeps_original_fallback(
    recommendation_client, monkeypatch,
):
    def fail_request(*_args, **_kwargs):
        raise requests.Timeout('provider unavailable')

    monkeypatch.setattr(rotation_engine.requests, 'get', fail_request)
    result = json.loads(
        rotation_engine.generate_mvp_recommendation(0, 0, 'Corn'),
    )
    assert result['recommendation_status'] == 'success'
    assert len(result['ml_top5']) == 5


@pytest.mark.parametrize('directory', ['.', 'backend'])
def test_engine_import_resolves_from_both_launch_directories(directory):
    project_root = Path(__file__).resolve().parents[2]
    script = '''
import sys
from pathlib import Path

if Path.cwd().name != "backend":
    sys.path.insert(0, "backend")
from services import recommendation

engine = recommendation.import_module("data_ml.src.rotation_engine")
assert Path(engine.__file__).resolve() == (
    Path(recommendation.PROJECT_ROOT)
    / "data_ml" / "src" / "rotation_engine.py"
)
assert callable(engine.generate_mvp_recommendation)
print("Existing engine imported without network requests.")
'''
    result = subprocess.run(
        [sys.executable, '-c', script], cwd=project_root / directory,
        env={'PYTHONDONTWRITEBYTECODE': '1'},
        capture_output=True, text=True, check=False,
    )
    assert result.returncode == 0, result.stderr
    assert 'Existing engine imported' in result.stdout
