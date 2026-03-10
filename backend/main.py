from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from datetime import datetime
import traceback
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend" / "dist"

from app.core.database import engine, Base
from app.models import *  # ensure all models are registered
from app.api import auth, products, categories, cart, orders, reviews, users, admin

# Create tables
Base.metadata.create_all(bind=engine)

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
        return {"message": "Backend is running, but frontend/dist is missing. Build the frontend first!"}

import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    log_file = BASE_DIR / "error_log.txt"
    try:
        with open(log_file, "a") as f:
            f.write(f"\n--- ERROR AT {datetime.now()} ---\n")
            f.write(traceback.format_exc())
    except Exception:
        pass  # Don't crash if logging fails
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





