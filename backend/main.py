from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
from datetime import datetime
import traceback
from pathlib import Path

# Print startup info for Render logs
print("=" * 50, flush=True)
print(f"Starting EcomAntigravity Backend...", flush=True)
print(f"Python version: {sys.version}", flush=True)
print(f"Working directory: {os.getcwd()}", flush=True)

# Paths
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend" / "dist"

print(f"BASE_DIR: {BASE_DIR}", flush=True)
print(f"FRONTEND_DIR: {FRONTEND_DIR} (exists: {FRONTEND_DIR.exists()})", flush=True)

try:
    from app.core.config import settings
    db_url = settings.DATABASE_URL
    # Mask password for logging
    masked = db_url
    if "@" in db_url:
        prefix = db_url.split("@")[0]
        suffix = db_url.split("@")[1]
        masked = prefix.rsplit(":", 1)[0] + ":****@" + suffix
    print(f"DATABASE_URL: {masked}", flush=True)
except Exception as e:
    print(f"ERROR loading config: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

try:
    from app.core.database import engine, Base
    from app.models import *  # ensure all models are registered
    print("Models imported successfully.", flush=True)
except Exception as e:
    print(f"ERROR importing models: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified.", flush=True)
except Exception as e:
    print(f"ERROR connecting to database: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

from app.api import auth, products, categories, cart, orders, reviews, users, admin

# Create upload dir
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="EcomAntigravity API",
    description="Flipkart-like E-Commerce Platform API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers (Prefixes are already defined in the router files)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(users.router)

# Serve frontend build (if it exists)
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "EcomAntigravity API is running. Frontend not built yet."}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Unhandled error: {exc}", flush=True)
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    content = {"detail": "Internal Server Error"}
    if os.getenv("DEBUG") == "True":
        content["msg"] = str(exc)
        content["traceback"] = traceback.format_exc()
    return JSONResponse(status_code=500, content=content)

# SPA Fallback for non-API routes
@app.exception_handler(404)
async def spa_fallback(request, exc):
    if not request.url.path.startswith("/api"):
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            from fastapi.responses import FileResponse
            return FileResponse(str(index_file))
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

print("=" * 50, flush=True)
print("App ready! Waiting for uvicorn to start serving...", flush=True)
print("=" * 50, flush=True)
