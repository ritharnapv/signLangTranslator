import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data

def test_root_service_info():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "SignSense" in data.get("service", "")
    assert data.get("status") == "online"

def test_sign_dictionary_search():
    response = client.get("/api/v1/dictionary?query=hello")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert isinstance(data["results"], list)
