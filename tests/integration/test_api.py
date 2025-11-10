"""Integration tests for API"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "name" in response.json()


def test_health_endpoint():
    """Test health endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert "status" in response.json()


def test_languages_endpoint():
    """Test languages endpoint"""
    response = client.get("/api/v1/languages")
    assert response.status_code == 200
    assert "languages" in response.json()

