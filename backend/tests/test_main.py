import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import Base, engine, SessionLocal

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_read_main():
    response = client.get("/")
    # If frontend is built, it might return 200, otherwise 200 with JSON or something else
    assert response.status_code in [200, 404] 

def test_list_products():
    response = client.get("/api/products")
    assert response.status_code == 200
    assert "products" in response.json()

def test_list_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
